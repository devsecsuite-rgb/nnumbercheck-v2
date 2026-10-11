#!/usr/bin/env python3
"""
Scrape Controller.com listings using curl_cffi to bypass Cloudflare.
Uses the keywords search endpoint.
"""
import argparse
import time
import random
import json
import sys
import re
from curl_cffi import requests
from bs4 import BeautifulSoup
from urllib.parse import urljoin, quote

BASE_URL = "https://www.controller.com"
SEARCH_PATH = "/listings/search"
IMPERSONATE = "chrome124"


def create_session():
    s = requests.Session()
    s.headers.update({
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.9",
        "Accept-Encoding": "gzip, deflate, br",
        "DNT": "1",
        "Connection": "keep-alive",
        "Upgrade-Insecure-Requests": "1",
    })
    return s


def fetch_page(session, url, retries=3):
    for attempt in range(retries):
        try:
            r = session.get(url, impersonate=IMPERSONATE, timeout=30)
            if r.status_code == 200:
                return r.text
            if r.status_code == 403:
                print(f"  403 (attempt {attempt+1}/{retries})")
                time.sleep(10)
            elif r.status_code == 429:
                print("  429 rate limited")
                time.sleep(60)
            else:
                print(f"  HTTP {r.status_code}")
                return None
        except Exception as e:
            print(f"  Failed: {e}")
            time.sleep(5)
    return None


def extract_spec(card, label_text):
    """Find a spec value by its label text."""
    for spec in card.find_all("div", class_="spec"):
        label = spec.find("span", class_="spec-label")
        value = spec.find("span", class_="spec-value")
        if label and value:
            clean = label.get_text(strip=True).rstrip(":").strip()
            if clean.lower() == label_text.lower():
                return value.get_text(strip=True)
    return None


def clean_n_number(reg):
    if not reg:
        return None
    s = re.sub(r"[^A-Z0-9]", "", reg.upper())
    if not s:
        return None
    if not s.startswith("N"):
        s = "N" + s
    return s


def parse_listing_card(card):
    try:
        listing_id = card.get("data-listing-id")
        if not listing_id:
            return None

        # Title & URL
        title_el = card.find("a", class_="list-listing-title-link")
        if not title_el:
            return None
        title = title_el.get_text(strip=True)
        href = title_el.get("href", "")
        url = urljoin(BASE_URL, href)

        # Category
        cat_el = card.find("p", class_="listing-category")
        category = cat_el.get_text(strip=True) if cat_el else None

        # Price
        price = None
        retail = card.find("div", class_="retail-price-container")
        if retail:
            price_el = retail.find("span", class_="price")
            if price_el:
                price = price_el.get_text(strip=True)
        if not price:
            lease = card.find("span", class_="rent-lease-price")
            if lease:
                price = lease.get_text(strip=True)

        # Location
        location = None
        loc_el = card.find("div", class_="machine-location")
        if loc_el:
            raw = loc_el.get_text(strip=True)
            location = re.sub(r"^Location\s*:\s*", "", raw).strip()
        if not location:
            # Fallback: look for location class variants
            for cls in ["dealer-contact__location", "listing-location", "location"]:
                el = card.find(class_=re.compile(cls, re.I))
                if el:
                    location = el.get_text(strip=True)
                    break

        # Specs
        serial_number = extract_spec(card, "Serial Number")
        registration = extract_spec(card, "Registration #")
        total_time = extract_spec(card, "Total Time")
        engine_time = extract_spec(card, "Engine 1 Time")
        seats = extract_spec(card, "Number of Seats")
        description = extract_spec(card, "Description")

        # Seller — try many selectors
        seller = None
        seller_selectors = [
            ("div", "dealer-contact__branch-name"),
            ("div", "seller"),
            ("div", "dealer-contact"),
            ("span", "seller-name"),
        ]
        for tag, cls in seller_selectors:
            el = card.find(tag, class_=cls)
            if el:
                strong = el.find("strong")
                seller = strong.get_text(strip=True) if strong else el.get_text(strip=True)
                if seller:
                    break

        # Phone — try many selectors, then regex fallback
        phone = None
        for tag, cls in [
            ("a", "phone-link"),
            ("a", "dealer-phone"),
            ("a", "dealer-contact__phone"),
        ]:
            el = card.find(tag, class_=cls)
            if el:
                phone = el.get_text(strip=True)
                if phone:
                    break
        if not phone:
            m = re.search(r"\(?\d{3}\)?[\s.-]?\d{3}[\s.-]?\d{4}", card.get_text())
            if m:
                phone = m.group(0)

        # Parse year/make/model from title
        year, make, model = None, None, None
        if title:
            m = re.match(r"^(\d{4})\s+(.+)$", title)
            if m:
                year = int(m.group(1))
                rest = m.group(2).strip().split()
                if len(rest) >= 2:
                    make = rest[0]
                    model = " ".join(rest[1:])

        return {
            "listing_id": listing_id,
            "title": title,
            "year": year,
            "make": make,
            "model": model,
            "category": category,
            "price": price,
            "location": location,
            "serial_number": serial_number,
            "registration": registration,
            "registration_clean": clean_n_number(registration),
            "total_time": total_time,
            "engine_time": engine_time,
            "seats": seats,
            "description": description,
            "seller": seller,
            "phone": phone,
            "url": url,
        }
    except Exception as e:
        print(f"    Parse error: {e}")
        return None


def build_search_url(make=None, model=None, page=1):
    """Build a Controller.com search URL using keywords."""
    url = f"{BASE_URL}{SEARCH_PATH}"
    keywords = []
    if make:
        keywords.append(make)
    if model:
        keywords.append(model)

    params = []
    if keywords:
        params.append(f"keywords={quote(' '.join(keywords))}")
    if page > 1:
        params.append(f"page={page}")

    if params:
        url += "?" + "&".join(params)
    return url


def scrape_page(session, url, first_page=False):
    print(f"  Fetching {url}")
    html = fetch_page(session, url)
    if not html:
        return [], False

    if first_page:
        with open("debug_search.html", "w", encoding="utf-8") as f:
            f.write(html)
        print(f"    Saved debug_search.html")

    soup = BeautifulSoup(html, "lxml")
    cards = soup.find_all("div", class_="listing-data-selector")
    print(f"    Found {len(cards)} cards")

    listings = []
    for card in cards:
        item = parse_listing_card(card)
        if item:
            listings.append(item)

    has_next = len(cards) >= 20
    return listings, has_next


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--make", help="e.g. cessna")
    parser.add_argument("--model", help="e.g. 172")
    parser.add_argument("--pages", type=int, default=3)
    parser.add_argument("--output", default="controller_listings.json")
    args = parser.parse_args()

    session = create_session()

    print("Establishing session via homepage...")
    home = fetch_page(session, BASE_URL)
    if not home:
        print("Failed homepage. Exit.")
        sys.exit(1)
    print("  Homepage loaded.")
    time.sleep(random.uniform(3, 6))

    all_listings = []
    seen_ids = set()

    for page in range(1, args.pages + 1):
        print(f"\n--- Page {page} ---")
        url = build_search_url(args.make, args.model, page)
        listings, has_next = scrape_page(session, url, first_page=(page == 1))

        for item in listings:
            if item["listing_id"] not in seen_ids:
                all_listings.append(item)
                seen_ids.add(item["listing_id"])

        if not has_next and page < args.pages:
            print(f"    No more pages — stopping")
            break

        if page < args.pages:
            delay = random.uniform(5, 10)
            print(f"    Sleeping {delay:.1f}s")
            time.sleep(delay)

    with open(args.output, "w", encoding="utf-8") as f:
        json.dump(all_listings, f, indent=2)

    print(f"\n=== Done ===")
    print(f"Saved {len(all_listings)} unique listings to {args.output}")

    # Broker summary
    sellers = {}
    for item in all_listings:
        if item.get("seller"):
            key = item["seller"]
            if key not in sellers:
                sellers[key] = {"count": 0, "phone": item.get("phone"), "listings": []}
            sellers[key]["count"] += 1
            sellers[key]["listings"].append(
                f"{item.get('year')} {item.get('make')} {item.get('model')} ({item.get('registration') or 'no reg'})"
            )

    print(f"\n=== Brokers found: {len(sellers)} ===")
    for name, data in sorted(sellers.items(), key=lambda x: -x[1]["count"]):
        print(f"  {name} — {data['count']} listings — {data['phone'] or 'no phone'}")

    # Sample 3 listings
    print(f"\n=== Sample listings ===")
    for item in all_listings[:3]:
        print(f"  {item.get('year')} {item.get('make')} {item.get('model')} | Reg: {item.get('registration') or 'N/A'} | Seller: {item.get('seller') or 'N/A'}")


if __name__ == "__main__":
    main()

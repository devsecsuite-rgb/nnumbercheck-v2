#!/usr/bin/env python3
"""
Scrape Controller.com piston single aircraft listings using curl_cffi.

Usage:
    python controller_cffi_scraper.py --make cessna --model 172 --pages 5
    python controller_cffi_scraper.py --make piper --model pa-28 --pages 5
    python controller_cffi_scraper.py --make cirrus --model sr22 --pages 5
    python controller_cffi_scraper.py --category all --pages 3
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
OUTPUT_FILE = "controller_listings.json"
DEBUG_FILE = "debug_search.html"
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
    for spec in card.find_all("div", class_="spec"):
        label = spec.find("span", class_="spec-label")
        value = spec.find("span", class_="spec-value")
        if label and value:
            clean = label.get_text(strip=True).rstrip(":").strip()
            if clean.lower() == label_text.lower():
                return value.get_text(strip=True)
    return None


def clean_n_number(reg):
    """Extract clean N-number from registration field."""
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

        title_el = card.find("a", class_="list-listing-title-link")
        if not title_el:
            return None
        title = title_el.get_text(strip=True)
        href = title_el.get("href", "")
        url = urljoin(BASE_URL, href)

        cat_el = card.find("p", class_="listing-category")
        category = cat_el.get_text(strip=True) if cat_el else None

        price = None
        retail = card.find("div", class_="retail-price-container")
        if retail:
            price_el = retail.find("span", class_="price")
            if price_el:
                price = price_el.get_text(strip=True)

        location = None
        loc_el = card.find("div", class_="machine-location")
        if loc_el:
            raw = loc_el.get_text(strip=True)
            location = re.sub(r"^Location\s*:\s*", "", raw).strip()

        serial_number = extract_spec(card, "Serial Number")
        registration = extract_spec(card, "Registration #")
        total_time = extract_spec(card, "Total Time")
        engine_time = extract_spec(card, "Engine 1 Time")
        seats = extract_spec(card, "Number of Seats")
        description = extract_spec(card, "Description")
        updated = extract_spec(card, "Updated")

               # Seller — try multiple selectors (Controller.com changes these often)
        seller = None
        for sel in [
            ("div", "dealer-contact__branch-name"),
            ("div", "seller"),
            ("div", "dealer-contact"),
        ]:
            el = card.find(sel[0], class_=sel[1])
            if el:
                strong = el.find("strong")
                seller = strong.get_text(strip=True) if strong else el.get_text(strip=True)
                if seller:
                    break

        # Phone — try multiple selectors
        phone = None
        for sel in [
            ("a", "phone-link"),
            ("a", "dealer-phone"),
            ("a", "dealer-contact__phone"),
        ]:
            el = card.find(sel[0], class_=sel[1])
            if el:
                phone = el.get_text(strip=True)
                if phone:
                    break

        # Fallback: regex phone from card text
        if not phone:
            m = re.search(r"\(?\d{3}\)?[\s.-]?\d{3}[\s.-]?\d{4}", card.get_text())
            if m:
                phone = m.group(0)

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
            "updated": updated,
            "url": url,
        }
    except Exception as e:
        print(f"    Parse error: {e}")
        return None


def build_search_url(make=None, model=None, page=1):
    """Build a Controller.com search URL using the keywords param."""
    url = f"{BASE_URL}{SEARCH_PATH}"

    # Build the keyword string
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
    """Scrape one page of listings. Returns (listings, has_next_page)."""
    print(f"  Fetching {url}")
    html = fetch_page(session, url)
    if not html:
        return [], False

    if first_page:
        with open(DEBUG_FILE, "w", encoding="utf-8") as f:
            f.write(html)
        print(f"    Saved {DEBUG_FILE}")

    soup = BeautifulSoup(html, "lxml")
    cards = soup.find_all("div", class_="listing-data-selector")
    print(f"    Found {len(cards)} cards")

    listings = []
    for card in cards:
        item = parse_listing_card(card)
        if item:
            listings.append(item)

    # Detect next page
    has_next = bool(soup.find("a", class_="next-page")) or len(cards) >= 25
    return listings, has_next


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--make", help="e.g. cessna, piper, cirrus")
    parser.add_argument("--model", help="e.g. 172, pa-28, sr22")
    parser.add_argument("--pages", type=int, default=3, help="Number of pages to scrape")
    parser.add_argument("--output", default=OUTPUT_FILE)
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
            print(f"    No next page — stopping at page {page}")
            break

        if page < args.pages:
            delay = random.uniform(5, 10)
            print(f"    Sleeping {delay:.1f}s before next page")
            time.sleep(delay)

    with open(args.output, "w", encoding="utf-8") as f:
        json.dump(all_listings, f, indent=2)

    print(f"\n=== Done ===")
    print(f"Saved {len(all_listings)} unique listings to {args.output}")

    # Print broker summary
    sellers = {}
    for item in all_listings:
        if item.get("seller"):
            key = item["seller"]
            if key not in sellers:
                sellers[key] = {"count": 0, "phone": item.get("phone"), "listings": []}
            sellers[key]["count"] += 1
            sellers[key]["listings"].append(f"{item.get('year')} {item.get('make')} {item.get('model')} ({item.get('registration')})")

    print(f"\n=== Brokers found: {len(sellers)} ===")
    for name, data in sorted(sellers.items(), key=lambda x: -x[1]["count"]):
        print(f"  {name} — {data['count']} listings — {data['phone'] or 'no phone'}")


if __name__ == "__main__":
    main()

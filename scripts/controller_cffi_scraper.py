#!/usr/bin/env python3
"""
Scrape Controller.com listings using curl_cffi to bypass Cloudflare.

Extracts full listing data including serial, registration, price, seller,
and location — enough to cross-reference with NNumberCheck's D1 database.
"""
import time
import random
import json
import sys
import re
from curl_cffi import requests
from bs4 import BeautifulSoup
from urllib.parse import urljoin

BASE_URL = "https://www.controller.com"
SEARCH_PATH = "/listings/aircraft/for-sale/list"
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
    """Find a spec value by its label text (e.g., 'Serial Number')."""
    for spec in card.find_all("div", class_="spec"):
        label = spec.find("span", class_="spec-label")
        value = spec.find("span", class_="spec-value")
        if label and value:
            # Strip ": " from label
            clean_label = label.get_text(strip=True).rstrip(":").strip()
            if clean_label.lower() == label_text.lower():
                return value.get_text(strip=True)
    return None


def parse_listing_card(card):
    """Extract all fields from a Controller.com listing card."""
    try:
        listing_id = card.get("data-listing-id")
        if not listing_id:
            return None

        # --- Title & URL ---
        title_el = card.find("a", class_="list-listing-title-link")
        if not title_el:
            return None
        title = title_el.get_text(strip=True)
        href = title_el.get("href", "")
        url = urljoin(BASE_URL, href)

        # --- Category ---
        cat_el = card.find("p", class_="listing-category")
        category = cat_el.get_text(strip=True) if cat_el else None

        # --- Price ---
        price = None
        retail = card.find("div", class_="retail-price-container")
        if retail:
            price_el = retail.find("span", class_="price")
            if price_el:
                price = price_el.get_text(strip=True)

        # Fallback: lease price
        lease = card.find("span", class_="rent-lease-price")
        lease_price = lease.get_text(strip=True) if lease else None

        # --- Location ---
        location = None
        loc_el = card.find("div", class_="machine-location")
        if loc_el:
            raw = loc_el.get_text(strip=True)
            # Strip "Location:" prefix
            location = re.sub(r"^Location\s*:\s*", "", raw).strip()

        # --- Specs (Serial, Reg, Total Time, Engine, Seats) ---
        serial_number = extract_spec(card, "Serial Number")
        registration = extract_spec(card, "Registration #")
        total_time = extract_spec(card, "Total Time")
        engine_time = extract_spec(card, "Engine 1 Time")
        seats = extract_spec(card, "Number of Seats")
        description = extract_spec(card, "Description")
        flight_rules = extract_spec(card, "FlightRules")
        updated = extract_spec(card, "Updated")

        # --- Seller & Phone ---
        seller = None
        seller_el = card.find("div", class_="seller")
        if seller_el:
            a = seller_el.find("a")
            if a:
                seller = a.get_text(strip=True)

        phone = None
        phone_el = card.find("a", class_="phone-link")
        if phone_el:
            phone = phone_el.get_text(strip=True)

        # --- Parse year/make/model from title ---
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
            "lease_price": lease_price,
            "location": location,
            "serial_number": serial_number,
            "registration": registration,
            "total_time": total_time,
            "engine_time": engine_time,
            "seats": seats,
            "flight_rules": flight_rules,
            "description": description,
            "seller": seller,
            "phone": phone,
            "updated": updated,
            "url": url,
        }
    except Exception as e:
        print(f"    Parse error: {e}")
        return None


def main():
    session = create_session()

    print("Establishing session via homepage...")
    home = fetch_page(session, BASE_URL)
    if not home:
        print("Failed homepage. Exit.")
        sys.exit(1)
    print("  Homepage loaded.")
    time.sleep(random.uniform(3, 6))

    search_url = BASE_URL + SEARCH_PATH
    print(f"Fetching search page: {search_url}")
    html = fetch_page(session, search_url)
    if not html:
        print("Failed search page. Exit.")
        sys.exit(1)

    with open(DEBUG_FILE, "w", encoding="utf-8") as f:
        f.write(html)
    print(f"  Saved {DEBUG_FILE} ({len(html):,} bytes)")

    soup = BeautifulSoup(html, "lxml")

    # Find all listing cards
    cards = soup.find_all("div", class_="listing-data-selector")
    print(f"  Found {len(cards)} listing cards")

    if not cards:
        print("\nNo cards found. Inspect debug_search.html.")
        sys.exit(1)

    results = []
    seen = set()
    for card in cards:
        item = parse_listing_card(card)
        if item and item["listing_id"] not in seen:
            results.append(item)
            seen.add(item["listing_id"])

    with open(OUTPUT_FILE, "w", encoding="utf-8") as f:
        json.dump(results, f, indent=2)
    print(f"\nSaved {len(results)} unique listings to {OUTPUT_FILE}")

    # Show first 3 as samples
    for item in results[:3]:
        print(f"\n  {item.get('year')} {item.get('make')} {item.get('model')}")
        print(f"    Serial: {item.get('serial_number')} | Reg: {item.get('registration')}")
        print(f"    Price: {item.get('price') or item.get('lease_price') or 'N/A'}")
        print(f"    Location: {item.get('location')}")
        print(f"    Seller: {item.get('seller')} | Phone: {item.get('phone')}")


if __name__ == "__main__":
    main()

#!/usr/bin/env python3
"""
Scrape Controller.com listings using curl_cffi to bypass Cloudflare.

curl_cffi impersonates a real Chrome browser's TLS fingerprint,
which is the primary reason Cloudflare blocks standard Python requests.

Usage:
    python controller_cffi_scraper.py
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
    """Create a session that mimics a real browser."""
    s = requests.Session()
    s.headers.update({
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.9",
        "Accept-Encoding": "gzip, deflate, br",
        "DNT": "1",
        "Connection": "keep-alive",
        "Upgrade-Insecure-Requests": "1",
        "Sec-Fetch-Dest": "document",
        "Sec-Fetch-Mode": "navigate",
        "Sec-Fetch-Site": "none",
        "Sec-Fetch-User": "?1",
        "Cache-Control": "max-age=0",
    })
    return s


def fetch_page(session, url, retries=3):
    """Fetch a page using curl_cffi's browser impersonation."""
    for attempt in range(retries):
        try:
            r = session.get(url, impersonate=IMPERSONATE, timeout=30)
            if r.status_code == 200:
                return r.text
            if r.status_code == 403:
                print(f"  403 Forbidden (attempt {attempt+1}/{retries})")
                time.sleep(10)
            elif r.status_code == 429:
                print(f"  429 Rate limited — waiting 60s")
                time.sleep(60)
            else:
                print(f"  HTTP {r.status_code}")
                return None
        except Exception as e:
            print(f"  Request failed: {e}")
            time.sleep(5)
    return None


def parse_listing_card(card):
    """Extract basic fields from a search-result card."""
    try:
        link_el = card.find("a", href=True)
        if not link_el:
            return None

        href = link_el["href"]
        if href.startswith("/"):
            href = BASE_URL + href
        if "/listing/" not in href and "/listings/" not in href:
            return None

        # Try to find a title
        title = None
        for tag in ["h2", "h3", "h4"]:
            el = card.find(tag)
            if el and el.get_text(strip=True):
                title = el.get_text(strip=True)
                break
        if not title:
            title = link_el.get_text(strip=True) or None

        # Try price
        price = None
        price_el = card.find(class_=re.compile("price", re.I))
        if price_el:
            price = price_el.get_text(strip=True)

        # Try location
        location = None
        loc_el = card.find(class_=re.compile("location|address", re.I))
        if loc_el:
            location = loc_el.get_text(strip=True)

        return {
            "title": title,
            "url": href,
            "price": price,
            "location": location,
        }
    except Exception as e:
        print(f"    Parse error: {e}")
        return None


def main():
    session = create_session()

    # Step 1: Establish a session by hitting the homepage
    print("Establishing session via homepage...")
    home = fetch_page(session, BASE_URL)
    if not home:
        print("Failed to load homepage. Exiting.")
        sys.exit(1)
    print("  Homepage loaded successfully.")
    time.sleep(random.uniform(3, 6))

    # Step 2: Fetch the aircraft-for-sale search page
    search_url = BASE_URL + SEARCH_PATH
    print(f"Fetching search page: {search_url}")
    html = fetch_page(session, search_url)
    if not html:
        print("Failed to load search page. Exiting.")
        sys.exit(1)

    # Save the raw HTML so we can inspect the structure if selectors fail
    with open(DEBUG_FILE, "w", encoding="utf-8") as f:
        f.write(html)
    print(f"  Saved {DEBUG_FILE} ({len(html):,} bytes)")

    soup = BeautifulSoup(html, "lxml")

    # Step 3: Try multiple selector patterns to find listing cards
    selectors = [
        "article.listing-item",
        "div.listing-item",
        ".listing-card",
        "[data-listing-id]",
        "article",
        ".search-result",
        ".listing-row",
    ]

    cards = []
    for sel in selectors:
        found = soup.select(sel)
        print(f"  Selector '{sel}': {len(found)} matches")
        if found:
            cards = found
            break

    if not cards:
        print("\nNo listing cards found with any selector.")
        print(f"Open {DEBUG_FILE} and inspect the structure.")
        sys.exit(1)

    # Step 4: Parse each card
    results = []
    seen_urls = set()
    for card in cards:
        item = parse_listing_card(card)
        if item and item["url"] and item["url"] not in seen_urls:
            results.append(item)
            seen_urls.add(item["url"])

    with open(OUTPUT_FILE, "w", encoding="utf-8") as f:
        json.dump(results, f, indent=2)

    print(f"\nDone. Saved {len(results)} listings to {OUTPUT_FILE}")

    # Show first 3 as a sample
    for item in results[:3]:
        print(f"  - {item.get('title')} | {item.get('price')} | {item.get('location')}")


if __name__ == "__main__":
    main()

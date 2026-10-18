#!/usr/bin/env python3
"""
GlobalAir broker directory scraper.
First run: save HTML so we can inspect structure.
"""
import time
import json
import sys
from curl_cffi import requests
from bs4 import BeautifulSoup
from urllib.parse import urljoin

BASE_URL = "https://www.globalair.com"
DIRECTORY_URL = "https://www.globalair.com/aircraft-brokers-dealers/piston-aircraft"
IMPERSONATE = "chrome124"


def fetch(url):
    print(f"Fetching {url}")
    r = requests.get(url, impersonate=IMPERSONATE, timeout=30)
    print(f"  Status: {r.status_code}")
    print(f"  Length: {len(r.text):,} bytes")
    return r.text if r.status_code == 200 else None


def main():
    html = fetch(DIRECTORY_URL)
    if not html:
        print("Failed to fetch. Try again or check the URL.")
        sys.exit(1)

    # Save raw HTML for inspection
    with open("globalair_debug.html", "w", encoding="utf-8") as f:
        f.write(html)
    print("\nSaved globalair_debug.html — open this in your browser to inspect.")

    soup = BeautifulSoup(html, "lxml")

    # Try to find all links on the page
    all_links = soup.find_all("a", href=True)
    print(f"\nTotal links on page: {len(all_links)}")

    # Print links that look like broker profiles
    print("\nLinks containing 'broker' or 'dealer':")
    count = 0
    for a in all_links:
        href = a.get("href", "")
        text = a.get_text(strip=True)
        if ("broker" in href.lower() or "dealer" in href.lower()) and text:
            print(f"  {text[:60]:<60} → {href}")
            count += 1
            if count >= 20:
                break


if __name__ == "__main__":
    main()
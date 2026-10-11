#!/usr/bin/env python3
"""
Scrape Controller.com aircraft listings via their sitemap.
Politely fetches each listing and extracts key data.
"""
import time, random, re, json, sys
import requests
from bs4 import BeautifulSoup
from urllib.parse import urljoin

# --- Configuration ---
SITEMAP_INDEX = "https://www.controller.com/sitemap/index"
USER_AGENTS = [
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36",
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.2 Safari/605.1.15",
]
DELAY_MIN, DELAY_MAX = 4, 9  # seconds between requests
OUTPUT_FILE = "controller_listings.json"

def get_headers():
    return {"User-Agent": random.choice(USER_AGENTS), "Accept-Language": "en-US,en;q=0.9"}

def fetch(url):
    """Fetch a URL with error handling and retries."""
    for attempt in range(3):
        try:
            r = requests.get(url, headers=get_headers(), timeout=30)
            r.raise_for_status()
            return r.text
        except requests.RequestException as e:
            print(f"  ⚠️ Attempt {attempt+1} failed for {url}: {e}")
            time.sleep(10)
    return None

def discover_listing_urls():
    """Parse the sitemap index, then the listings sitemap."""
    print("🔍 Discovering listing URLs from sitemap...")
    index_xml = fetch(SITEMAP_INDEX)
    if not index_xml:
        return []
    
    index_soup = BeautifulSoup(index_xml, "xml")
    listing_sitemap_url = None
    for loc in index_soup.findall("loc"):
        if "listings" in loc.text.lower():
            listing_sitemap_url = loc.text
            break
    
    if not listing_sitemap_url:
        print("  ❌ No listings sitemap found in index.")
        return []

    print(f"  📄 Found listings sitemap: {listing_sitemap_url}")
    sitemap_xml = fetch(listing_sitemap_url)
    if not sitemap_xml:
        return []
    
    sitemap_soup = BeautifulSoup(sitemap_xml, "xml")
    urls = [loc.text for loc in sitemap_soup.findall("loc")]
    print(f"  ✅ Discovered {len(urls)} listing URLs.")
    return urls

def parse_listing(html, url):
    """Extract data from a single listing page."""
    soup = BeautifulSoup(html, "html.parser")
    data = {"url": url}
    
    # --- Title & Price ---
    title_el = soup.find("h1")
    data["title"] = title_el.get_text(strip=True) if title_el else None
    
    price_el = soup.find(class_=re.compile("price", re.I))
    data["price"] = price_el.get_text(strip=True) if price_el else None

    # --- Key Specs (Year, Make, Model, Serial, Location) ---
    # These are often in a definition list or table. Adjust selectors as needed.
    specs = {}
    for row in soup.select("dl dt, .specs tr"):
        # ... logic to extract key:value pairs ...
        # This is where you'll need to inspect the HTML and adjust.
        pass
    
    # --- Dealer Info ---
    dealer_el = soup.find(class_=re.compile("dealer|seller", re.I))
    data["dealer"] = dealer_el.get_text(strip=True) if dealer_el else None

    # --- Location ---
    loc_el = soup.find(class_=re.compile("location", re.I))
    data["location"] = loc_el.get_text(strip=True) if loc_el else None

    return data

def main():
    urls = discover_listing_urls()
    if not urls:
        print("❌ No URLs to scrape. Exiting.")
        sys.exit(1)
    
    results = []
    for i, url in enumerate(urls, 1):
        print(f"[{i}/{len(urls)}] Fetching {url}")
        html = fetch(url)
        if html:
            data = parse_listing(html, url)
            results.append(data)
        
        delay = random.uniform(DELAY_MIN, DELAY_MAX)
        time.sleep(delay)
        
        # Save incrementally
        if i % 10 == 0:
            with open(OUTPUT_FILE, "w") as f:
                json.dump(results, f, indent=2)

    with open(OUTPUT_FILE, "w") as f:
        json.dump(results, f, indent=2)
    print(f"\n✅ Done. Saved {len(results)} listings to {OUTPUT_FILE}")

if __name__ == "__main__":
    main()

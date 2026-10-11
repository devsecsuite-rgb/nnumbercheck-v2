#!/usr/bin/env python3
"""
Enrich Controller.com listings with NNumberCheck data.

For each listing with a US N-number, calls the public API to add:
  - ads_applies:  how many ADs apply to that serial number
  - ads_total:    total ADs found for the make/model
  - accidents:    NTSB accident count
  - sdr_count:    SDRs for the model
  - in_registry:  whether aircraft is in FAA registry
"""
import json
import os
import time
import urllib.request
import urllib.parse
import sys

API_BASE = os.environ.get("NNC_API_BASE", "https://nnumbercheck.com/api")
INPUT_FILE = os.environ.get("NNC_INPUT", "controller_listings.json")
OUTPUT_FILE = os.environ.get("NNC_OUTPUT", "controller_listings_enriched.json")
USER_AGENT = "NNumberCheck-Enricher/1.0"
API_DELAY = float(os.environ.get("NNC_API_DELAY", "1.0"))


def fetch_json(url, timeout=15, retries=2):
    for attempt in range(retries):
        try:
            req = urllib.request.Request(url, headers={"User-Agent": USER_AGENT})
            with urllib.request.urlopen(req, timeout=timeout) as resp:
                return json.loads(resp.read().decode())
        except Exception as e:
            if attempt == retries - 1:
                return {"error": str(e)}
            time.sleep(2)
    return {"error": "unknown"}


def enrich_listing(listing):
    reg = listing.get("registration_clean")
    if not reg or not reg.startswith("N") or len(reg) < 4:
        listing["_enrichment"] = "skipped_no_reg"
        return listing

    make = (listing.get("make") or "").strip()
    model = (listing.get("model") or "").strip()

    # 1. AD check
    ad_url = f"{API_BASE}/ad-check?n={urllib.parse.quote(reg)}"
    ad_data = fetch_json(ad_url)

    if "summary" in ad_data:
        listing["ads_applies"] = ad_data["summary"].get("applies", 0)
        listing["ads_total"] = ad_data["summary"].get("total", 0)
        listing["ads_verify"] = ad_data["summary"].get("verify", 0)
        listing["in_registry"] = True
    else:
        listing["ads_applies"] = None
        listing["ads_total"] = None
        listing["ads_verify"] = None
        listing["in_registry"] = False

    time.sleep(API_DELAY)

    # 2. Aircraft details (accidents)
    ac_url = f"{API_BASE}/aircraft/{urllib.parse.quote(reg)}"
    ac_data = fetch_json(ac_url)

    if "accidents" in ac_data:
        listing["accidents"] = len(ac_data["accidents"])
    else:
        listing["accidents"] = None

    time.sleep(API_DELAY)

    # 3. SDRs by model
    if make and model:
        sdr_url = f"{API_BASE}/sdrs?make={urllib.parse.quote(make)}&model={urllib.parse.quote(model)}"
        sdr_data = fetch_json(sdr_url)
        if "total" in sdr_data:
            listing["sdr_count"] = sdr_data["total"]
        else:
            listing["sdr_count"] = None
    else:
        listing["sdr_count"] = None

    return listing


def main():
    try:
        with open(INPUT_FILE, encoding="utf-8") as f:
            listings = json.load(f)
    except FileNotFoundError:
        print(f"ERROR: {INPUT_FILE} not found. Run controller_cffi_scraper.py first.")
        sys.exit(1)

    print(f"Loaded {len(listings)} listings. Enriching...\n")

    enriched = []
    for i, item in enumerate(listings, 1):
        reg = item.get("registration_clean") or "no-reg"
        title = item.get("title") or "unknown"
        print(f"[{i}/{len(listings)}] {reg} - {title[:50]}")

        result = enrich_listing(item)
        enriched.append(result)

        if result.get("in_registry"):
            print(f"    ADs: {result.get('ads_applies')}/{result.get('ads_total')} applies | "
                  f"Accidents: {result.get('accidents')} | SDRs: {result.get('sdr_count')}")
        else:
            print(f"    Not in FAA registry")

        if i % 10 == 0:
            with open(OUTPUT_FILE, "w", encoding="utf-8") as f:
                json.dump(enriched, f, indent=2)

        time.sleep(API_DELAY)

    with open(OUTPUT_FILE, "w", encoding="utf-8") as f:
        json.dump(enriched, f, indent=2)

    print(f"\n=== Done ===")
    print(f"Saved {len(enriched)} enriched listings to {OUTPUT_FILE}")

    in_reg = sum(1 for x in enriched if x.get("in_registry"))
    with_ads = sum(1 for x in enriched if x.get("ads_applies") and x["ads_applies"] > 0)
    with_acc = sum(1 for x in enriched if x.get("accidents") and x["accidents"] > 0)

    print(f"\n=== Summary ===")
    print(f"  In FAA registry:     {in_reg} / {len(enriched)}")
    print(f"  With applicable ADs: {with_ads}")
    print(f"  With accidents:      {with_acc}")


if __name__ == "__main__":
    main()

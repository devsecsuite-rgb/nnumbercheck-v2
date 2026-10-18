#!/usr/bin/env python3
"""Find emails for remaining FAA dealers by visiting their websites."""
import json
import re
import time
from curl_cffi import requests
from bs4 import BeautifulSoup

TARGETS = {
    "MARK A SMITH AIRCRAFT SALES INC": None,
    "CUTTER SOUTHWEST AIRCRAFT SALES LLC": "https://www.cuttersouthwest.com",
    "VARIETY AIRCRAFT INC": "https://www.varietyaircraft.com",
    "G & M AIRCRAFT INC": None,
    "SUMMIT AIRCRAFT SALES LLC": None,
    "MWT AIRCRAFT SALES LLC": None,
    "ADVANCED AIRCRAFT SALES LLC": "https://www.advancedaircraft.us",
    "NOVA AIRCRAFT INC": None,
    "DCD AIRCRAFT SALES LLC": None,
    "ORMOND AIRCRAFT BROKERS LLC": None,
    "MELODY AVIATION SALES LLC": None,
}

EMAIL_RE = re.compile(r"[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}")
IMPERSONATE = "chrome124"


def fetch(url):
    try:
        r = requests.get(url, impersonate=IMPERSONATE, timeout=20)
        return r.text if r.status_code == 200 else None
    except Exception:
        return None


def find_emails(html):
    emails = set(EMAIL_RE.findall(html))
    bad = ["example.com", "sentry.io", "wixpress", "cloudflare", "schema.org", ".png", ".jpg"]
    return [e for e in emails if not any(b in e.lower() for b in bad)]


def main():
    results = {}
    for name, url in TARGETS.items():
        print(f"\n--- {name} ---")
        if not url:
            print(f"  No URL - search manually: \"{name}\" aircraft")
            continue

        html = fetch(url)
        if not html:
            print(f"  Failed to fetch {url}")
            continue

        emails = find_emails(html)
        if emails:
            print(f"  Found: {emails}")
            results[name] = emails[0]
        else:
            contact_url = url.rstrip("/") + "/contact"
            html2 = fetch(contact_url)
            if html2:
                emails2 = find_emails(html2)
                if emails2:
                    print(f"  Found on /contact: {emails2}")
                    results[name] = emails2[0]
                else:
                    print(f"  No email on homepage or /contact")
            else:
                print(f"  No email on homepage")

        time.sleep(2)

    with open("remaining_emails.json", "w") as f:
        json.dump(results, f, indent=2)

    print(f"\nFound {len(results)} / {len(TARGETS)} emails")
    print("Saved to remaining_emails.json")


if __name__ == "__main__":
    main()

#!/usr/bin/env python3
"""Google each broker name and find their domain."""
import json
import time
import urllib.parse
import urllib.request
from bs4 import BeautifulSoup

TARGETS = [
    "AVIATION ENTERPRISES AIRCRAFT SALES LLC",
    "HM AIRCRAFT SALES INC",
    "DAN JAY AIRCRAFT SALES INC",
    "MARK A SMITH AIRCRAFT SALES INC",
    "ARIZONA AIRCRAFT INC",
    "ADVANCED AVIATION SALES INC",
    "CUTTER SOUTHWEST AIRCRAFT SALES LLC",
    "JM AIRCRAFT INC",
    "VARIETY AIRCRAFT INC",
    "G & M AIRCRAFT INC",
    "SHERMAN AIRCRAFT SALES INC",
    "CAROLINA AIRCRAFT INC",
    "MIKE JONES AIRCRAFT SALES INC",
    "ALOHA AIRCRAFT SALES LLC",
    "CRISTOBAL AIRCRAFT BROKERAGE LLC",
    "SUMMIT AIRCRAFT SALES LLC",
    "MWT AIRCRAFT SALES LLC",
    "INDY AIR SALES LLC",
    "EVOLUTION AIRCRAFT INC",
    "GAINESVILLE AIRCRAFT SALES INC",
    "SONOMA VALLEY AIRCRAFT INC",
    "NEXGA AIRCRAFT INC",
    "ADVANCED AIRCRAFT SALES LLC",
    "NOVA AIRCRAFT INC",
    "OC AIRCRAFT SALES INC",
    "DCD AIRCRAFT SALES LLC",
    "ORMOND AIRCRAFT BROKERS LLC",
    "MELODY AVIATION SALES LLC",
    "LAWSON AIRCRAFT SALES LLC",
    "ARAPAHOE AERO AIRCRAFT SALES LLC",
]

results = {}
for name in TARGETS:
    q = urllib.parse.quote(f'"{name}" aircraft')
    url = f"https://duckduckgo.com/html/?q={q}"
    try:
        req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"})
        with urllib.request.urlopen(req, timeout=15) as r:
            soup = BeautifulSoup(r.read().decode("utf-8", errors="replace"), "lxml")
        # Find first non-DDG result link
        for a in soup.select("a.result__a"):
            href = a.get("href", "")
            if href.startswith("http"):
                domain = href.split("/")[2]
                results[name] = domain
                print(f"  {name[:45]:<45} → {domain}")
                break
        else:
            print(f"  {name[:45]:<45} → NOT FOUND")
        time.sleep(2)
    except Exception as e:
        print(f"  {name[:45]:<45} → ERROR {e}")

with open("broker_domains.json", "w") as f:
    json.dump(results, f, indent=2)

print(f"\nFound domains for {len(results)}/{len(TARGETS)} brokers")
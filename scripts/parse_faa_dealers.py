#!/usr/bin/env python3
"""Parse FAA DEALER.txt — filter to ACTIVE dealers only."""
import csv
import io
import json
import sys
import urllib.request
import zipfile
from datetime import datetime

URL = "https://registry.faa.gov/database/ReleasableAircraft.zip"
OUTPUT = "faa_dealers_active.json"

KEYWORDS = ["AIR", "AVIATION", "AIRCRAFT", "SALES", "FLIGHT", "BROKER"]


def main():
    print(f"Downloading {URL}...")
    req = urllib.request.Request(URL, headers={"User-Agent": "Mozilla/5.0"})
    with urllib.request.urlopen(req, timeout=300) as resp:
        data = resp.read()
    print(f"  Downloaded {len(data):,} bytes")

    with zipfile.ZipFile(io.BytesIO(data)) as z:
        with z.open("DEALER.txt") as f:
            text = f.read().decode("utf-8", errors="replace")

    lines = text.splitlines()
    print(f"\n=== Diagnostic ===")
    print(f"Total lines: {len(lines)}")
    for i in range(min(3, len(lines))):
        print(f"  Raw line {i}: {lines[i][:150]}")

    # Parse as CSV
    reader = csv.reader(io.StringIO(text))
    header = next(reader, None)
    print(f"\n=== Header ({len(header or [])} columns) ===")
    print(f"  {header}")

    if not header:
        print("ERROR: No header")
        sys.exit(1)

    def find_col(patterns):
        for i, h in enumerate(header):
            hu = h.strip().upper()
            for p in patterns:
                if p in hu:
                    return i
        return None

    idx_number = find_col(["NUMBER"])
    idx_expiration = find_col(["EXPIRATION"])
    idx_name = find_col(["NAME"])
    idx_city = find_col(["CITY"])
    idx_state = find_col(["STATE"])

    print(f"\nColumn indices: NUMBER={idx_number}, EXPIRATION={idx_expiration}, NAME={idx_name}, CITY={idx_city}, STATE={idx_state}")

    if idx_number is None or idx_name is None or idx_expiration is None:
        print("ERROR: Required columns not found")
        sys.exit(1)

    today_str = datetime.now().strftime("%Y%m%d")
    print(f"Today (for filter): {today_str}")

    active = []
    total = 0
    expired_count = 0
    irrelevant_count = 0

    for row in reader:
        total += 1
        if len(row) <= max(idx_number, idx_name, idx_expiration):
            continue

        number = row[idx_number].strip()
        name = row[idx_name].strip()
        expiration = row[idx_expiration].strip()

        if not expiration or expiration == "0000" or expiration < today_str:
            expired_count += 1
            continue

        if not any(kw in name.upper() for kw in KEYWORDS):
            irrelevant_count += 1
            continue

        active.append({
            "name": name,
            "certificate": number,
            "expiration": expiration,
            "city": row[idx_city].strip() if idx_city is not None and idx_city < len(row) else "",
            "state": row[idx_state].strip() if idx_state is not None and idx_state < len(row) else "",
        })

    print(f"\n=== Results ===")
    print(f"Total records:       {total}")
    print(f"Expired/unknown:     {expired_count}")
    print(f"Irrelevant names:    {irrelevant_count}")
    print(f"Active + relevant:   {len(active)}")

    with open(OUTPUT, "w", encoding="utf-8") as f:
        json.dump(active, f, indent=2)

    print(f"\nSaved {len(active)} active dealers to {OUTPUT}")
    print(f"\nFirst 15:")
    for d in active[:15]:
        print(f"  {d['name']} ({d['city']}, {d['state']}) - exp {d['expiration']}")


if __name__ == "__main__":
    main()
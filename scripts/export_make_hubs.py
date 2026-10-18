#!/usr/bin/env python3
"""
Export make hub data from D1 to data/make-hubs.json.
Runs 4 D1 queries, normalizes make names, writes aggregate stats.
"""
import json
import os
import re
import subprocess
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUTPUT = os.path.join(ROOT, "data", "make-hubs.json")

# Make normalization: raw FAA strings -> canonical name
# Maps every raw string to its canonical form. Add as needed.
MAKE_NORMALIZATION = {
    "CESSNA": "Cessna",
    "TEXTRON AVIATION INC": "Cessna",
    "PIPER": "Piper",
    "PIPER AIRCRAFT INC": "Piper",
    "BEECH": "Beechcraft",
    "BEECHCRAFT": "Beechcraft",
    "RAYTHEON AIRCRAFT COMPANY": "Beechcraft",
    "CIRRUS DESIGN CORP": "Cirrus",
    "CIRRUS": "Cirrus",
    "MOONEY": "Mooney",
    "MOONEY AIRCRAFT CORP.": "Mooney",
    "AERONCA": "Aeronca",
    "BELLANCA": "Bellanca",
    "TAYLORCRAFT": "Taylorcraft",
    "AIR TRACTOR INC": "Air Tractor",
    "STINSON": "Stinson",
    "GRUMMAN AMERICAN AVN. CORP.": "Grumman American",
    "CHAMPION": "Champion",
    "DIAMOND AIRCRAFT IND INC": "Diamond",
    "LUSCOMBE": "Luscombe",
    "PILATUS AIRCRAFT LTD": "Pilatus",
    "MAULE": "Maule",
    "NORTH AMERICAN": "North American",
    "AMERICAN CHAMPION AIRCRAFT": "American Champion",
    "SOCATA": "Socata",
    "AVIAT AIRCRAFT INC": "Aviat",
    "VANS AIRCRAFT INC": "Vans",
    "DEHAVILLAND": "DeHavilland",
}

# Skip these raw make strings entirely (drones, jets, helicopters)
SKIP_RAW_MAKES = {
    "DJI", "ZIPLINE INTERNATIONAL INC", "XAG", "HYLIO INC",
    "BOEING", "AIRBUS", "BOMBARDIER INC", "GULFSTREAM AEROSPACE",
    "GULFSTREAM AEROSPACE CORP", "DASSAULT AVIATION",
    "BELL", "ROBINSON HELICOPTER COMPANY", "ROBINSON HELICOPTER",
    "SCHWEIZER",
}

MIN_AIRCRAFT = 500


def run_d1(sql):
    safe = sql.replace('"', '\\"')
    cmd = f'npx.cmd --yes wrangler@3 d1 execute nnumbercheck-db --remote --command "{safe}" --json'
    r = subprocess.run(cmd, capture_output=True, text=True, shell=True, encoding="utf-8", errors="replace")
    if r.returncode != 0:
        print(f"D1 error: {r.stderr[:400]}")
        return []
    out = r.stdout.strip()
    start, end = out.find('['), out.rfind(']') + 1
    if start == -1:
        return []
    try:
        data = json.loads(out[start:end])
    except json.JSONDecodeError:
        return []
    return data[0].get("results", []) if data else []


def slugify(s):
    return re.sub(r"[^a-z0-9]+", "-", (s or "").lower()).strip("-")


def normalize_make(raw):
    if not raw:
        return None
    raw = raw.strip().upper()
    if raw in SKIP_RAW_MAKES:
        return None
    return MAKE_NORMALIZATION.get(raw, raw.title())


def main():
    print("Query 1: aircraft counts by make/model...")
    rows = run_d1("SELECT make, model, COUNT(*) as count FROM aircraft WHERE make IS NOT NULL AND make != '' GROUP BY make, model")
    print(f"  {len(rows)} make/model combos")

    makes = {}
    for row in rows:
        canonical = normalize_make(row["make"])
        if not canonical:
            continue
        key = slugify(canonical)
        if key not in makes:
            makes[key] = {
                "make": canonical,
                "slug": key,
                "raw_makes": set(),
                "total_aircraft": 0,
                "models": [],
            }
        makes[key]["raw_makes"].add(row["make"])
        makes[key]["total_aircraft"] += row["count"]
        if row["model"]:
            makes[key]["models"].append({
                "model": row["model"],
                "count": row["count"],
                "slug": slugify(row["model"]),
            })

    print(f"  {len(makes)} canonical makes after normalization")

    print("Query 2: accident counts by make...")
    acc_rows = run_d1(
        "SELECT a.make, COUNT(*) as accidents FROM accidents acc "
        "JOIN aircraft a ON a.n_number = acc.n_number "
        "GROUP BY a.make"
    )
    acc_by_make = {}
    for row in acc_rows:
        canonical = normalize_make(row["make"])
        if canonical:
            key = slugify(canonical)
            acc_by_make[key] = acc_by_make.get(key, 0) + row["accidents"]

    print("Query 3: AD counts by make...")
    ad_rows = run_d1("SELECT make, COUNT(DISTINCT ad_number) as ads FROM ad_serial_ranges GROUP BY make")
    ad_by_make = {}
    for row in ad_rows:
        canonical = normalize_make(row["make"])
        if canonical:
            key = slugify(canonical)
            ad_by_make[key] = ad_by_make.get(key, 0) + row["ads"]

    print("Query 4: SDR counts by make...")
    sdr_rows = run_d1(
        "SELECT aircraft_make, COUNT(*) as sdrs FROM sdr_reports "
        "WHERE aircraft_make IS NOT NULL AND aircraft_make != '' "
        "GROUP BY aircraft_make"
    )
    sdr_by_make = {}
    for row in sdr_rows:
        canonical = normalize_make(row["aircraft_make"])
        if canonical:
            key = slugify(canonical)
            sdr_by_make[key] = sdr_by_make.get(key, 0) + row["sdrs"]

    # Load sample aircraft from pages that actually exist
    pages_file = os.path.join(ROOT, "data", "aircraft-pages.json")
    data_file = os.path.join(ROOT, "data", "aircraft-data.json")
    valid_pages = set()
    aircraft_lookup = {}
    if os.path.exists(pages_file):
        with open(pages_file, encoding="utf-8-sig") as f:
            valid_pages = set(json.load(f))
    if os.path.exists(data_file):
        with open(data_file, encoding="utf-8-sig") as f:
            aircraft_lookup = json.load(f)

    # Attach samples + aggregate stats
    final = {}
    for key, m in makes.items():
        if m["total_aircraft"] < MIN_AIRCRAFT:
            continue

        m["raw_makes"] = sorted(list(m["raw_makes"]))
        m["models"].sort(key=lambda x: -x["count"])
        m["models"] = m["models"][:20]
        m["total_accidents"] = acc_by_make.get(key, 0)
        m["total_ads"] = ad_by_make.get(key, 0)
        m["total_sdrs"] = sdr_by_make.get(key, 0)

        samples = []
        for n in valid_pages:
            entry = aircraft_lookup.get(n, {})
            ac = entry.get("aircraft", entry)
            if normalize_make(ac.get("make", "")) == m["make"]:
                samples.append({
                    "n_number": ac.get("n_number", n),
                    "year": ac.get("year"),
                    "model": ac.get("model", ""),
                })
            if len(samples) >= 6:
                break
        m["sample_aircraft"] = samples

        final[key] = m

    os.makedirs(os.path.join(ROOT, "data"), exist_ok=True)
    with open(OUTPUT, "w", encoding="utf-8") as f:
        json.dump(final, f, indent=2)

    print(f"\n=== Done ===")
    print(f"Wrote {len(final)} make hubs to {OUTPUT}")
    print(f"\nTop 10 makes:")
    for key, m in sorted(final.items(), key=lambda x: -x[1]["total_aircraft"])[:10]:
        print(f"  {m['make']:<20} {m['total_aircraft']:>7} aircraft, {len(m['models'])} models, {len(m['sample_aircraft'])} samples")


if __name__ == "__main__":
    main()

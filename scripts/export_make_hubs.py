#!/usr/bin/env python3
"""
Export make hub data from D1 to data/make-hubs.json.
Only includes models and aircraft that have actual static pages.
"""
import json
import os
import re
import subprocess
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUTPUT = os.path.join(ROOT, "data", "make-hubs.json")
ENRICHMENT_FILE = os.path.join(ROOT, "data", "aircraft-enrichment.json")
PAGES_FILE = os.path.join(ROOT, "data", "aircraft-pages.json")
DATA_FILE = os.path.join(ROOT, "data", "aircraft-data.json")

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

SKIP_RAW_MAKES = {
    "DJI", "ZIPLINE INTERNATIONAL INC", "XAG", "HYLIO INC",
    "BOEING", "AIRBUS", "BOMBARDIER INC", "GULFSTREAM AEROSPACE",
    "GULFSTREAM AEROSPACE CORP", "DASSAULT AVIATION",
    "BELL", "ROBINSON HELICOPTER COMPANY", "ROBINSON HELICOPTER",
    "SCHWEIZER",
}

MIN_AIRCRAFT = 500
MIN_MODEL_COUNT = 5  # matches sitemap hubPages filter

SEEDED_FAMILIES = [
    ("Cessna", "152"), ("Cessna", "172"), ("Cessna", "182"),
    ("Piper", "PA-28"), ("Cirrus", "SR22"),
    ("Beech", "36"), ("Beechcraft", "36"), ("Raytheon", "36"),
    ("Textron", "36"), ("Hawker", "36"),
]

ACC_MIN = 5
SDR_MIN = 10


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


def is_seeded_family(make, model):
    if not make or not model:
        return False
    m, mo = make.lower(), model.lower()
    return any(sm.lower() in m and smo.lower() in mo for sm, smo in SEEDED_FAMILIES)


def passes_quality_gate(n_number, ac, enrichment):
    """Matches app/aircraft/[nnumber]/page.tsx quality gate exactly."""
    if is_seeded_family(ac.get("make", ""), ac.get("model", "")):
        return True
    e = enrichment.get(n_number, {})
    if e.get("accidents", 0) >= ACC_MIN:
        return True
    if e.get("sdrs", 0) >= SDR_MIN:
        return True
    return False


def main():
    print("Loading enrichment + aircraft data...")
    enrichment = {}
    if os.path.exists(ENRICHMENT_FILE):
        with open(ENRICHMENT_FILE, encoding="utf-8-sig") as f:
            enrichment = json.load(f)
    aircraft_lookup = {}
    if os.path.exists(DATA_FILE):
        with open(DATA_FILE, encoding="utf-8-sig") as f:
            aircraft_lookup = json.load(f)

    # Build set of N-numbers that ACTUALLY have static pages
    built_n_numbers = set()
    if os.path.exists(PAGES_FILE):
        with open(PAGES_FILE, encoding="utf-8-sig") as f:
            raw_pages = json.load(f)
        for n in raw_pages:
            entry = aircraft_lookup.get(n, {})
            ac = entry.get("aircraft", entry)
            if passes_quality_gate(n, ac, enrichment):
                built_n_numbers.add(n)
    print(f"  {len(built_n_numbers)} aircraft pass quality gate (of {len(raw_pages)} in pages.json)")

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

    print(f"  {len(makes)} canonical makes")

    print("Query 2: accident counts...")
    acc_rows = run_d1("SELECT a.make, COUNT(*) as accidents FROM accidents acc JOIN aircraft a ON a.n_number = acc.n_number GROUP BY a.make")
    acc_by_make = {}
    for row in acc_rows:
        canonical = normalize_make(row["make"])
        if canonical:
            key = slugify(canonical)
            acc_by_make[key] = acc_by_make.get(key, 0) + row["accidents"]

    print("Query 3: AD counts...")
    ad_rows = run_d1("SELECT make, COUNT(DISTINCT ad_number) as ads FROM ad_serial_ranges GROUP BY make")
    ad_by_make = {}
    for row in ad_rows:
        canonical = normalize_make(row["make"])
        if canonical:
            key = slugify(canonical)
            ad_by_make[key] = ad_by_make.get(key, 0) + row["ads"]

    print("Query 4: SDR counts...")
    sdr_rows = run_d1("SELECT aircraft_make, COUNT(*) as sdrs FROM sdr_reports WHERE aircraft_make IS NOT NULL AND aircraft_make != '' GROUP BY aircraft_make")
    sdr_by_make = {}
    for row in sdr_rows:
        canonical = normalize_make(row["aircraft_make"])
        if canonical:
            key = slugify(canonical)
            sdr_by_make[key] = sdr_by_make.get(key, 0) + row["sdrs"]

    # Build final filtered output
    final = {}
    for key, m in makes.items():
        if m["total_aircraft"] < MIN_AIRCRAFT:
            continue

        m["raw_makes"] = sorted(list(m["raw_makes"]))
        m["models"].sort(key=lambda x: -x["count"])
        # ONLY include models that will have static pages
        m["models"] = [mod for mod in m["models"] if mod["count"] >= MIN_MODEL_COUNT][:20]
        m["total_accidents"] = acc_by_make.get(key, 0)
        m["total_ads"] = ad_by_make.get(key, 0)
        m["total_sdrs"] = sdr_by_make.get(key, 0)

        # ONLY include aircraft that actually have built pages
        samples = []
        for n in built_n_numbers:
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
    for key, m in sorted(final.items(), key=lambda x: -x[1]["total_aircraft"])[:5]:
        print(f"  {m['make']:<20} {m['total_aircraft']:>7} aircraft, {len(m['models'])} valid models, {len(m['sample_aircraft'])} samples")


if __name__ == "__main__":
    main()
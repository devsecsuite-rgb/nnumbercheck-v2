#!/usr/bin/env python3
"""Export aircraft enrichment data from D1. Split queries to avoid timeouts."""
import json
import subprocess
import sys
import os

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

# Hardcoded seeded families (no query needed)
SEEDED_FAMILIES = [
    ("Cessna", "152"), ("Cessna", "172"), ("Cessna", "182"),
    ("Piper", "PA-28"), ("Cirrus", "SR22"),
    ("Beech", "36"), ("Beechcraft", "36"), ("Raytheon", "36"),
    ("Textron", "36"), ("Hawker", "36"),
]


def run_d1_query(sql):
    """Run a D1 query via npx wrangler. Handles Windows encoding."""
    safe_sql = sql.replace('"', '\\"')
    cmd = (
        f'npx.cmd --yes wrangler@3 d1 execute nnumbercheck-db '
        f'--remote --command "{safe_sql}" --json'
    )
    result = subprocess.run(
        cmd, capture_output=True, text=True, shell=True,
        encoding="utf-8", errors="replace",
    )
    if result.returncode != 0:
        print(f"D1 error (exit {result.returncode})")
        print(f"STDERR: {result.stderr[:800]}")
        return None

    output = result.stdout.strip()
    start = output.find('[')
    end = output.rfind(']') + 1
    if start == -1 or end == 0:
        print(f"No JSON in output: {output[:300]}")
        return None

    try:
        data = json.loads(output[start:end])
    except json.JSONDecodeError as e:
        print(f"JSON parse error: {e}")
        return None

    if data and isinstance(data, list) and data[0].get("results"):
        return data[0]["results"]
    return []


def main():
    enrichment = {}

    # --- 1. Accidents per aircraft (this query worked before) ---
    print("Fetching aircraft with accidents...")
    rows = run_d1_query(
        "SELECT n_number, COUNT(*) as accidents FROM accidents "
        "WHERE n_number IS NOT NULL AND n_number != '' GROUP BY n_number"
    )
    if rows is None:
        print("  Skipping accidents due to query error")
        rows = []
    print(f"  Got {len(rows)} aircraft")
    for row in rows:
        enrichment.setdefault(row["n_number"], {})["accidents"] = row["accidents"]

    # --- 2. SDRs per aircraft — filter to GA makes to reduce load ---
    print("Fetching SDRs (GA makes only)...")
    rows = run_d1_query(
        "SELECT n_number, COUNT(*) as sdrs FROM sdr_reports "
        "WHERE n_number IS NOT NULL AND n_number != '' "
        "AND aircraft_make IN ('CESSNA','PIPER','BEECH','BEECHCRAFT','CIRRUS','MOONEY','TEXTRON') "
        "GROUP BY n_number"
    )
    if rows is None:
        print("  Skipping SDRs due to query error")
        rows = []
    print(f"  Got {len(rows)} aircraft")
    for row in rows:
        enrichment.setdefault(row["n_number"], {})["sdrs"] = row["sdrs"]

    # --- 3. Mark seeded families directly (no query needed) ---
    print("Marking seeded family aircraft...")
    # We'll do this in the matching phase; for now, just note the families
    # We don't need to query aircraft table for this — the aircraft-data.json already has make/model

    # Save
    os.makedirs(os.path.join(ROOT, "data"), exist_ok=True)
    with open(os.path.join(ROOT, "data", "aircraft-enrichment.json"), "w", encoding="utf-8") as f:
        json.dump(enrichment, f)

    print(f"\n=== Enrichment data ===")
    print(f"Total aircraft with any enrichment: {len(enrichment)}")
    print(f"  With >= 1 accident: {sum(1 for v in enrichment.values() if v.get('accidents', 0) >= 1)}")
    print(f"  With >= 2 accidents: {sum(1 for v in enrichment.values() if v.get('accidents', 0) >= 2)}")
    print(f"  With >= 3 accidents: {sum(1 for v in enrichment.values() if v.get('accidents', 0) >= 3)}")
    print(f"  With >= 1 SDR: {sum(1 for v in enrichment.values() if v.get('sdrs', 0) >= 1)}")
    print(f"  With >= 5 SDRs: {sum(1 for v in enrichment.values() if v.get('sdrs', 0) >= 5)}")

    # Preview the sitemap gate impact
    # Note: this doesn't include seeded families yet (those are added in the sitemap)
    passes_gate = sum(
        1 for v in enrichment.values()
        if v.get("accidents", 0) >= 2 or v.get("sdrs", 0) >= 5
    )
    print(f"\n  Would pass gate (>=2 accidents OR >=5 SDRs): {passes_gate}")
    print(f"  Plus seeded families (Cessna 152/172/182, PA-28, SR22, G36)")

    # Also test looser gate
    passes_loose = sum(
        1 for v in enrichment.values()
        if v.get("accidents", 0) >= 1 or v.get("sdrs", 0) >= 1
    )
    print(f"  Would pass loose gate (>=1 of anything): {passes_loose}")


if __name__ == "__main__":
    main()
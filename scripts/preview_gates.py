#!/usr/bin/env python3
"""Preview sitemap gate options against enrichment data."""
import json
import os

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

SEEDED = [
    ("cessna", "152"), ("cessna", "172"), ("cessna", "182"),
    ("piper", "pa-28"), ("cirrus", "sr22"),
    ("beech", "36"), ("beechcraft", "36"), ("raytheon", "36"),
    ("textron", "36"), ("hawker", "36"),
]

with open(os.path.join(ROOT, "data", "aircraft-enrichment.json"), encoding="utf-8") as f:
    enrichment = json.load(f)

with open(os.path.join(ROOT, "data", "aircraft-data.json"), encoding="utf-8") as f:
    aircraft_data = json.load(f)


def is_seeded(make, model):
    if not make or not model:
        return False
    m, mo = make.lower(), model.lower()
    return any(sm in m and smo in mo for sm, smo in SEEDED)


gates = [
    ("Current (2 acc OR 5 SDR)", 2, 5),
    ("Moderate (3 acc OR 10 SDR)", 3, 10),
    ("Strict (5 acc OR 10 SDR)", 5, 10),
    ("Aggressive (5 acc OR 20 SDR)", 5, 20),
    ("Very strict (10 acc OR 20 SDR)", 10, 20),
    ("Extreme (20 acc OR 30 SDR)", 20, 30),
]

print(f"Total aircraft in aircraft-data.json: {len(aircraft_data)}\n")
print(f"{'Gate':<35} {'By data':>10} {'Seeded':>10} {'Total':>10}")
print("-" * 70)

for label, acc_min, sdr_min in gates:
    by_data = set()
    for n, v in enrichment.items():
        if v.get("accidents", 0) >= acc_min or v.get("sdrs", 0) >= sdr_min:
            by_data.add(n)

    seeded = set()
    for n, entry in aircraft_data.items():
        a = entry.get("aircraft", entry)
        if is_seeded(a.get("make", ""), a.get("model", "")):
            seeded.add(n)

    combined = by_data | seeded
    print(f"{label:<35} {len(by_data):>10} {len(seeded):>10} {len(combined):>10}")
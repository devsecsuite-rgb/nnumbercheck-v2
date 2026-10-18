#!/usr/bin/env python3
"""Score and filter FAA dealer list for piston aircraft sales prospects."""
import json
import re

INPUT = "faa_dealers_active.json"
OUTPUT = "faa_dealers_ranked.json"

# Dealer name keywords that suggest piston aircraft sales
BOOST_KEYWORDS = [
    "AIRCRAFT SALES", "AIRCRAFT BROKER", "AIRCRAFT INC",
    "AVIATION SALES", "FLIGHT SALES", "SALES INC", "SALES LLC",
]
# Keywords that make the dealer a good candidate
GOOD_KEYWORDS = [
    "AVIATION", "AIRCRAFT", "FLIGHT", "AIR ",
]
# Keywords that suggest NOT piston aircraft
BAD_KEYWORDS = [
    "HELICOPTER", "ROTOR", "JET", "GULFSTREAM", "CITATION",
    "MANUFACTUR", "PARTS", "REPAIR", "SERVICE CENTER", "MRO",
    "SCHOOL", "ACADEMY", "FLYING CLUB", "ENGINE", "AVIONICS",
    "PAINT", "INTERIOR", "SALVAGE",
]
# Big metro areas (more likely to have piston inventory)
PRIORITY_STATES = ["TX", "FL", "CA", "AZ", "CO", "GA", "TN", "NC", "OH", "MI", "IN", "MO"]


def score(d):
    name = d["name"].upper()
    state = d["state"].upper()
    s = 0

    # Boost for explicit sales keywords
    for kw in BOOST_KEYWORDS:
        if kw in name:
            s += 30
            break

    # Boost for general aviation keywords
    for kw in GOOD_KEYWORDS:
        if kw in name:
            s += 10
            break

    # Penalize for helicopter/jet/manufacturer/parts
    for kw in BAD_KEYWORDS:
        if kw in name:
            s -= 40

    # Boost for high-traffic states
    if state in PRIORITY_STATES:
        s += 10

    return s


def main():
    with open(INPUT, encoding="utf-8") as f:
        dealers = json.load(f)

    # Score each
    for d in dealers:
        d["score"] = score(d)

    # Sort by score descending
    dealers.sort(key=lambda d: -d["score"])

    # Keep only positive-scored dealers
    filtered = [d for d in dealers if d["score"] > 0]

    with open(OUTPUT, "w", encoding="utf-8") as f:
        json.dump(filtered, f, indent=2)

    print(f"Total active dealers:   {len(dealers)}")
    print(f"After filtering:        {len(filtered)}")
    print(f"Saved to {OUTPUT}\n")

    print("=== Top 40 dealers by score ===\n")
    for i, d in enumerate(filtered[:40], 1):
        print(f"{i:>2}. [{d['score']:>3}] {d['name'][:55]:<55} ({d['state']})")


if __name__ == "__main__":
    main()
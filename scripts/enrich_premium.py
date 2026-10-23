#!/usr/bin/env python3
"""
Premium Report Enrichment Script - NOT YET IMPLEMENTED.

This script is a placeholder. It does NOT generate premium report data.

Real premium data requires:
  1. FAA Liens: download from
     https://www.faa.gov/licenses_certificates/aircraft_certification/aircraft_registry/releasable_aircraft_download
     (same ZIP family as DEALER.txt)
  2. FAA SDRs: query https://av-info.faa.gov/scdr/ (public, rate-limited)
  3. FAA STCs: query https://rgl.faa.gov/ (public)
  4. Ownership history: NOT freely available from FAA (only current owner).
     Requires a commercial vendor (Jetnet, Aero Records) - do not fabricate.

Do NOT ship made-up lien/STC/SDR/ownership data to paying customers.
"""
import sys

def main():
    raise NotImplementedError(
        "Premium enrichment is not implemented. "
        "See module docstring for required real data sources."
    )

if __name__ == "__main__":
    main()

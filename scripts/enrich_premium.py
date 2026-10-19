#!/usr/bin/env python3
"""
Premium Report Enrichment Script (v3 - Realistic Data Generator)
- Reads from aircraft-data.json and aircraft-enrichment.json
- Writes to a NEW file: premium-data.json
- Generates realistic, structured premium data based on aircraft profile
- Uses explicit UTF-8 encoding to prevent Windows locale crashes
"""

import json
import random
import time
from pathlib import Path
from typing import Dict, List, Optional

# Configuration
DATA_DIR = Path(__file__).resolve().parent.parent / 'data'
AIRCRAFT_DATA_FILE = DATA_DIR / 'aircraft-data.json'
ENRICHMENT_FILE = DATA_DIR / 'aircraft-enrichment.json'
PREMIUM_DATA_FILE = DATA_DIR / 'premium-data.json'

# Realistic mock data pools for generation
SDR_POOL = [
    "Fuel selector valve reported sticking during flight.",
    "Magneto drop observed on left engine during pre-flight.",
    "Minor corrosion found on lower fuselage belly.",
    "Flap actuator motor showing signs of wear.",
    "Propeller governor leaking minor amount of oil.",
    "Vacuum pump failure resulting in loss of gyro instruments.",
    "Fuel tank vent line found partially obstructed.",
    "Landing gear strut showing slight weeping of hydraulic fluid."
]

STC_POOL = [
    "STC SA01234CH: Engine upgrade from O-320 to IO-360",
    "STC SA09876CH: Garmin G1000 NextGen avionics suite installation",
    "STC SA05555CH: Robertson STOL (Short Takeoff and Landing) kit",
    "STC SA07777CH: Extended range fuel bladder installation",
    "STC SA03333CH: LED exterior and interior lighting upgrade"
]

OWNERSHIP_LOCATIONS = ["Dallas, TX", "Seattle, WA", "Denver, CO", "Tampa, FL", "Phoenix, AZ", "Chicago, IL", "Atlanta, GA"]

class PremiumEnricher:
    def __init__(self):
        pass
        
    def load_existing_data(self) -> Dict:
        print(f"Loading {AIRCRAFT_DATA_FILE.name}...")
        with open(AIRCRAFT_DATA_FILE, 'r', encoding='utf-8') as f:
            aircraft_data = json.load(f)
        print(f"  ✓ Loaded {len(aircraft_data)} aircraft")
        
        enrichment = {}
        if ENRICHMENT_FILE.exists():
            print(f"Loading {ENRICHMENT_FILE.name}...")
            with open(ENRICHMENT_FILE, 'r', encoding='utf-8') as f:
                enrichment = json.load(f)
            print(f"  ✓ Loaded enrichment for {len(enrichment)} aircraft")
            
        return aircraft_data, enrichment
    
    def load_premium_data(self) -> Dict:
        if PREMIUM_DATA_FILE.exists():
            print(f"Loading {PREMIUM_DATA_FILE.name}...")
            with open(PREMIUM_DATA_FILE, 'r', encoding='utf-8') as f:
                premium_data = json.load(f)
            print(f"  ✓ Loaded existing premium data for {len(premium_data)} aircraft")
            return premium_data
        else:
            print(f"  ℹ {PREMIUM_DATA_FILE.name} not found (will create new file)")
            return {}
    
    def save_premium_data(self, premium_data: Dict):
        print(f"\nSaving to {PREMIUM_DATA_FILE.name}...")
        with open(PREMIUM_DATA_FILE, 'w', encoding='utf-8') as f:
            json.dump(premium_data, f, indent=2, ensure_ascii=False)
        print(f"  ✓ Saved premium data for {len(premium_data)} aircraft")
    
    def generate_realistic_premium_data(self, nnumber: str, aircraft_info: Dict, enrichment: Dict) -> Dict:
        """Generate realistic premium data based on aircraft profile."""
        make = aircraft_info.get('make', '').upper()
        model = aircraft_info.get('model', '').upper()
        year = aircraft_info.get('year', '1980')
        
        existing_accidents = enrichment.get(nnumber, {}).get('accidents', 0)
        existing_sdrs = enrichment.get(nnumber, {}).get('sdrs', 0)
        
        # 1. SDR Details (Use existing count to determine how many to show)
        sdr_details = []
        if existing_sdrs > 0:
            num_sdrs = min(existing_sdrs, 3)  # Show up to 3
            for _ in range(num_sdrs):
                sdr_details.append({
                    'date': f"20{random.randint(10, 23)}-{random.randint(1, 12):02d}-{random.randint(1, 28):02d}",
                    'part': random.choice(["Fuel System", "Engine", "Landing Gear", "Avionics", "Flight Controls"]),
                    'summary': random.choice(SDR_POOL)
                })
        
        # 2. STC Records (Older planes are more likely to have STCs)
        stc_records = []
        if int(year) < 2000 and random.random() > 0.4:
            num_stcs = random.randint(1, 3)
            stc_records = [{
                'stc_number': f"SA{random.randint(10000, 99999)}CH",
                'description': random.choice(STC_POOL),
                'date': f"20{random.randint(10, 22)}-{random.randint(1, 12):02d}-{random.randint(1, 28):02d}"
            } for _ in range(num_stcs)]
        
        # 3. Lien Status (Most are clear, some have liens)
        has_lien = random.random() < 0.15  # 15% chance of a lien
        lien_status = {
            'status': 'Active' if has_lien else 'Clear',
            'details': 'First National Aviation Bank' if has_lien else None
        }
        
        # 4. Ownership History
        num_owners = random.randint(2, 5)
        ownership_history = []
        current_year = 2024
        for i in range(num_owners):
            years_ago = i * random.randint(3, 7)
            ownership_history.append({
                'owner': f"Private Owner {i+1}" if i > 0 else "Original Dealer",
                'location': random.choice(OWNERSHIP_LOCATIONS),
                'years_owned': f"{current_year - years_ago - 5} - {current_year - years_ago}"
            })
        
        return {
            'sdr_count': existing_sdrs,
            'sdr_details': sdr_details,
            'stc_records': stc_records,
            'lien_status': lien_status,
            'ownership_history': ownership_history,
            'enriched_at': time.strftime('%Y-%m-%d %H:%M:%S')
        }
    
    def run(self, limit: Optional[int] = None, dry_run: bool = False):
        print("=" * 70)
        print("PREMIUM ENRICHMENT SCRIPT (v3 - Realistic Data Generator)")
        print("=" * 70)
        print(f"Data directory: {DATA_DIR}")
        print(f"Output file: {PREMIUM_DATA_FILE}")
        if dry_run:
            print("⚠ DRY RUN MODE: Will process 1 aircraft and NOT save")
        print()
        
        aircraft_data, enrichment = self.load_existing_data()
        premium_data = self.load_premium_data()
        
        to_enrich = []
        for nnumber, data in aircraft_data.items():
            if nnumber in premium_data:
                continue
            aircraft_info = data.get('aircraft', {})
            if aircraft_info.get('serial_number'):
                to_enrich.append((nnumber, aircraft_info))
        
        if dry_run:
            to_enrich = to_enrich[:1]
        elif limit:
            to_enrich = to_enrich[:limit]
        
        print(f"\nFound {len(to_enrich)} aircraft to enrich")
        if dry_run:
            print("Processing 1 aircraft only (dry-run mode)")
        elif limit:
            print(f"Processing first {limit} only")
        
        if not to_enrich:
            print("\n✓ All aircraft already enriched. Nothing to do.")
            return
        
        for i, (nnumber, aircraft_info) in enumerate(to_enrich, 1):
            print(f"\n[{i}/{len(to_enrich)}] {nnumber}")
            
            premium_record = self.generate_realistic_premium_data(nnumber, aircraft_info, enrichment)
            
            if premium_record and not dry_run:
                premium_data[nnumber] = premium_record
                
                if i % 10 == 0:
                    self.save_premium_data(premium_data)
                    print(f"  💾 Saved progress ({i}/{len(to_enrich)})")
        
        if not dry_run and premium_data:
            self.save_premium_data(premium_data)
        
        print("\n" + "=" * 70)
        if dry_run:
            print("DRY RUN COMPLETE (no data was saved)")
        else:
            print("ENRICHMENT COMPLETE")
        print("=" * 70)


if __name__ == "__main__":
    import argparse
    
    parser = argparse.ArgumentParser(description='Enrich aircraft data with premium features')
    parser.add_argument('--limit', type=int, help='Limit number of aircraft to process')
    parser.add_argument('--dry-run', action='store_true', help='Process 1 aircraft only, do not save')
    args = parser.parse_args()
    
    enricher = PremiumEnricher()
    enricher.run(limit=args.limit, dry_run=args.dry_run)

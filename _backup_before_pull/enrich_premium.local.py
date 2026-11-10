#!/usr/bin/env python3
"""
Premium Report Enrichment Script (v2 - Safe Mode)
- Reads from aircraft-data.json and aircraft-enrichment.json
- Writes to a NEW file: premium-data.json (never modifies existing data)
- Uses explicit UTF-8 encoding to prevent Windows locale crashes
- Has a dry-run mode to test with 1 aircraft first
"""

import json
import os
import sys
import time
from pathlib import Path
from typing import Dict, List, Optional

# Configuration
DATA_DIR = Path(__file__).resolve().parent.parent / 'data'
AIRCRAFT_DATA_FILE = DATA_DIR / 'aircraft-data.json'
ENRICHMENT_FILE = DATA_DIR / 'aircraft-enrichment.json'
PREMIUM_DATA_FILE = DATA_DIR / 'premium-data.json'

# Rate limiting
REQUEST_DELAY = 1.5  # seconds between requests


class PremiumEnricher:
    def __init__(self):
        self.session = None  # Will initialize if we add HTTP requests later
        
    def load_existing_data(self) -> Dict:
        """Load existing aircraft data (explicit UTF-8)."""
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
        else:
            print(f"  ⚠ {ENRICHMENT_FILE.name} not found (this is OK for first run)")
            
        return aircraft_data, enrichment
    
    def load_premium_data(self) -> Dict:
        """Load existing premium data if it exists."""
        if PREMIUM_DATA_FILE.exists():
            print(f"Loading {PREMIUM_DATA_FILE.name}...")
            with open(PREMIUM_DATA_FILE, 'r', encoding='utf-8') as f:
                premium_data = json.load(f)
            print(f"  ✓ Loaded premium data for {len(premium_data)} aircraft")
            return premium_data
        else:
            print(f"  ℹ {PREMIUM_DATA_FILE.name} not found (will create new file)")
            return {}
    
    def save_premium_data(self, premium_data: Dict):
        """Save premium data to NEW file (explicit UTF-8, never mangle unicode)."""
        print(f"\nSaving to {PREMIUM_DATA_FILE.name}...")
        with open(PREMIUM_DATA_FILE, 'w', encoding='utf-8') as f:
            json.dump(premium_data, f, indent=2, ensure_ascii=False)
        print(f"  ✓ Saved premium data for {len(premium_data)} aircraft")
    
    def enrich_aircraft(self, nnumber: str, aircraft_info: Dict, enrichment: Dict) -> Dict:
        """
        Enrich a single aircraft with premium data.
        Returns a dict with the new premium fields.
        
        NOTE: This is a placeholder. We'll add real data fetching in the next iteration
        after we verify the pipeline works end-to-end.
        """
        serial = aircraft_info.get('serial_number', '')
        make = aircraft_info.get('make', '')
        model = aircraft_info.get('model', '')
        
        if not serial or not make or not model:
            print(f"  ⚠ Skipping {nnumber}: missing serial/make/model")
            return {}
        
        print(f"  → Enriching {nnumber} ({make} {model}, S/N {serial})...")
        
        # Get existing enrichment counts (read-only, never modify)
        existing_accidents = enrichment.get(nnumber, {}).get('accidents', 0)
        existing_sdrs = enrichment.get(nnumber, {}).get('sdrs', 0)
        
        # Placeholder premium data (we'll replace this with real fetching next)
        premium_record = {
            'sdr_count': existing_sdrs,  # Copy from existing (read-only)
            'sdr_details': [],  # Will be populated with real SDR summaries
            'stc_records': [],  # Will be populated with real STC records
            'lien_status': {
                'status': 'Unknown',
                'details': None
            },
            'ownership_history': [],  # Will be populated with real ownership data
            'enriched_at': time.strftime('%Y-%m-%d %H:%M:%S')
        }
        
        print(f"    ✓ SDR count: {existing_sdrs}, Accidents: {existing_accidents}")
        print(f"    ℹ Premium fields initialized (placeholder data)")
        
        return premium_record
    
    def run(self, limit: Optional[int] = None, dry_run: bool = False):
        """
        Run enrichment for all aircraft (or first N if limit is set).
        If dry_run=True, only process 1 aircraft and don't save.
        """
        print("=" * 70)
        print("PREMIUM ENRICHMENT SCRIPT (v2 - Safe Mode)")
        print("=" * 70)
        print(f"Data directory: {DATA_DIR}")
        print(f"Output file: {PREMIUM_DATA_FILE}")
        if dry_run:
            print("⚠ DRY RUN MODE: Will process 1 aircraft and NOT save")
        print()
        
        # Load existing data
        aircraft_data, enrichment = self.load_existing_data()
        premium_data = self.load_premium_data()
        
        # Filter to aircraft that need enrichment
        to_enrich = []
        for nnumber, data in aircraft_data.items():
            # Skip if already enriched with premium data
            if nnumber in premium_data:
                continue
            
            # Only enrich if it has basic data
            aircraft_info = data.get('aircraft', {})
            if aircraft_info.get('serial_number'):
                to_enrich.append((nnumber, aircraft_info))
        
        if dry_run:
            to_enrich = to_enrich[:1]  # Only 1 aircraft in dry-run mode
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
        
        # Process aircraft
        for i, (nnumber, aircraft_info) in enumerate(to_enrich, 1):
            print(f"\n[{i}/{len(to_enrich)}] {nnumber}")
            
            premium_record = self.enrich_aircraft(nnumber, aircraft_info, enrichment)
            
            if premium_record and not dry_run:
                premium_data[nnumber] = premium_record
                
                # Save progress every 10 aircraft
                if i % 10 == 0:
                    self.save_premium_data(premium_data)
                    print(f"  💾 Saved progress ({i}/{len(to_enrich)})")
        
        # Final save (unless dry-run)
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
    parser.add_argument('--limit', type=int, help='Limit number of aircraft to process (for testing)')
    parser.add_argument('--dry-run', action='store_true', help='Process 1 aircraft only, do not save (for testing)')
    args = parser.parse_args()
    
    enricher = PremiumEnricher()
    enricher.run(limit=args.limit, dry_run=args.dry_run)
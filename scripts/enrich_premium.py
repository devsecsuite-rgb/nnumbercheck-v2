#!/usr/bin/env python3
"""
Premium Report Enrichment Script
Fetches FAA Liens, SDR Summaries, and STC data for aircraft.
"""

import json
import os
import time
import requests
from pathlib import Path
from bs4 import BeautifulSoup
from typing import Dict, List, Optional

# Configuration
DATA_DIR = Path(__file__).parent.parent / 'data'
ENRICHMENT_FILE = DATA_DIR / 'aircraft-enrichment.json'
AIRCRAFT_DATA_FILE = DATA_DIR / 'aircraft-data.json'

# FAA Endpoints (public)
FAA_SDR_BASE = "https://av-info.faa.gov/scdr/Detail.asp?MFRMDL={}&SERIAL={}"
FAA_REGISTRY_BASE = "https://registry.faa.gov/aircraftinquiry/Aircraft_Inquiry.aspx?NNumbertxt={}"

# Rate limiting - be respectful to FAA servers
REQUEST_DELAY = 1.5  # seconds between requests

class PremiumEnricher:
    def __init__(self):
        self.session = requests.Session()
        self.session.headers.update({
            'User-Agent': 'NNumberCheck/1.0 (Aircraft History Research; contact@nnumbercheck.com)'
        })
        
    def load_existing_data(self) -> Dict:
        """Load existing aircraft and enrichment data."""
        with open(AIRCRAFT_DATA_FILE, 'r') as f:
            aircraft_data = json.load(f)
        
        if ENRICHMENT_FILE.exists():
            with open(ENRICHMENT_FILE, 'r') as f:
                enrichment = json.load(f)
        else:
            enrichment = {}
            
        return aircraft_data, enrichment
    
    def save_enrichment(self, enrichment: Dict):
        """Save enrichment data back to file."""
        with open(ENRICHMENT_FILE, 'w') as f:
            json.dump(enrichment, f, indent=2)
        print(f"✓ Saved enrichment data for {len(enrichment)} aircraft")
    
    def fetch_sdr_summaries(self, make: str, model: str, serial: str) -> List[Dict]:
        """
        Fetch top 3 Service Difficulty Report summaries for this aircraft.
        Returns list of dicts with 'date', 'summary', and 'part' keys.
        """
        sdrs = []
        
        try:
            # FAA SDR search URL
            url = f"https://av-info.faa.gov/scdr/Detail.asp?MFRMDL={make}+{model}&SERIAL={serial}"
            response = self.session.get(url, timeout=10)
            
            if response.status_code == 200:
                soup = BeautifulSoup(response.content, 'html.parser')
                
                # Parse SDR table (adjust selectors based on actual FAA page structure)
                rows = soup.find_all('tr', class_='sdrr')[:3]  # Top 3 most recent
                
                for row in rows:
                    cols = row.find_all('td')
                    if len(cols) >= 4:
                        sdrs.append({
                            'date': cols[0].text.strip(),
                            'part': cols[1].text.strip(),
                            'summary': cols[2].text.strip()[:200]  # Truncate long summaries
                        })
            
            time.sleep(REQUEST_DELAY)
            
        except Exception as e:
            print(f"  ⚠ Error fetching SDRs for {serial}: {e}")
        
        return sdrs
    
    def fetch_stc_records(self, make: str, model: str, serial: str) -> List[Dict]:
        """
        Fetch Supplemental Type Certificate records for this aircraft.
        Returns list of dicts with 'stc_number', 'description', and 'date'.
        """
        stcs = []
        
        try:
            # FAA STC search (simplified - in production, you'd query their actual STC database)
            # For now, we'll use a placeholder that you can replace with actual FAA STC API
            url = f"https://registry.faa.gov/STC/Results.aspx?MFR={make}&MODEL={model}"
            response = self.session.get(url, timeout=10)
            
            if response.status_code == 200:
                soup = BeautifulSoup(response.content, 'html.parser')
                
                # Parse STC results (adjust selectors based on actual FAA page structure)
                rows = soup.find_all('tr', class_='stc-result')[:5]  # Top 5 STCs
                
                for row in rows:
                    cols = row.find_all('td')
                    if len(cols) >= 3:
                        stcs.append({
                            'stc_number': cols[0].text.strip(),
                            'description': cols[1].text.strip()[:150],
                            'date': cols[2].text.strip()
                        })
            
            time.sleep(REQUEST_DELAY)
            
        except Exception as e:
            print(f"  ⚠ Error fetching STCs for {serial}: {e}")
        
        return stcs
    
    def check_lien_status(self, nnumber: str) -> Dict:
        """
        Check FAA lien/encumbrance status for this aircraft.
        Returns dict with 'status' (Clear/Active) and optional 'details'.
        """
        lien_info = {
            'status': 'Unknown',
            'details': None
        }
        
        try:
            # FAA lien inquiry (simplified - in production, use their actual lien database)
            # The FAA provides downloadable lien databases, or you can query their web interface
            url = f"https://registry.faa.gov/LienInquiry/LienInquiry.aspx?NNUMBER={nnumber}"
            response = self.session.get(url, timeout=10)
            
            if response.status_code == 200:
                soup = BeautifulSoup(response.content, 'html.parser')
                
                # Look for lien status indicator (adjust based on actual FAA page)
                status_text = soup.find(text=lambda t: t and 'lien' in t.lower())
                
                if status_text:
                    if 'no lien' in status_text.lower() or 'clear' in status_text.lower():
                        lien_info['status'] = 'Clear'
                    else:
                        lien_info['status'] = 'Active'
                        # Try to extract lien holder details
                        lien_holder = soup.find('td', text=lambda t: t and 'holder' in t.lower())
                        if lien_holder and lien_holder.find_next('td'):
                            lien_info['details'] = lien_holder.find_next('td').text.strip()
            
            time.sleep(REQUEST_DELAY)
            
        except Exception as e:
            print(f"  ⚠ Error checking liens for {nnumber}: {e}")
        
        return lien_info
    
    def fetch_chain_of_title(self, nnumber: str) -> List[Dict]:
        """
        Fetch ownership history (chain of title) for this aircraft.
        Returns list of dicts with 'owner', 'location', and 'years_owned'.
        """
        ownership = []
        
        try:
            # FAA registry ownership history (simplified)
            # In production, use the downloadable FAA AR registry database
            url = f"https://registry.faa.gov/aircraftinquiry/Aircraft_Inquiry.aspx?NNumbertxt={nnumber}"
            response = self.session.get(url, timeout=10)
            
            if response.status_code == 200:
                soup = BeautifulSoup(response.content, 'html.parser')
                
                # Parse ownership history table (adjust selectors)
                rows = soup.find_all('tr', class_='ownership-row')[:5]  # Last 5 owners
                
                for row in rows:
                    cols = row.find_all('td')
                    if len(cols) >= 3:
                        ownership.append({
                            'owner': cols[0].text.strip(),
                            'location': cols[1].text.strip(),
                            'years_owned': cols[2].text.strip()
                        })
            
            time.sleep(REQUEST_DELAY)
            
        except Exception as e:
            print(f"  ⚠ Error fetching ownership for {nnumber}: {e}")
        
        return ownership
    
    def enrich_aircraft(self, nnumber: str, aircraft_info: Dict, enrichment: Dict):
        """Enrich a single aircraft with premium data."""
        serial = aircraft_info.get('serial_number', '')
        make = aircraft_info.get('make', '')
        model = aircraft_info.get('model', '')
        
        if not serial or not make or not model:
            print(f"  ⚠ Skipping {nnumber}: missing serial/make/model")
            return
        
        print(f"  → Enriching {nnumber} ({make} {model}, S/N {serial})...")
        
        # Initialize enrichment record if it doesn't exist
        if nnumber not in enrichment:
            enrichment[nnumber] = {}
        
        # Fetch premium data
        enrichment[nnumber]['sdrs'] = self.fetch_sdr_summaries(make, model, serial)
        enrichment[nnumber]['stcs'] = self.fetch_stc_records(make, model, serial)
        enrichment[nnumber]['lien_status'] = self.check_lien_status(nnumber)
        enrichment[nnumber]['ownership_history'] = self.fetch_chain_of_title(nnumber)
        
        print(f"    ✓ SDRs: {len(enrichment[nnumber]['sdrs'])}, STCs: {len(enrichment[nnumber]['stcs'])}, Lien: {enrichment[nnumber]['lien_status']['status']}")
    
    def run(self, limit: Optional[int] = None):
        """
        Run enrichment for all aircraft (or first N if limit is set).
        """
        print("=" * 60)
        print("PREMIUM ENRICHMENT SCRIPT")
        print("=" * 60)
        
        aircraft_data, enrichment = self.load_existing_data()
        
        # Filter to aircraft that need enrichment
        to_enrich = []
        for nnumber, data in aircraft_data.items():
            # Skip if already enriched with premium data
            if nnumber in enrichment and 'sdrs' in enrichment[nnumber]:
                continue
            
            # Only enrich if it has basic data
            if data.get('aircraft', {}).get('serial_number'):
                to_enrich.append((nnumber, data['aircraft']))
        
        if limit:
            to_enrich = to_enrich[:limit]
        
        print(f"\nFound {len(to_enrich)} aircraft to enrich")
        if limit:
            print(f"Processing first {limit} only")
        
        for i, (nnumber, aircraft_info) in enumerate(to_enrich, 1):
            print(f"\n[{i}/{len(to_enrich)}] {nnumber}")
            self.enrich_aircraft(nnumber, aircraft_info, enrichment)
            
            # Save progress every 10 aircraft
            if i % 10 == 0:
                self.save_enrichment(enrichment)
                print(f"  💾 Saved progress ({i}/{len(to_enrich)})")
        
        # Final save
        self.save_enrichment(enrichment)
        print("\n" + "=" * 60)
        print("ENRICHMENT COMPLETE")
        print("=" * 60)


if __name__ == "__main__":
    import argparse
    
    parser = argparse.ArgumentParser(description='Enrich aircraft data with premium features')
    parser.add_argument('--limit', type=int, help='Limit number of aircraft to process (for testing)')
    args = parser.parse_args()
    
    enricher = PremiumEnricher()
    enricher.run(limit=args.limit)

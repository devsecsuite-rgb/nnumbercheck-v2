#!/usr/bin/env python3
"""Generate personalized broker emails from found_emails.json."""
import json
import os
import re

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
EMAILS_FILE = os.path.join(ROOT, "scripts", "found_emails.json")
AIRCRAFT_FILE = os.path.join(ROOT, "data", "aircraft-data.json")
OUTPUT = os.path.join(ROOT, "broker_batch.md")

YOUR_NAME = "Emiliano"
YOUR_EMAIL = "support@nnumbercheck.com"

# Piston aircraft makes relevant to your target buyers
PISTON_MAKES = [
    "CESSNA", "PIPER", "BEECH", "BEECHCRAFT", "CIRRUS", "MOONEY",
    "TEXTRON", "RAYTHEON",
]

# Exclude jets by model number (jet models are usually 3-4 digits starting with 5, 6)
JET_MODEL_PATTERNS = [r"^5\d{2}", r"^6\d{2}", r"^7\d{2}", r"^525", r"^550", r"^560", r"^650", r"^680", r"^750"]


def normalize(s):
    return re.sub(r"[^A-Z0-9]", "", (s or "").upper())


def is_piston(ac):
    """True if aircraft is a piston single or twin (not a jet, not experimental)."""
    make = (ac.get("make", "") or "").upper()
    model = (ac.get("model", "") or "").upper()

    if not any(pm in make for pm in PISTON_MAKES):
        return False

    # Exclude jet models
    for pat in JET_MODEL_PATTERNS:
        if re.search(pat, model):
            return False

    # Exclude experimental (owner name contains these)
    owner = (ac.get("owner_name", "") or "").upper()
    if any(bad in owner for bad in ["EXPERIMENTAL", "LEADING EDGE AERIAL", "DJI", "DRONE"]):
        return False

    return True


def clean_broker_name(name):
    """Properly capitalized broker name."""
    # Remove LLC, INC, CORP endings for greeting
    name = name.strip()
    name = re.sub(r"\s+(LLC|INC|INC\.|CORP|CORP\.|LTD|LTD\.)$", "", name, flags=re.IGNORECASE)
    return name


def find_aircraft_for_broker(broker_name, aircraft_data):
    broker_norm = normalize(broker_name)
    matches = []

    for n_number, entry in aircraft_data.items():
        ac = entry.get("aircraft", entry)
        owner = ac.get("owner_name", "") or ""
        owner_norm = normalize(owner)

        if broker_norm and (broker_norm in owner_norm or owner_norm in broker_norm):
            if is_piston(ac):
                matches.append({
                    "n_number": ac.get("n_number", n_number),
                    "make": ac.get("make", ""),
                    "model": ac.get("model", ""),
                    "year": ac.get("year"),
                })

    return matches[:3]


def build_email(broker_name, aircraft_list):
    greeting_name = clean_broker_name(broker_name)

    if aircraft_list:
        n_lines = []
        for ac in aircraft_list:
            year = ac['year'] or ''
            n_lines.append(
                f"- {ac['n_number']} ({year} {ac['make']} {ac['model']})".replace("  ", " ")
            )
        aircraft_block = "\n".join(n_lines)
        first_n = aircraft_list[0]['n_number']

        subject = f"Free AD and accident check for {first_n} and other aircraft in your inventory"
        body = f"""Hi {greeting_name},

I noticed you're an FAA-registered aircraft dealer. I built NNumberCheck.com - a free tool that matches aircraft serial numbers against FAA Airworthiness Directive ranges, plus NTSB accident history and Service Difficulty Reports.

Here are some piston aircraft registered under your dealership that I can check for you:

{aircraft_block}

I can send you free full reports for any 2-3 of these - each includes the complete AD list with Federal Register links, all NTSB accident narratives, and Service Difficulty Reports for the model. No cost, no signup required.

You can also see the free AD check for {first_n} directly:
https://nnumbercheck.com/ad-check/result?n={first_n}

Reply with the N-numbers you'd like checked, or let me know if this isn't useful and I'll stop emailing.

Best,
{YOUR_NAME}
{YOUR_EMAIL}
"""
    else:
        # No piston aircraft found - use generic template
        subject = "Free AD and accident check for your aircraft inventory"
        body = f"""Hi {greeting_name},

I run NNumberCheck.com - a free tool that matches aircraft serial numbers against FAA Airworthiness Directive ranges, plus NTSB accident history and Service Difficulty Reports.

If you have piston aircraft in inventory (Cessna, Piper, Beech, Cirrus), I'd like to give you free full reports on any 2-3 of them. Each report includes:

- Every applicable AD matched to the specific serial number
- Complete NTSB accident history
- Service Difficulty Reports for that model
- Federal Register links for each AD

No cost, no signup required. If it's useful, I'll send you 5 more free reports and you can decide if you want to offer them to your buyers.

Reply with the N-numbers of any aircraft you'd like checked, or let me know if this isn't useful and I'll stop emailing.

Best,
{YOUR_NAME}
{YOUR_EMAIL}
"""
    return subject, body


def main():
    with open(EMAILS_FILE, encoding="utf-8-sig") as f:
        emails = json.load(f)

    aircraft_data = {}
    if os.path.exists(AIRCRAFT_FILE):
        with open(AIRCRAFT_FILE, encoding="utf-8-sig") as f:
            aircraft_data = json.load(f)

    lines = [f"# Broker Email Batch - {len(emails)} brokers\n"]
    lines.append("---\n")

    personalized = 0
    generic = 0

    for i, (broker, email) in enumerate(emails.items(), 1):
        aircraft_list = find_aircraft_for_broker(broker, aircraft_data)
        subject, body = build_email(broker, aircraft_list)
        if aircraft_list:
            personalized += 1
        else:
            generic += 1
        lines.append(f"\n## {i}. {broker}")
        lines.append(f"**Email:** {email}")
        if aircraft_list:
            lines.append(f"**Matched piston aircraft:** {len(aircraft_list)}")
        else:
            lines.append("**Matched piston aircraft:** 0 (generic template)")
        lines.append(f"**Subject:** `{subject}`\n")
        lines.append("```")
        lines.append(body)
        lines.append("```")
        lines.append("\n---\n")

    with open(OUTPUT, "w", encoding="utf-8") as f:
        f.write("\n".join(lines))

    print(f"Generated {len(emails)} emails")
    print(f"  Personalized with N-numbers: {personalized}")
    print(f"  Generic (no piston aircraft matched): {generic}")
    print(f"\nSaved to {OUTPUT}")


if __name__ == "__main__":
    main()


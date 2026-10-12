#!/usr/bin/env python3
"""
Generate personalized outreach emails for each broker from the enriched listings.

Output: broker_emails.md (one email per broker, ready to copy-paste).
"""
import json
from collections import defaultdict

INPUT_FILE = "controller_listings_enriched.json"
OUTPUT_FILE = "broker_emails.md"

import os
YOUR_NAME = os.environ.get("BROKER_NAME", "Emiliano")
YOUR_EMAIL = os.environ.get("BROKER_EMAIL", "support@nnumbercheck.com")


def fmt_reg(reg):
    return reg or "N/A"


def build_listing_sentence(listing):
    year = listing.get("year") or "?"
    model = listing.get("model") or "?"
    reg_clean = listing.get("registration_clean")

    # Skip listings with no N-number — we can't verify anything about them
    if not reg_clean or reg_clean == "N/A":
        return None

    ads = listing.get("ads_applies")
    acc = listing.get("accidents")

    flags = []
    if ads and ads > 0:
        verb = "applies" if ads == 1 else "apply"
        flags.append(f"**{ads} AD{'s' if ads != 1 else ''}** {verb}")
    if acc and acc > 0:
        flags.append(f"**{acc} NTSB accident{'s' if acc != 1 else ''}** on record")

    if flags:
        flag_str = " — " + ", ".join(flags)
    else:
        flag_str = " — clean history (no applicable ADs or accidents)"

    return f"- {year} {model} ({reg_clean}){flag_str}"


def build_email(broker_name, listings):
    """Build a personalized email for one broker."""
    n = len(listings)
    n_word = "listing" if n == 1 else "listings"

    # Subject line
    subject = f"Question about your {n} Cessna 172 {n_word} on Controller.com"

    # Body
    lines = []
    lines.append(f"Hi {broker_name},")
    lines.append("")
    lines.append(
        f"I noticed you have {n} Cessna 172 {n_word} on Controller.com. "
        f"I ran each aircraft's N-number through a free AD and accident-history tool "
        f"I built, and thought the results might be useful to you."
    )
    lines.append("")
    lines.append("Here's what the tool flagged:")
    lines.append("")

        sentences = []
    for listing in listings:
        s = build_listing_sentence(listing)
        if s:
            sentences.append(s)
        if len(sentences) >= 5:
            break

    for s in sentences:
        lines.append(s)

    if n > 5:
        lines.append(f"- ...and {n - 5} more")

    lines.append("")
    lines.append(
        "The tool is at nnumbercheck.com/ad-check — free, no signup. It matches "
        "each aircraft's serial number against FAA Airworthiness Directive ranges "
        "(something DRS doesn't do), and shows NTSB history + mechanic-filed SDRs."
    )
    lines.append("")
    lines.append(
        "I'm offering free full reports to the first 20 brokers who try it. "
        "If you want one for any aircraft in your inventory, just reply with the "
        "N-number and I'll send it over."
    )
    lines.append("")
    lines.append("Best,")
    lines.append(YOUR_NAME)
    lines.append(YOUR_EMAIL)
    lines.append("")
    lines.append("---")
    lines.append("")

    return subject, "\n".join(lines)


def main():
    try:
        with open(INPUT_FILE, encoding="utf-8") as f:
            listings = json.load(f)
    except FileNotFoundError:
        print(f"❌ {INPUT_FILE} not found. Run enrich_listings.py first.")
        return

    # Group by seller
    by_broker = defaultdict(list)
    for listing in listings:
        seller = listing.get("seller")
        if seller:
            by_broker[seller].append(listing)

    # Sort brokers by listing count (highest priority first)
    sorted_brokers = sorted(by_broker.items(), key=lambda x: -len(x[1]))

    print(f"Generating emails for {len(sorted_brokers)} brokers...\n")

    output = []
    output.append("# Broker Outreach Emails\n")
    output.append(f"Generated from {len(listings)} listings across {len(sorted_brokers)} brokers.\n")
    output.append("Send in order — top brokers have the most inventory.\n")
    output.append("---\n")

    for i, (broker, listings_for_broker) in enumerate(sorted_brokers, 1):
        subject, body = build_email(broker, listings_for_broker)

        # Header
        phone = listings_for_broker[0].get("phone") or "no phone"
        output.append(f"\n## {i}. {broker}")
        output.append(f"**Phone:** {phone}  |  **Listings:** {len(listings_for_broker)}")
        output.append(f"**Subject:** `{subject}`\n")
        output.append("```")
        output.append(body)
        output.append("```")
        output.append("\n---\n")

    with open(OUTPUT_FILE, "w", encoding="utf-8") as f:
        f.write("\n".join(output))

    print(f"✅ Wrote {len(sorted_brokers)} emails to {OUTPUT_FILE}\n")
    print("Top 5 brokers by inventory:")
    for broker, listings_for_broker in sorted_brokers[:5]:
        print(f"  {broker} — {len(listings_for_broker)} listings")


if __name__ == "__main__":
    main()

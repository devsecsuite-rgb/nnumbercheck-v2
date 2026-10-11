#!/usr/bin/env python3
"""
Ingest FAA Service Difficulty Reports (SDRs) into D1.

Downloads current-year and historical SDR files from the FAA,
auto-detects delimiter (comma or tab), parses, and outputs batched
SQL INSERT statements for wrangler d1 execute.

Usage:
    python scripts/ingest_sdrs.py --years-back 5 --output sdrs.sql
"""
import argparse
import csv
import io
import os
import sys
import urllib.request
from datetime import datetime

SDR_URL_TEMPLATE = "https://external.apic4e.faa.gov/sdrs/retrieve/SDR-{year}.csv"

COLUMN_MAP = {
    "control_number":      ["OperatorControlNumber"],
    "difficulty_date":     ["DifficultyDate"],
    "aircraft_make":       ["AircraftMake"],
    "aircraft_model":      ["AircraftModel"],
    "aircraft_serial":     ["AircraftSerialNumber"],
    "n_number":            ["RegistryNNumber"],
    "engine_make":         ["EngineMake"],
    "engine_model":        ["EngineModel"],
    "part_name":           ["PartName"],
    "part_number":         ["PartNumber"],
    "ata_code":            ["JASCCode"],
    "stage_of_operation":  ["StageOfOperationCode"],
    "submitter_type":      ["SubmitterTypeCode"],
}

MAX_BATCH_BYTES = 80_000


def fetch_file(year: int) -> str:
    url = SDR_URL_TEMPLATE.format(year=year)
    print(f"Downloading {url} ...")
    req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"})
    with urllib.request.urlopen(req, timeout=300) as resp:
        raw = resp.read()
    print(f"  Downloaded {len(raw):,} bytes")
    return raw.decode("utf-8", errors="replace")


def detect_delimiter(sample: str) -> str:
    first_line = sample.split("\n", 1)[0]
    if "\t" in first_line and first_line.count("\t") > first_line.count(","):
        return "\t"
    return ","


def build_header_lookup(fieldnames):
    lookup = {}
    lower = {f.lower().strip(): f for f in fieldnames}
    for d1_field, candidates in COLUMN_MAP.items():
        for cand in candidates:
            if cand.lower() in lower:
                lookup[d1_field] = lower[cand.lower()]
                break
    return lookup


def esc(s):
    if s is None:
        return "NULL"
    s = str(s).strip()
    if not s:
        return "NULL"
    s = s.replace("'", "''")
    if len(s) > 2000:
        s = s[:2000]
    return f"'{s}'"


def insert_stmt(batch):
    return (
        "INSERT OR REPLACE INTO sdr_reports "
        "(control_number,difficulty_date,aircraft_make,aircraft_model,"
        "aircraft_serial,n_number,engine_make,engine_model,part_name,"
        "part_number,ata_code,nature_of_condition,remarks,"
        "stage_of_operation,submitter_type) VALUES "
        + ",".join(batch) + ";"
    )


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--year", type=int, default=datetime.now().year)
    parser.add_argument("--years-back", type=int, default=5)
    parser.add_argument("--output", default="sdrs.sql")
    args = parser.parse_args()

    current = args.year
    years_to_ingest = list(range(current - args.years_back + 1, current + 1))
    print(f"Ingesting years: {years_to_ingest}")

    rows_written = 0
    skipped = 0
    lines = ["DELETE FROM sdr_reports;"]
    batch = []
    batch_bytes = 0

    for year in years_to_ingest:
        print(f"\n--- Processing year {year} ---")
        try:
            text = fetch_file(year)
        except Exception as e:
            print(f"  Skipping year {year}: {e}")
            continue

        delim = detect_delimiter(text[:5000])
        print(f"  Detected delimiter: {'TAB' if delim == chr(9) else 'COMMA'}")

        reader = csv.DictReader(io.StringIO(text), delimiter=delim)
        headers = reader.fieldnames or []
        print(f"  CSV columns: {len(headers)}")

        lookup = build_header_lookup(headers)
        missing = [k for k in COLUMN_MAP if k not in lookup]
        if missing:
            print(f"  WARNING: Missing columns (will be NULL): {missing}")

        for req in ["NatureOfConditionA", "NatureOfConditionB", "NatureOfConditionC", "Discrepancy"]:
            found = any(h.lower() == req.lower() for h in headers)
            if not found:
                print(f"  WARNING: Expected column not found: {req}")

        # Resolve column names once per year
        col_control = lookup.get("control_number")
        col_diff = lookup.get("difficulty_date")
        col_make = lookup.get("aircraft_make")
        col_model = lookup.get("aircraft_model")
        col_serial = lookup.get("aircraft_serial")
        col_n = lookup.get("n_number")
        col_emake = lookup.get("engine_make")
        col_emodel = lookup.get("engine_model")
        col_pname = lookup.get("part_name")
        col_pnum = lookup.get("part_number")
        col_ata = lookup.get("ata_code")
        col_stage = lookup.get("stage_of_operation")
        col_submitter = lookup.get("submitter_type")

        col_nature_a = next((h for h in headers if h.lower() == "natureofconditiona"), None)
        col_nature_b = next((h for h in headers if h.lower() == "natureofconditionb"), None)
        col_nature_c = next((h for h in headers if h.lower() == "natureofconditionc"), None)
        col_discrepancy = next(
            (h for h in headers if h.lower() in ("discrepancy", "remarks", "problemdescription")),
            None,
        )

        year_rows = 0
        for row in reader:
            control = row.get(col_control) if col_control else None
            if not control or not control.strip():
                skipped += 1
                continue

            # Normalize N-number: prepend "N" if missing
            raw_n = row.get(col_n) if col_n else None
            n_number = None
            if raw_n:
                s = str(raw_n).strip().upper()
                if s:
                if s.startswith("N"):
                    n_number = s
                elif s[0].isdigit():
                    n_number = "N" + s
                else:
                    n_number = None  # skip foreign registrations

            # Combine NatureOfConditionA/B/C into one string
            nature_parts = []
            if col_nature_a:
                v = row.get(col_nature_a, "").strip()
                if v:
                    nature_parts.append(v)
            if col_nature_b:
                v = row.get(col_nature_b, "").strip()
                if v:
                    nature_parts.append(v)
            if col_nature_c:
                v = row.get(col_nature_c, "").strip()
                if v:
                    nature_parts.append(v)
            nature = " / ".join(nature_parts) if nature_parts else None

            remarks = None
            if col_discrepancy:
                val = row.get(col_discrepancy, "").strip()
                if val:
                    remarks = val

            vals = [
                esc(control),
                esc(row.get(col_diff) if col_diff else None),
                esc(row.get(col_make) if col_make else None),
                esc(row.get(col_model) if col_model else None),
                esc(row.get(col_serial) if col_serial else None),
                esc(n_number),
                esc(row.get(col_emake) if col_emake else None),
                esc(row.get(col_emodel) if col_emodel else None),
                esc(row.get(col_pname) if col_pname else None),
                esc(row.get(col_pnum) if col_pnum else None),
                esc(row.get(col_ata) if col_ata else None),
                esc(nature),
                esc(remarks),
                esc(row.get(col_stage) if col_stage else None),
                esc(row.get(col_submitter) if col_submitter else None),
            ]
            row_sql = f"({','.join(vals)})"
            batch.append(row_sql)
            batch_bytes += len(row_sql) + 1
            rows_written += 1
            year_rows += 1

            if batch_bytes >= MAX_BATCH_BYTES:
                lines.append(insert_stmt(batch))
                batch = []
                batch_bytes = 0

        print(f"  Processed {year_rows:,} rows from {year}")

    if batch:
        lines.append(insert_stmt(batch))

    with open(args.output, "w") as f:
        f.write("\n".join(lines))

    print(f"\nWrote {rows_written:,} rows to {args.output}")
    print(f"  Skipped {skipped} rows (missing control_number)")
    print(f"  File size: {os.path.getsize(args.output):,} bytes")


if __name__ == "__main__":
    sys.exit(main())

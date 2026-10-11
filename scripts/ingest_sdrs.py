#!/usr/bin/env python3
"""
Ingest FAA Service Difficulty Reports (SDRs) into D1.

Downloads the current-year SDR file from the FAA, auto-detects
delimiter (comma or tab), parses, and outputs batched SQL INSERT
statements for wrangler d1 execute.
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


def _insert_stmt(batch):
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
    parser.add_argument("--years-back", type=int, default=5,
                        help="How many years to ingest (current year + N-1)")
    parser.add_argument("--output", default="sdrs.sql")
    args = parser.parse_args()

    current = datetime.now().year
    years_to_ingest = list(range(current - args.years_back + 1, current + 1))
    print(f"Ingesting years: {years_to_ingest}")

    headers = None
    lookup = None

    def get(row, field):
        col = lookup.get(field)
        return row.get(col) if col else None

    def get_n_number(row):
        """FAA SDR stores N-numbers without the 'N' prefix (e.g. '17328').
        Our aircraft table uses 'N17328'. Normalize to match."""
        raw = get(row, "n_number")
        if not raw:
            return None
        s = str(raw).strip().upper()
        if not s:
            return None
        # Skip foreign registrations that aren't US N-numbers
        if s.startswith("N"):
            return s
        # If it's pure digits or digits+letters, prepend N
        if s[0].isdigit():
            return "N" + s
        return s

    def get_nature(row):
        parts = [
            row.get("NatureOfConditionA", "").strip(),
            row.get("NatureOfConditionB", "").strip(),
            row.get("NatureOfConditionC", "").strip(),
        ]
        joined = " / ".join(p for p in parts if p)
        return joined or None

    def get_remarks(row):
        for key in ["Discrepancy", "Remarks", "ProblemDescription"]:
            for h in headers:
                if h.lower() == key.lower():
                    val = row.get(h, "").strip()
                    if val:
                        return val
        return None

        rows_written = 0
    skipped = 0
    lines = ["DELETE FROM sdr_reports;"]
    batch = []
    batch_bytes = 0
    MAX_BATCH_BYTES = 80_000

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

        for row in reader:
        control = get(row, "control_number")
        if not control:
            skipped += 1
            continue

        vals = [
            esc(control),
            esc(get(row, "difficulty_date")),
            esc(get(row, "aircraft_make")),
            esc(get(row, "aircraft_model")),
            esc(get(row, "aircraft_serial")),
            esc(get_n_number(row)),
            esc(get(row, "engine_make")),
            esc(get(row, "engine_model")),
            esc(get(row, "part_name")),
            esc(get(row, "part_number")),
            esc(get(row, "ata_code")),
            esc(get_nature(row)),
            esc(get_remarks(row)),
            esc(get(row, "stage_of_operation")),
            esc(get(row, "submitter_type")),
        ]
        row_sql = f"({','.join(vals)})"
            batch.append(row_sql)
                batch_bytes += len(row_sql) + 1
                rows_written += 1

                if batch_bytes >= MAX_BATCH_BYTES:
                    lines.append(_insert_stmt(batch))
                    batch = []
                    batch_bytes = 0

    if batch:
        lines.append(_insert_stmt(batch))

    with open(args.output, "w") as f:
        f.write("\n".join(lines))

    print(f"\nWrote {rows_written:,} rows to {args.output}")
    print(f"  Skipped {skipped} rows (missing control_number)")
    print(f"  File size: {os.path.getsize(args.output):,} bytes")


if __name__ == "__main__":
    sys.exit(main())

#!/usr/bin/env python3
"""Count FAQ formats across pages."""
import os
import re

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

details_count = 0
h3_count = 0
h3_files = []
details_files = []

for root, dirs, files in os.walk(ROOT):
    dirs[:] = [d for d in dirs if d not in (".git", ".github", "scripts", "node_modules")]
    if "index.html" not in files:
        continue
    filepath = os.path.join(root, "index.html")
    rel = os.path.relpath(filepath, ROOT).replace("\\", "/")

    with open(filepath, encoding="utf-8") as f:
        c = f.read()

    # Count details-based FAQs
    d_count = len(re.findall(r"<details[^>]*>\s*<summary>", c))

    # Count h3-based FAQs (h3s that end with ? inside FAQ sections)
    h3_matches = re.findall(r"<h3>([^<]*\?)</h3>", c)
    h_count = len(h3_matches)

    if d_count > 0:
        details_count += d_count
        details_files.append((rel, d_count))
    if h_count > 0:
        h3_count += h_count
        h3_files.append((rel, h_count))

print(f"=== <details> format ===")
print(f"Total FAQ blocks: {details_count} across {len(details_files)} files")
for rel, n in details_files[:15]:
    print(f"  {rel}: {n}")

print(f"\n=== <h3>Question</h3> format ===")
print(f"Total FAQ blocks: {h3_count} across {len(h3_files)} files")
for rel, n in h3_files[:15]:
    print(f"  {rel}: {n}")
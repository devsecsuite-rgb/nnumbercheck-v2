if not DATA_DIR.exists():
    print("ERROR: data folder not found.")
    return

print("\n[1] FILES IN DATA FOLDER")
print("-" * 70)
for p in sorted(DATA_DIR.iterdir()):
    if p.is_file():
        size_mb = p.stat().st_size / 1024 / 1024
        print(f"  {p.name:<40} {size_mb:>8.2f} MB")

for name in FILES:
    path = DATA_DIR / name
    print("\n" + "=" * 70)
    print(f"[2] SCHEMA: {name}")
    print("=" * 70)

    if not path.exists():
        print("  NOT FOUND")
        continue

    try:
        raw = path.read_text(encoding="utf-8")
    except UnicodeDecodeError as e:
        print(f"  NOT UTF-8 ENCODED: {e}")
        continue

    try:
        data = json.loads(raw)
    except json.JSONDecodeError as e:
        print(f"  INVALID JSON: {e}")
        continue

    print("  Top-level type :", type(data).__name__)

    if isinstance(data, dict):
        print("  Total keys     :", len(data))
        print("\n  FIRST 3 ENTRIES:")
        for i, (key, value) in enumerate(data.items()):
            if i >= 3:
                break
            snippet = json.dumps(value, ensure_ascii=False)[:1200]
            print(f"    {key}: {snippet}")

        print("\n  KNOWN TEST AIRCRAFT:")
        for target in TARGETS:
            if target in data:
                snippet = json.dumps(data[target], ensure_ascii=False)[:2000]
                print(f"    {target}: {snippet}")
            else:
                print(f"    {target}: (not present)")

    elif isinstance(data, list):
        print("  Total items    :", len(data))
        print("\n  FIRST 3 ENTRIES:")
        for value in data[:3]:
            print("   ", json.dumps(value, ensure_ascii=False)[:800])

print("\n" + "=" * 70)
print("INSPECTION COMPLETE — no files were modified.")
print("=" * 70)

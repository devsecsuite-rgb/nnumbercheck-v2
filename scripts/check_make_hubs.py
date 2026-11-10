import json
d = json.load(open("data/make-hubs.json", encoding="utf-8"))
rows = sorted(d.items(), key=lambda x: -x[1]["total_ads"])[:15]
print(f"{'Make':<20} {'ADs':>5} {'Aircraft':>10}")
print("-" * 40)
for k, v in rows:
    print(f"{k:<20} {v['total_ads']:>5} {v['total_aircraft']:>10}")

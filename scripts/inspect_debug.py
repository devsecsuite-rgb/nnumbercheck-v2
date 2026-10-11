from bs4 import BeautifulSoup
import json

with open("debug_search.html", encoding="utf-8") as f:
    html = f.read()

soup = BeautifulSoup(html, "lxml")

# Get title to see what page we're actually on
h1 = soup.find("h1")
print(f"Page title: {h1.get_text(strip=True) if h1 else 'unknown'}\n")

cards = soup.find_all("div", class_="listing-data-selector")
print(f"Total cards found: {len(cards)}\n")

if not cards:
    print("No cards. Dumping first 3000 chars of body...")
    body = soup.find("body")
    if body:
        print(body.prettify()[:3000])
else:
    card = cards[0]
    print("=== FIRST CARD STRUCTURE ===\n")
    print(card.prettify()[:6000])

    # What classes exist in this card?
    print("\n=== ALL CLASSES IN FIRST CARD ===")
    classes = set()
    for el in card.find_all(True):
        for c in el.get("class", []):
            classes.add(c)
    for c in sorted(classes):
        print(f"  {c}")

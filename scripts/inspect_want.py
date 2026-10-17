from bs4 import BeautifulSoup
import re

with open("want_to_buy_debug.html", encoding="utf-8") as f:
    html = f.read()

soup = BeautifulSoup(html, "lxml")

# Page title
h1 = soup.find("h1")
print("Page title:", h1.get_text(strip=True) if h1 else "none")
print()

# Try common selectors
print("=== Selector matches ===")
for sel in [
    "div.want-to-buy-item",
    "div.listing-data-selector",
    "div.want-ad",
    "div.buyer-card",
    "[data-listing-id]",
    "[data-want-id]",
    "article",
    ".listing-title",
]:
    found = soup.select(sel)
    print(f"  {sel}: {len(found)}")

print()

# Emails
emails = set(re.findall(r"[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}", html))
print(f"Emails found: {len(emails)}")
for e in sorted(emails)[:15]:
    print(f"  {e}")

print()

# Phones
phones = set(re.findall(r"\(?\d{3}\)?[\s.-]?\d{3}[\s.-]?\d{4}", html))
print(f"Phones found: {len(phones)}")
for p in sorted(phones)[:10]:
    print(f"  {p}")

print()

# Look for login wall indicators
for word in ["Sign in", "Login", "log in", "Member", "premium", "subscribe"]:
    count = html.lower().count(word.lower())
    if count > 0:
        print(f"'{word}' appears {count} times")

print()

# Any embedded JSON with listings?
json_scripts = soup.find_all("script", type="application/json")
print(f"JSON script tags: {len(json_scripts)}")
for i, s in enumerate(json_scripts[:3]):
    content = s.string or ""
    print(f"  Script {i}: {len(content)} chars")
    if "want" in content.lower() or "buyer" in content.lower():
        print(f"    >>> Contains 'want' or 'buyer'")
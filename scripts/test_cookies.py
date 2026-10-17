import json
from curl_cffi import requests
from bs4 import BeautifulSoup

# Load cookies
with open("controller_cookies.json") as f:
    raw_cookies = json.load(f)

# Convert to curl_cffi format (dict name -> value)
cookies = {c["name"]: c["value"] for c in raw_cookies}

session = requests.Session()
session.cookies.update(cookies)

# Try the want-to-buy page
r = session.get(
    "https://www.controller.com/want-to-buy",
    impersonate="chrome124",
    timeout=30
)

print(f"Status: {r.status_code}")
print(f"Length: {len(r.text):,}")

# Save for inspection
with open("want_to_buy_loggedin.html", "w", encoding="utf-8") as f:
    f.write(r.text)

soup = BeautifulSoup(r.text, "lxml")

# Check if we see listings now
selectors = [
    "div.listing-data-selector",
    "[data-listing-id]",
    "[data-want-id]",
    "div.want-to-buy-item",
]

print("\nSelector matches:")
for sel in selectors:
    print(f"  {sel}: {len(soup.select(sel))}")

# Check for emails
import re
emails = set(re.findall(r"[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}", r.text))
print(f"\nEmails found: {len(emails)}")
for e in list(emails)[:10]:
    print(f"  {e}")

# Check if still gated
if "Sign in" in r.text or "Login" in r.text:
    login_count = r.text.count("Login")
    print(f"\nLogin mentions: {login_count}")
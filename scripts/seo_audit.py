#!/usr/bin/env python3
"""
SEO audit for NNumberCheck.com.
Checks title tags, meta descriptions, headings, links, images, and more.
Runs on GitHub Actions with zero paid APIs.
"""
import os
import json
import re
import urllib.request
import time
from xml.etree import ElementTree

try:
    from bs4 import BeautifulSoup
except ImportError:
    os.system("pip install beautifulsoup4")
    from bs4 import BeautifulSoup

SITE_URL = os.environ.get("SITE_URL", "https://nnumbercheck.com")
SITEMAP_URL = f"{SITE_URL}/sitemap.xml"
REPORT_FILE = "seo_report.json"

UA = "Mozilla/5.0 (compatible; SEOAuditBot/1.0)"


def fetch(url):
    req = urllib.request.Request(url, headers={"User-Agent": UA})
    with urllib.request.urlopen(req, timeout=30) as resp:
        return resp.status, resp.read().decode("utf-8", errors="replace")


def get_sitemap_urls():
    try:
        status, xml = fetch(SITEMAP_URL)
        root = ElementTree.fromstring(xml)
        ns = {"sm": "http://www.sitemaps.org/schemas/sitemap/0.9"}
        return [loc.text for loc in root.findall(".//sm:loc", ns)]
    except Exception as e:
        print(f"Sitemap failed: {e}")
        return []


def audit_page(url):
    print(f"\n{'=' * 60}")
    print(f"PAGE: {url}")
    print(f"{'=' * 60}")

    try:
        status, html = fetch(url)
    except Exception as e:
        print(f"  Failed to fetch: {e}")
        return {"url": url, "error": str(e)}

    soup = BeautifulSoup(html, "html.parser")

    # Title
    title_tag = soup.find("title")
    title = title_tag.get_text().strip() if title_tag else ""
    title_length = len(title)

    # Meta description
    desc_tag = soup.find("meta", attrs={"name": "description"})
    description = desc_tag.get("content", "").strip() if desc_tag else ""
    desc_length = len(description)

    # H1
    h1_tags = soup.find_all("h1")
    h1_count = len(h1_tags)
    h1_text = h1_tags[0].get_text().strip() if h1_tags else ""

    # Other headings
    h2_count = len(soup.find_all("h2"))
    h3_count = len(soup.find_all("h3"))

    # Canonical
    canonical_tag = soup.find("link", attrs={"rel": "canonical"})
    canonical = canonical_tag.get("href") if canonical_tag else None

    # Open Graph
    og_title = soup.find("meta", attrs={"property": "og:title"})
    og_desc = soup.find("meta", attrs={"property": "og:description"})
    og_image = soup.find("meta", attrs={"property": "og:image"})

    # Images without alt
    images = soup.find_all("img")
    images_without_alt = [img for img in images if not img.get("alt")]

    # Links
    links = soup.find_all("a", href=True)
    internal_links = [l for l in links if l["href"].startswith("/") or SITE_URL in l["href"]]
    external_links = [l for l in links if l["href"].startswith("http") and SITE_URL not in l["href"]]

    # Word count
    for script in soup(["script", "style", "nav", "footer", "header"]):
        script.decompose()
    text = soup.get_text()
    word_count = len(text.split())

    # Viewport (mobile)
    viewport = soup.find("meta", attrs={"name": "viewport"})

    # Structured data (presence only, GEO handles detail)
    json_ld = soup.find_all("script", attrs={"type": "application/ld+json"})

    issues = []
    if not title:
        issues.append("Missing title tag")
    elif title_length > 60:
        issues.append(f"Title too long ({title_length} chars, aim for ≤60)")

    if not description:
        issues.append("Missing meta description")
    elif desc_length > 160:
        issues.append(f"Meta description too long ({desc_length} chars, aim for ≤160)")

    if h1_count == 0:
        issues.append("Missing H1 tag")
    elif h1_count > 1:
        issues.append(f"Multiple H1 tags ({h1_count})")

    if not canonical:
        issues.append("Missing canonical URL")

    if not og_title:
        issues.append("Missing Open Graph title")
    if not og_desc:
        issues.append("Missing Open Graph description")
    if not og_image:
        issues.append("Missing Open Graph image")

    if images_without_alt:
        issues.append(f"{len(images_without_alt)} image(s) without alt text")

    if not viewport:
        issues.append("Missing viewport meta tag (mobile)")

    if not json_ld:
        issues.append("No JSON-LD structured data")

    # Print summary
    print(f"  Title: {title[:80]}{'...' if len(title) > 80 else ''}")
    print(f"  Title length: {title_length}")
    print(f"  Description length: {desc_length}")
    print(f"  H1 count: {h1_count}")
    print(f"  H2 count: {h2_count}")
    print(f"  H3 count: {h3_count}")
    print(f"  Canonical: {canonical}")
    print(f"  OG title: {'Yes' if og_title else 'No'}")
    print(f"  OG image: {'Yes' if og_image else 'No'}")
    print(f"  Images without alt: {len(images_without_alt)}")
    print(f"  Internal links: {len(internal_links)}")
    print(f"  External links: {len(external_links)}")
    print(f"  Word count: {word_count}")
    print(f"  JSON-LD blocks: {len(json_ld)}")
    print(f"  Issues: {len(issues)}")
    for issue in issues:
        print(f"    - {issue}")

    return {
        "url": url,
        "title": title,
        "title_length": title_length,
        "description_length": desc_length,
        "h1_count": h1_count,
        "h1_text": h1_text,
        "h2_count": h2_count,
        "h3_count": h3_count,
        "canonical": canonical,
        "has_og_title": bool(og_title),
        "has_og_desc": bool(og_desc),
        "has_og_image": bool(og_image),
        "images_without_alt": len(images_without_alt),
        "internal_links": len(internal_links),
        "external_links": len(external_links),
        "word_count": word_count,
        "json_ld_blocks": len(json_ld),
        "issues": issues,
        "issue_count": len(issues),
    }


def main():
    print(f"\n{'#' * 60}")
    print(f"# SEO AUDIT: {SITE_URL}")
    print(f"# {time.strftime('%Y-%m-%d %H:%M')}")
    print(f"{'#' * 60}")

    urls = get_sitemap_urls()
    print(f"\nFound {len(urls)} pages in sitemap\n")

    results = []
    total_issues = 0

    for url in urls:
        result = audit_page(url)
        results.append(result)
        if "issue_count" in result:
            total_issues += result["issue_count"]
        time.sleep(0.3)

    avg_issues = total_issues / len(results) if results else 0

    print(f"\n\n{'=' * 60}")
    print(f"SITE-LEVEL SUMMARY")
    print(f"{'=' * 60}")
    print(f"Pages audited: {len(results)}")
    print(f"Total issues: {total_issues}")
    print(f"Average issues per page: {avg_issues:.1f}")

    report = {
        "site": SITE_URL,
        "audited_at": time.strftime("%Y-%m-%dT%H:%M:%SZ"),
        "total_issues": total_issues,
        "avg_issues_per_page": avg_issues,
        "pages": results,
    }

    with open(REPORT_FILE, "w") as f:
        json.dump(report, f, indent=2)

    print(f"\nReport saved to {REPORT_FILE}")

    return 0


if __name__ == "__main__":
    exit(main())

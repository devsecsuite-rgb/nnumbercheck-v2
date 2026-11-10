import os
import json
import time
import requests
from google.oauth2 import service_account
from googleapiclient.discovery import build
from datetime import datetime

# ============================================================
# CONFIGURATION
# ============================================================

SEED_KEYWORDS = [
    "cessna 172 vs 182 cost",
    "piper pa-28 vs cessna 172",
    "how much does a cessna 172 cost",
    "best first airplane to buy",
    "common airworthiness directives cessna",
    "piper pa-18 super cub review",
    "cirrus sr22 maintenance costs",
    "how to check aircraft accident history",
    "faa n number lookup",
    "aircraft title search before buying"
]

YOUR_DOMAIN = "nnumbercheck.com"

MIN_SCORE_TO_LOG = 50
MAX_POSITIONS_TO_CHECK = 10

# ============================================================
# SERP FETCHING (via OpenSERP)
# ============================================================

def fetch_serp(keyword):
    url = "http://127.0.0.1:7000/google/search"
    params = {"text": keyword, "extract": 0}
    try:
        resp = requests.get(url, params=params, timeout=60)
        resp.raise_for_status()
        return resp.json().get("results", [])[:MAX_POSITIONS_TO_CHECK]
    except Exception as e:
        print(f"  [ERROR] SERP fetch failed for '{keyword}': {e}")
        return []

# ============================================================
# BACKLINK CHECK (via Crawly)
# ============================================================

def get_backlink_data(url):
    api_key = os.environ.get("CRAWLY_API_KEY", "")
    if not api_key:
        return {"referring_domains": 0, "harmonic_score": 0}

    try:
        domain = url.split("//")[1].split("/")[0]
    except IndexError:
        domain = url

    headers = {"Authorization": f"Bearer {api_key}"}
    params = {"domain": domain}

    try:
        resp = requests.get("https://www.getcrawly.com/api/v1/domain-authority", params=params, headers=headers, timeout=15)
        if resp.status_code == 200:
            data = resp.json()
            return {
                "referring_domains": data.get("summary", {}).get("referring_domains", 999),
                "harmonic_score": data.get("score", {}).get("harmonic_score", 0),
            }
    except Exception:
        pass
    return {"referring_domains": 999, "harmonic_score": 0}

# ============================================================
# GSC DATA
# ============================================================

def get_gsc_striking_distance():
    creds_json = os.environ.get("GSC_SERVICE_ACCOUNT_JSON", "")
    if not creds_json:
        return []

    try:
        creds_dict = json.loads(creds_json)
        creds = service_account.Credentials.from_service_account_info(creds_dict, scopes=["https://www.googleapis.com/auth/webmasters.readonly"])
        service = build("searchconsole", "v1", credentials=creds)

        site_url = "https://nnumbercheck.com/" # FIXED FOR NNUMBERCHECK
        request = {
            "startDate": "2026-01-01",
            "endDate": datetime.now().strftime("%Y-%m-%d"),
            "dimensions": ["query"],
            "rowLimit": 200,
            "startRow": 0,
            "dimensionFilterGroups": [{"filters": [{"dimension": "position", "operator": "between", "expression": ["5", "20"]}]}],
        }
        response = service.searchanalytics().query(siteUrl=site_url, body=request).execute()
        return [row["keys"][0] for row in response.get("rows", [])]
    except Exception as e:
        print(f"[ERROR] GSC fetch failed: {e}")
        return []

# ============================================================
# SCORING LOGIC
# ============================================================

def score_opportunity(keyword, result, ref_domains, harmonic_score):
    score = 0
    reasons = []

    if ref_domains <= 3: score += 25; reasons.append(f"+25: Only {ref_domains} referring domains")
    elif ref_domains <= 10: score += 15; reasons.append(f"+15: Only {ref_domains} referring domains")
    
    if harmonic_score < 0.3: score += 15; reasons.append(f"+15: Low harmonic score")
    elif harmonic_score < 0.5: score += 8; reasons.append(f"+8: Moderate harmonic score")

    url_lower = result.get("url", "").lower()
    if any(site in url_lower for site in ["reddit.com", "quora.com", "pilots", "forum"]):
        score += 15; reasons.append("+15: Forum/UGC content in results")

    title = result.get("title", "").lower()
    kw_lower = keyword.lower()
    if kw_lower not in title: score += 10; reasons.append("+10: Keyword absent from title")
    
    generic_indicators = ["blog", "article", "guide", "what is", "how to"]
    if any(ind in title for ind in generic_indicators): score += 8; reasons.append("+8: Generic content type")

    tool_indicators = ["calculator", "estimator", "quote", "tool", "calculate", "database", "lookup"]
    if not any(ind in title for ind in tool_indicators): score += 12; reasons.append("+12: No interactive tool/lookup in title")
    if any(ind in title for ind in tool_indicators): score -= 10; reasons.append("-10: Competitor has tool")
    if kw_lower in title: score -= 5; reasons.append("-5: Keyword in title")
    if ref_domains > 100: score -= 15; reasons.append(f"-15: {ref_domains} referring domains")

    return max(0, min(100, score)), reasons

# ============================================================
# MAIN EXECUTION
# ============================================================

def main():
    print(f"[START] Blood in the Water scan – {datetime.now().isoformat()}")
    gsc_keywords = get_gsc_striking_distance()
    all_keywords = list(set(SEED_KEYWORDS + gsc_keywords))
    
    all_opportunities = []

    for i, keyword in enumerate(all_keywords, 1):
        print(f"[{i}/{len(all_keywords)}] Scanning: '{keyword}'")
        results = fetch_serp(keyword)
        if not results: continue

        for result in results:
            url = result.get("url", "")
            if YOUR_DOMAIN in url: continue

            ref_data = get_backlink_data(url)
            score, reasons = score_opportunity(keyword, result, ref_data["referring_domains"], ref_data["harmonic_score"])

            if score >= MIN_SCORE_TO_LOG:
                all_opportunities.append({
                    "score": score,
                    "keyword": keyword,
                    "url": url,
                    "why_weak": "; ".join(reasons)
                })
                print(f"  [FOUND] Score {score} – {url}")
            time.sleep(0.5)

    all_opportunities.sort(key=lambda x: x["score"], reverse=True)

    # Save to JSON file instead of Google Sheets (easier for local workflow)
    with open("data/seo_opportunities.json", "w", encoding="utf-8") as f:
        json.dump(all_opportunities, f, indent=2)
        
    print(f"\n[DONE] Scan complete. {len(all_opportunities)} opportunities saved to data/seo_opportunities.json")

if __name__ == "__main__":
    main()

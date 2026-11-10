import os
import json
import time
import requests
import gspread
from oauth2client.service_account import ServiceAccountCredentials
from google.oauth2 import service_account
from googleapiclient.discovery import build
from datetime import datetime

# ============================================================
# CONFIGURATION – EDIT THIS SECTION
# ============================================================

SEED_KEYWORDS = [
    "workers comp insurance calculator",
    "general liability insurance estimator",
    "commercial auto insurance quote calculator",
    "business insurance cost calculator",
    "small business liability insurance estimate",
    "contractor insurance calculator",
    "restaurant insurance cost estimator",
    "commercial property insurance calculator",
]

YOUR_DOMAIN = "calccover.com"

# Scoring thresholds
MIN_SCORE_TO_LOG = 50
MAX_POSITIONS_TO_CHECK = 10

# ============================================================
# SERP FETCHING (via OpenSERP running locally in Docker)
# ============================================================

def fetch_serp(keyword):
    """
    Fetch top 10 Google results for a keyword.
    Assumes OpenSERP is running on localhost:7000.
    """
    url = "http://127.0.0.1:7000/google/search"
    params = {"text": keyword, "extract": 0}
    try:
        resp = requests.get(url, params=params, timeout=60)
        resp.raise_for_status()
        data = resp.json()
        results = data.get("results", [])
        return results[:MAX_POSITIONS_TO_CHECK]
    except Exception as e:
        print(f"  [ERROR] SERP fetch failed for '{keyword}': {e}")
        return []

# ============================================================
# BACKLINK CHECK (via Crawly)
# ============================================================

def get_backlink_data(url):
    """
    Returns a dict with referring_domains and harmonic_score
    for a given URL's domain.
    """
    api_key = os.environ.get("CRAWLY_API_KEY", "")
    if not api_key:
        print("  [WARN] CRAWLY_API_KEY not set. Returning dummy data.")
        return {"referring_domains": 0, "harmonic_score": 0}

    # Extract domain from URL
    try:
        domain = url.split("//")[1].split("/")[0]
    except IndexError:
        domain = url

    headers = {"Authorization": f"Bearer {api_key}"}
    params = {"domain": domain}

    try:
        resp = requests.get(
            "https://www.getcrawly.com/api/v1/domain-authority",
            params=params,
            headers=headers,
            timeout=15,
        )
        if resp.status_code == 200:
            data = resp.json()
            summary = data.get("summary", {})
            score = data.get("score", {})
            return {
                "referring_domains": summary.get("referring_domains", 999),
                "harmonic_score": score.get("harmonic_score", 0),
            }
        else:
            print(f"  [WARN] Crawly returned {resp.status_code} for {domain}")
    except Exception as e:
        print(f"  [ERROR] Crawly request failed for {domain}: {e}")

    return {"referring_domains": 999, "harmonic_score": 0}

# ============================================================
# GSC DATA (for your own striking-distance keywords)
# ============================================================

def get_gsc_striking_distance():
    """
    Pull queries where YOUR site ranks position 5-20.
    Returns a list of keyword strings.
    """
    creds_json = os.environ.get("GSC_SERVICE_ACCOUNT_JSON", "")
    if not creds_json:
        print("[WARN] GSC_SERVICE_ACCOUNT_JSON not set. Skipping GSC data.")
        return []

    try:
        creds_dict = json.loads(creds_json)
        creds = service_account.Credentials.from_service_account_info(
            creds_dict,
            scopes=["https://www.googleapis.com/auth/webmasters.readonly"],
        )
        service = build("searchconsole", "v1", credentials=creds)

        # Get the site URL (you may need to adjust this)
        site_url = "https://calccover.com/"
        request = {
            "startDate": "2026-01-01",
            "endDate": datetime.now().strftime("%Y-%m-%d"),
            "dimensions": ["query"],
            "rowLimit": 200,
            "startRow": 0,
            "dimensionFilterGroups": [
                {
                    "filters": [
                        {
                            "dimension": "position",
                            "operator": "between",
                            "expression": ["5", "20"],
                        }
                    ]
                }
            ],
        }
        response = service.searchanalytics().query(siteUrl=site_url, body=request).execute()
        rows = response.get("rows", [])
        return [row["keys"][0] for row in rows]
    except Exception as e:
        print(f"[ERROR] GSC fetch failed: {e}")
        return []

# ============================================================
# SCORING LOGIC (Blood in the Water factors)
# ============================================================

def score_opportunity(keyword, result, ref_domains, harmonic_score):
    """
    Transparent 0-100 scoring based on observable weakness signals.
    Returns (score, reasons_list).
    """
    score = 0
    reasons = []

    # --- POSITIVE FACTORS (weak competitor signals) ---

    # 1. Very few referring domains (accidental ranking signal)
    if ref_domains <= 3:
        score += 25
        reasons.append(f"+25: Only {ref_domains} referring domains")
    elif ref_domains <= 10:
        score += 15
        reasons.append(f"+15: Only {ref_domains} referring domains")
    elif ref_domains <= 30:
        score += 5
        reasons.append(f"+5: {ref_domains} referring domains")

    # 2. Low harmonic score (weak overall authority)
    if harmonic_score < 0.3:
        score += 15
        reasons.append(f"+15: Low harmonic score ({harmonic_score:.2f})")
    elif harmonic_score < 0.5:
        score += 8
        reasons.append(f"+8: Moderate harmonic score ({harmonic_score:.2f})")

    # 3. Forum/UGC content in top results
    url_lower = result.get("url", "").lower()
    if any(site in url_lower for site in ["reddit.com", "quora.com", "stackexchange.com", "forum"]):
        score += 15
        reasons.append("+15: Forum/UGC content in results")

    # 4. Keyword absent from title (poor optimization)
    title = result.get("title", "").lower()
    kw_lower = keyword.lower()
    if kw_lower not in title:
        score += 10
        reasons.append("+10: Keyword absent from page title")

    # 5. Thin content signals (check for generic words)
    generic_indicators = ["blog", "article", "guide", "what is", "how to"]
    if any(ind in title for ind in generic_indicators):
        score += 8
        reasons.append("+8: Generic content type in title")

    # 6. No calculator/tool in title
    tool_indicators = ["calculator", "estimator", "quote", "tool", "calculate"]
    if not any(ind in title for ind in tool_indicators):
        score += 12
        reasons.append("+12: No calculator/tool in title")

    # --- NEGATIVE FACTORS (strong competitor signals) ---

    # 1. Dedicated calculator page (hard to beat)
    if any(ind in title for ind in tool_indicators):
        score -= 10
        reasons.append("-10: Competitor has calculator/tool")

    # 2. Keyword perfectly matches title
    if kw_lower in title:
        score -= 5
        reasons.append("-5: Keyword in title (good optimization)")

    # 3. High referring domain count
    if ref_domains > 100:
        score -= 15
        reasons.append(f"-15: {ref_domains} referring domains (strong)")

    # Clamp score to 0-100
    score = max(0, min(100, score))

    return score, reasons

# ============================================================
# LOGGING TO GOOGLE SHEETS
# ============================================================

def log_to_sheet(opportunities):
    """Append opportunities to Google Sheet."""
    creds_json = os.environ.get("GSC_SERVICE_ACCOUNT_JSON", "")
    sheet_id = os.environ.get("SHEET_ID", "")

    if not creds_json or not sheet_id:
        print("[ERROR] Missing GSC_SERVICE_ACCOUNT_JSON or SHEET_ID. Cannot log.")
        return

    try:
        scope = [
            "https://spreadsheets.google.com/feeds",
            "https://www.googleapis.com/auth/drive",
        ]
        creds_dict = json.loads(creds_json)
        creds = ServiceAccountCredentials.from_json_keyfile_dict(creds_dict, scope)
        client = gspread.authorize(creds)
        sheet = client.open_by_key(sheet_id).sheet1

        for opp in opportunities:
            sheet.append_row([
                opp["score"],
                opp["keyword"],
                opp["position"],
                opp["domain"],
                opp["url"],
                opp["ref_domains"],
                opp["harmonic_score"],
                opp["intent"],
                opp["why_weak"],
                opp["cluster"],
                datetime.now().strftime("%Y-%m-%d"),
            ])
        print(f"  [OK] Logged {len(opportunities)} opportunities to Google Sheet.")
    except Exception as e:
        print(f"  [ERROR] Sheet logging failed: {e}")

# ============================================================
# MAIN EXECUTION
# ============================================================

def main():
    print(f"[START] Blood in the Water scan – {datetime.now().isoformat()}")

    # Combine seed keywords with GSC striking-distance keywords
    gsc_keywords = get_gsc_striking_distance()
    all_keywords = list(set(SEED_KEYWORDS + gsc_keywords))
    print(f"[INFO] Scanning {len(all_keywords)} keywords...")

    all_opportunities = []

    for i, keyword in enumerate(all_keywords, 1):
        print(f"\n[{i}/{len(all_keywords)}] Scanning: '{keyword}'")
        results = fetch_serp(keyword)

        if not results:
            print("  [SKIP] No results returned.")
            continue

        for result in results:
            url = result.get("url", "")
            if YOUR_DOMAIN in url:
                continue  # Skip your own site

            ref_data = get_backlink_data(url)
            ref_domains = ref_data["referring_domains"]
            harmonic = ref_data["harmonic_score"]

            score, reasons = score_opportunity(keyword, result, ref_domains, harmonic)

            if score >= MIN_SCORE_TO_LOG:
                # Determine cluster (simple: first word of keyword)
                cluster = keyword.split()[0] if keyword else "general"

                all_opportunities.append({
                    "score": score,
                    "keyword": keyword,
                    "position": result.get("rank", result.get("position", 99)),
                    "domain": url.split("//")[1].split("/")[0] if "//" in url else url,
                    "url": url,
                    "ref_domains": ref_domains,
                    "harmonic_score": round(harmonic, 3),
                    "intent": "commercial",
                    "why_weak": "; ".join(reasons),
                    "cluster": cluster,
                })
                print(f"  [FOUND] Score {score} – {url}")
            else:
                print(f"  [SKIP] Score {score} (below threshold) – {url}")

            time.sleep(0.5)  # Respect Crawly rate limit

    # Sort by score descending
    all_opportunities.sort(key=lambda x: x["score"], reverse=True)

    if all_opportunities:
        log_to_sheet(all_opportunities)
    else:
        print("\n[INFO] No opportunities met the threshold this run.")

    print(f"\n[DONE] Scan complete. {len(all_opportunities)} opportunities found.")

if __name__ == "__main__":
    main()
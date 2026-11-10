import os
import json
import time
from google import genai
from datetime import datetime

api_key = os.environ.get("GEMINI_API_KEY")
if not api_key:
    print("ERROR: GEMINI_API_KEY environment variable not set.")
    exit(1)

client = genai.Client(api_key=api_key)

def slugify(text):
    return text.lower().replace(" ", "-").replace("?", "").replace("'", "").replace("vs.", "vs")

def get_aviation_data_context(keyword):
    try:
        with open("data/aircraft-data.json", "r", encoding="utf-8-sig") as f:
            data = json.load(f)
    except FileNotFoundError:
        return "No database context available."

    targets = keyword.lower().split(" vs ")
    contexts = []

    for target in targets:
        matches = []
        for n_number, entry in data.items():
            aircraft = entry.get("aircraft", {})
            make = str(aircraft.get("make", "")).lower()
            model = str(aircraft.get("model", "")).lower()
            
            if make in target and model in target:
                matches.append(entry)
                
            if len(matches) >= 50:
                break
                
        if matches:
            total_aircraft = len(matches)
            total_accidents = sum(len(entry.get("accidents", [])) for entry in matches)
            ads = set()
            for entry in matches:
                for ad in entry.get("directives", []):
                    ads.add(ad.get("ad_number"))
            
            contexts.append(f"""
            DATA FOR "{target}":
            - Matching Aircraft in DB: {total_aircraft}
            - Total NTSB Accidents: {total_accidents}
            - Relevant Airworthiness Directives: {', '.join(list(ads)[:5])}
            """)

    if not contexts:
        return "General aviation data. Use industry knowledge."
        
    return "\n".join(contexts)

def generate_article(opportunity):
    keyword = opportunity["keyword"]
    slug = slugify(keyword)
    filepath = f"content/blog/{slug}.md"
    
    # Skip if already generated
    if os.path.exists(filepath):
        print(f"Skipping: {keyword} (already exists)")
        return

    print(f"Generating: {keyword}")
    
    data_context = get_aviation_data_context(keyword)
    
    prompt = f"""
    You are an expert aviation journalist and aircraft buyer's advocate writing for NNumberCheck.com.
    Write a comprehensive, 1000-word article targeting the search query: "{keyword}".
    
    Use the following real data from our FAA database to make the article authoritative:
    {data_context}
    
    Guidelines:
    1. Format the output in Markdown. Use H2 (##) and H3 (###) tags.
    2. Write in a professional, helpful tone for aircraft buyers and pilots.
    3. If the query is a comparison (e.g., "X vs Y"), create a structured comparison. If it is a general guide, use the data to recommend specific models.
    4. Include a section on why checking an aircraft's specific N-number history is critical.
    5. Do NOT use generic filler. Use the data provided.
    6. Include a Call to Action (CTA) at the end encouraging the reader to use the free N-number lookup on NNumberCheck.com.
    
    Format the very first line as the article title (e.g., # Title Here).
    """
    
    try:
        response = client.models.generate_content(
            model='gemini-3.6-flash',
            contents=prompt,
        )
        
        content = response.text
        title = keyword.title()
        lines = content.split('\n')
        
        if lines and lines[0].startswith('# '):
            title = lines[0].replace('# ', '').strip()
            content = '\n'.join(lines[1:])
            
        date = datetime.now().strftime("%Y-%m-%d")
        
        frontmatter = f"""---
title: "{title}"
date: "{date}"
keyword: "{keyword}"
description: "Learn about {keyword}. Real FAA data, accident history, and buyer's guide."
---

"""
        
        with open(filepath, "w", encoding="utf-8") as f:
            f.write(frontmatter + content)
            
        print(f"  [OK] Saved to {filepath}")
        
        # Wait 5 seconds to avoid rate limits
        time.sleep(5)
        
    except Exception as e:
        print(f"  [ERROR] Failed to generate {keyword}: {e}")
        print("  Waiting 10 seconds before trying the next one...")
        time.sleep(10)

def main():
    try:
        with open("data/seo_opportunities.json", "r", encoding="utf-8-sig") as f:
            opportunities = json.load(f)
    except FileNotFoundError:
        print("Error: data/seo_opportunities.json not found.")
        return

    seen = set()
    unique_opps = []
    for opp in opportunities:
        if opp["keyword"] not in seen:
            unique_opps.append(opp)
            seen.add(opp["keyword"])
            
    for opp in unique_opps[:3]:
        generate_article(opp)
        
if __name__ == "__main__":
    main()

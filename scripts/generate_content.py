import os
import json
from google import genai
from datetime import datetime

# Read from environment variable
api_key = os.environ.get("GEMINI_API_KEY")
if not api_key:
    print("ERROR: GEMINI_API_KEY environment variable not set.")
    exit(1)

# Initialize the NEW Google GenAI client
client = genai.Client(api_key=api_key)

def slugify(text):
    return text.lower().replace(" ", "-").replace("?", "").replace("'", "").replace("vs.", "vs")

def get_aviation_data_context(keyword):
    try:
        # FIXED: using utf-8-sig to ignore PowerShell BOM
        with open("data/aircraft-data.json", "r", encoding="utf-8-sig") as f:
            data = json.load(f)
    except FileNotFoundError:
        return "No database context available."

    matches = []
    for n_number, entry in data.items():
        aircraft = entry.get("aircraft", {})
        make = str(aircraft.get("make", "")).lower()
        model = str(aircraft.get("model", "")).lower()
        
        if make in keyword.lower() and model in keyword.lower():
            matches.append(entry)
            
        if len(matches) >= 100:
            break
            
    if not matches:
        return "No specific model stats found for this keyword."

    total_aircraft = len(matches)
    total_accidents = sum(len(entry.get("accidents", [])) for entry in matches)
    
    ads = set()
    for entry in matches:
        for ad in entry.get("directives", []):
            ads.add(ad.get("ad_number"))
            
    context = f"""
    DATABASE FACTS for {keyword}:
    - Aircraft in our database matching this search: {total_aircraft}
    - Total NTSB accident records for these aircraft: {total_accidents}
    - Relevant Airworthiness Directives found: {', '.join(list(ads)[:5])}
    """
    return context

def generate_article(opportunity):
    keyword = opportunity["keyword"]
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
    3. Include a section on why checking an aircraft's specific N-number history is critical.
    4. Do NOT use generic filler. Use the data provided.
    5. Include a Call to Action (CTA) at the end encouraging the reader to use the free N-number lookup on NNumberCheck.com.
    
    Format the very first line as the article title (e.g., # Title Here).
    """
    
    # FIXED: New SDK syntax
    response = client.models.generate_content(
        model='gemini-3.5-flash',
        contents=prompt,
    )
    
    content = response.text
    
    title = keyword.title()
    lines = content.split('\n')
    if lines and lines[0].startswith('# '):
        title = lines[0].replace('# ', '').strip()
        content = '\n'.join(lines[1:])
        
    slug = slugify(keyword)
    date = datetime.now().strftime("%Y-%m-%d")
    
    frontmatter = f"""---
title: "{title}"
date: "{date}"
keyword: "{keyword}"
description: "Learn about {keyword}. Real FAA data, accident history, and buyer's guide."
---

"""
    
    filepath = f"content/blog/{slug}.md"
    with open(filepath, "w", encoding="utf-8") as f:
        f.write(frontmatter + content)
        
    print(f"  [OK] Saved to {filepath}")

def main():
    try:
        # FIXED: using utf-8-sig to ignore PowerShell BOM
        with open("data/seo_opportunities.json", "r", encoding="utf-8-sig") as f:
            opportunities = json.load(f)
    except FileNotFoundError:
        print("Error: data/seo_opportunities.json not found.")
        return

    # Process the top 1 opportunity for testing
    for opp in opportunities[:1]:
        generate_article(opp)
        
if __name__ == "__main__":
    main()

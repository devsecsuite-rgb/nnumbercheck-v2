// scripts/fetch-ads.js
const fs = require('fs');

const FR_API_URL = 'https://www.federalregister.gov/api/v1/documents.json';
const START_YEAR = 2010; // Adjust if you want older ADs
const CURRENT_YEAR = new Date().getFullYear();

async function fetchYear(year) {
  const allADs = [];
  let page = 1;
  let hasMore = true;

  while (hasMore) {
    const params = new URLSearchParams({
      'conditions[type][]': 'RULE',
      'conditions[agencies][]': 'federal-aviation-administration',
      'conditions[term]': 'Airworthiness Directives',
      'conditions[publication_date][gte]': `${year}-01-01`,
      'conditions[publication_date][lte]': `${year}-12-31`,
      'per_page': '1000',
      'page': page.toString(),
      'order': 'newest',
    });

    const url = `${FR_API_URL}?${params.toString()}`;
    const response = await fetch(url);

    if (!response.ok) {
      if (response.status === 400 && page > 1) {
        // Hit the pagination cap for this year — move on
        console.log(`  [${year}] Reached pagination cap at page ${page}`);
        hasMore = false;
        continue;
      }
      throw new Error(`Federal Register API error: ${response.status} (${year}, page ${page})`);
    }

    const data = await response.json();
    if (data.results && data.results.length > 0) {
      allADs.push(...data.results);
      page++;
    } else {
      hasMore = false;
    }

    await new Promise((r) => setTimeout(r, 300));
  }

  return allADs;
}

function parseTitle(title) {
  const cleanTitle = title.replace(/^Airworthiness Directives;\s*/i, '');
  const manufacturerMatch = cleanTitle.match(/^(.+?)(?=\s+(Model|Airplanes|Helicopters|Engines|Propellers|Turbofan|Turboprop|Blades))/i);
  const manufacturer = manufacturerMatch ? manufacturerMatch[1].trim() : null;
  const modelMatch = cleanTitle.match(/Model\s+([^,]+?)\s+(Airplanes|Helicopters|Engines|Propellers)/i);
  const model = modelMatch ? modelMatch[1].trim() : null;
  return { manufacturer, model };
}

function generateSQL(ads) {
  const statements = [];

  for (const ad of ads) {
    const adNumber = ad.document_number;
    const title = ad.title;
    const { manufacturer, model } = parseTitle(title);
    const effectiveDate = ad.effective_on || '';
    const abstract = ad.abstract || '';
    const documentUrl = ad.html_url || '';

    const esc = (s) => (s || '').toString().replace(/'/g, "''");

    statements.push(
      `INSERT OR IGNORE INTO directives (ad_number, title, manufacturer, model, effective_date, abstract, document_url) VALUES ('${esc(adNumber)}', '${esc(title)}', '${esc(manufacturer)}', '${esc(model)}', '${esc(effectiveDate)}', '${esc(abstract)}', '${esc(documentUrl)}');`
    );
  }

  return statements.join('\n');
}

async function main() {
  try {
    const allADs = [];
    for (let year = CURRENT_YEAR; year >= START_YEAR; year--) {
      console.log(`[${year}] Fetching...`);
      const ads = await fetchYear(year);
      console.log(`[${year}] Got ${ads.length} ADs`);
      allADs.push(...ads);
    }

    console.log(`\nTotal AD documents fetched: ${allADs.length}`);

    const sql = generateSQL(allADs);
    fs.writeFileSync('ads-import.sql', sql);
    console.log(`Wrote ${allADs.length} SQL statements to ads-import.sql`);
  } catch (err) {
    console.error('Fatal error:', err.message);
    process.exit(1);
  }
}

main();

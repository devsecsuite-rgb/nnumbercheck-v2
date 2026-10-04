// scripts/fetch-ads.js
const fs = require('fs');

const FR_API_URL = 'https://www.federalregister.gov/api/v1/documents.json';

async function fetchAllADs() {
  const allADs = [];
  let page = 1;
  let hasMore = true;

  console.log('Starting to fetch FAA Airworthiness Directives...');

  while (hasMore) {
    const params = new URLSearchParams({
      'conditions[type][]': 'RULE',
      'conditions[agencies][]': 'federal-aviation-administration',
      'conditions[term]': 'Airworthiness Directives',
      'per_page': '1000',
      'page': page.toString(),
      'order': 'newest',
    });

    const url = `${FR_API_URL}?${params.toString()}`;
    console.log(`Fetching page ${page}...`);

    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Federal Register API error: ${response.status}`);
    }

    const data = await response.json();
    if (data.results && data.results.length > 0) {
      allADs.push(...data.results);
      console.log(`  Got ${data.results.length} records (total so far: ${allADs.length})`);
      page++;
    } else {
      hasMore = false;
    }

    await new Promise((r) => setTimeout(r, 500));
  }

  console.log(`Total AD documents fetched: ${allADs.length}`);
  return allADs;
}

// Parse "Airworthiness Directives; Cessna Aircraft Company Model 172N Airplanes"
// into manufacturer and model fields.
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
    const ads = await fetchAllADs();
    const sql = generateSQL(ads);
    fs.writeFileSync('ads-import.sql', sql);
    console.log(`Wrote ${ads.length} SQL statements to ads-import.sql`);
  } catch (err) {
    console.error('Fatal error:', err.message);
    process.exit(1);
  }
}

main();

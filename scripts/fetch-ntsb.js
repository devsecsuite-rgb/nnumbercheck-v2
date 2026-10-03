// scripts/fetch-ntsb.js
const fs = require('fs');
const AdmZip = require('adm-zip');

const NTSB_ENDPOINT = 'https://data.ntsb.gov/carol-main-public/api/Query/FileExport';
const START_YEAR = 1982;
const CURRENT_YEAR = new Date().getFullYear();
const CHUNK_SIZE = 50000;

function buildSelectedOption(fieldName, displayText, columns, inputType) {
  return {
    FieldName: fieldName,
    DisplayText: displayText,
    Columns: columns,
    Selectable: true,
    InputType: inputType,
    RuleType: 0,
    Options: null,
    TargetCollection: 'cases',
    UnderDevelopment: true,
  };
}

async function fetchYear(year) {
  const start = `${year}-01-01`;
  const end = `${year}-12-31`;

  const payload = {
    QueryGroups: [
      {
        QueryRules: [
          {
            RuleType: 'Simple',
            Values: [start],
            Columns: ['Event.EventDate'],
            Operator: 'is on or after',
            overrideColumn: '',
            selectedOption: buildSelectedOption('EventDate', 'Event date', ['Event.EventDate'], 'Date'),
          },
          {
            RuleType: 'Simple',
            Values: [end],
            Columns: ['Event.EventDate'],
            Operator: 'is on or before',
            overrideColumn: '',
            selectedOption: buildSelectedOption('EventDate', 'Event date', ['Event.EventDate'], 'Date'),
          },
          {
            RuleType: 'Simple',
            Values: ['Aviation'],
            Columns: ['Event.Mode'],
            Operator: 'is',
            overrideColumn: '',
            selectedOption: buildSelectedOption('Mode', 'Investigation mode', ['Event.Mode'], 'Dropdown'),
          },
        ],
        AndOr: 'and',
        inLastSearch: false,
        editedSinceLastSearch: false,
      },
    ],
    AndOr: 'and',
    TargetCollection: 'cases',
    ExportFormat: 'data',
    SessionId: Math.floor(Math.random() * 100000) + 100000,
    ResultSetSize: 500,
    SortDescending: true,
  };

  const response = await fetch(NTSB_ENDPOINT, {
    method: 'POST',
    headers: {
      'Accept': '*/*',
      'Content-Type': 'application/json',
      'Origin': 'https://data.ntsb.gov',
      'User-Agent': 'ntsb-api-proxy/1.0.0',
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`);
  }

  const buffer = Buffer.from(await response.arrayBuffer());
  const zip = new AdmZip(buffer);
  const entries = zip.getEntries();
  const dataEntry = entries.find((e) => e.entryName.endsWith('.json'));

  if (!dataEntry) {
    return [];
  }

  const raw = JSON.parse(dataEntry.getData().toString('utf8'));
  return Array.isArray(raw) ? raw : [];
}

function recordToSql(record) {
  const sqlStatements = [];
  const vehicles = record.cm_vehicles || [];

  // Filter to US-registered aircraft (N-numbers only)
  const usVehicles = vehicles.filter((v) => {
    const reg = (v.registrationNumber || '').toString().toUpperCase().trim();
    return reg.startsWith('N') && reg.length >= 2 && reg.length <= 6;
  });

  if (usVehicles.length === 0) return sqlStatements;

  const eventDate = (record.cm_eventDate || '').toString().slice(0, 10);
  const city = record.cm_city || '';
  const state = record.cm_state || '';
  const country = record.cm_country || '';
  const location = [city, state, country].filter(Boolean).join(', ');
  const severity = record.cm_highestInjury || 'Unknown';
  const eventType = record.cm_eventType === 'ACC' ? 'Accident' : 'Incident';
  const ntsbNum = record.cm_ntsbNum || '';

  for (const vehicle of usVehicles) {
    const nNumber = vehicle.registrationNumber.toUpperCase().trim();
    const make = vehicle.make || '';
    const model = vehicle.model || '';
    const summary = `${eventType} — ${make} ${model} (NTSB ${ntsbNum})`.trim();
    const esc = (s) => (s || '').toString().replace(/'/g, "''");

    sqlStatements.push(
      `INSERT OR REPLACE INTO accidents (n_number, event_date, location, severity, summary) VALUES ('${esc(nNumber)}', '${esc(eventDate)}', '${esc(location)}', '${esc(severity)}', '${esc(summary)}');`
    );
  }

  return sqlStatements;
}

async function fetchWithRetry(year, retries = 3) {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      return await fetchYear(year);
    } catch (err) {
      console.log(`  Attempt ${attempt}/${retries} failed: ${err.message}`);
      if (attempt === retries) throw err;
      // Exponential backoff
      await new Promise((r) => setTimeout(r, 2000 * attempt));
    }
  }
}

async function main() {
  const allSql = [];
  let totalRecords = 0;
  let totalUsAccidents = 0;
  const yearSummary = [];

  console.log(`Starting year-by-year NTSB fetch: ${START_YEAR} to ${CURRENT_YEAR}`);

  for (let year = START_YEAR; year <= CURRENT_YEAR; year++) {
    console.log(`[${year}] Fetching...`);
    try {
      const records = await fetchWithRetry(year);
      let yearSqlCount = 0;
      for (const record of records) {
        const sql = recordToSql(record);
        allSql.push(...sql);
        yearSqlCount += sql.length;
      }
      totalRecords += records.length;
      totalUsAccidents += yearSqlCount;
      yearSummary.push({ year, total: records.length, us: yearSqlCount });
      console.log(`[${year}] ${records.length} total records, ${yearSqlCount} US accidents`);
    } catch (err) {
      console.error(`[${year}] Failed permanently: ${err.message}`);
      yearSummary.push({ year, total: 0, us: 0, error: err.message });
    }

    // Be polite to the NTSB API
    await new Promise((r) => setTimeout(r, 500));
  }

  console.log('');
  console.log('=== SUMMARY ===');
  for (const s of yearSummary) {
    const status = s.error ? `ERROR: ${s.error}` : `${s.total} total / ${s.us} US`;
    console.log(`  ${s.year}: ${status}`);
  }
  console.log('');
  console.log(`Total records fetched: ${totalRecords}`);
  console.log(`Total US accident SQL statements: ${totalUsAccidents}`);

  // Write chunks
  const numChunks = Math.ceil(allSql.length / CHUNK_SIZE);
  for (let i = 0; i < allSql.length; i += CHUNK_SIZE) {
    const chunk = allSql.slice(i, i + CHUNK_SIZE);
    const chunkNum = Math.floor(i / CHUNK_SIZE) + 1;
    const filename = `ntsb-import-part${chunkNum}.sql`;
    fs.writeFileSync(filename, chunk.join('\n'));
    console.log(`Wrote ${chunk.length} statements to ${filename}`);
  }

  // Also write the legacy single file for backwards compatibility
  fs.writeFileSync('ntsb-import.sql', allSql.join('\n'));
  console.log(`Wrote ${allSql.length} statements to ntsb-import.sql`);
  console.log(`Generated ${numChunks} chunks total`);
}

main().catch((err) => {
  console.error('Fatal error:', err.message);
  process.exit(1);
});

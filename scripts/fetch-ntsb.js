// scripts/fetch-ntsb.js
const fs = require('fs');
const path = require('path');
const AdmZip = require('adm-zip');
const { execSync } = require('child_process');

const NTSB_ENDPOINT = 'https://data.ntsb.gov/carol-main-public/api/Query/FileExport';

// Fetch the last 12 months of data
function getDateRange(monthsBack = 12) {
  const end = new Date();
  const start = new Date();
  start.setMonth(start.getMonth() - monthsBack);
  return {
    start: start.toISOString().split('T')[0],
    end: end.toISOString().split('T')[0],
  };
}

async function fetchNTSBData() {
  const { start, end } = getDateRange(12);
  console.log(`Fetching NTSB data from ${start} to ${end}...`);

  const payload = {
    QueryGroups: [
      {
        QueryRules: [
          {
            RuleType: 'Simple',
            Values: [start],
            Columns: ['Event.EventDate'],
            Operator: 'is on or after',
          },
          {
            RuleType: 'Simple',
            Values: [end],
            Columns: ['Event.EventDate'],
            Operator: 'is on or before',
          },
          {
            RuleType: 'Simple',
            Values: ['Aviation'],
            Columns: ['Event.Mode'],
            Operator: 'is',
          },
        ],
        AndOr: 'and',
      },
    ],
    AndOr: 'and',
    TargetCollection: 'cases',
    ExportFormat: 'data',
    SessionId: 227230,
    ResultSetSize: 500,
    SortDescending: true,
  };

  const response = await fetch(NTSB_ENDPOINT, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'User-Agent': 'Mozilla/5.0 (compatible; NNumberCheck/1.0)',
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error(`NTSB API error: ${response.status}`);
  }

  const buffer = Buffer.from(await response.arrayBuffer());
  const zip = new AdmZip(buffer);
  const entries = zip.getEntries();

  console.log(`Received ${entries.length} files in ZIP`);

  // The main data file is typically a JSON or XML file
  // Adjust based on the actual NTSB export format
  const dataEntry = entries.find((e) => e.entryName.endsWith('.json'));
  if (!dataEntry) {
    console.log('Available entries:', entries.map((e) => e.entryName));
    throw new Error('No JSON data file found in ZIP');
  }

  const data = JSON.parse(dataEntry.getData().toString('utf8'));
  console.log(`Parsed ${data.length} accident records`);

  // Write to a SQL file for D1 import
  const sqlStatements = data
    .filter((r) => r.registration && r.registration.startsWith('N'))
    .map((r) => {
      const nNumber = r.registration.toUpperCase().trim();
      const eventDate = r.eventDate || '';
      const location = r.location || '';
      const severity = r.injurySeverity || 'Unknown';
      const summary = (r.narrative || '').replace(/'/g, "''").slice(0, 500);

      return `INSERT OR REPLACE INTO accidents (n_number, event_date, location, severity, summary) VALUES ('${nNumber}', '${eventDate}', '${location}', '${severity}', '${summary}');`;
    });

  const sqlContent = sqlStatements.join('\n');
  fs.writeFileSync('ntsb-import.sql', sqlContent);
  console.log(`Wrote ${sqlStatements.length} SQL statements to ntsb-import.sql`);
}

fetchNTSBData().catch((err) => {
  console.error(err);
  process.exit(1);
});

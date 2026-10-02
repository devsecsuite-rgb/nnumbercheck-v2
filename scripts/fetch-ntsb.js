// scripts/fetch-ntsb.js
const fs = require('fs');
const AdmZip = require('adm-zip');

const NTSB_ENDPOINT = 'https://data.ntsb.gov/carol-main-public/api/Query/FileExport';

// Build the selectedOption object for a given field
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
            overrideColumn: '',
            selectedOption: buildSelectedOption(
              'EventDate',
              'Event date',
              ['Event.EventDate'],
              'Date'
            ),
          },
          {
            RuleType: 'Simple',
            Values: [end],
            Columns: ['Event.EventDate'],
            Operator: 'is on or before',
            overrideColumn: '',
            selectedOption: buildSelectedOption(
              'EventDate',
              'Event date',
              ['Event.EventDate'],
              'Date'
            ),
          },
          {
            RuleType: 'Simple',
            Values: ['Aviation'],
            Columns: ['Event.Mode'],
            Operator: 'is',
            overrideColumn: '',
            selectedOption: buildSelectedOption(
              'Mode',
              'Investigation mode',
              ['Event.Mode'],
              'Dropdown'
            ),
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
    const errorText = await response.text();
    throw new Error(`NTSB API error: ${response.status} - ${errorText.slice(0, 500)}`);
  }

  const buffer = Buffer.from(await response.arrayBuffer());
  const zip = new AdmZip(buffer);
  const entries = zip.getEntries();

  console.log(`Received ${entries.length} files in ZIP`);
  console.log('Entry names:', entries.map((e) => e.entryName));

  // Find the JSON data file
  const dataEntry = entries.find((e) => e.entryName.endsWith('.json'));
  if (!dataEntry) {
    throw new Error(
      `No JSON data file found in ZIP. Available: ${entries.map((e) => e.entryName).join(', ')}`
    );
  }

  const raw = JSON.parse(dataEntry.getData().toString('utf8'));
  console.log(`Parsed NTSB response. Top-level keys:`, Object.keys(raw));

  // The response format is: { Results: [{ Fields: [{ FieldName, Values }] }] }
  const results = raw.Results || [];
  console.log(`Found ${results.length} accident records`);

  const sqlStatements = [];

  for (const record of results) {
    const fields = record.Fields || [];
    const map = {};
    for (const f of fields) {
      map[f.FieldName] = f.Values && f.Values.length ? f.Values[f.Values.length - 1] : null;
    }

    const nNumber = (map['N#'] || map['Registration'] || '').toString().toUpperCase().trim();
    if (!nNumber || !nNumber.startsWith('N')) continue;

    const eventDate = (map['EventDate'] || '').toString().slice(0, 10);
    const city = map['City'] || '';
    const state = map['State'] || '';
    const location = [city, state].filter(Boolean).join(', ');
    const severity = map['HighestInjuryLevel'] || 'Unknown';
    const summary = `${map['EventType'] || 'Accident'} - ${map['ReportNo'] || ''}`.trim();

    const escaped = (s) => (s || '').toString().replace(/'/g, "''");

    sqlStatements.push(
      `INSERT OR REPLACE INTO accidents (n_number, event_date, location, severity, summary) VALUES ('${escaped(nNumber)}', '${escaped(eventDate)}', '${escaped(location)}', '${escaped(severity)}', '${escaped(summary)}');`
    );
  }

  fs.writeFileSync('ntsb-import.sql', sqlStatements.join('\n'));
  console.log(`Wrote ${sqlStatements.length} SQL statements to ntsb-import.sql`);
}

fetchNTSBData().catch((err) => {
  console.error('Fatal error:', err.message);
  process.exit(1);
});

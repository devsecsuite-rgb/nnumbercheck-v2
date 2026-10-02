// scripts/fetch-ntsb.js
const fs = require('fs');
const AdmZip = require('adm-zip');

const NTSB_ENDPOINT = 'https://data.ntsb.gov/carol-main-public/api/Query/FileExport';

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
    const errorText = await response.text();
    throw new Error(`NTSB API error: ${response.status} - ${errorText.slice(0, 500)}`);
  }

  const buffer = Buffer.from(await response.arrayBuffer());
  const zip = new AdmZip(buffer);
  const entries = zip.getEntries();

  console.log(`Received ${entries.length} files in ZIP`);

  const dataEntry = entries.find((e) => e.entryName.endsWith('.json'));
  if (!dataEntry) {
    throw new Error(`No JSON file found. Available: ${entries.map((e) => e.entryName).join(', ')}`);
  }

  const raw = JSON.parse(dataEntry.getData().toString('utf8'));
  console.log(`Top-level type: ${Array.isArray(raw) ? 'Array' : typeof raw}`);
  console.log(`Record count: ${Array.isArray(raw) ? raw.length : 'N/A'}`);

  // DIAGNOSTIC: Log the first record so we can see its structure
  if (Array.isArray(raw) && raw.length > 0) {
    console.log('=== FIRST RECORD STRUCTURE ===');
    console.log(JSON.stringify(raw[0], null, 2).slice(0, 3000));
    console.log('=== END FIRST RECORD ===');
  }

  // For now, exit without writing SQL until we know the schema
  fs.writeFileSync('ntsb-import.sql', '-- Diagnostic run: no data imported yet\n');
  console.log('Diagnostic complete. Review the first record structure above.');
}

fetchNTSBData().catch((err) => {
  console.error('Fatal error:', err.message);
  process.exit(1);
});

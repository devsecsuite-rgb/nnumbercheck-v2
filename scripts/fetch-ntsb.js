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

  const dataEntry = entries.find((e) => e.entryName.endsWith('.json'));
  if (!dataEntry) {
    throw new Error(`No JSON file found. Available: ${entries.map((e) => e.entryName).join(', ')}`);
  }

  const raw = JSON.parse(dataEntry.getData().toString('utf8'));
  console.log(`Received ${raw.length} total records from NTSB`);

  const sqlStatements = [];
  let skippedNoNNumber = 0;
  let processed = 0;

  for (const record of raw) {
    // Get all vehicles for this event
    const vehicles = record.cm_vehicles || [];

    // Find US-registered aircraft (N-numbers) in any vehicle
    const usVehicles = vehicles.filter((v) => {
      const reg = (v.registrationNumber || '').toString().toUpperCase().trim();
      return reg.startsWith('N') && reg.length >= 2 && reg.length <= 6;
    });

    if (usVehicles.length === 0) {
      skippedNoNNumber++;
      continue;
    }

    // Extract event-level fields
    const eventDate = (record.cm_eventDate || '').toString().slice(0, 10);
    const city = record.cm_city || '';
    const state = record.cm_state || '';
    const country = record.cm_country || '';
    const location = [city, state, country].filter(Boolean).join(', ');
    const severity = record.cm_highestInjury || 'Unknown';
    const eventType = record.cm_eventType === 'ACC' ? 'Accident' : 'Incident';
    const ntsbNum = record.cm_ntsbNum || '';

    // Insert one row per US-registered vehicle
    for (const vehicle of usVehicles) {
      const nNumber = vehicle.registrationNumber.toUpperCase().trim();
      const make = vehicle.make || '';
      const model = vehicle.model || '';
      const summary = `${eventType} — ${make} ${model} (NTSB ${ntsbNum})`.trim();

      const esc = (s) => (s || '').toString().replace(/'/g, "''");

      sqlStatements.push(
        `INSERT OR REPLACE INTO accidents (n_number, event_date, location, severity, summary) VALUES ('${esc(nNumber)}', '${esc(eventDate)}', '${esc(location)}', '${esc(severity)}', '${esc(summary)}');`
      );
      processed++;
    }
  }

  console.log(`Total records: ${raw.length}`);
  console.log(`Skipped (no US N-number): ${skippedNoNNumber}`);
  console.log(`SQL statements generated: ${processed}`);

  fs.writeFileSync('ntsb-import.sql', sqlStatements.join('\n'));
  console.log(`Wrote ${sqlStatements.length} SQL statements to ntsb-import.sql`);

  // Show a sample statement for verification
  if (sqlStatements.length > 0) {
    console.log('=== SAMPLE SQL ===');
    console.log(sqlStatements[0]);
    console.log('=== END SAMPLE ===');
  }
}

fetchNTSBData().catch((err) => {
  console.error('Fatal error:', err.message);
  process.exit(1);
});

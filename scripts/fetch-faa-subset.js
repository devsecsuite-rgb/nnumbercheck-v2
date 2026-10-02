// scripts/fetch-faa-subset.js
const fs = require('fs');
const AdmZip = require('adm-zip');

const FAA_URL = 'https://registry.faa.gov/database/ReleasableAircraft.zip';

// ---------- CSV parser that handles quoted fields ----------
function parseCsvLine(line) {
  const result = [];
  let current = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      inQuotes = !inQuotes;
    } else if (ch === ',' && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += ch;
    }
  }
  result.push(current.trim());
  return result;
}

// ---------- Extract N-numbers from the NTSB SQL file ----------
function getAccidentNNumbers() {
  if (!fs.existsSync('ntsb-import.sql')) {
    throw new Error('ntsb-import.sql not found. Run fetch-ntsb.js first.');
  }
  const sql = fs.readFileSync('ntsb-import.sql', 'utf8');
  const regex = /VALUES \('([^']+)'/g;
  const numbers = new Set();
  let match;
  while ((match = regex.exec(sql)) !== null) {
    numbers.add(match[1].toUpperCase().trim());
  }
  console.log(`Found ${numbers.size} unique N-numbers in NTSB data`);
  return numbers;
}

// ---------- Map FAA status codes ----------
function statusLabel(code) {
  const map = {
    'V': 'Valid',
    'R': 'Reserved',
    'E': 'Expired',
    'S': 'Sale Reported',
    'T': 'Triennial',
    'A': 'The Aircraft Registration Application',
    'X': 'Terminated',
    'N': 'None',
  };
  return map[code] || code || 'Unknown';
}

// ---------- Format FAA date (YYYYMMDD -> YYYY-MM-DD) ----------
function formatDate(raw) {
  if (!raw || raw.length !== 8) return raw || '';
  return `${raw.slice(0, 4)}-${raw.slice(4, 6)}-${raw.slice(6, 8)}`;
}

async function main() {
  console.log('Downloading FAA Releasable Aircraft Database...');
  const response = await fetch(FAA_URL);
  if (!response.ok) {
    throw new Error(`FAA download failed: ${response.status}`);
  }
  const buffer = Buffer.from(await response.arrayBuffer());
  console.log(`Downloaded ${(buffer.length / 1024 / 1024).toFixed(1)} MB`);

  const zip = new AdmZip(buffer);
  const entries = zip.getEntries();
  console.log('ZIP contains:', entries.map((e) => e.entryName).join(', '));

  // Find the master and reference files (names vary slightly by year)
  const masterEntry = entries.find((e) => /MASTER/i.test(e.entryName));
  const refEntry = entries.find((e) => /ACFTREF/i.test(e.entryName));
  if (!masterEntry || !refEntry) {
    throw new Error('Could not find MASTER.txt or ACFTREF.txt in ZIP');
  }

  // ---------- Build make/model lookup from ACFTREF ----------
  console.log('Parsing ACFTREF.txt...');
  const refLines = refEntry.getData().toString('utf8').split(/\r?\n/);
  const refHeader = parseCsvLine(refLines[0]);
  const codeIdx = refHeader.indexOf('CODE');
  const mfrIdx = refHeader.indexOf('MFR');
  const modelIdx = refHeader.indexOf('MODEL');

  const makeModelMap = new Map();
  for (let i = 1; i < refLines.length; i++) {
    if (!refLines[i].trim()) continue;
    const cols = parseCsvLine(refLines[i]);
    const code = (cols[codeIdx] || '').trim();
    const make = (cols[mfrIdx] || '').trim();
    const model = (cols[modelIdx] || '').trim();
    if (code) makeModelMap.set(code, { make, model });
  }
  console.log(`Loaded ${makeModelMap.size} aircraft make/model codes`);

  // ---------- Parse MASTER.txt and filter ----------
  console.log('Parsing MASTER.txt...');
  const accidentNumbers = getAccidentNNumbers();

  const masterLines = masterEntry.getData().toString('utf8').split(/\r?\n/);
  const header = parseCsvLine(masterLines[0]);

  // Locate column indices
  const idx = {
    nNumber: header.indexOf('N-NUMBER'),
    serial: header.indexOf('SERIAL NUMBER'),
    mfrCode: header.indexOf('MFR MDL CODE'),
    year: header.indexOf('YEAR MFR'),
    name: header.indexOf('NAME'),
    city: header.indexOf('CITY'),
    state: header.indexOf('STATE'),
    status: header.indexOf('STATUS CODE'),
    airworth: header.indexOf('AIR WORTH DATE'),
  };

  const sqlStatements = [];
  let matched = 0;

  for (let i = 1; i < masterLines.length; i++) {
    const line = masterLines[i];
    if (!line.trim()) continue;
    const cols = parseCsvLine(line);

    const rawN = (cols[idx.nNumber] || '').trim();
    if (!rawN) continue;
    const nNumber = 'N' + rawN.replace(/^N/i, '');

    if (!accidentNumbers.has(nNumber)) continue;

    matched++;
    const mfrCode = (cols[idx.mfrCode] || '').trim();
    const ref = makeModelMap.get(mfrCode) || { make: '', model: '' };
    const esc = (s) => (s || '').toString().replace(/'/g, "''");

    sqlStatements.push(
      `INSERT OR REPLACE INTO aircraft (n_number, serial_number, make, model, year, owner_name, owner_city, owner_state, registration_status, airworthiness_date) VALUES ('${esc(nNumber)}', '${esc(cols[idx.serial])}', '${esc(ref.make)}', '${esc(ref.model)}', ${parseInt(cols[idx.year]) || 'NULL'}, '${esc(cols[idx.name])}', '${esc(cols[idx.city])}', '${esc(cols[idx.state])}', '${esc(statusLabel(cols[idx.status]))}', '${esc(formatDate(cols[idx.airworth]))}');`
    );
  }

  console.log(`Matched ${matched} aircraft from FAA registry`);

  fs.writeFileSync('faa-import.sql', sqlStatements.join('\n'));
  console.log(`Wrote ${sqlStatements.length} SQL statements to faa-import.sql`);

  if (sqlStatements.length > 0) {
    console.log('=== SAMPLE SQL ===');
    console.log(sqlStatements[0]);
    console.log('=== END SAMPLE ===');
  }
}

main().catch((err) => {
  console.error('Fatal error:', err.message);
  process.exit(1);
});

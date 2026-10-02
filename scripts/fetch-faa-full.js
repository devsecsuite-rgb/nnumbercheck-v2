// scripts/fetch-faa-full.js
const fs = require('fs');
const AdmZip = require('adm-zip');

const FAA_URL = 'https://registry.faa.gov/database/ReleasableAircraft.zip';

// --- CSV Parser (same as before) ---
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

// --- Status Code Mapper (same as before) ---
function statusLabel(code) {
  const map = { 'V': 'Valid', 'R': 'Reserved', 'E': 'Expired', 'S': 'Sale Reported', 'T': 'Triennial', 'A': 'The Aircraft Registration Application', 'X': 'Terminated', 'N': 'None' };
  return map[code] || code || 'Unknown';
}

// --- Date Formatter (same as before) ---
function formatDate(raw) {
  if (!raw || raw.length !== 8) return raw || '';
  return `${raw.slice(0, 4)}-${raw.slice(4, 6)}-${raw.slice(6, 8)}`;
}

async function main() {
  console.log('Downloading full FAA Releasable Aircraft Database...');
  const response = await fetch(FAA_URL);
  if (!response.ok) {
    throw new Error(`FAA download failed: ${response.status}`);
  }
  const buffer = Buffer.from(await response.arrayBuffer());
  console.log(`Downloaded ${(buffer.length / 1024 / 1024).toFixed(1)} MB`);

  const zip = new AdmZip(buffer);
  const entries = zip.getEntries();

  const masterEntry = entries.find((e) => /MASTER/i.test(e.entryName));
  const refEntry = entries.find((e) => /ACFTREF/i.test(e.entryName));
  if (!masterEntry || !refEntry) {
    throw new Error('Could not find MASTER.txt or ACFTREF.txt in ZIP');
  }

  // --- Build the Make/Model map ---
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

  // --- Parse the ENTIRE MASTER.txt ---
  console.log('Parsing FULL MASTER.txt...');
  const masterLines = masterEntry.getData().toString('utf8').split(/\r?\n/);
  const header = parseCsvLine(masterLines[0]);

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
  let count = 0;

  for (let i = 1; i < masterLines.length; i++) {
    const line = masterLines[i];
    if (!line.trim()) continue;
    const cols = parseCsvLine(line);
    
    const rawN = (cols[idx.nNumber] || '').trim();
    if (!rawN) continue;

    const nNumber = 'N' + rawN.replace(/^N/i, '');
    const mfrCode = (cols[idx.mfrCode] || '').trim();
    const ref = makeModelMap.get(mfrCode) || { make: '', model: '' };
    const esc = (s) => (s || '').toString().replace(/'/g, "''");

    sqlStatements.push(
      `INSERT OR REPLACE INTO aircraft (n_number, serial_number, make, model, year, owner_name, owner_city, owner_state, registration_status, airworthiness_date) VALUES ('${esc(nNumber)}', '${esc(cols[idx.serial])}', '${esc(ref.make)}', '${esc(ref.model)}', ${parseInt(cols[idx.year]) || 'NULL'}, '${esc(cols[idx.name])}', '${esc(cols[idx.city])}', '${esc(cols[idx.state])}', '${esc(statusLabel(cols[idx.status]))}', '${esc(formatDate(cols[idx.airworth]))}');`
    );
    count++;
  }

  console.log(`Generated SQL for ${count} aircraft.`);

  // --- Chunk the output into multiple files to avoid import issues ---
  const CHUNK_SIZE = 50000; // 50,000 statements per file
  for (let i = 0; i < sqlStatements.length; i += CHUNK_SIZE) {
    const chunk = sqlStatements.slice(i, i + CHUNK_SIZE);
    const chunkNumber = Math.floor(i / CHUNK_SIZE) + 1;
    const filename = `faa-full-import-part${chunkNumber}.sql`;
    fs.writeFileSync(filename, chunk.join('\n'));
    console.log(`Wrote ${chunk.length} statements to ${filename}`);
  }
}

main().catch((err) => {
  console.error('Fatal error:', err.message);
  process.exit(1);
});

// scripts/inspect-docindex.js
const AdmZip = require('adm-zip');

const FAA_URL = 'https://registry.faa.gov/database/ReleasableAircraft.zip';

async function main() {
  console.log('Downloading FAA ZIP...');
  const response = await fetch(FAA_URL);
  if (!response.ok) throw new Error(`Download failed: ${response.status}`);
  const buffer = Buffer.from(await response.arrayBuffer());
  console.log(`Downloaded ${(buffer.length / 1024 / 1024).toFixed(1)} MB`);

  const zip = new AdmZip(buffer);
  const entries = zip.getEntries();
  console.log('Files in ZIP:', entries.map((e) => e.entryName).join(', '));

  const docEntry = entries.find((e) => /DOCINDEX/i.test(e.entryName));
  if (!docEntry) throw new Error('No DOCINDEX file found');

  const content = docEntry.getData().toString('utf8');
  const lines = content.split(/\r?\n/);

  console.log(`\nTotal lines: ${lines.length}`);
  console.log('\n=== FIRST 5 LINES (raw) ===');
  for (let i = 0; i < Math.min(5, lines.length); i++) {
    console.log(`[${i}] ${lines[i]}`);
  }

  console.log('\n=== HEADER ROW (parsed) ===');
  if (lines[0]) {
    const headers = lines[0].split(',').map((h) => h.trim());
    headers.forEach((h, idx) => console.log(`  Column ${idx}: "${h}"`));
  }

  console.log('\n=== FIRST 3 DATA ROWS (parsed) ===');
  for (let i = 1; i < Math.min(4, lines.length); i++) {
    if (!lines[i].trim()) continue;
    const cells = lines[i].split(',').map((c) => c.trim());
    console.log(`Row ${i}:`, cells);
  }
}

main().catch((err) => {
  console.error('Error:', err.message);
  process.exit(1);
});

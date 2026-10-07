// scripts/generate-aircraft-pages.js
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const LIMIT = 5000;
const BATCH_SIZE = 200;
const DATA_DIR = path.join(__dirname, '..', 'data');
const PAGES_FILE = path.join(DATA_DIR, 'aircraft-pages.json');

function queryD1(sql) {
  const escaped = sql.replace(/"/g, '\\"').replace(/\n/g, ' ').replace(/\s+/g, ' ').trim();
  const result = execSync(
    `npx wrangler d1 execute DB --command="${escaped}" --remote --json`,
    {
      encoding: 'utf-8',
      stdio: ['pipe', 'pipe', 'pipe'],
      maxBuffer: 100 * 1024 * 1024,
    }
  );
  const parsed = JSON.parse(result);
  return parsed[0]?.results || [];
}

async function main() {
  let topAircraft;

  if (fs.existsSync(PAGES_FILE)) {
    // Reuse the existing N-numbers list if the file is already present
    const nNumbers = JSON.parse(fs.readFileSync(PAGES_FILE, 'utf-8'));
    console.log(`Reusing existing list of ${nNumbers.length} N-numbers`);

    // Fetch aircraft data in batches (small reads)
    console.log('Fetching aircraft details...');
    const allAircraft = [];
    for (let i = 0; i < nNumbers.length; i += BATCH_SIZE) {
      const batch = nNumbers.slice(i, i + BATCH_SIZE);
      const inClause = batch.map((n) => `'${n}'`).join(',');
      const rows = queryD1(
        `SELECT n_number, make, model, year, serial_number, owner_name, owner_city, owner_state, registration_status, airworthiness_date FROM aircraft WHERE n_number IN (${inClause})`
      );
      allAircraft.push(...rows);
      process.stdout.write(`  Batch ${Math.floor(i / BATCH_SIZE) + 1}/${Math.ceil(nNumbers.length / BATCH_SIZE)}\r`);
    }
    console.log('\nAircraft details fetched');
    topAircraft = allAircraft;
  } else {
    console.log('Fetching top aircraft by accident count...');
    topAircraft = queryD1(`
      SELECT a.n_number, a.make, a.model, a.year, a.serial_number, a.owner_name,
             a.owner_city, a.owner_state, a.registration_status, a.airworthiness_date,
             COUNT(acc.id) AS accident_count
      FROM aircraft a
      INNER JOIN accidents acc ON a.n_number = acc.n_number
      GROUP BY a.n_number
      ORDER BY accident_count DESC, a.n_number ASC
      LIMIT ${LIMIT}
    `);
    console.log(`Got ${topAircraft.length} aircraft`);

    const nNumbers = topAircraft.map((a) => a.n_number);
    fs.mkdirSync(DATA_DIR, { recursive: true });
    fs.writeFileSync(PAGES_FILE, JSON.stringify(nNumbers, null, 2));
    console.log(`Wrote ${nNumbers.length} N-numbers to aircraft-pages.json`);
  }

  const nNumbers = topAircraft.map((a) => a.n_number);

  // Fetch accidents in batches
  console.log('Fetching accidents...');
  const allAccidents = {};
  for (let i = 0; i < nNumbers.length; i += BATCH_SIZE) {
    const batch = nNumbers.slice(i, i + BATCH_SIZE);
    const inClause = batch.map((n) => `'${n}'`).join(',');
    const accidents = queryD1(
      `SELECT * FROM accidents WHERE n_number IN (${inClause}) ORDER BY event_date DESC`
    );
    for (const acc of accidents) {
      if (!allAccidents[acc.n_number]) allAccidents[acc.n_number] = [];
      allAccidents[acc.n_number].push(acc);
    }
    process.stdout.write(`  Batch ${Math.floor(i / BATCH_SIZE) + 1}/${Math.ceil(nNumbers.length / BATCH_SIZE)}\r`);
  }
  console.log('\nAccidents fetched');

  // Fetch ALL directives in one query (this is the key optimization)
  console.log('Fetching all directives (single query)...');
  const allDirectives = queryD1(`SELECT * FROM directives ORDER BY effective_date DESC`);
  console.log(`Got ${allDirectives.length} directives`);

  // Match directives to aircraft in JavaScript (no D1 queries needed)
  console.log('Matching directives to aircraft...');
  const aircraftData = {};
  for (const ac of topAircraft) {
    const makeUpper = (ac.make || '').toUpperCase();
    const modelFirst = (ac.model || '').split(' ')[0].toUpperCase();
    const makeFirst = makeUpper.split(' ')[0];

    const matched = allDirectives.filter((d) => {
      const dirMfr = (d.manufacturer || '').toUpperCase();
      const dirModel = (d.model || '').toUpperCase();
      const dirTitle = (d.title || '').toUpperCase();

      const makeMatch =
        (makeFirst && dirMfr.includes(makeFirst)) ||
        (makeUpper && dirMfr.includes(makeUpper));

      if (!makeMatch) return false;

      const modelMatch =
        (modelFirst && dirModel.includes(modelFirst)) ||
        (modelFirst && dirTitle.includes(modelFirst));

      return modelMatch;
    });

    aircraftData[ac.n_number] = {
      aircraft: {
        n_number: ac.n_number,
        make: ac.make,
        model: ac.model,
        year: ac.year,
        serial_number: ac.serial_number,
        owner_name: ac.owner_name,
        owner_city: ac.owner_city,
        owner_state: ac.owner_state,
        registration_status: ac.registration_status,
        airworthiness_date: ac.airworthiness_date,
      },
      accidents: allAccidents[ac.n_number] || [],
      directives: matched.slice(0, 20),
    };
  }

  fs.writeFileSync(
    path.join(DATA_DIR, 'aircraft-data.json'),
    JSON.stringify(aircraftData)
  );
  const sizeMB = (fs.statSync(path.join(DATA_DIR, 'aircraft-data.json')).size / 1024 / 1024).toFixed(1);
  console.log(`Wrote ${Object.keys(aircraftData).length} aircraft to aircraft-data.json (${sizeMB} MB)`);
  console.log('\nDone. Now run:');
  console.log('  git add data/');
  console.log('  git commit -m "Add 5000 aircraft SEO pages data"');
  console.log('  git push');
}

main().catch((err) => {
  console.error('Error:', err.message);
  process.exit(1);
});

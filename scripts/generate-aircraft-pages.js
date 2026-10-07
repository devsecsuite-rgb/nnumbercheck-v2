// scripts/generate-aircraft-pages.js
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const LIMIT = 5000;
const BATCH_SIZE = 200;
const DATA_DIR = path.join(__dirname, '..', 'data');

function queryD1(sql) {
  const escaped = sql.replace(/"/g, '\\"').replace(/\n/g, ' ').replace(/\s+/g, ' ').trim();
  const result = execSync(
    `npx wrangler d1 execute DB --command="${escaped}" --remote --json`,
    { encoding: 'utf-8', stdio: ['pipe', 'pipe', 'pipe'] }
  );
  const parsed = JSON.parse(result);
  return parsed[0]?.results || [];
}

async function main() {
  console.log('Fetching top aircraft by accident count...');
  const topAircraft = queryD1(`
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
  fs.writeFileSync(
    path.join(DATA_DIR, 'aircraft-pages.json'),
    JSON.stringify(nNumbers, null, 2)
  );
  console.log(`Wrote ${nNumbers.length} N-numbers to aircraft-pages.json`);

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

  console.log('Fetching directives by make/model...');
  const makeModels = [...new Set(topAircraft.map((a) => `${a.make || ''}|${a.model || ''}`))];
  const directivesByMakeModel = {};
  let mmCount = 0;
  for (const mm of makeModels) {
    const [make, model] = mm.split('|');
    if (!make || !model) {
      directivesByMakeModel[mm] = [];
      continue;
    }
    const makeFirst = make.split(' ')[0].replace(/'/g, "''");
    const modelFirst = model.split(' ')[0].replace(/'/g, "''");
    const dirs = queryD1(
      `SELECT * FROM directives WHERE (manufacturer LIKE '%${makeFirst}%' OR manufacturer LIKE '%${make.replace(/'/g, "''")}%') AND (model LIKE '%${modelFirst}%' OR title LIKE '%${modelFirst}%') ORDER BY effective_date DESC LIMIT 20`
    );
    directivesByMakeModel[mm] = dirs;
    mmCount++;
    process.stdout.write(`  ${mmCount}/${makeModels.length} make/models\r`);
  }
  console.log('\nDirectives fetched');

  console.log('Building final data object...');
  const aircraftData = {};
  for (const ac of topAircraft) {
    const mm = `${ac.make || ''}|${ac.model || ''}`;
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
      directives: directivesByMakeModel[mm] || [],
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

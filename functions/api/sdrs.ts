// @ts-nocheck
// functions/api/sdrs.ts

const ATA_NAMES: Record<string, string> = {
  '05': 'Time Limits / Maintenance Checks',
  '11': 'Placards and Markings',
  '12': 'Servicing',
  '20': 'Standard Practices — Airframe',
  '21': 'Air Conditioning',
  '22': 'Auto Flight',
  '23': 'Communications',
  '24': 'Electrical Power',
  '25': 'Equipment / Furnishings',
  '26': 'Fire Protection',
  '27': 'Flight Controls',
  '28': 'Fuel',
  '29': 'Hydraulic Power',
  '30': 'Ice and Rain Protection',
  '31': 'Indicating / Recording Systems',
  '32': 'Landing Gear',
  '33': 'Lights',
  '34': 'Navigation',
  '35': 'Oxygen',
  '36': 'Pneumatic',
  '37': 'Vacuum',
  '38': 'Water / Waste',
  '39': 'Electrical — Electronic Panel',
  '49': 'Airborne Auxiliary Power',
  '51': 'Structures — General',
  '52': 'Doors',
  '53': 'Fuselage',
  '54': 'Nacelles / Pylons',
  '55': 'Stabilizers',
  '56': 'Windows',
  '57': 'Wings',
  '61': 'Propellers',
  '62': 'Main Rotor',
  '63': 'Main Rotor Drive',
  '64': 'Tail Rotor',
  '65': 'Tail Rotor Drive',
  '67': 'Rotors — Flight Control',
  '71': 'Power Plant',
  '72': 'Engine',
  '73': 'Engine Fuel and Control',
  '74': 'Ignition',
  '75': 'Air',
  '76': 'Engine Controls',
  '77': 'Engine Indicating',
  '78': 'Exhaust',
  '79': 'Oil',
  '80': 'Starting',
  '81': 'Turbines',
  '82': 'Water Injection',
  '83': 'Accessory Gearboxes',
  '84': 'Propulsion Augmentation',
  '85': 'Reciprocating Engine',
  '91': 'Charts',
  '92': 'Electrical System',
  '97': 'Wiring',
};

function ataName(code: string | null): string {
  if (!code) return 'Unknown system';
  const two = String(code).slice(0, 2);
  return ATA_NAMES[two] || `ATA ${two}`;
}

export const onRequestGet = async (context) => {
  const { request, env } = context;
  const url = new URL(request.url);
  const nNumber = (url.searchParams.get('n') || '').toUpperCase().trim();
  const make = (url.searchParams.get('make') || '').toUpperCase().trim();
  const model = (url.searchParams.get('model') || '').toUpperCase().trim();

  if (!nNumber && (!make || !model)) {
    return new Response(
      JSON.stringify({ error: 'Provide either n, or make+model' }),
      { status: 400, headers: { 'Content-Type': 'application/json' } }
    );
  }

  try {
    // --- Aircraft-specific query ---
    if (nNumber) {
      const { results } = await env.DB.prepare(
        `SELECT control_number, difficulty_date, aircraft_make, aircraft_model,
                aircraft_serial, part_name, part_number, ata_code,
                nature_of_condition, remarks, stage_of_operation
         FROM sdr_reports
         WHERE n_number = ?
         ORDER BY difficulty_date DESC
         LIMIT 50`
      )
        .bind(nNumber)
        .all();

      const rows = (results || []).map((r) => ({
        ...r,
        ata_name: ataName(r.ata_code),
      }));

      return new Response(
        JSON.stringify({
          n_number: nNumber,
          count: rows.length,
          reports: rows,
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // --- Model-level aggregate query ---
    const { results: summary } = await env.DB.prepare(
      `SELECT COUNT(*) AS total,
              MIN(difficulty_date) AS first_date,
              MAX(difficulty_date) AS last_date
       FROM sdr_reports
       WHERE aircraft_make = ? AND aircraft_model = ?`
    )
      .bind(make, model)
      .all();

    const { results: byAta } = await env.DB.prepare(
      `SELECT ata_code, COUNT(*) AS n
       FROM sdr_reports
       WHERE aircraft_make = ? AND aircraft_model = ?
       GROUP BY ata_code
       ORDER BY n DESC
       LIMIT 8`
    )
      .bind(make, model)
      .all();

    const { results: recent } = await env.DB.prepare(
      `SELECT control_number, difficulty_date, part_name, ata_code,
              nature_of_condition, substr(remarks, 1, 300) AS remarks
       FROM sdr_reports
       WHERE aircraft_make = ? AND aircraft_model = ?
       ORDER BY difficulty_date DESC
       LIMIT 5`
    )
      .bind(make, model)
      .all();

    return new Response(
      JSON.stringify({
        make,
        model,
        total: summary?.[0]?.total || 0,
        first_date: summary?.[0]?.first_date || null,
        last_date: summary?.[0]?.last_date || null,
        by_ata: (byAta || []).map((r) => ({
          ...r,
          ata_name: ataName(r.ata_code),
        })),
        recent: (recent || []).map((r) => ({
          ...r,
          ata_name: ataName(r.ata_code),
        })),
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({
        error: 'Database query failed',
        detail: String(err?.message || err),
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};

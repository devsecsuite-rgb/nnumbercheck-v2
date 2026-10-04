// @ts-nocheck
// functions/api/report.ts

export const onRequestGet = async (context) => {
  const { request, env } = context;
  const url = new URL(request.url);
  const nNumber = (url.searchParams.get('n') || '').toUpperCase();
  const txnId = url.searchParams.get('txn') || '';

  if (!nNumber) {
    return new Response(
      JSON.stringify({ error: 'Missing n parameter' }),
      { status: 400, headers: { 'Content-Type': 'application/json' } }
    );
  }

  try {
    // Match on n_number only — picks the most recent completed purchase
    const purchase = await env.DB.prepare(
      `SELECT * FROM purchases
       WHERE n_number = ?
         AND status = 'completed'
       ORDER BY id DESC
       LIMIT 1`
    )
      .bind(nNumber)
      .first();

    if (!purchase) {
      return new Response(
        JSON.stringify({ error: 'No completed purchase found for this aircraft.' }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const aircraft = await env.DB.prepare(
      'SELECT * FROM aircraft WHERE n_number = ?'
    )
      .bind(nNumber)
      .first();

    const { results: accidents } = await env.DB.prepare(
      'SELECT * FROM accidents WHERE n_number = ? ORDER BY event_date DESC'
    )
      .bind(nNumber)
      .all();

    // Fetch matching ADs — if we have the aircraft's make/model
    let directives = [];
    if (aircraft?.make || aircraft?.model) {
      const make = (aircraft.make || '').trim().split(' ')[0]; // "Cessna" from "Cessna Aircraft Company"
      const model = (aircraft.model || '').trim().split(' ')[0]; // "172" from "172S"

      const { results } = await env.DB.prepare(
        `SELECT * FROM directives
         WHERE (manufacturer LIKE ? OR manufacturer LIKE ?)
           AND (model LIKE ? OR title LIKE ?)
         ORDER BY effective_date DESC
         LIMIT 20`
      )
        .bind(`%${make}%`, `%${aircraft.make}%`, `%${model}%`, `%${model}%`)
        .all();
      directives = results || [];
    }

    return new Response(
      JSON.stringify({
        purchase,
        aircraft: {
          ...(aircraft || {
            n_number: nNumber,
            make: null,
            model: null,
            year: null,
            serial_number: null,
            owner_name: null,
            owner_city: null,
            owner_state: null,
            registration_status: 'Deregistered',
            airworthiness_date: null,
          }),
          accidents: accidents || [],
          directives,
        },
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({
        error: 'Database error',
        detail: String(err?.message || err),
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};

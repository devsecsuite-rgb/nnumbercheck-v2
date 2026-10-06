// @ts-nocheck
// functions/api/report.ts

export const onRequestGet = async (context: any) => {
  const { request, env } = context;
  const url = new URL(request.url);
  const nNumber = (url.searchParams.get('n') || '').toUpperCase();
  const txnId = url.searchParams.get('txn') || '';

  if (!nNumber || !txnId) {
    return new Response(
      JSON.stringify({ error: 'Missing n or txn parameter' }),
      { status: 400, headers: { 'Content-Type': 'application/json' } }
    );
  }

  try {
    // Require BOTH the N-number and a valid transaction ID that matches
    // a completed purchase in the database. This prevents anyone from
    // viewing a paid report without a legitimate purchase.
    const purchase = await env.DB.prepare(
      `SELECT * FROM purchases
       WHERE paddle_transaction_id = ?
         AND n_number = ?
         AND status = 'completed'
       LIMIT 1`
    )
      .bind(txnId, nNumber)
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

    let directives = [];
    if (aircraft?.make || aircraft?.model) {
      const make = (aircraft.make || '').trim().split(' ')[0];
      const model = (aircraft.model || '').trim().split(' ')[0];

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

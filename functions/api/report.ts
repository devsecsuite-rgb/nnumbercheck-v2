// @ts-nocheck
// functions/api/report.ts

export const onRequestGet = async (context) => {
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
    // Verify a completed purchase exists matching BOTH the transaction
    // and the N-number — prevents someone from paying for one aircraft
    // and viewing a different one.
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

    // Fetch aircraft + accidents
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

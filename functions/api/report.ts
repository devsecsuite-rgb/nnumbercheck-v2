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

            const serialNumber = aircraft.serial_number || '';

      // Match ADs and left-join serial ranges for applicability tagging
      const { results } = await env.DB.prepare(
        `SELECT
           d.*,
           r.serial_start,
           r.serial_end,
           r.serial_exceptions,
           CASE
             WHEN r.id IS NULL THEN 'verify'
             WHEN ? = '' THEN 'verify'
             WHEN ? >= r.serial_start AND ? <= r.serial_end THEN 'applies'
             ELSE 'not_applies'
           END AS applicability
         FROM directives d
         LEFT JOIN ad_serial_ranges r ON r.ad_number = d.ad_number
         WHERE (d.manufacturer LIKE ? OR d.manufacturer LIKE ?)
           AND (d.model LIKE ? OR d.title LIKE ?)
         ORDER BY d.effective_date DESC
         LIMIT 20`
      )
        .bind(
          serialNumber,
          serialNumber,
          serialNumber,
          `%${make}%`,
          `%${aircraft.make}%`,
          `%${model}%`,
          `%${model}%`
        )
        .all();
      directives = results || [];
    }

        // Fetch data-freshness timestamps
    const { results: metaRows } = await env.DB.prepare(
      'SELECT key, value FROM metadata'
    ).all();
    const metadata: Record<string, string> = {};
    (metaRows || []).forEach((row) => {
      metadata[row.key] = row.value;
    });

    return new Response(
      JSON.stringify({
        purchase,
        metadata,
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

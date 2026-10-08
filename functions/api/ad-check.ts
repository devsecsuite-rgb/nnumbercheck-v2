// @ts-nocheck
// functions/api/ad-check.ts

export const onRequestGet = async (context) => {
  const { request, env } = context;
  const url = new URL(request.url);
  const nNumber = (url.searchParams.get('n') || '').toUpperCase().trim();

  if (!nNumber) {
    return new Response(JSON.stringify({ error: 'N-Number required' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    // Get aircraft details
    const aircraft = await env.DB.prepare(
      'SELECT * FROM aircraft WHERE n_number = ?'
    )
      .bind(nNumber)
      .first();

    if (!aircraft) {
      return new Response(
        JSON.stringify({ error: 'Aircraft not found in FAA registry' }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const make = (aircraft.make || '').trim().split(' ')[0];
    const model = (aircraft.model || '').trim().split(' ')[0];
    const serialNumber = (aircraft.serial_number || '').trim();

    // Fetch all matching ADs (by make/model)
    const { results: directives } = await env.DB.prepare(
      `SELECT * FROM directives
       WHERE (manufacturer LIKE ? OR manufacturer LIKE ?)
         AND (model LIKE ? OR title LIKE ?)
       ORDER BY effective_date DESC
       LIMIT 50`
    )
      .bind(`%${make}%`, `%${aircraft.make}%`, `%${model}%`, `%${model}%`)
      .all();

    // Fetch serial ranges for these ADs
    const adNumbers = (directives || []).map((d) => d.ad_number);
    let serialRanges = [];

    if (adNumbers.length > 0) {
      const placeholders = adNumbers.map(() => '?').join(',');
      const { results } = await env.DB.prepare(
        `SELECT * FROM ad_serial_ranges WHERE ad_number IN (${placeholders})`
      )
        .bind(...adNumbers)
        .all();
      serialRanges = results || [];
    }

    // Build a lookup map: ad_number -> serial range row
    const rangeMap = new Map();
    for (const r of serialRanges) {
      rangeMap.set(r.ad_number, r);
    }

    // Apply applicability logic to each AD
    const enrichedDirectives = (directives || []).map((ad) => {
      const range = rangeMap.get(ad.ad_number);

      let applicability = 'verify'; // default: manual verification needed

      if (range) {
        if (!serialNumber) {
          applicability = 'verify';
        } else {
          const sn = serialNumber.toUpperCase();
          const start = (range.serial_start || '').toUpperCase();
          const end = (range.serial_end || '').toUpperCase();
          const exceptions = (range.serial_exceptions || '')
            .toUpperCase()
            .split(',')
            .map((s) => s.trim());

          if (exceptions.includes(sn)) {
            applicability = 'not_applies';
          } else if (
            (!start || sn >= start) &&
            (!end || sn <= end)
          ) {
            applicability = 'applies';
          } else if (start && end && (sn < start || sn > end)) {
            applicability = 'not_applies';
          }
        }
      }

      return {
        ...ad,
        applicability,
        serial_start: range?.serial_start || null,
        serial_end: range?.serial_end || null,
        serial_exceptions: range?.serial_exceptions || null,
      };
    });

    // Counts for summary
    const appliesCount = enrichedDirectives.filter(
      (d) => d.applicability === 'applies'
    ).length;
    const verifyCount = enrichedDirectives.filter(
      (d) => d.applicability === 'verify'
    ).length;

    return new Response(
      JSON.stringify({
        aircraft: {
          n_number: aircraft.n_number,
          make: aircraft.make,
          model: aircraft.model,
          year: aircraft.year,
          serial_number: aircraft.serial_number,
          owner_name: aircraft.owner_name,
          registration_status: aircraft.registration_status,
        },
        directives: enrichedDirectives,
        summary: {
          total: enrichedDirectives.length,
          applies: appliesCount,
          verify: verifyCount,
        },
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

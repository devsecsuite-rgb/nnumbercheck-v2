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
    const rawModel = (aircraft.model || '').trim();
    const model = rawModel.split(' ')[0];
    const serialNumber = (aircraft.serial_number || '').trim();

    // Numeric part of the model (e.g. "172R" -> "172") for broader AD matching
    const modelNumber = (rawModel.match(/\d+/)?.[0]) || model;

    // --- Query 1: ADs with serial-range data (produce Applies / Does not apply) ---
    const { results: rangedDirectives } = await env.DB.prepare(
      `SELECT d.id, d.ad_number, d.title, d.manufacturer, d.model,
              d.effective_date, d.abstract, d.document_url,
              r.serial_start, r.serial_end, r.serial_exceptions
       FROM ad_serial_ranges r
       JOIN directives d ON d.ad_number = r.ad_number
       WHERE r.make LIKE ? AND r.model LIKE ?
       ORDER BY d.effective_date DESC
       LIMIT 50`
    )
      .bind(`%${make}%`, `%${modelNumber}%`)
      .all();

    // --- Query 2: ADs WITHOUT range data that mention this model (produce Verify) ---
const { results: verifyDirectives } = await env.DB.prepare(
  `SELECT * FROM directives
   WHERE (manufacturer LIKE ? OR title LIKE ?)
     AND abstract LIKE ?
     AND ad_number NOT IN (
       SELECT ad_number FROM ad_serial_ranges
       WHERE make LIKE ? AND model LIKE ?
     )
   ORDER BY effective_date DESC
   LIMIT 30`
)
  .bind(`%${make}%`, `%${make}%`, `%${modelNumber}%`, `%${make}%`, `%${modelNumber}%`)
  .all();

    const directives = [...(rangedDirectives || []), ...(verifyDirectives || [])];

    // --- Applicability logic ---
    const enrichedDirectives = directives.map((ad) => {
      const sn = serialNumber.toUpperCase();
      const start = (ad.serial_start || '').toUpperCase().trim();
      const end = (ad.serial_end || '').toUpperCase().trim();
      const exceptions = (ad.serial_exceptions || '')
        .toUpperCase()
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);

            // Compare serials numerically when both sides are pure digits,
      // otherwise fall back to string comparison. This avoids the
      // "10000" < "2912" bug where new 5-digit serials sort below
      // 4-digit serials lexicographically.
      const cmpSerial = (a: string, b: string) => {
        const bothNumeric = /^\d+$/.test(a) && /^\d+$/.test(b);
        if (bothNumeric) {
          return parseInt(a, 10) - parseInt(b, 10);
        }
        return a < b ? -1 : a > b ? 1 : 0;
      };

      let applicability = 'verify';

      const hasRange = Boolean(start || end);

      if (!hasRange) {
        applicability = 'verify';
      } else if (!sn) {
        applicability = 'verify';
      } else if (exceptions.includes(sn)) {
        applicability = 'not_applies';
      } else if (
        (!start || cmpSerial(sn, start) >= 0) &&
        (!end || cmpSerial(sn, end) <= 0)
      ) {
        applicability = 'applies';
      } else {
        applicability = 'not_applies';
      }

      return {
        ...ad,
        applicability,
        serial_start: ad.serial_start || null,
        serial_end: ad.serial_end || null,
        serial_exceptions: ad.serial_exceptions || null,
      };
    });

    // --- Summary counts ---
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

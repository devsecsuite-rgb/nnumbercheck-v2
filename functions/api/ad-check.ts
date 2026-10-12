// @ts-nocheck
// functions/api/ad-check.ts

// Map modern owner names to their legacy manufacturer patterns.
// FAA registry stores aircraft under the current type certificate holder
// (e.g. "TEXTRON AVIATION INC"), but historical ADs are filed under the
// original manufacturer ("Cessna Aircraft Company"). Without this map,
// modern Cessna/Beechcraft lookups miss most of their applicable ADs.
const LEGACY_MAKE_MAP: Record<string, string[]> = {
  TEXTRON:    ['Cessna', 'Textron', 'Beechcraft', 'Hawker'],
  HAWKER:     ['Beechcraft', 'Hawker', 'Raytheon'],
  RAYTHEON:   ['Beechcraft', 'Raytheon', 'Hawker'],
  BEECH:      ['Beechcraft', 'Beech', 'Hawker', 'Raytheon'],
  BEECHCRAFT: ['Beechcraft', 'Beech', 'Hawker', 'Raytheon'],
  CESSNA:     ['Cessna', 'Textron'],
  CIRRUS:     ['Cirrus'],
  PIPER:      ['Piper'],
  MOONEY:     ['Mooney'],
};

function buildOrLike(column: string, count: number): string {
  return Array(count).fill(`${column} LIKE ?`).join(' OR ');
}

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

    const makeFirstWord = (aircraft.make || '').trim().split(' ')[0].toUpperCase();
    const rawModel = (aircraft.model || '').trim();
    const model = rawModel.split(' ')[0];
    const serialNumber = (aircraft.serial_number || '').trim();
    const modelNumber = (rawModel.match(/\d+/)?.[0]) || model;

    // Expand the make to include historical manufacturers
    const makePatterns = LEGACY_MAKE_MAP[makeFirstWord] || [makeFirstWord];
    const makeLikes = makePatterns.map((p) => `%${p}%`);

    // --- Query 1: ADs with serial-range data ---
    const q1Sql = `
      SELECT d.id, d.ad_number, d.title, d.manufacturer, d.model,
             d.effective_date, d.abstract, d.document_url,
             r.serial_start, r.serial_end, r.serial_exceptions
      FROM ad_serial_ranges r
      JOIN directives d ON d.ad_number = r.ad_number
      WHERE (${buildOrLike('r.make', makePatterns.length)})
        AND r.model LIKE ?
      ORDER BY d.effective_date DESC
      LIMIT 50
    `;
    const q1Binds = [...makeLikes, `%${modelNumber}%`];

    const { results: rangedDirectives } = await env.DB.prepare(q1Sql)
      .bind(...q1Binds)
      .all();

    // --- Query 2: ADs WITHOUT range data (Verify bucket) ---
    const q2Sql = `
      SELECT * FROM directives
      WHERE (
        ${buildOrLike('manufacturer', makePatterns.length)}
        OR ${buildOrLike('title', makePatterns.length)}
      )
        AND abstract LIKE ?
        AND ad_number NOT IN (
          SELECT ad_number FROM ad_serial_ranges
          WHERE (${buildOrLike('make', makePatterns.length)})
            AND model LIKE ?
        )
      ORDER BY effective_date DESC
      LIMIT 30
    `;
    const q2Binds = [
      ...makeLikes,               // manufacturer
      ...makeLikes,               // title
      `%${modelNumber}%`,         // abstract
      ...makeLikes,               // subquery ad_serial_ranges.make
      `%${modelNumber}%`,         // subquery ad_serial_ranges.model
    ];

    const { results: verifyDirectives } = await env.DB.prepare(q2Sql)
      .bind(...q2Binds)
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

      const cmpSerial = (a: string, b: string) => {
        const bothNumeric = /^\d+$/.test(a) && /^\d+$/.test(b);
        if (bothNumeric) return parseInt(a, 10) - parseInt(b, 10);
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

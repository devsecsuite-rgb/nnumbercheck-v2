// @ts-nocheck
// functions/api/aircraft/[number].ts

export const onRequestGet = async (context) => {
  const nNumber = context.params.number;

  if (!nNumber) {
    return new Response(JSON.stringify({ error: 'N-Number required' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const normalized = nNumber.toUpperCase();

  try {
    const aircraft = await context.env.DB.prepare(
      'SELECT * FROM aircraft WHERE n_number = ?'
    )
      .bind(normalized)
      .first();

    const { results: accidents } = await context.env.DB.prepare(
      'SELECT * FROM accidents WHERE n_number = ? ORDER BY event_date DESC'
    )
      .bind(normalized)
      .all();

    // Fetch applicable ADs so the free page can preview the first one
    let directives = [];
    if (aircraft?.make || aircraft?.model) {
      const make = (aircraft.make || '').trim().split(' ')[0];
      const model = (aircraft.model || '').trim().split(' ')[0];

      const { results } = await context.env.DB.prepare(
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

    const hasAircraft = !!aircraft;
    const hasAccidents = accidents && accidents.length > 0;
    const hasDirectives = directives && directives.length > 0;

    if (!hasAircraft && !hasAccidents && !hasDirectives) {
      return new Response(JSON.stringify({ error: 'Aircraft not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const responseData = {
      n_number: normalized,
      serial_number: aircraft?.serial_number || null,
      make: aircraft?.make || null,
      model: aircraft?.model || null,
      year: aircraft?.year || null,
      owner_name: aircraft?.owner_name || null,
      owner_city: aircraft?.owner_city || null,
      owner_state: aircraft?.owner_state || null,
      registration_status: aircraft?.registration_status || 'Deregistered',
      airworthiness_date: aircraft?.airworthiness_date || null,
      deregistered: !hasAircraft,
      accidents: accidents || [],
      directives,
    };

    return new Response(JSON.stringify(responseData), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return new Response(
      JSON.stringify({ error: 'Database query failed', detail: String(error) }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};

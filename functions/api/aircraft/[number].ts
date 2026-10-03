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
    // Query aircraft (may be null for deregistered aircraft)
    const aircraft = await context.env.DB.prepare(
      'SELECT * FROM aircraft WHERE n_number = ?'
    ).bind(normalized).first();

    // Query accidents (may be empty)
    const { results: accidents } = await context.env.DB.prepare(
      'SELECT * FROM accidents WHERE n_number = ? ORDER BY event_date DESC'
    ).bind(normalized).all();

    const hasAircraft = !!aircraft;
    const hasAccidents = accidents && accidents.length > 0;

    // If neither exists, return 404
    if (!hasAircraft && !hasAccidents) {
      return new Response(JSON.stringify({ error: 'Aircraft not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Build response — use aircraft data if available, otherwise stub from accidents
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

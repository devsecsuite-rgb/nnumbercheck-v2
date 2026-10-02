// functions/api/aircraft/[number].ts
export const onRequestGet = async (context) => {
  const nNumber = context.params.number;

  if (!nNumber) {
    return new Response(JSON.stringify({ error: 'N-Number required' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    // Query the aircraft table
    const aircraft = await context.env.DB.prepare(
      'SELECT * FROM aircraft WHERE n_number = ?'
    ).bind(nNumber.toUpperCase()).first();

    if (!aircraft) {
      return new Response(JSON.stringify({ error: 'Aircraft not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Query the accidents table for this aircraft
    const { results: accidents } = await context.env.DB.prepare(
      'SELECT * FROM accidents WHERE n_number = ? ORDER BY event_date DESC'
    ).bind(nNumber.toUpperCase()).all();

    // Combine the results
    const responseData = {
      ...aircraft,
      accidents: accidents || [],
    };

    return new Response(JSON.stringify(responseData), {
      headers: { 'Content-Type': 'application/json' },
    });

  } catch (error) {
    return new Response(JSON.stringify({ error: 'Database query failed' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};

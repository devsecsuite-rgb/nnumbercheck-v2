// @ts-nocheck
// functions/api/checkout.ts

// Strip invisible characters (whitespace, literal \n, \r, tabs) that often
// get pasted into environment variables and corrupt API authentication.
function cleanEnv(value: string | undefined | null): string {
  if (!value) return '';
  return value
    .replace(/^(?:\\n|\\r|\\t|\s)+/g, '')
    .replace(/(?:\\n|\\r|\\t|\s)+$/g, '')
    .trim();
}

export const onRequestPost = async (context) => {
  const { request, env } = context;

  try {
    const body = await request.json();
    const nNumber = body.nNumber;

    if (!nNumber) {
      return new Response(JSON.stringify({ error: 'N-Number required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Clean all environment variables — invisible characters in any of these
    // will cause Paddle to reject the request with a 403.
    const apiKey = cleanEnv(env.PADDLE_API_KEY);
    const priceId = cleanEnv(env.PADDLE_PRICE_ID);
    const environment = cleanEnv(env.PADDLE_ENVIRONMENT) || 'production';

    // Diagnostic logs — view these in Cloudflare Functions logs
    console.log('=== CHECKOUT DEBUG ===');
    console.log('Environment:', environment);
    console.log('API key length:', apiKey.length);
    console.log('API key starts with:', apiKey.substring(0, 25));
    console.log('API key ends with:', apiKey.substring(apiKey.length - 8));
    console.log('Price ID:', priceId);
    console.log('N-Number:', nNumber);
    console.log('======================');

    // Determine the correct API base URL based on environment
    const apiBase =
      environment === 'sandbox'
        ? 'https://sandbox-api.paddle.com'
        : 'https://api.paddle.com';

    // Call Paddle's API directly with fetch
    const response = await fetch(`${apiBase}/transactions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        items: [
          {
            price_id: priceId,
            quantity: 1,
          },
        ],
        custom_data: {
          n_number: nNumber,
        },
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('Paddle API error:', JSON.stringify(data));
      return new Response(
        JSON.stringify({
          error: data.error?.detail || 'Paddle API error',
          code: data.error?.code,
          status: response.status,
        }),
        {
          status: response.status,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    return new Response(
      JSON.stringify({ transactionId: data.data.id }),
      {
        headers: { 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Checkout error:', error);
    return new Response(
      JSON.stringify({ error: String(error?.message || error) }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};

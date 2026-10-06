// @ts-nocheck
// functions/api/checkout.ts

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

    const rawKey = env.PADDLE_API_KEY || '';
    const apiKey = cleanEnv(rawKey);
    const priceId = cleanEnv(env.PADDLE_PRICE_ID);
    const environment = cleanEnv(env.PADDLE_ENVIRONMENT) || 'production';

    // Diagnostic info — returned in every response so we can debug
    // without needing Cloudflare logs.
    const diagnostics = {
      environment,
      rawKeyLength: rawKey.length,
      cleanKeyLength: apiKey.length,
      keyPrefix: apiKey.substring(0, 22),
      keySuffix: apiKey.substring(apiKey.length - 6),
      priceId: priceId,
      rawKeyHasNewline: /\\n|\n/.test(rawKey),
      rawKeyHasSpace: /\s/.test(rawKey),
    };

    const apiBase =
      environment === 'sandbox'
        ? 'https://sandbox-api.paddle.com'
        : 'https://api.paddle.com';

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
      return new Response(
        JSON.stringify({
          error: data.error?.detail || 'Paddle API error',
          code: data.error?.code,
          status: response.status,
          diagnostics,
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
    return new Response(
      JSON.stringify({
        error: String(error?.message || error),
        diagnostics: {
          note: 'Exception thrown before or during fetch',
        },
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};

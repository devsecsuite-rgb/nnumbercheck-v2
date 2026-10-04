// @ts-nocheck
// functions/api/checkout.ts

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

    // Determine the correct API base URL based on environment
    const apiBase = env.PADDLE_ENVIRONMENT === 'sandbox'
      ? 'https://sandbox-api.paddle.com'
      : 'https://api.paddle.com';

    // Call Paddle's API directly with fetch (no SDK needed)
    const response = await fetch(`${apiBase}/transactions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${env.PADDLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        items: [
          {
            price_id: env.PADDLE_PRICE_ID, // Paddle API uses snake_case
            quantity: 1,
          },
        ],
        custom_data: {
          n_number: nNumber, // Paddle API uses snake_case
        },
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      // Return the detailed error from Paddle
      return new Response(JSON.stringify({ 
        error: data.error?.detail || 'Paddle API error',
        code: data.error?.code,
      }), {
        status: response.status,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Return the transaction ID for the frontend to use
    return new Response(JSON.stringify({ 
      transactionId: data.data.id 
    }), {
      headers: { 'Content-Type': 'application/json' },
    });

  } catch (error) {
    return new Response(
      JSON.stringify({ error: String(error?.message || error) }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};

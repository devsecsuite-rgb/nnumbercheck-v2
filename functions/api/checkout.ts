// @ts-nocheck
// functions/api/checkout.ts

function cleanEnv(value) {
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

    const stripeKey = cleanEnv(env.STRIPE_SECRET_KEY);
    const priceId = cleanEnv(env.STRIPE_PRICE_ID);

    const origin = new URL(request.url).origin;

    const response = await fetch('https://api.stripe.com/v1/checkout/sessions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${stripeKey}`,
        'Content-Type': 'application/x-www-form-urlencoded',
        'Stripe-Version': '2024-11-20.acacia',
      },
      body: new URLSearchParams({
        'mode': 'payment',
        'line_items[0][price]': priceId,
        'line_items[0][quantity]': '1',
        'success_url': `${origin}/report?n=${nNumber}&_ptxn={CHECKOUT_SESSION_ID}`,
        'cancel_url': `${origin}/n?number=${nNumber}`,
        'metadata[n_number]': nNumber,
        'adaptive_pricing[enabled]': 'true',
      }).toString(),
    });

    const data = await response.json();

    if (!response.ok) {
      return new Response(
        JSON.stringify({
          error: data.error?.message || 'Stripe API error',
          code: data.error?.code,
        }),
        { status: response.status, headers: { 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ url: data.url }),
      { headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: String(error?.message || error) }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};

// functions/api/checkout.ts
import Stripe from 'stripe';

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

    // Cloudflare Workers require the Fetch HTTP client for Stripe
    const stripe = new Stripe(env.STRIPE_SECRET_KEY, {
      httpClient: Stripe.createFetchHttpClient(),
    });

    const origin = new URL(request.url).origin;

    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      line_items: [
        {
          price: env.STRIPE_PRICE_ID, // set this as an env var too
          quantity: 1,
        },
      ],
      success_url: `${origin}/report?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/n?number=${nNumber}`,
      metadata: {
        nNumber: nNumber,
      },
    });

    return new Response(JSON.stringify({ url: session.url }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};

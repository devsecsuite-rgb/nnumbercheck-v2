// @ts-nocheck
// functions/api/checkout.ts
import { Paddle, Environment } from '@paddle/paddle-node-sdk';

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

    const paddle = new Paddle(env.PADDLE_API_KEY, {
      environment:
        env.PADDLE_ENVIRONMENT === 'sandbox'
          ? Environment.sandbox
          : Environment.production,
    });

    const transaction = await paddle.transactions.create({
      items: [
        {
          priceId: env.PADDLE_PRICE_ID,
          quantity: 1,
        },
      ],
      customData: {
        n_number: nNumber,
      },
    });

    return new Response(JSON.stringify({ transactionId: transaction.id }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return new Response(
      JSON.stringify({ error: String(error?.message || error) }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};

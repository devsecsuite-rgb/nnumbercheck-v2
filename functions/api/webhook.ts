// @ts-nocheck
// functions/api/webhook.ts

async function verifyStripeSignature(payload, header, secret) {
  const parts = header.split(',').map((p) => p.trim());
  const timestamp = parts.find((p) => p.startsWith('t='))?.split('=')[1];
  const signature = parts.find((p) => p.startsWith('v1='))?.split('=')[1];
  if (!timestamp || !signature) return false;

  const signedPayload = `${timestamp}.${payload}`;
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  const sigBuffer = await crypto.subtle.sign('HMAC', key, encoder.encode(signedPayload));
  const computed = Array.from(new Uint8Array(sigBuffer))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');

  if (computed.length !== signature.length) return false;
  let diff = 0;
  for (let i = 0; i < computed.length; i++) {
    diff |= computed.charCodeAt(i) ^ signature.charCodeAt(i);
  }
  return diff === 0;
}

export const onRequestPost = async (context) => {
  const { request, env } = context;

  try {
    const rawBody = await request.text();
    const signature = request.headers.get('stripe-signature');

    if (!signature) {
      return new Response('Missing signature', { status: 401 });
    }

    const valid = await verifyStripeSignature(
      rawBody,
      signature,
      (env.STRIPE_WEBHOOK_SECRET || '').trim()
    );
    if (!valid) {
      return new Response('Invalid signature', { status: 401 });
    }

    const event = JSON.parse(rawBody);

    if (event.type === 'checkout.session.completed') {
      const session = event.data.object;
      const nNumber = session.metadata?.n_number || null;
      const transactionId = session.id;
      const customerEmail = session.customer_details?.email || null;
      const amountCents = session.amount_total || null;
      const currency = (session.currency || 'usd').toUpperCase();

      if (nNumber) {
        await env.DB.prepare(
          `INSERT OR IGNORE INTO purchases
           (paddle_transaction_id, paddle_customer_id, customer_email, n_number, amount_cents, currency, status)
           VALUES (?, ?, ?, ?, ?, ?, 'completed')`
        )
          .bind(
            transactionId,
            session.customer,
            customerEmail,
            nNumber,
            amountCents,
            currency
          )
          .run();
      }
    }

    return new Response(JSON.stringify({ received: true }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    return new Response(
      JSON.stringify({ error: String(err?.message || err) }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};

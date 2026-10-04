// @ts-nocheck
// functions/api/webhook.ts

// Paddle signs webhooks with an HMAC-SHA256 signature using
// the notification secret. We verify it with Web Crypto, which
// is available on Cloudflare Workers.
async function verifySignature(
  rawBody: string,
  signatureHeader: string,
  secret: string
): Promise<boolean> {
  // The header format is: ts=1234567890;h1=abc123...
  const parts = signatureHeader.split(';');
  const ts = parts.find((p) => p.startsWith('ts='))?.slice(3);
  const h1 = parts.find((p) => p.startsWith('h1='))?.slice(3);
  if (!ts || !h1) return false;

  const signedPayload = `${ts}:${rawBody}`;
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  const sigBuffer = await crypto.subtle.sign(
    'HMAC',
    key,
    encoder.encode(signedPayload)
  );
  const sigArray = Array.from(new Uint8Array(sigBuffer));
  const computed =
    sigArray.map((b) => b.toString(16).padStart(2, '0')).join('');

  // Constant-time comparison
  if (computed.length !== h1.length) return false;
  let diff = 0;
  for (let i = 0; i < computed.length; i++) {
    diff |= computed.charCodeAt(i) ^ h1.charCodeAt(i);
  }
  return diff === 0;
}

export const onRequestPost = async (context) => {
  const { request, env } = context;

  const rawBody = await request.text();
  const signature = request.headers.get('paddle-signature');

  if (!signature) {
    return new Response('Missing signature', { status: 401 });
  }

  const valid = await verifySignature(
    rawBody,
    signature,
    env.PADDLE_WEBHOOK_SECRET
  );
  if (!valid) {
    return new Response('Invalid signature', { status: 401 });
  }

  let event;
  try {
    event = JSON.parse(rawBody);
  } catch {
    return new Response('Invalid JSON', { status: 400 });
  }

  // Paddle sends transaction.completed when a payment clears
  if (event.event_type === 'transaction.completed') {
    const txn = event.data;
    const transactionId = txn.id;
    const nNumber = txn.custom_data?.n_number || null;
    const customerEmail = txn.customer?.email || null;
    const customerId = txn.customer_id || null;
    const amountCents = txn.details?.totals?.grand_total || null;
    const currency = txn.currency_code || 'USD';

    if (!nNumber) {
      console.error('No n_number in transaction custom_data:', transactionId);
      return new Response(JSON.stringify({ received: true }), {
        headers: { 'Content-Type': 'application/json' },
      });
    }

    try {
      // INSERT OR IGNORE uses the UNIQUE constraint on
      // paddle_transaction_id to guarantee idempotency — even
      // if Paddle retries the webhook, we only store it once.
      await env.DB.prepare(
        `INSERT OR IGNORE INTO purchases
         (paddle_transaction_id, paddle_customer_id, customer_email, n_number, amount_cents, currency, status)
         VALUES (?, ?, ?, ?, ?, ?, 'completed')`
      )
        .bind(
          transactionId,
          customerId,
          customerEmail,
          nNumber,
          amountCents,
          currency
        )
        .run();

      console.log(
        `Purchase recorded: ${transactionId} for ${nNumber} (${customerEmail})`
      );
    } catch (err) {
      console.error('Failed to record purchase:', err);
      return new Response('Database error', { status: 500 });
    }
  }

  return new Response(JSON.stringify({ received: true }), {
    headers: { 'Content-Type': 'application/json' },
  });
};

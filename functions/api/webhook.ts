// @ts-nocheck
// functions/api/webhook.ts

// Paddle signs webhooks with an HMAC-SHA256 signature using the
// notification secret. We verify it with Web Crypto, which is
// available on Cloudflare Workers.
async function verifySignature(
  rawBody: string,
  signatureHeader: string,
  secret: string
): Promise<boolean> {
  // Header format: ts=1234567890;h1=abc123...
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
  const computed = sigArray
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');

  if (computed.length !== h1.length) return false;
  let diff = 0;
  for (let i = 0; i < computed.length; i++) {
    diff |= computed.charCodeAt(i) ^ h1.charCodeAt(i);
  }
  return diff === 0;
}

export const onRequestPost = async (context) => {
  const { request, env } = context;

  try {
    const rawBody = await request.text();
    const signature = request.headers.get('paddle-signature');

    if (!signature) {
      return new Response(
        JSON.stringify({ error: 'Missing signature header' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const valid = await verifySignature(
      rawBody,
      signature,
      env.PADDLE_WEBHOOK_SECRET
    );

    if (!valid) {
      return new Response(
        JSON.stringify({ error: 'Invalid signature' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }

    let event;
    try {
      event = JSON.parse(rawBody);
    } catch {
      return new Response(
        JSON.stringify({ error: 'Invalid JSON body' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    console.log('Event type:', event.event_type);

    if (event.event_type === 'transaction.completed') {
      const txn = event.data;
      const transactionId = txn.id;
      const nNumber = txn.custom_data?.n_number || null;
      const customerEmail = txn.customer?.email || null;
      const customerId = txn.customer_id || null;
      const amountCents = txn.details?.totals?.grand_total || null;
      const currency = txn.currency_code || 'USD';

      console.log('Transaction:', transactionId, 'N-Number:', nNumber, 'Email:', customerEmail);

      if (!nNumber) {
        // Test simulations often lack custom_data — log and return success
        console.log('No n_number in custom_data — likely a test event');
        return new Response(
          JSON.stringify({ received: true, note: 'No n_number' }),
          { status: 200, headers: { 'Content-Type': 'application/json' } }
        );
      }

      try {
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

        console.log('Purchase recorded successfully');
      } catch (dbErr) {
        console.error('DB insert failed:', dbErr);
        return new Response(
          JSON.stringify({
            error: 'Database error',
            detail: String(dbErr?.message || dbErr),
          }),
          { status: 500, headers: { 'Content-Type': 'application/json' } }
        );
      }
    }

    return new Response(JSON.stringify({ received: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('Unhandled webhook error:', err);
    return new Response(
      JSON.stringify({
        error: 'Unhandled error',
        detail: String(err?.message || err),
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};

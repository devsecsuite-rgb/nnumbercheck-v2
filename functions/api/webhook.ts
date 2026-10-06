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

function buildEmailHtml({ nNumber, reportUrl, transactionId, amount, email }) {
  const amountDisplay = amount
    ? `$${(amount / 100).toFixed(2)}`
    : 'your purchase';

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
</head>
<body style="margin:0;padding:0;background:#f1f5f9;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <table role="presentation" style="width:100%;background:#f1f5f9;padding:40px 0;">
    <tr>
      <td align="center">
        <table role="presentation" style="max-width:560px;background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.1);">
          <tr>
            <td style="background:#0284c7;padding:24px 32px;">
              <h1 style="margin:0;color:#ffffff;font-size:20px;font-weight:700;">NNumberCheck</h1>
            </td>
          </tr>
          <tr>
            <td style="padding:32px;">
              <h2 style="margin:0 0 16px;color:#0f172a;font-size:22px;">Thank you for your purchase</h2>
              <p style="margin:0 0 24px;color:#475569;font-size:15px;line-height:1.6;">
                Your full history report for aircraft <strong style="font-family:monospace;color:#0f172a;">${nNumber}</strong> is ready.
              </p>

              <table role="presentation" style="width:100%;background:#f8fafc;border-radius:8px;padding:20px;margin:0 0 24px;">
                <tr>
                  <td style="padding:6px 0;color:#64748b;font-size:13px;">N-Number</td>
                  <td style="padding:6px 0;color:#0f172a;font-size:13px;font-family:monospace;text-align:right;"><strong>${nNumber}</strong></td>
                </tr>
                <tr>
                  <td style="padding:6px 0;color:#64748b;font-size:13px;">Amount Paid</td>
                  <td style="padding:6px 0;color:#0f172a;font-size:13px;text-align:right;"><strong>${amountDisplay}</strong></td>
                </tr>
                <tr>
                  <td style="padding:6px 0;color:#64748b;font-size:13px;">Transaction ID</td>
                  <td style="padding:6px 0;color:#64748b;font-size:11px;font-family:monospace;text-align:right;">${transactionId}</td>
                </tr>
              </table>

              <table role="presentation" style="width:100%;margin:0 0 24px;">
                <tr>
                  <td align="center">
                    <a href="${reportUrl}" style="display:inline-block;background:#0284c7;color:#ffffff;text-decoration:none;padding:14px 32px;border-radius:8px;font-weight:600;font-size:15px;">
                      View Your Report →
                    </a>
                  </td>
                </tr>
              </table>

              <p style="margin:0 0 16px;color:#64748b;font-size:13px;line-height:1.6;">
                <strong>Save this email.</strong> The link above is your permanent access to the report — you can return to it anytime.
              </p>
              <p style="margin:0 0 24px;color:#64748b;font-size:13px;line-height:1.6;">
                If you have any questions or need a refund, reply to this email or contact us at <a href="mailto:support@nnumbercheck.com" style="color:#0284c7;">support@nnumbercheck.com</a>.
              </p>

              <hr style="border:none;border-top:1px solid #e2e8f0;margin:24px 0;">

              <p style="margin:0;color:#94a3b8;font-size:11px;line-height:1.5;">
                Not affiliated with the FAA or NTSB. For historical reference only. Verify all information with official records before making any purchase or safety decision.
              </p>
            </td>
          </tr>
          <tr>
            <td style="background:#f8fafc;padding:16px 32px;text-align:center;">
              <p style="margin:0;color:#94a3b8;font-size:11px;">
                © ${new Date().getFullYear()} NNumberCheck.com — All rights reserved.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();
}

async function sendReportEmail(env, { nNumber, transactionId, amount, email }) {
  if (!env.RESEND_API_KEY) {
    console.error('RESEND_API_KEY not set — skipping email');
    return { skipped: true };
  }

  if (!email) {
    console.error('No customer email in session — skipping email');
    return { skipped: true };
  }

  const reportUrl = `https://nnumbercheck.com/report?n=${nNumber}&_ptxn=${transactionId}`;
  const html = buildEmailHtml({ nNumber, reportUrl, transactionId, amount, email });

  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${env.RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: 'NNumberCheck <support@nnumbercheck.com>',
      to: [email],
      subject: `Your NNumberCheck report for ${nNumber} is ready`,
      html,
    }),
  });

  const data = await response.json();
  if (!response.ok) {
    console.error('Resend error:', JSON.stringify(data));
    return { error: data };
  }
  return { id: data.id };
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
        // 1. Record the purchase in D1
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

        // 2. Send the report email
        try {
          const result = await sendReportEmail(env, {
            nNumber,
            transactionId,
            amount: amountCents,
            email: customerEmail,
          });
          console.log('Email send result:', JSON.stringify(result));
        } catch (emailErr) {
          // Don't fail the webhook if email fails — the purchase is already recorded
          console.error('Email send failed:', emailErr);
        }
      }
    }

    return new Response(JSON.stringify({ received: true }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('Webhook error:', err);
    return new Response(
      JSON.stringify({ error: String(err?.message || err) }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};

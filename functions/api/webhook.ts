// @ts-nocheck
// functions/api/webhook.ts — DIAGNOSTIC VERSION

export const onRequestPost = async (context) => {
  const { request, env } = context;

  const rawBody = await request.text();
  const signature = request.headers.get('paddle-signature');

  console.log('=== WEBHOOK RECEIVED ===');
  console.log('Signature header present:', !!signature);
  console.log('Signature value:', signature);
  console.log('Body length:', rawBody.length);
  console.log('Body preview:', rawBody.slice(0, 300));
  console.log('PADDLE_WEBHOOK_SECRET present:', !!env.PADDLE_WEBHOOK_SECRET);
  console.log('DB binding present:', !!env.DB);

  return new Response(
    JSON.stringify({
      received: true,
      signaturePresent: !!signature,
      secretPresent: !!env.PADDLE_WEBHOOK_SECRET,
      dbPresent: !!env.DB,
      bodyLength: rawBody.length,
    }),
    { status: 200, headers: { 'Content-Type': 'application/json' } }
  );
};

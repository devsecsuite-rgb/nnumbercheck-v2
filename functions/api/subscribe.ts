// @ts-nocheck
// functions/api/subscribe.ts

// Basic email validation
function isValidEmail(email: string): boolean {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email) && email.length <= 254;
}

export const onRequestPost = async (context) => {
  const { request, env } = context;

  try {
    const body = await request.json();
    const email = (body.email || '').trim().toLowerCase();
    const nNumber = (body.nNumber || '').trim().toUpperCase();
    const source = (body.source || 'n_page').trim();

    // Validate email
    if (!email || !isValidEmail(email)) {
      return new Response(
        JSON.stringify({ error: 'Please enter a valid email address.' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Simple length guards to prevent abuse
    if (email.length > 254 || nNumber.length > 10 || source.length > 50) {
      return new Response(
        JSON.stringify({ error: 'Invalid input.' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Insert into D1. UNIQUE(email, n_number) prevents duplicates —
    // the same email can subscribe to multiple aircraft, but not twice
    // for the same aircraft.
    await env.DB.prepare(
      `INSERT OR IGNORE INTO subscribers (email, n_number, source)
       VALUES (?, ?, ?)`
    )
      .bind(email, nNumber || null, source)
      .run();

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Thanks — we will email you when new ADs or accidents are issued for this aircraft.',
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({
        error: 'Subscription failed. Please try again.',
        detail: String(err?.message || err),
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};

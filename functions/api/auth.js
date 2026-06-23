/**
 * POST /api/auth
 * Verifies PIN
 * Body: { pin: string }
 * Response: { success: boolean }
 */

export async function onRequest(context) {
  try {
    const { request, env } = context;
    const body = await request.json();
    const pin = body?.pin?.toString().trim() || '';

    const result = await env.DB.prepare(
      "SELECT value FROM settings WHERE key = 'pin'"
    ).first();

    const success = result && result.value === pin;

    return new Response(
      JSON.stringify({ success }),
      { headers: { 'content-type': 'application/json' } }
    );
  } catch (e) {
    return new Response(
      JSON.stringify({ success: false, error: 'Invalid request' }),
      { status: 400, headers: { 'content-type': 'application/json' } }
    );
  }
}

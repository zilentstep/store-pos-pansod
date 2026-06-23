/**
 * POST /api/change-pin
 * Changes the PIN (old PIN validated by middleware)
 * Body: { newPin: string }
 * Response: { success: boolean }
 */

export async function onRequest(context) {
  try {
    const { request, env } = context;
    const body = await request.json();
    const newPin = body?.newPin?.toString().trim() || '';

    if (!newPin || newPin.length < 4) {
      return new Response(
        JSON.stringify({ success: false, error: 'PIN must be at least 4 characters' }),
        { status: 400, headers: { 'content-type': 'application/json' } }
      );
    }

    await env.DB.prepare(
      "UPDATE settings SET value = ? WHERE key = 'pin'"
    ).bind(newPin).run();

    return new Response(
      JSON.stringify({ success: true }),
      { headers: { 'content-type': 'application/json' } }
    );
  } catch (e) {
    return new Response(
      JSON.stringify({ success: false, error: 'Failed to change PIN' }),
      { status: 500, headers: { 'content-type': 'application/json' } }
    );
  }
}

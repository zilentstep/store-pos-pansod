/**
 * PIN Auth Middleware
 * Only protects /api/* routes. Non-API routes (HTML, CSS, JS) pass through.
 * /api/auth is excluded from PIN check.
 */

async function onRequest(context) {
  const { request, next, env } = context;
  const url = new URL(request.url);
  const path = url.pathname;

  // Only protect /api/ routes
  if (!path.startsWith('/api/')) {
    return next();
  }

  // Allow /api/auth without PIN
  if (path === '/api/auth' || path === '/api/auth/') {
    return next();
  }

  // Check x-pin header
  const pin = request.headers.get('x-pin');
  if (!pin) {
    return new Response(
      JSON.stringify({ success: false, error: 'PIN required' }),
      { status: 401, headers: { 'content-type': 'application/json' } }
    );
  }

  // Verify PIN against database
  try {
    const result = await env.DB.prepare(
      "SELECT value FROM settings WHERE key = 'pin'"
    ).first();

    if (!result || result.value !== pin) {
      return new Response(
        JSON.stringify({ success: false, error: 'Invalid PIN' }),
        { status: 401, headers: { 'content-type': 'application/json' } }
      );
    }
  } catch (e) {
    return new Response(
      JSON.stringify({ success: false, error: 'Auth error' }),
      { status: 500, headers: { 'content-type': 'application/json' } }
    );
  }

  return next();
}

export { onRequest };

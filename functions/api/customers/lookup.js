/**
 * POST /api/customers/lookup
 * Public / Protected endpoint to look up customer by phone number
 * Body: { phone: string }
 * Response: { success: true, data: customer | null }
 */

export async function onRequest(context) {
  try {
    const { request, env } = context;
    const body = await request.json();
    let { phone } = body || {};

    if (!phone) {
      return new Response(
        JSON.stringify({ success: false, error: 'Phone number is required' }),
        { status: 400, headers: { 'content-type': 'application/json' } }
      );
    }

    const cleanPhone = phone.replace(/\D/g, '').trim();

    // Ensure table exists
    await env.DB.prepare(`
      CREATE TABLE IF NOT EXISTS customers (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        phone TEXT UNIQUE NOT NULL,
        name TEXT NOT NULL,
        birthday TEXT,
        sex TEXT,
        points INTEGER NOT NULL DEFAULT 0,
        created_at TEXT NOT NULL DEFAULT (datetime('now'))
      )
    `).run();

    const customer = await env.DB.prepare(
      'SELECT id, phone, name, birthday, sex, points, created_at FROM customers WHERE phone = ?'
    ).bind(cleanPhone).first();

    return new Response(
      JSON.stringify({ success: true, data: customer || null }),
      { headers: { 'content-type': 'application/json' } }
    );
  } catch (e) {
    return new Response(
      JSON.stringify({ success: false, error: e.message || 'Lookup failed' }),
      { status: 500, headers: { 'content-type': 'application/json' } }
    );
  }
}

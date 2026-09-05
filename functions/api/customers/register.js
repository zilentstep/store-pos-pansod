/**
 * POST /api/customers/register
 * Public endpoint for customer self-registration
 * Body: { phone: string, name: string, birthday?: string, sex?: string }
 * Response: { success: true, data: { customer } }
 */

export async function onRequest(context) {
  try {
    const { request, env } = context;
    const body = await request.json();
    let { phone, name, birthday, sex } = body || {};

    if (!phone || !name) {
      return new Response(
        JSON.stringify({ success: false, error: 'Phone number and Name are required' }),
        { status: 400, headers: { 'content-type': 'application/json' } }
      );
    }

    // Clean & normalize phone number (keep only digits)
    phone = phone.replace(/\D/g, '').trim();
    name = name.trim();
    birthday = birthday ? birthday.trim() : null;
    sex = sex ? sex.trim() : 'unspecified';

    if (phone.length < 9 || phone.length > 12) {
      return new Response(
        JSON.stringify({ success: false, error: 'Please enter a valid phone number (9-10 digits)' }),
        { status: 400, headers: { 'content-type': 'application/json' } }
      );
    }

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

    await env.DB.prepare(`
      CREATE TABLE IF NOT EXISTS customer_points_ledger (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        customer_id INTEGER NOT NULL,
        order_id INTEGER,
        grab_order_id INTEGER,
        change_type TEXT NOT NULL,
        points_delta INTEGER NOT NULL,
        notes TEXT,
        created_at TEXT NOT NULL DEFAULT (datetime('now')),
        FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE
      )
    `).run();

    // Check if customer already exists
    const existing = await env.DB.prepare(
      'SELECT * FROM customers WHERE phone = ?'
    ).bind(phone).first();

    if (existing) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'This phone number is already registered.',
          data: existing
        }),
        { status: 409, headers: { 'content-type': 'application/json' } }
      );
    }

    const now = new Date();
    const gmt7 = new Date(now.getTime() + 7 * 60 * 60 * 1000);
    const createdAt = gmt7.toISOString().replace('Z', '+07:00');

    const res = await env.DB.prepare(`
      INSERT INTO customers (phone, name, birthday, sex, points, created_at)
      VALUES (?, ?, ?, ?, 0, ?)
    `).bind(phone, name, birthday, sex, createdAt).run();

    const customerId = res.meta?.last_row_id;

    // Log ledger entry
    if (customerId) {
      await env.DB.prepare(`
        INSERT INTO customer_points_ledger (customer_id, change_type, points_delta, notes, created_at)
        VALUES (?, 'REGISTER', 0, 'Customer registered', ?)
      `).bind(customerId, createdAt).run();
    }

    const created = await env.DB.prepare(
      'SELECT * FROM customers WHERE id = ?'
    ).bind(customerId).first();

    return new Response(
      JSON.stringify({ success: true, data: created }),
      { headers: { 'content-type': 'application/json' } }
    );
  } catch (e) {
    return new Response(
      JSON.stringify({ success: false, error: e.message || 'Failed to register customer' }),
      { status: 500, headers: { 'content-type': 'application/json' } }
    );
  }
}

/**
 * POST /api/customers/list
 * Returns customers list with search and summary stats
 * Body: { search?: string, limit?: number, offset?: number }
 * Response: { success: true, data: { customers: [], total: number } }
 */

export async function onRequest(context) {
  try {
    const { request, env } = context;
    const body = await request.json().catch(() => ({}));
    const search = (body?.search || '').trim();

    // Ensure columns and tables exist
    try { await env.DB.prepare("ALTER TABLE orders ADD COLUMN customer_id INTEGER").run(); } catch(e) {}
    try { await env.DB.prepare("ALTER TABLE orders ADD COLUMN points_earned INTEGER NOT NULL DEFAULT 0").run(); } catch(e) {}
    try { await env.DB.prepare("ALTER TABLE orders ADD COLUMN points_redeemed INTEGER NOT NULL DEFAULT 0").run(); } catch(e) {}
    try { await env.DB.prepare("ALTER TABLE grab_orders ADD COLUMN customer_id INTEGER").run(); } catch(e) {}
    try { await env.DB.prepare("ALTER TABLE grab_orders ADD COLUMN points_earned INTEGER NOT NULL DEFAULT 0").run(); } catch(e) {}

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

    let query = `
      SELECT c.*,
        (SELECT COUNT(*) FROM orders o WHERE o.customer_id = c.id) +
        (SELECT COUNT(*) FROM grab_orders g WHERE g.customer_id = c.id) AS total_orders,
        (SELECT COALESCE(SUM(o.final_total), 0) FROM orders o WHERE o.customer_id = c.id) AS total_spent
      FROM customers c
    `;
    const params = [];

    if (search) {
      query += ` WHERE c.phone LIKE ? OR c.name LIKE ?`;
      params.push(`%${search}%`, `%${search}%`);
    }

    query += ` ORDER BY c.points DESC, c.id DESC`;

    const stmt = params.length > 0
      ? env.DB.prepare(query).bind(...params)
      : env.DB.prepare(query);

    const result = await stmt.all();

    return new Response(
      JSON.stringify({ success: true, data: { customers: result.results || [], total: result.results?.length || 0 } }),
      { headers: { 'content-type': 'application/json' } }
    );
  } catch (e) {
    return new Response(
      JSON.stringify({ success: false, error: e.message || 'Failed to list customers' }),
      { status: 500, headers: { 'content-type': 'application/json' } }
    );
  }
}

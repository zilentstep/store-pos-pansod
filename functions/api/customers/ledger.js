/**
 * POST /api/customers/ledger
 * Returns points ledger / history for a specific customer
 * Body: { customerId: number }
 * Response: { success: true, data: ledgerEntries[] }
 */

export async function onRequest(context) {
  try {
    const { request, env } = context;
    const body = await request.json();
    const { customerId } = body || {};

    if (!customerId) {
      return new Response(
        JSON.stringify({ success: false, error: 'Customer ID is required' }),
        { status: 400, headers: { 'content-type': 'application/json' } }
      );
    }

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

    const ledger = await env.DB.prepare(`
      SELECT * FROM customer_points_ledger
      WHERE customer_id = ?
      ORDER BY id DESC
      LIMIT 100
    `).bind(customerId).all();

    return new Response(
      JSON.stringify({ success: true, data: ledger.results || [] }),
      { headers: { 'content-type': 'application/json' } }
    );
  } catch (e) {
    return new Response(
      JSON.stringify({ success: false, error: e.message || 'Failed to fetch ledger' }),
      { status: 500, headers: { 'content-type': 'application/json' } }
    );
  }
}

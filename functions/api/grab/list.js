/**
 * POST /api/grab/list
 * Returns grab orders with items for a given date
 * Body: { date: "YYYY-MM-DD" }
 * Response: { success: true, data: grabOrders[] }
 */

export async function onRequest(context) {
  try {
    const { request, env } = context;
    const body = await request.json();
    const date = body?.date || new Date().toISOString().split('T')[0];

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

    const orders = await env.DB.prepare(
      `SELECT g.*, c.name as customer_name, c.phone as customer_phone
       FROM grab_orders g
       LEFT JOIN customers c ON g.customer_id = c.id
       WHERE date(g.created_at) = ?
       ORDER BY g.id DESC`
    ).bind(date).all();

    const ordersWithItems = [];

    for (const order of orders.results) {
      const items = await env.DB.prepare(
        "SELECT id, item_name, qty FROM grab_order_items WHERE grab_order_id = ?"
      ).bind(order.id).all();

      const dt = new Date(order.created_at.replace('+07:00', 'Z'));
      const h = dt.getHours().toString().padStart(2, '0');
      const m = dt.getMinutes().toString().padStart(2, '0');
      ordersWithItems.push({
        id: order.id,
        time: h + ':' + m,
        orderNr: order.order_nr || '',
        customerType: order.customer_type || '',
        customerId: order.customer_id,
        customerName: order.customer_name,
        customerPhone: order.customer_phone,
        pointsEarned: order.points_earned || 0,
        items: items.results.map(i => ({
          name: i.item_name,
          qty: i.qty
        }))
      });
    }

    return new Response(
      JSON.stringify({ success: true, data: ordersWithItems }),
      { headers: { 'content-type': 'application/json' } }
    );
  } catch (e) {
    return new Response(
      JSON.stringify({ success: false, error: 'Failed to fetch grab orders' }),
      { status: 500, headers: { 'content-type': 'application/json' } }
    );
  }
}

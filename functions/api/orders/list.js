/**
 * POST /api/orders/list
 * Returns orders with items for a given date or date range
 * Body: { date: "YYYY-MM-DD" } or { startDate, endDate }
 * Response: { success: true, data: orders[] }
 */

export async function onRequest(context) {
  try {
    const { request, env } = context;
    const body = await request.json();
    const startDate = body?.startDate || body?.date || new Date().toISOString().split('T')[0];
    const endDate = body?.endDate || startDate;

    try { await env.DB.prepare("ALTER TABLE orders ADD COLUMN customer_id INTEGER").run(); } catch(e) {}
    try { await env.DB.prepare("ALTER TABLE orders ADD COLUMN points_earned INTEGER NOT NULL DEFAULT 0").run(); } catch(e) {}
    try { await env.DB.prepare("ALTER TABLE orders ADD COLUMN points_redeemed INTEGER NOT NULL DEFAULT 0").run(); } catch(e) {}
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

    // Fetch orders with customer info for the date range
    const orders = await env.DB.prepare(
      `SELECT o.*, c.name as customer_name, c.phone as customer_phone
       FROM orders o
       LEFT JOIN customers c ON o.customer_id = c.id
       WHERE date(o.created_at) >= ? AND date(o.created_at) <= ?
       ORDER BY o.id DESC`
    ).bind(startDate, endDate).all();

    const ordersWithItems = [];

    for (const order of orders.results) {
      const items = await env.DB.prepare(
        "SELECT id, item_name, qty, price FROM order_items WHERE order_id = ?"
      ).bind(order.id).all();

      const dt = new Date(order.created_at.replace('+07:00', 'Z'));
      const h = dt.getHours().toString().padStart(2, '0');
      const m = dt.getMinutes().toString().padStart(2, '0');
      ordersWithItems.push({
        id: order.id,
        date: order.created_at.split('T')[0],
        time: h + ':' + m,
        items: items.results.map(i => ({
          name: i.item_name,
          qty: i.qty,
          price: i.price
        })),
        total: items.results.reduce((s, i) => s + i.price * i.qty, 0),
        promoApplied: order.promo_applied === 1,
        discount: order.discount,
        finalTotal: order.final_total,
        paymentMethod: order.payment_method,
        orderType: order.order_type,
        status: order.status,
        customerId: order.customer_id,
        customerName: order.customer_name,
        customerPhone: order.customer_phone,
        pointsEarned: order.points_earned || 0,
        pointsRedeemed: order.points_redeemed || 0
      });
    }

    return new Response(
      JSON.stringify({ success: true, data: ordersWithItems }),
      { headers: { 'content-type': 'application/json' } }
    );
  } catch (e) {
    return new Response(
      JSON.stringify({ success: false, error: 'Failed to fetch orders' }),
      { status: 500, headers: { 'content-type': 'application/json' } }
    );
  }
}

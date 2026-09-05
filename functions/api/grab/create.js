/**
 * POST /api/grab/create
 * Creates a new grab order with items and optional customer points
 * Body: { items: [{ name, qty }], orderNr: string, customerType: string, customerId?: number }
 * Response: { success: true, data: { id, pointsEarned } }
 */

export async function onRequest(context) {
  try {
    const { request, env } = context;
    const body = await request.json();
    const { items, orderNr, customerType, customerId, createdAt: reqCreatedAt } = body;

    if (!Array.isArray(items) || items.length === 0) {
      return new Response(
        JSON.stringify({ success: false, error: 'Order must have at least one item' }),
        { status: 400, headers: { 'content-type': 'application/json' } }
      );
    }

    // Ensure columns exist on grab_orders table
    try { await env.DB.prepare("ALTER TABLE grab_orders ADD COLUMN customer_id INTEGER").run(); } catch(e) {}
    try { await env.DB.prepare("ALTER TABLE grab_orders ADD COLUMN points_earned INTEGER NOT NULL DEFAULT 0").run(); } catch(e) {}

    // Ensure customers and ledger tables exist
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

    const orderId = Date.now();
    const now = new Date();
    const offset = 7 * 60;
    const gmt7 = new Date(now.getTime() + offset * 60 * 1000);
    const createdAt = reqCreatedAt || gmt7.toISOString().replace('Z', '+07:00');

    // Calculate onigiri points earned (1 Onigiri = 1 point)
    let pointsEarned = 0;
    for (const item of items) {
      const mi = await env.DB.prepare("SELECT cat FROM menu_items WHERE en_name = ?").bind(item.name).first();
      if (mi && mi.cat === 'Onigiri') {
        pointsEarned += (item.qty || 1);
      }
    }

    if (customerId && pointsEarned > 0) {
      const customer = await env.DB.prepare("SELECT id, points FROM customers WHERE id = ?").bind(customerId).first();
      if (customer) {
        const newPoints = (customer.points || 0) + pointsEarned;
        await env.DB.prepare("UPDATE customers SET points = ? WHERE id = ?").bind(newPoints, customerId).run();
        await env.DB.prepare(`
          INSERT INTO customer_points_ledger (customer_id, grab_order_id, change_type, points_delta, notes, created_at)
          VALUES (?, ?, ?, ?, ?, ?)
        `).bind(customerId, orderId, 'EARN', pointsEarned, `Earned ${pointsEarned} pts from Grab order #${orderNr || ''}`, createdAt).run();
      }
    }

    await env.DB.prepare(
      `INSERT INTO grab_orders (id, created_at, order_nr, customer_type, customer_id, points_earned) VALUES (?, ?, ?, ?, ?, ?)`
    ).bind(orderId, createdAt, orderNr || '', customerType || '', customerId || null, pointsEarned).run();

    // Insert grab order items
    const itemStmts = items.map(item => {
      return env.DB.prepare(
        "INSERT INTO grab_order_items (grab_order_id, item_name, qty, cat) VALUES (?, ?, ?, (SELECT cat FROM menu_items WHERE en_name = ?))"
      ).bind(orderId, item.name, item.qty, item.name);
    });

    await env.DB.batch(itemStmts);

    return new Response(
      JSON.stringify({ success: true, data: { id: orderId, pointsEarned } }),
      { headers: { 'content-type': 'application/json' } }
    );
  } catch (e) {
    return new Response(
      JSON.stringify({ success: false, error: e.message || 'Failed to create grab order' }),
      { status: 500, headers: { 'content-type': 'application/json' } }
    );
  }
}

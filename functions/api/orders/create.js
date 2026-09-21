/**
 * POST /api/orders/create
 * Creates a new order with items
 * Body: { items: [{ name, qty, price }], orderType, paymentMethod, promoApplied, discount, finalTotal, customerId, pointsRedeemed }
 * Response: { success: true, data: { id, pointsEarned, pointsRedeemed, customerPoints } }
 */

export async function onRequest(context) {
  try {
    const { request, env } = context;
    const body = await request.json();
    const {
      items,
      orderType,
      paymentMethod,
      promoApplied,
      discount,
      finalTotal,
      customerId,
      pointsRedeemed = 0,
      createdAt: reqCreatedAt
    } = body;

    if (!Array.isArray(items) || items.length === 0) {
      return new Response(
        JSON.stringify({ success: false, error: 'Order must have at least one item' }),
        { status: 400, headers: { 'content-type': 'application/json' } }
      );
    }

    // Ensure columns exist on orders table
    try { await env.DB.prepare("ALTER TABLE orders ADD COLUMN customer_id INTEGER").run(); } catch(e) {}
    try { await env.DB.prepare("ALTER TABLE orders ADD COLUMN points_earned INTEGER NOT NULL DEFAULT 0").run(); } catch(e) {}
    try { await env.DB.prepare("ALTER TABLE orders ADD COLUMN points_redeemed INTEGER NOT NULL DEFAULT 0").run(); } catch(e) {}

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

    // Calculate total onigiri count
    let totalOnigiriCount = 0;
    for (const item of items) {
      const mi = await env.DB.prepare("SELECT cat FROM menu_items WHERE en_name = ?").bind(item.name).first();
      if (mi && mi.cat === 'Onigiri') {
        totalOnigiriCount += (item.qty || 1);
      }
    }

    let actualPointsRedeemed = 0;
    if (customerId && pointsRedeemed > 0) {
      const customer = await env.DB.prepare("SELECT points FROM customers WHERE id = ?").bind(customerId).first();
      if (customer && (customer.points || 0) >= pointsRedeemed) {
        actualPointsRedeemed = pointsRedeemed;
      }
    }

    // Points earned = Total Onigiri - Free Onigiri
    // Since 10 points = 1 free onigiri, we divide pointsRedeemed by 10 to get free Onigiri count
    // NOTE: This assumes pointsRedeemed is always a multiple of 10
    const freeOnigiriCount = actualPointsRedeemed / 10;
    let pointsEarned = Math.max(0, totalOnigiriCount - freeOnigiriCount);

    let customerPoints = 0;

    if (customerId) {
      const customer = await env.DB.prepare("SELECT id, points FROM customers WHERE id = ?").bind(customerId).first();
      if (customer) {
        const newBalance = Math.max(0, (customer.points || 0) - actualPointsRedeemed + pointsEarned);
        customerPoints = newBalance;

        // Update customer points
        await env.DB.prepare("UPDATE customers SET points = ? WHERE id = ?").bind(newBalance, customerId).run();

        // Ledger entries
        if (actualPointsRedeemed > 0) {
          await env.DB.prepare(`
            INSERT INTO customer_points_ledger (customer_id, order_id, change_type, points_delta, notes, created_at)
            VALUES (?, ?, ?, ?, ?, ?)
          `).bind(customerId, orderId, 'REDEEM', -actualPointsRedeemed, `Redeemed ${actualPointsRedeemed} pts for free onigiri`, createdAt).run();
        }

        if (pointsEarned > 0) {
          await env.DB.prepare(`
            INSERT INTO customer_points_ledger (customer_id, order_id, change_type, points_delta, notes, created_at)
            VALUES (?, ?, ?, ?, ?, ?)
          `).bind(customerId, orderId, 'EARN', pointsEarned, `Earned ${pointsEarned} pts from order`, createdAt).run();
        }
      }
    }

    // Insert order
    await env.DB.prepare(
      `INSERT INTO orders (id, created_at, order_type, payment_method, promo_applied, discount, final_total, status, customer_id, points_earned, points_redeemed)
       VALUES (?, ?, ?, ?, ?, ?, ?, 'pending', ?, ?, ?)`
    ).bind(
      orderId,
      createdAt,
      orderType || 'dinein',
      paymentMethod || 'cash',
      promoApplied ? 1 : 0,
      discount || 0,
      finalTotal || 0,
      customerId || null,
      pointsEarned,
      actualPointsRedeemed
    ).run();

    // Insert order items
    const itemStmts = items.map(item => {
      return env.DB.prepare(
        "INSERT INTO order_items (order_id, item_name, qty, price) VALUES (?, ?, ?, ?)"
      ).bind(orderId, item.name, item.qty, item.price);
    });

    await env.DB.batch(itemStmts);

    return new Response(
      JSON.stringify({
        success: true,
        data: {
          id: orderId,
          pointsEarned,
          pointsRedeemed: actualPointsRedeemed,
          customerPoints
        }
      }),
      { headers: { 'content-type': 'application/json' } }
    );
  } catch (e) {
    return new Response(
      JSON.stringify({ success: false, error: e.message || 'Failed to create order' }),
      { status: 500, headers: { 'content-type': 'application/json' } }
    );
  }
}

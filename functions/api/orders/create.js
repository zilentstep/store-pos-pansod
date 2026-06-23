/**
 * POST /api/orders/create
 * Creates a new order with items
 * Body: { items: [{ name, qty, price }], orderType, paymentMethod, promoApplied, discount, finalTotal }
 * Response: { success: true, data: { id } }
 */

export async function onRequest(context) {
  try {
    const { request, env } = context;
    const body = await request.json();
    const { items, orderType, paymentMethod, promoApplied, discount, finalTotal } = body;

    if (!Array.isArray(items) || items.length === 0) {
      return new Response(
        JSON.stringify({ success: false, error: 'Order must have at least one item' }),
        { status: 400, headers: { 'content-type': 'application/json' } }
      );
    }

    const orderId = Date.now();
    const createdAt = new Date().toISOString();

    // Insert order
    await env.DB.prepare(
      `INSERT INTO orders (id, created_at, order_type, payment_method, promo_applied, discount, final_total, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, 'pending')`
    ).bind(
      orderId,
      createdAt,
      orderType || 'dinein',
      paymentMethod || 'cash',
      promoApplied ? 1 : 0,
      discount || 0,
      finalTotal || 0
    ).run();

    // Insert order items
    const itemStmts = items.map(item => {
      return env.DB.prepare(
        "INSERT INTO order_items (order_id, item_name, qty, price) VALUES (?, ?, ?, ?)"
      ).bind(orderId, item.name, item.qty, item.price);
    });

    await env.DB.batch(itemStmts);

    return new Response(
      JSON.stringify({ success: true, data: { id: orderId } }),
      { headers: { 'content-type': 'application/json' } }
    );
  } catch (e) {
    return new Response(
      JSON.stringify({ success: false, error: 'Failed to create order' }),
      { status: 500, headers: { 'content-type': 'application/json' } }
    );
  }
}

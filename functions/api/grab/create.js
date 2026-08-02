/**
 * POST /api/grab/create
 * Creates a new grab order with items
 * Body: { items: [{ name, qty }], orderNr: string }
 * Response: { success: true, data: { id } }
 */

export async function onRequest(context) {
  try {
    const { request, env } = context;
    const body = await request.json();
    const { items, orderNr, customerType, createdAt: reqCreatedAt } = body;

    if (!Array.isArray(items) || items.length === 0) {
      return new Response(
        JSON.stringify({ success: false, error: 'Order must have at least one item' }),
        { status: 400, headers: { 'content-type': 'application/json' } }
      );
    }

    const orderId = Date.now();
    const now = new Date();
    const offset = 7 * 60;
    const gmt7 = new Date(now.getTime() + offset * 60 * 1000);
    const createdAt = reqCreatedAt || gmt7.toISOString().replace('Z', '+07:00');

    await env.DB.prepare(
      `INSERT INTO grab_orders (id, created_at, order_nr, customer_type) VALUES (?, ?, ?, ?)`
    ).bind(orderId, createdAt, orderNr || '', customerType || '').run();

    // Insert grab order items
    const itemStmts = items.map(item => {
      return env.DB.prepare(
        "INSERT INTO grab_order_items (grab_order_id, item_name, qty, cat) VALUES (?, ?, ?, (SELECT cat FROM menu_items WHERE en_name = ?))"
      ).bind(orderId, item.name, item.qty, item.name);
    });

    await env.DB.batch(itemStmts);

    return new Response(
      JSON.stringify({ success: true, data: { id: orderId } }),
      { headers: { 'content-type': 'application/json' } }
    );
  } catch (e) {
    return new Response(
      JSON.stringify({ success: false, error: 'Failed to create grab order' }),
      { status: 500, headers: { 'content-type': 'application/json' } }
    );
  }
}

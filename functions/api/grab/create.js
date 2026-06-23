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
    const { items, orderNr } = body;

    if (!Array.isArray(items) || items.length === 0) {
      return new Response(
        JSON.stringify({ success: false, error: 'Order must have at least one item' }),
        { status: 400, headers: { 'content-type': 'application/json' } }
      );
    }

    const orderId = Date.now();
    const createdAt = new Date().toISOString();

    // Insert grab order
    await env.DB.prepare(
      `INSERT INTO grab_orders (id, created_at, order_nr) VALUES (?, ?, ?)`
    ).bind(orderId, createdAt, orderNr || '').run();

    // Insert grab order items
    const itemStmts = items.map(item => {
      return env.DB.prepare(
        "INSERT INTO grab_order_items (grab_order_id, item_name, qty) VALUES (?, ?, ?)"
      ).bind(orderId, item.name, item.qty);
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

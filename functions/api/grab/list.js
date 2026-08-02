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

    const orders = await env.DB.prepare(
      `SELECT * FROM grab_orders WHERE date(created_at) = ? ORDER BY id DESC`
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

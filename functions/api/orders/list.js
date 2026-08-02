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

    // Fetch orders for the date range
    const orders = await env.DB.prepare(
      `SELECT * FROM orders WHERE date(created_at) >= ? AND date(created_at) <= ? ORDER BY id DESC`
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
        status: order.status
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

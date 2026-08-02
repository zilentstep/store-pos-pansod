export async function onRequest(context) {
  try {
    const { request, env } = context;
    const body = await request.json();
    const { id, items, orderNr, customerType } = body;

    if (!id) {
      return new Response(
        JSON.stringify({ success: false, error: 'Order ID required' }),
        { status: 400, headers: { 'content-type': 'application/json' } }
      );
    }

    if (!Array.isArray(items) || items.length === 0) {
      return new Response(
        JSON.stringify({ success: false, error: 'Order must have at least one item' }),
        { status: 400, headers: { 'content-type': 'application/json' } }
      );
    }

    await env.DB.prepare("DELETE FROM grab_order_items WHERE grab_order_id = ?").bind(id).run();

    const stmts = items.map(item => {
      return env.DB.prepare(
        "INSERT INTO grab_order_items (grab_order_id, item_name, qty) VALUES (?, ?, ?)"
      ).bind(id, item.name, item.qty);
    });

    if (orderNr !== undefined || customerType !== undefined) {
      const updates = [];
      const vals = [];
      if (orderNr !== undefined) { updates.push('order_nr = ?'); vals.push(orderNr); }
      if (customerType !== undefined) { updates.push('customer_type = ?'); vals.push(customerType); }
      vals.push(id);
      await env.DB.prepare('UPDATE grab_orders SET ' + updates.join(', ') + ' WHERE id = ?').bind(...vals).run();
    }

    await env.DB.batch(stmts);

    return new Response(
      JSON.stringify({ success: true, data: { id } }),
      { headers: { 'content-type': 'application/json' } }
    );
  } catch (e) {
    return new Response(
      JSON.stringify({ success: false, error: 'Failed to update grab order' }),
      { status: 500, headers: { 'content-type': 'application/json' } }
    );
  }
}

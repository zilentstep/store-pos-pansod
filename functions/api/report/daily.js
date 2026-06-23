/**
 * POST /api/report/daily
 * Returns daily report data for a given date
 * Body: { date: "YYYY-MM-DD" }
 * Response: { success: true, data: { ... } }
 */

export async function onRequest(context) {
  try {
    const { request, env } = context;
    const body = await request.json();
    const date = body?.date || new Date().toISOString().split('T')[0];

    // --- In-store orders ---
    const orders = await env.DB.prepare(
      `SELECT * FROM orders WHERE date(created_at) = ?`
    ).bind(date).all();

    const allOrderItems = [];
    for (const order of orders.results) {
      const items = await env.DB.prepare(
        "SELECT * FROM order_items WHERE order_id = ?"
      ).bind(order.id).all();
      allOrderItems.push({ order, items: items.results });
    }

    // --- Grab orders ---
    const grabOrders = await env.DB.prepare(
      `SELECT * FROM grab_orders WHERE date(created_at) = ?`
    ).bind(date).all();

    const allGrabItems = [];
    for (const go of grabOrders.results) {
      const items = await env.DB.prepare(
        "SELECT * FROM grab_order_items WHERE grab_order_id = ?"
      ).bind(go.id).all();
      allGrabItems.push({ order: go, items: items.results });
    }

    // --- Compute stats ---
    const totalOrders = orders.results.length;
    const totalRevenue = orders.results.reduce((s, o) => s + o.final_total, 0);
    const totalItems = allOrderItems.reduce((s, oi) =>
      s + oi.items.reduce((a, i) => a + i.qty, 0), 0
    );
    const aov = totalOrders > 0 ? Math.round(totalRevenue / totalOrders) : 0;
    const totalDiscount = orders.results.reduce((s, o) => s + o.discount, 0);

    const cashTotal = orders.results
      .filter(o => o.payment_method === 'cash')
      .reduce((s, o) => s + o.final_total, 0);
    const qrTotal = orders.results
      .filter(o => o.payment_method === 'qr')
      .reduce((s, o) => s + o.final_total, 0);

    const grabTotalOrders = grabOrders.results.length;
    const grabTotalItems = allGrabItems.reduce((s, gi) =>
      s + gi.items.reduce((a, i) => a + i.qty, 0), 0
    );

    // --- Top selling products (in-store + grab) ---
    const productMap = {};
    for (const oi of allOrderItems) {
      for (const item of oi.items) {
        if (!productMap[item.item_name]) productMap[item.item_name] = { qty: 0, rev: 0 };
        productMap[item.item_name].qty += item.qty;
        productMap[item.item_name].rev += item.price * item.qty;
      }
    }
    for (const gi of allGrabItems) {
      for (const item of gi.items) {
        if (!productMap[item.item_name]) productMap[item.item_name] = { qty: 0, rev: 0 };
        productMap[item.item_name].qty += item.qty;
      }
    }

    const topProducts = Object.entries(productMap)
      .map(([name, data]) => ({ name, qty: data.qty, rev: data.rev }))
      .sort((a, b) => b.qty - a.qty);

    // --- Category breakdown (revenue only from in-store) ---
    const catBreakdown = { Onigiri: 0, Drinks: 0, Other: 0 };
    for (const oi of allOrderItems) {
      for (const item of oi.items) {
        const menuItem = await env.DB.prepare(
          "SELECT cat FROM menu_items WHERE en_name = ?"
        ).bind(item.item_name).first();
        const rev = item.price * item.qty;
        if (menuItem?.cat === 'Onigiri') catBreakdown.Onigiri += rev;
        else if (menuItem?.cat === 'Drinks') catBreakdown.Drinks += rev;
        else catBreakdown.Other += rev;
      }
    }
    const catTotal = catBreakdown.Onigiri + catBreakdown.Drinks + catBreakdown.Other;

    // --- Hourly sales ---
    const hourly = {};
    for (let h = 0; h < 24; h++) hourly[h] = { orders: 0, rev: 0 };
    for (const order of orders.results) {
      const hr = new Date(order.created_at).getHours();
      hourly[hr].orders += 1;
      hourly[hr].rev += order.final_total;
    }

    // --- Grab insights ---
    let oniQtyInGrab = 0;
    for (const gi of allGrabItems) {
      for (const item of gi.items) {
        const menuItem = await env.DB.prepare(
          "SELECT cat FROM menu_items WHERE en_name = ?"
        ).bind(item.item_name).first();
        if (menuItem?.cat === 'Onigiri') oniQtyInGrab += item.qty;
      }
    }
    const avgOniPerGrab = grabTotalOrders > 0 ? Math.round(oniQtyInGrab / grabTotalOrders) : 0;

    const report = {
      summary: {
        totalRevenue,
        totalOrders,
        totalItems,
        aov,
        totalDiscount,
        cashTotal,
        qrTotal
      },
      grab: {
        totalOrders: grabTotalOrders,
        totalItems: grabTotalItems
      },
      topProducts,
      categoryBreakdown: {
        ...catBreakdown,
        total: catTotal
      },
      hourly: Object.entries(hourly)
        .filter(([_, v]) => v.orders > 0)
        .map(([h, v]) => ({ hour: parseInt(h), orders: v.orders, rev: v.rev })),
      grabInsights: {
        totalItems: grabTotalItems,
        avgOniPerOrder: avgOniPerGrab
      }
    };

    return new Response(
      JSON.stringify({ success: true, data: report }),
      { headers: { 'content-type': 'application/json' } }
    );
  } catch (e) {
    return new Response(
      JSON.stringify({ success: false, error: 'Failed to generate report' }),
      { status: 500, headers: { 'content-type': 'application/json' } }
    );
  }
}

/**
 * POST /api/report/range
 * Returns aggregated report data for a date range
 * Body: { startDate: "YYYY-MM-DD", endDate: "YYYY-MM-DD" }
 * Response: { success: true, data: { ... } }
 */

export async function onRequest(context) {
  try {
    const { request, env } = context;
    const body = await request.json();
    const { startDate, endDate } = body;
    if (!startDate || !endDate) {
      return new Response(
        JSON.stringify({ success: false, error: 'startDate and endDate required' }),
        { status: 400, headers: { 'content-type': 'application/json' } }
      );
    }

    // Load menu items once and cache
    const menuItemsMap = {};
    const allMenuItems = await env.DB.prepare("SELECT en_name, cat, price FROM menu_items").all();
    for (const m of allMenuItems.results) menuItemsMap[m.en_name] = m;
    function getMenu(enName) { return menuItemsMap[enName] || null; }

    const orders = await env.DB.prepare(
      `SELECT * FROM orders WHERE date(created_at) >= ? AND date(created_at) <= ?`
    ).bind(startDate, endDate).all();

    const orderItemsRes = await env.DB.prepare(
      `SELECT oi.* FROM order_items oi JOIN orders o ON o.id = oi.order_id WHERE date(o.created_at) >= ? AND date(o.created_at) <= ?`
    ).bind(startDate, endDate).all();
    const orderItems = orderItemsRes.results;

    const grabOrders = await env.DB.prepare(
      `SELECT * FROM grab_orders WHERE date(created_at) >= ? AND date(created_at) <= ?`
    ).bind(startDate, endDate).all();

    const grabItemsRes = await env.DB.prepare(
      `SELECT goi.* FROM grab_order_items goi JOIN grab_orders go ON go.id = goi.grab_order_id WHERE date(go.created_at) >= ? AND date(go.created_at) <= ?`
    ).bind(startDate, endDate).all();
    const grabItems = grabItemsRes.results;

    const totalOrders = orders.results.length;
    const totalRevenue = orders.results.reduce((s, o) => s + o.final_total, 0);
    const totalItems = orderItems.reduce((s, i) => s + i.qty, 0);
    const aov = totalOrders > 0 ? Math.round(totalRevenue / totalOrders) : 0;
    const totalDiscount = orders.results.reduce((s, o) => s + o.discount, 0);

    const cashTotal = orders.results
      .filter(o => o.payment_method === 'cash')
      .reduce((s, o) => s + o.final_total, 0);
    const qrTotal = orders.results
      .filter(o => o.payment_method === 'qr')
      .reduce((s, o) => s + o.final_total, 0);

    const grabTotalOrders = grabOrders.results.length;
    const grabTotalItems = grabItems.reduce((s, i) => s + i.qty, 0);

    let grabTotalRevenue = 0;
    for (const item of grabItems) {
      grabTotalRevenue += (getMenu(item.item_name)?.price || 0) * item.qty;
    }

    // --- Top selling products (in-store only) ---
    const productMap = {};
    for (const item of orderItems) {
      if (!productMap[item.item_name]) productMap[item.item_name] = { qty: 0, rev: 0 };
      productMap[item.item_name].qty += item.qty;
      productMap[item.item_name].rev += item.price * item.qty;
    }

    const topProducts = Object.entries(productMap)
      .map(([name, data]) => ({ name, qty: data.qty, rev: Math.round(data.rev) }))
      .sort((a, b) => b.qty - a.qty);

    // --- Category breakdown (revenue only from in-store) ---
    const catBreakdown = { Onigiri: 0, Drinks: 0, Salad: 0, Other: 0 };
    for (const item of orderItems) {
      const menuItem = getMenu(item.item_name);
      const rev = item.price * item.qty;
      if (menuItem?.cat === 'Onigiri') catBreakdown.Onigiri += rev;
      else if (menuItem?.cat === 'Drinks') catBreakdown.Drinks += rev;
      else if (menuItem?.cat === 'Salad') catBreakdown.Salad += rev;
      else catBreakdown.Other += rev;
    }
    const catTotal = catBreakdown.Onigiri + catBreakdown.Drinks + catBreakdown.Other;

    // --- Hourly sales ---
    const hourly = {};
    for (let h = 0; h < 24; h++) hourly[h] = { orders: 0, rev: 0 };
    for (const order of orders.results) {
      const dt = new Date(order.created_at.replace('+07:00', 'Z'));
      const hr = dt.getHours();
      hourly[hr].orders += 1;
      hourly[hr].rev += order.final_total;
    }

    // --- Grab insights ---
    let oniQtyInGrab = 0;
    const grabProductMap = {};
    for (const item of grabItems) {
      if (item.cat === 'Onigiri') oniQtyInGrab += item.qty;
      if (!grabProductMap[item.item_name]) grabProductMap[item.item_name] = { qty: 0 };
      grabProductMap[item.item_name].qty += item.qty;
    }
    const avgOniPerGrab = grabTotalOrders > 0 ? Math.round(oniQtyInGrab / grabTotalOrders) : 0;

    // --- Grab customer type breakdown ---
    let oldCount = 0, newCount = 0, adsCount = 0;
    for (const go of grabOrders.results) {
      const types = (go.customer_type || '').split(',').filter(Boolean);
      if (types.indexOf('old') !== -1) oldCount++;
      if (types.indexOf('new') !== -1) newCount++;
      if (types.indexOf('ads') !== -1) adsCount++;
    }
    const avgPcsPerBill = grabTotalOrders > 0 ? Math.round(grabTotalItems / grabTotalOrders) : 0;

    const grabProducts = Object.entries(grabProductMap)
      .map(([name, data]) => ({ name, qty: data.qty }))
      .sort((a, b) => b.qty - a.qty);
    const grabTopProducts = grabProducts.slice(0, 5);
    const grabLowProducts = grabProducts.slice(-5).reverse();

    const report = {
      summary: { totalRevenue, totalOrders, totalItems, aov, totalDiscount, cashTotal, qrTotal },
      grab: { totalOrders: grabTotalOrders, totalItems: grabTotalItems, oldOrders: oldCount, newOrders: newCount, adsOrders: adsCount, avgPcsPerBill: avgPcsPerBill, totalOnigiri: oniQtyInGrab, grabTopProducts, grabLowProducts, grabProducts },
      topProducts,
      categoryBreakdown: { ...catBreakdown, total: catTotal },
      hourly: Object.entries(hourly)
        .filter(([_, v]) => v.orders > 0)
        .map(([h, v]) => ({ hour: parseInt(h), orders: v.orders, rev: v.rev })),
      grabInsights: { totalItems: grabTotalItems, avgOniPerOrder: avgOniPerGrab }
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

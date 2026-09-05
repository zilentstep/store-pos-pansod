/**
 * POST /api/report/monthly
 * Returns per-day summary rows for a date range (for CSV export)
 * Body: { startDate: "YYYY-MM-DD", endDate: "YYYY-MM-DD" }
 * Response: { success: true, data: { rows: [{ date, revenue, orders, items, aov, cash, qr, discount, grabOrders, grabItems }] } }
 */

function addDays(d, n) {
  const date = new Date(d.getFullYear(), d.getMonth(), d.getDate() + n);
  return date.getFullYear() + '-' + String(date.getMonth() + 1).padStart(2, '0') + '-' + String(date.getDate()).padStart(2, '0');
}

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

    const orderRows = await env.DB.prepare(
      `SELECT date(created_at) as d,
              COUNT(*) as cnt,
              SUM(final_total) as rev,
              SUM(discount) as disc,
              SUM(CASE WHEN payment_method = 'cash' THEN final_total ELSE 0 END) as cash,
              SUM(CASE WHEN payment_method = 'qr' THEN final_total ELSE 0 END) as qr
       FROM orders
       WHERE date(created_at) >= ? AND date(created_at) <= ?
       GROUP BY d ORDER BY d`
    ).bind(startDate, endDate).all();

    const orderItemsRows = await env.DB.prepare(
      `SELECT date(o.created_at) as d, SUM(oi.qty) as items
       FROM orders o JOIN order_items oi ON oi.order_id = o.id
       WHERE date(o.created_at) >= ? AND date(o.created_at) <= ?
       GROUP BY d ORDER BY d`
    ).bind(startDate, endDate).all();

    const grabRows = await env.DB.prepare(
      `SELECT date(created_at) as d, COUNT(*) as cnt
       FROM grab_orders
       WHERE date(created_at) >= ? AND date(created_at) <= ?
       GROUP BY d ORDER BY d`
    ).bind(startDate, endDate).all();

    const grabItemsRows = await env.DB.prepare(
      `SELECT date(go.created_at) as d, SUM(goi.qty) as items
       FROM grab_orders go JOIN grab_order_items goi ON goi.grab_order_id = go.id
       WHERE date(go.created_at) >= ? AND date(go.created_at) <= ?
       GROUP BY d ORDER BY d`
    ).bind(startDate, endDate).all();

    const byDay = {};
    for (const r of orderRows.results) byDay[r.d] = Object.assign({ cnt: 0, rev: 0, disc: 0, cash: 0, qr: 0, items: 0, grabCnt: 0, grabItems: 0 }, r);
    for (const r of orderItemsRows.results) if (byDay[r.d]) byDay[r.d].items = r.items;
    for (const r of grabRows.results) if (byDay[r.d]) byDay[r.d].grabCnt = r.cnt;
    for (const r of grabItemsRows.results) if (byDay[r.d]) byDay[r.d].grabItems = r.items;

    const rows = [];
    let cursor = startDate;
    while (cursor <= endDate) {
      const d = byDay[cursor] || { cnt: 0, rev: 0, disc: 0, cash: 0, qr: 0, items: 0, grabCnt: 0, grabItems: 0 };
      const orders = d.cnt || 0;
      const revenue = Math.round(d.rev || 0);
      rows.push({
        date: cursor,
        revenue: revenue,
        orders: orders,
        items: d.items || 0,
        aov: orders > 0 ? Math.round(revenue / orders) : 0,
        cash: Math.round(d.cash || 0),
        qr: Math.round(d.qr || 0),
        discount: Math.round(d.disc || 0),
        grabOrders: d.grabCnt || 0,
        grabItems: d.grabItems || 0
      });
      cursor = addDays(new Date(cursor), 1);
    }

    return new Response(
      JSON.stringify({ success: true, data: { rows, startDate, endDate } }),
      { headers: { 'content-type': 'application/json' } }
    );
  } catch (e) {
    return new Response(
      JSON.stringify({ success: false, error: 'Failed to generate monthly report' }),
      { status: 500, headers: { 'content-type': 'application/json' } }
    );
  }
}

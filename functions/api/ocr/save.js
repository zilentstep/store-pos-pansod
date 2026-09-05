export async function onRequest(context) {
  const { request, env } = context;
  const data = await request.json();

  // Basic validation
  if (!data.supplier_name || !data.items) {
    return new Response(JSON.stringify({ success: false, error: 'Invalid data' }), { status: 400 });
  }

  try {
    await env.DB.batch([
      env.DB.prepare("INSERT INTO supplier_bills (supplier_name, bill_date, total_amount) VALUES (?, ?, ?)")
        .bind(data.supplier_name, data.bill_date, 0), // total_amount to be updated or calculated
      ...data.items.map(item => env.DB.prepare(
        "INSERT INTO supplier_bill_items (bill_id, item_name, qty, price, category) VALUES (last_insert_rowid(), ?, ?, ?, ?)"
      ).bind(item.name, item.qty, item.price, item.category))
    ]);

    return new Response(JSON.stringify({ success: true }));
  } catch (e) {
    return new Response(JSON.stringify({ success: false, error: e.message }), { status: 500 });
  }
}

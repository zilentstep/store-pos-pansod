/**
 * POST /api/menu/save
 * Replaces all menu items (transaction)
 * Body: { menu: [{ id, cat, en, th, price }] }
 * Response: { success: boolean }
 */

export async function onRequest(context) {
  try {
    const { request, env } = context;
    const body = await request.json();
    const menu = body?.menu;

    if (!Array.isArray(menu)) {
      return new Response(
        JSON.stringify({ success: false, error: 'Invalid menu data' }),
        { status: 400, headers: { 'content-type': 'application/json' } }
      );
    }

    // Replace all items in a transaction
    const tx = env.DB.prepare("DELETE FROM menu_items");

    const insertStmts = menu.map((item, index) => {
      return env.DB.prepare(
        "INSERT INTO menu_items (id, cat, en_name, th_name, price, sort_order) VALUES (?, ?, ?, ?, ?, ?)"
      ).bind(
        item.id || `m${Date.now()}${Math.random().toString(36).slice(2, 6)}`,
        item.cat || '',
        item.en || '',
        item.th || '',
        item.price || 0,
        index + 1
      );
    });

    await env.DB.batch([tx, ...insertStmts]);

    return new Response(
      JSON.stringify({ success: true }),
      { headers: { 'content-type': 'application/json' } }
    );
  } catch (e) {
    return new Response(
      JSON.stringify({ success: false, error: 'Failed to save menu' }),
      { status: 500, headers: { 'content-type': 'application/json' } }
    );
  }
}

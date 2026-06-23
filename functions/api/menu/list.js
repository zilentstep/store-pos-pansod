/**
 * POST /api/menu/list
 * Returns all menu items ordered by sort_order
 * Response: { success: true, data: menuItems[] }
 */

export async function onRequest(context) {
  try {
    const { env } = context;
    const result = await env.DB.prepare(
      "SELECT id, cat, en_name, th_name, price, sort_order FROM menu_items ORDER BY sort_order ASC"
    ).all();

    const items = result.results.map(row => ({
      id: row.id,
      cat: row.cat,
      en: row.en_name,
      th: row.th_name || '',
      price: row.price
    }));

    return new Response(
      JSON.stringify({ success: true, data: items }),
      { headers: { 'content-type': 'application/json' } }
    );
  } catch (e) {
    return new Response(
      JSON.stringify({ success: false, error: 'Failed to fetch menu' }),
      { status: 500, headers: { 'content-type': 'application/json' } }
    );
  }
}

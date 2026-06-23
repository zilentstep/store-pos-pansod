/**
 * POST /api/orders/delete
 * Deletes an order and its items
 * Body: { id: number }
 * Response: { success: boolean }
 */

export async function onRequest(context) {
  try {
    const { request, env } = context;
    const body = await request.json();
    const { id } = body;

    if (!id) {
      return new Response(
        JSON.stringify({ success: false, error: 'id required' }),
        { status: 400, headers: { 'content-type': 'application/json' } }
      );
    }

    // Delete items first (CASCADE should handle this, but explicit is safer)
    await env.DB.prepare("DELETE FROM order_items WHERE order_id = ?").bind(id).run();
    await env.DB.prepare("DELETE FROM orders WHERE id = ?").bind(id).run();

    return new Response(
      JSON.stringify({ success: true }),
      { headers: { 'content-type': 'application/json' } }
    );
  } catch (e) {
    return new Response(
      JSON.stringify({ success: false, error: 'Failed to delete order' }),
      { status: 500, headers: { 'content-type': 'application/json' } }
    );
  }
}

/**
 * POST /api/grab/delete
 * Deletes a grab order and its items
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

    await env.DB.prepare("DELETE FROM grab_order_items WHERE grab_order_id = ?").bind(id).run();
    await env.DB.prepare("DELETE FROM grab_orders WHERE id = ?").bind(id).run();

    return new Response(
      JSON.stringify({ success: true }),
      { headers: { 'content-type': 'application/json' } }
    );
  } catch (e) {
    return new Response(
      JSON.stringify({ success: false, error: 'Failed to delete grab order' }),
      { status: 500, headers: { 'content-type': 'application/json' } }
    );
  }
}

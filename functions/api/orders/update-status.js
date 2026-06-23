/**
 * POST /api/orders/update-status
 * Updates order status
 * Body: { id: number, status: string }
 * Response: { success: boolean }
 */

export async function onRequest(context) {
  try {
    const { request, env } = context;
    const body = await request.json();
    const { id, status } = body;

    if (!id || !status) {
      return new Response(
        JSON.stringify({ success: false, error: 'id and status required' }),
        { status: 400, headers: { 'content-type': 'application/json' } }
      );
    }

    const validStatuses = ['pending', 'preparing', 'completed', 'cancelled'];
    if (!validStatuses.includes(status)) {
      return new Response(
        JSON.stringify({ success: false, error: 'Invalid status' }),
        { status: 400, headers: { 'content-type': 'application/json' } }
      );
    }

    await env.DB.prepare(
      "UPDATE orders SET status = ? WHERE id = ?"
    ).bind(status, id).run();

    return new Response(
      JSON.stringify({ success: true }),
      { headers: { 'content-type': 'application/json' } }
    );
  } catch (e) {
    return new Response(
      JSON.stringify({ success: false, error: 'Failed to update status' }),
      { status: 500, headers: { 'content-type': 'application/json' } }
    );
  }
}

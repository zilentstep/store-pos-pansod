/**
 * POST /api/customers/adjust-points
 * Manually add or deduct points for a customer
 * Body: { id: number, delta: number, notes: string }
 * Response: { success: true, data: { newPoints } }
 */

export async function onRequest(context) {
  try {
    const { request, env } = context;
    const body = await request.json();
    const { id, delta, notes } = body || {};

    if (!id || typeof delta !== 'number' || delta === 0) {
      return new Response(
        JSON.stringify({ success: false, error: 'Customer ID and non-zero point delta are required' }),
        { status: 400, headers: { 'content-type': 'application/json' } }
      );
    }

    const customer = await env.DB.prepare(
      'SELECT id, points FROM customers WHERE id = ?'
    ).bind(id).first();

    if (!customer) {
      return new Response(
        JSON.stringify({ success: false, error: 'Customer not found' }),
        { status: 404, headers: { 'content-type': 'application/json' } }
      );
    }

    const newPoints = Math.max(0, (customer.points || 0) + delta);
    const actualDelta = newPoints - (customer.points || 0);

    const now = new Date();
    const gmt7 = new Date(now.getTime() + 7 * 60 * 60 * 1000);
    const createdAt = gmt7.toISOString().replace('Z', '+07:00');

    await env.DB.prepare(`
      UPDATE customers SET points = ? WHERE id = ?
    `).bind(newPoints, id).run();

    await env.DB.prepare(`
      INSERT INTO customer_points_ledger (customer_id, change_type, points_delta, notes, created_at)
      VALUES (?, 'MANUAL', ?, ?, ?)
    `).bind(id, actualDelta, notes || 'Manual adjustment by cashier', createdAt).run();

    return new Response(
      JSON.stringify({ success: true, data: { newPoints } }),
      { headers: { 'content-type': 'application/json' } }
    );
  } catch (e) {
    return new Response(
      JSON.stringify({ success: false, error: e.message || 'Failed to adjust points' }),
      { status: 500, headers: { 'content-type': 'application/json' } }
    );
  }
}

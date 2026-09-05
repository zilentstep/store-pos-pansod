/**
 * POST /api/customers/update
 * Updates customer details (phone, name, birthday, sex)
 * Body: { id, phone, name, birthday, sex }
 * Response: { success: true }
 */

export async function onRequest(context) {
  try {
    const { request, env } = context;
    const body = await request.json();
    let { id, phone, name, birthday, sex } = body || {};

    if (!id || !phone || !name) {
      return new Response(
        JSON.stringify({ success: false, error: 'ID, Phone number, and Name are required' }),
        { status: 400, headers: { 'content-type': 'application/json' } }
      );
    }

    const cleanPhone = phone.replace(/\D/g, '').trim();
    name = name.trim();
    birthday = birthday ? birthday.trim() : null;
    sex = sex ? sex.trim() : 'unspecified';

    // Check if phone number is taken by another customer
    const existing = await env.DB.prepare(
      'SELECT id FROM customers WHERE phone = ? AND id != ?'
    ).bind(cleanPhone, id).first();

    if (existing) {
      return new Response(
        JSON.stringify({ success: false, error: 'This phone number belongs to another customer' }),
        { status: 409, headers: { 'content-type': 'application/json' } }
      );
    }

    await env.DB.prepare(`
      UPDATE customers
      SET phone = ?, name = ?, birthday = ?, sex = ?
      WHERE id = ?
    `).bind(cleanPhone, name, birthday, sex, id).run();

    return new Response(
      JSON.stringify({ success: true }),
      { headers: { 'content-type': 'application/json' } }
    );
  } catch (e) {
    return new Response(
      JSON.stringify({ success: false, error: e.message || 'Failed to update customer' }),
      { status: 500, headers: { 'content-type': 'application/json' } }
    );
  }
}

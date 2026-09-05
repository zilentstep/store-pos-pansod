export async function onRequest(context) {
  const { request, env } = context;

  if (request.method !== 'POST') {
    return new Response(JSON.stringify({ success: false, error: 'Method not allowed' }), { status: 405 });
  }

  try {
    const formData = await request.formData();
    const image = formData.get('image');

    if (!image) {
      return new Response(JSON.stringify({ success: false, error: 'No image provided' }), { status: 400 });
    }

    // TODO: Implement AI API call (e.g., Gemini or OpenAI)
    // 1. Convert image to base64 or buffer
    // 2. Call AI API with prompt:
    //    "Extract items, qty, price, category from this receipt. Return JSON: {supplier_name, bill_date, total_amount, items: [{name, qty, price, category}]}"
    
    // For now, return a dummy response to verify the flow
    return new Response(JSON.stringify({
      success: true,
      data: {
        supplier_name: "Mock Supplier",
        bill_date: "2025-08-15",
        total_amount: 10000,
        items: [{ name: "Test Item", qty: 1, price: 10000, category: "Food" }]
      }
    }), { headers: { 'content-type': 'application/json' } });

  } catch (e) {
    return new Response(JSON.stringify({ success: false, error: 'OCR processing failed: ' + e.message }), { status: 500 });
  }
}

document.addEventListener('DOMContentLoaded', () => {
    const pin = sessionStorage.getItem('pos-pin');
    if (!pin) {
        document.getElementById('pin-screen').style.display = 'flex';
    }

    document.getElementById('pin-submit').addEventListener('click', () => {
        const pinInput = document.getElementById('pin-input').value;
        // Simple auth check - just set for now since middleware handles the API protection
        sessionStorage.setItem('pos-pin', pinInput);
        document.getElementById('pin-screen').style.display = 'none';
    });

    document.getElementById('process-btn').addEventListener('click', async () => {
        const fileInput = document.getElementById('image-upload');
        if (!fileInput.files[0]) return alert('Select image');
        
        const formData = new FormData();
        formData.append('image', fileInput.files[0]);

        const response = await fetch('/api/ocr/parse', {
            method: 'POST',
            headers: { 'x-pin': sessionStorage.getItem('pos-pin') },
            body: formData
        });

        const result = await response.json();
        if (result.success) renderResults(result.data);
    });

    function renderResults(data) {
        document.getElementById('results-area').style.display = 'block';
        document.getElementById('supplier-name').value = data.supplier_name;
        document.getElementById('bill-date').value = data.bill_date;
        
        const tbody = document.querySelector('#items-table tbody');
        tbody.innerHTML = '';
        data.items.forEach(item => {
            tbody.innerHTML += `<tr>
                <td><input type="text" value="${item.name}" class="edit-input"></td>
                <td><input type="number" value="${item.qty}" class="edit-input"></td>
                <td><input type="number" value="${item.price}" class="edit-input"></td>
                <td><input type="text" value="${item.category}" class="edit-input"></td>
            </tr>`;
        });
    }

    document.getElementById('save-btn').addEventListener('click', async () => {
        // Collect data and send to /api/ocr/save
        const rows = document.querySelectorAll('#items-table tbody tr');
        const items = Array.from(rows).map(row => ({
            name: row.cells[0].querySelector('input').value,
            qty: parseFloat(row.cells[1].querySelector('input').value),
            price: parseInt(row.cells[2].querySelector('input').value),
            category: row.cells[3].querySelector('input').value
        }));

        const data = {
            supplier_name: document.getElementById('supplier-name').value,
            bill_date: document.getElementById('bill-date').value,
            items: items
        };

        const response = await fetch('/api/ocr/save', {
            method: 'POST',
            headers: { 'x-pin': sessionStorage.getItem('pos-pin'), 'content-type': 'application/json' },
            body: JSON.stringify(data)
        });

        if ((await response.json()).success) alert('Saved!');
    });
});

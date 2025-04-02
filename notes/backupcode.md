price in services
<td>₱${isNaN(service.price) ? '0.00' : parseFloat(service.price).toLocaleString('en-PH', { minimumFractionDigits: 2 })}</td>

    const price = document.getElementById('service-price').value.trim();


➕ -> ADD
💾 -> SAVE
✏️ -> EDIT
🗑️ -> DELETE
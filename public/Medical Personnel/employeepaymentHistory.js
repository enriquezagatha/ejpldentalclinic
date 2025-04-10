let currentPage = 1;
const pageSize = 10; 
let totalPages = 1;
let lastSyncedPayments = [];
let lastSyncTimestamp = 0;

function fetchPayments(page = 1) {
    fetch(`http://localhost:3000/api/payment/getpayments?page=${page}&limit=${pageSize}`)
        .then(response => response.json())
        .then(data => {
            if (!data.payments || data.payments.length === 0) {
                console.warn("⚠ No payment records found.");
                return;
            }

            lastSyncedPayments = data.payments;
            totalPages = data.totalPages;
            currentPage = data.currentPage;
            updateTable(data.payments);
            updatePaginationControls();
        })
        .catch(error => console.error("❌ Error fetching payments:", error));
}

function updateTable(payments) {
    console.log(`🔄 Updating table with ${payments.length} payments.`);
    const tableBody = document.getElementById("payment-tbody"); // Ensure correct tbody ID
    tableBody.innerHTML = "";

    payments.forEach(payment => {
        const row = document.createElement("tr");
        row.innerHTML = `
            <td class="px-6 py-4 text-sm text-gray-700">${payment.patientName}</td>
            <td class="px-6 py-4 text-sm text-gray-700">${payment.email}</td>
            <td class="px-6 py-4 text-sm text-gray-700">${payment.treatment}</td>
            <td class="px-6 py-4 text-sm text-gray-700">₱${(payment.amount / 100).toFixed(2)}</td>
            <td class="px-6 py-4 text-sm font-semibold" style="color: ${payment.status === "paid" ? "green" : "red"};">${payment.status.charAt(0).toUpperCase() + payment.status.slice(1)}</td>
            <td class="px-6 py-4 text-sm text-gray-700">${new Date(payment.createdAt).toLocaleString()}</td>
        `;
        tableBody.appendChild(row);
    });
}

function updatePaginationControls() {
    const paginationContainer = document.getElementById("pagination-controls");
    paginationContainer.innerHTML = `
        <button class="bg-[#2C4A66] text-white px-2 py-1 rounded hover:bg-[#1E354D] focus:outline-none focus:ring-2 focus:ring-[#2C4A66]" onclick="prevPage()" ${currentPage === 1 ? "disabled" : ""}>⬅</button>
        <span class="p-2 mx-4 text-sm font-medium text-gray-700"> Page ${currentPage} of ${totalPages} </span>
        <button class="bg-[#2C4A66] text-white px-2 py-1 rounded hover:bg-[#1E354D] focus:outline-none focus:ring-2 focus:ring-[#2C4A66]" onclick="nextPage()" ${currentPage === totalPages ? "disabled" : ""}>➡</button>
    `;
}

function prevPage() {
    if (currentPage > 1) {
        fetchPayments(currentPage - 1);
    }
}

function nextPage() {
    if (currentPage < totalPages) {
        fetchPayments(currentPage + 1);
    }
}

function autoSyncPayments() {
    console.log("🔄 Auto-sync started...");

    fetch("http://localhost:3000/api/payment/sync")
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`);
            }
            return response.json();
        })
        .then(data => {
            const now = Date.now();
            if (now - lastSyncTimestamp < 60000) return; // Prevent duplicate logs
            lastSyncTimestamp = now; // ✅ Correctly update the timestamp

            console.log(`✅ Auto-sync completed at ${new Date().toLocaleTimeString()}`);
            fetchPayments(currentPage); // Refresh table after syncing
        })
        .catch(error => console.error("❌ Error syncing payments:", error));
}

// 📌 Initial load
document.addEventListener("DOMContentLoaded", () => {
    console.log("📌 Page loaded, fetching initial payments...");
    fetchPayments();  // Load payments on first load
    autoSyncPayments(); // Run initial sync
});

// 🕒 Run Auto-Sync Every 2 Minutes
setInterval(autoSyncPayments, 120000); // 120,000 ms = 2 minutes
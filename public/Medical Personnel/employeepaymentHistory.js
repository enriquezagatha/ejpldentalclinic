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
    const tableBody = document.getElementById("payment-tbody");
    tableBody.innerHTML = "";

    payments.forEach(payment => {
        const patientName = payment?.patientName || "N/A";
        const email = payment?.email || "N/A";
        const treatment = payment?.treatment || "N/A";
        const amount = typeof payment?.amount === "number" ? payment.amount / 100 : 0;
        const createdAt = payment?.createdAt ? new Date(payment.createdAt).toLocaleString() : "N/A";

        // Check if status is available
        const status = payment?.status ?? "unknown";
        const statusDisplay = status.charAt(0).toUpperCase() + status.slice(1);

        let statusColor = "gray"; // default/fallback
        if (status === "paid") statusColor = "green";
        else if (["unpaid", "failed"].includes(status)) statusColor = "red";

        // Check for malformed payment data
        if (!payment?.status || !payment?.referenceId) {
            console.warn("⚠ Malformed payment object:", payment);
        }

        // Create a table row
        const row = document.createElement("tr");
        row.innerHTML = `
            <td class="px-6 py-4 text-sm text-gray-700">${patientName}</td>
            <td class="px-6 py-4 text-sm text-gray-700">${email}</td>
            <td class="px-6 py-4 text-sm text-gray-700">${treatment}</td>
            <td class="px-6 py-4 text-sm text-gray-700">₱${amount.toFixed(2)}</td>
            <td class="px-6 py-4 text-sm font-semibold" style="color: ${statusColor};">${statusDisplay}</td>
            <td class="px-6 py-4 text-sm text-gray-700">${createdAt}</td>
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
            if (now - lastSyncTimestamp < 60000) return;
            lastSyncTimestamp = now;

            console.log(`✅ Auto-sync completed at ${new Date().toLocaleTimeString()}`);
            fetchPayments(currentPage);
        })
        .catch(error => console.error("❌ Error syncing payments:", error));
}

// 📌 Initial load
document.addEventListener("DOMContentLoaded", () => {
    console.log("📌 Page loaded, fetching initial payments...");
    fetchPayments();
    autoSyncPayments();
});

// 🕒 Run Auto-Sync Every 2 Minutes
setInterval(autoSyncPayments, 120000);
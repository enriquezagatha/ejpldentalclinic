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
    const tableBody = document.getElementById("payment-table");
    tableBody.innerHTML = "";

    payments.forEach(payment => {
        const row = document.createElement("tr");
        row.innerHTML = `
            <td>${payment.patientName}</td>
            <td>${payment.email}</td>
            <td>${payment.treatment}</td>
            <td>₱${(payment.amount / 100).toFixed(2)}</td>
            <td style="color: ${payment.status === "paid" ? "green" : "red"};">${payment.status}</td>
            <td>${new Date(payment.createdAt).toLocaleString()}</td>
            <td>
                <button class="delete-btn" onclick="deletePayment('${payment._id}')">❌ Delete</button>
            </td>
        `;
        tableBody.appendChild(row);
    });
}

function deletePayment(paymentId) {
    if (!confirm("Are you sure you want to delete this payment? This action cannot be undone.")) {
        return;
    }

    fetch(`http://localhost:3000/api/payment/payments/${paymentId}`, { method: "DELETE" })
        .then(response => response.json())
        .then(data => {
            if (data.error) {
                console.error("❌ Error deleting payment:", data.error);
                alert("Failed to delete payment.");
            } else {
                console.log("✅ Payment deleted successfully!");
                fetchPayments(); // Refresh table
            }
        })
        .catch(error => {
            console.error("❌ Error:", error);
            alert("An error occurred while deleting the payment.");
        });
}

function updatePaginationControls() {
    const paginationContainer = document.getElementById("pagination-controls");
    paginationContainer.innerHTML = `
        <button onclick="prevPage()" ${currentPage === 1 ? "disabled" : ""}>⬅ Prev</button>
        <span> Page ${currentPage} of ${totalPages} </span>
        <button onclick="nextPage()" ${currentPage === totalPages ? "disabled" : ""}>Next ➡</button>
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
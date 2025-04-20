let currentPage = 1;
const pageSize = 5; // Updated to 5 payments per page
let totalPages = 1;
let lastSyncedPayments = [];
let lastSyncTimestamp = 0;

function fetchPayments(page = 1) {
  const tableBody = document.getElementById("payment-tbody");
  tableBody.innerHTML = `
    <tr id="loading-row">
        <td colspan="6" class="text-center py-6 text-gray-500">
            <i class="fas fa-spinner fa-spin text-4xl mb-2 text-gray-400"></i>
            <p class="text-lg font-semibold">Loading balances...</p>
        </td>
    </tr>
  `; // Show loading spinner

  fetch(
    `${window.location.origin}/api/payment/getpayments?page=${page}&limit=${pageSize}`
  )
    .then((response) => response.json())
    .then((data) => {
      if (!data.payments || data.payments.length === 0) {
        console.warn("⚠ No payment records found.");
        tableBody.innerHTML =
          '<tr><td colspan="6" class="text-center text-gray-500 py-4">No payments found.</td></tr>';
        const paginationContainer = document.getElementById(
          "pagination-controls"
        );
        paginationContainer.innerHTML = ""; // Clear pagination
        return;
      }

      lastSyncedPayments = data.payments;
      totalPages = data.totalPages;
      currentPage = data.currentPage;
      updateTable(data.payments);
      updatePaginationControls();
    })
    .catch((error) => {
      console.error("❌ Error fetching payments:", error);
      tableBody.innerHTML =
        '<tr><td colspan="6" class="text-center text-red-500 py-4">Error loading payments. Please try again later.</td></tr>';
    });
}

function updateTable(payments) {
  console.log(`🔄 Updating table with ${payments.length} payments.`);
  const tableBody = document.getElementById("payment-tbody");
  tableBody.innerHTML = "";

  payments.forEach((payment) => {
    const patientName = payment?.patientName || "N/A";
    const email = payment?.email || "N/A";
    const treatment = payment?.treatment || "N/A";
    const amount =
      typeof payment?.amount === "number" ? payment.amount / 100 : 0;
    const createdAt = payment?.createdAt
      ? new Date(payment.createdAt).toLocaleString()
      : "N/A";

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
            <td class="px-6 py-4 text-sm text-gray-700">₱${amount.toFixed(
              2
            )}</td>
            <td class="px-6 py-4 text-sm font-semibold" style="color: ${statusColor};">${statusDisplay}</td>
            <td class="px-6 py-4 text-sm text-gray-700">${createdAt}</td>
        `;
    tableBody.appendChild(row);
  });
}

function updatePaginationControls() {
  const paginationContainer = document.getElementById("pagination-controls");
  paginationContainer.innerHTML = ""; // Clear existing pagination

  if (totalPages <= 1) return; // No pagination needed for 1 or fewer pages

  // Previous arrow
  if (currentPage > 1) {
    const prevButton = document.createElement("button");
    prevButton.innerHTML = "<span class='font-bold'>&lt;</span>"; // Use < for previous
    prevButton.className =
      "px-3 py-1 mx-1 bg-gray-200 text-gray-700 rounded-md";
    prevButton.onclick = () => fetchPayments(currentPage - 1);
    paginationContainer.appendChild(prevButton);
  }

  // Page buttons
  for (let i = 1; i <= totalPages; i++) {
    const button = document.createElement("button");
    button.innerText = i;
    button.className = `px-3 py-1 mx-1 rounded-md ${
      i === currentPage
        ? "bg-[#2C4A66] text-white"
        : "bg-gray-200 text-gray-700"
    }`;
    button.onclick = () => fetchPayments(i);
    paginationContainer.appendChild(button);
  }

  // Next arrow
  if (currentPage < totalPages) {
    const nextButton = document.createElement("button");
    nextButton.innerHTML = "<span class='font-bold'>&gt;</span>"; // Use > for next
    nextButton.className =
      "px-3 py-1 mx-1 bg-gray-200 text-gray-700 rounded-md";
    nextButton.onclick = () => fetchPayments(currentPage + 1);
    paginationContainer.appendChild(nextButton);
  }
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

  fetch(`${window.location.origin}/api/payment/sync`)
    .then((response) => {
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
      return response.json();
    })
    .then((data) => {
      const now = Date.now();
      if (now - lastSyncTimestamp < 60000) return;
      lastSyncTimestamp = now;

      console.log(
        `✅ Auto-sync completed at ${new Date().toLocaleTimeString()}`
      );
      fetchPayments(currentPage);
    })
    .catch((error) => console.error("❌ Error syncing payments:", error));
}

// 📌 Initial load
document.addEventListener("DOMContentLoaded", () => {
  console.log("📌 Page loaded, fetching initial payments...");
  fetchPayments();
  autoSyncPayments();
});

// 🕒 Run Auto-Sync Every 2 Minutes
setInterval(autoSyncPayments, 120000);

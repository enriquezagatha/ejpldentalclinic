document.addEventListener("DOMContentLoaded", function () {
  const paymentList = document.getElementById("paymentList");
  const totalPaymentsEl = document.getElementById("totalPayments");
  const totalRevenueEl = document.getElementById("totalRevenue");
  const totalPaidEl = document.getElementById("totalPaid");
  const loadingIndicator = document.getElementById("loadingIndicator");
  const paymentDropdownBtn = document.getElementById("paymentdropdownBtn");
  const paymentDropdownContent = document.getElementById(
    "paymentdropdownContent"
  );
  // const treatmentDropdownBtn = document.getElementById("treatmentdropdownBtn");
  // const treatmentDropdownContent = document.getElementById(
  //   "treatmentdropdownContent"
  // );
  const paymentfilterButton = document.getElementById("paymentfilterButton");
  const startDateInput = document.getElementById("paymentstartDate");
  const endDateInput = document.getElementById("paymentendDate");
  const downloadPaymentPdfBtn = document.getElementById(
    "downloadPaymentPdfBtn"
  );

  let selectedStatus = "";
  let selectedTreatment = "";

  // Set default date filters to today
  const today = new Date().toISOString().split("T")[0];
  startDateInput.value = today;
  endDateInput.value = today;

  // ✅ Toggle dropdown visibility when clicking the button
  paymentDropdownBtn.addEventListener("click", function () {
    paymentDropdownContent.classList.toggle("hidden");
  });

  // treatmentDropdownBtn.addEventListener("click", function () {
  //   treatmentDropdownContent.classList.toggle("hidden");
  // });

  // ✅ Handle dropdown selection for status
  document
    .querySelectorAll("#paymentdropdownContent div[data-value]")
    .forEach((option) => {
      option.addEventListener("click", function () {
        selectedStatus = this.dataset.value;
        paymentDropdownBtn.textContent = this.textContent;
        paymentDropdownContent.classList.add("hidden"); // Use class toggle instead of style.display
        console.log("✅ Selected Status:", selectedStatus);
      });
    });

  // ✅ Handle dropdown selection for treatment
  document
    .querySelectorAll("#treatmentdropdownContent div[data-value]")
    .forEach((option) => {
      option.addEventListener("click", function () {
        selectedTreatment = this.dataset.value;
        // treatmentDropdownBtn.textContent = this.textContent;
        treatmentDropdownContent.classList.add("hidden"); // Use class toggle instead of style.display
        console.log("✅ Selected Treatment:", selectedTreatment);
      });
    });

  // ✅ Close dropdowns when clicking outside
  document.addEventListener("click", function (event) {
    if (
      !paymentDropdownBtn.contains(event.target) &&
      !paymentDropdownContent.contains(event.target)
    ) {
      paymentDropdownContent.classList.add("hidden");
    }
    // if (
    //   !treatmentDropdownBtn.contains(event.target) &&
    //   !treatmentDropdownContent.contains(event.target)
    // ) {
    //   treatmentDropdownContent.classList.add("hidden");
    // }
  });

  // Fetch and display payments with filters
  async function fetchPayments() {
    const startDate = startDateInput.value ? startDateInput.value.trim() : null;
    const endDate = endDateInput.value ? endDateInput.value.trim() : null;
    let url = `/api/payment/getpayments?status=${
      selectedStatus || ""
    }&treatment=${selectedTreatment || ""}`;

    if (startDate) {
      url += `&startDate=${startDate}`;
    }
    if (endDate) {
      url += `&endDate=${endDate}`;
    }

    console.log("📡 Fetching Data from URL:", url);

    // Show loading spinner
    paymentList.innerHTML = `
      <tr>
        <td colspan="6" class="text-center py-6 text-gray-500">
          <i class="fas fa-spinner fa-spin text-4xl mb-2 text-gray-400"></i>
          <p class="text-lg font-semibold">Loading payment records...</p>
        </td>
      </tr>
    `;

    try {
      const response = await fetch(url);
      const data = await response.json();

      console.log("✅ API Response:", data);

      if (!response.ok) {
        throw new Error(data.error || "Failed to fetch payments");
      }

      if (!data.payments || !Array.isArray(data.payments)) {
        throw new Error("Invalid payments data received");
      }

      populateTable(data.payments);
      updateSummary(data.payments);
    } catch (error) {
      console.error("❌ Error fetching payments:", error);
      paymentList.innerHTML = `
        <tr>
          <td colspan="6" class="px-6 py-4 text-center text-red-500">
            Error loading data. Please try again later.
          </td>
        </tr>
      `;
    }
  }

  // Populate table with fetched data
  function populateTable(payments) {
    paymentList.innerHTML = "";

    if (payments.length === 0) {
      paymentList.innerHTML = `
        <tr>
          <td colspan="6" class="px-6 py-4 text-center text-gray-500">
            No payment records found.
          </td>
        </tr>
      `;
      return;
    }

    payments.forEach((payment) => {
      const row = document.createElement("tr");
      row.innerHTML = `
                <td class="px-6 py-4 text-sm text-gray-700">${
                  payment.patientName
                }</td>
                <td class="px-6 py-4 text-sm text-gray-700">${
                  payment.email
                }</td>
                <td class="px-6 py-4 text-sm text-gray-700">${
                  payment.treatment
                }</td>
                <td class="px-6 py-4 text-sm text-gray-700">₱${(
                  payment.amount / 100
                ).toFixed(2)}</td>
                <td class="px-6 py-4 text-sm font-semibold" style="color: ${
                  payment.status === "paid" ? "green" : "red"
                };">${
        payment.status.charAt(0).toUpperCase() + payment.status.slice(1)
      }</td>
                <td class="px-6 py-4 text-sm text-gray-700">${new Date(
                  payment.createdAt
                ).toLocaleDateString()}</td>
            `;
      paymentList.appendChild(row);
    });
  }

  // Update total transactions, revenue, and paid amount
  function updateSummary(payments) {
    totalPaymentsEl.textContent = payments.length;
    let totalRevenue = 0,
      totalPaid = 0;

    payments.forEach((payment) => {
      totalRevenue += payment.amount;
      if (payment.status === "paid") {
        totalPaid += payment.amount;
      }
    });

    totalRevenueEl.textContent = `₱${(totalRevenue / 100).toFixed(2)}`;
    totalPaidEl.textContent = `₱${(totalPaid / 100).toFixed(2)}`;
  }

  // Automatically fetch payments for the current day on page load
  fetchPayments();

  // Attach event listener to the filter button
  paymentfilterButton.addEventListener("click", fetchPayments);

  // Function to get the profile of the logged-in user
async function getProfile() {
  const response = await fetch("/api/medicalPersonnel/profile");

  if (response.ok) {
    const data = await response.json();
    return data;  // Return the profile data
  } else {
    alert("Failed to fetch profile data.");
    return null;
  }
}

// ✅ Update PDF Download Function
downloadPaymentPdfBtn.addEventListener("click", async function () {
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF();

  // Get logged-in user's profile data
  const userProfile = await getProfile();
  if (!userProfile) return; // If profile fetch fails, stop the PDF generation

  const preparedByName = `${userProfile.firstName} ${userProfile.lastName}`; // Full name
  const preparedByPosition = userProfile.position || "Medical Personnel"; // Position if available, fallback if not

  // ✅ Add Large Logo (Positioned on the Left)
  const imgUrl = "../media/logo/EJPL.png"; // Replace with actual logo URL or Base64
  doc.addImage(imgUrl, "PNG", 14, 10, 40, 40); // Logo on the left (X=14, Y=10, Width=40, Height=40)

  // ✅ Header Section (Clinic Name Bold, Address & Phone Normal)
  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.text("EJPL Dental Clinic", 105, 20, null, null, "center");

  doc.setFont("helvetica", "normal"); // Address & phone in normal font
  doc.setFontSize(10);
  doc.text(
    "B25 L2 Santan St. Queens Row West, Bacoor City, Cavite, Philippines",
    105,
    26,
    null,
    null,
    "center"
  );
  doc.text(
    "Phone: 0915-179-7522 | Landline: (046) 502-2063",
    105,
    32,
    null,
    null,
    "center"
  );

  // ✅ Horizontal line under header
  doc.setLineWidth(0.5);
  doc.line(14, 44, 196, 44); // Positioned below contact details

  // ✅ Report Title (Moved Down for Better Spacing)
  doc.setFont("helvetica", "bold");
  doc.setFontSize(18);
  doc.text("Patient Payment Report", 105, 50, null, null, "center");

  // ✅ Date & Summary Information
  const now = new Date();
  const options = {
    year: "numeric",
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  };
  const formattedDate = now.toLocaleString("en-US", options).replace(",", "");

  const totalPayments = totalPaymentsEl.textContent;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(11);
  doc.text(`Total Payments: ${totalPayments}`, 14, 58);
  doc.text(`As of ${formattedDate}`, 14, 64);

  // ✅ Extract Table Data
  const table = document.querySelector("table");
  const rows = Array.from(table.querySelectorAll("tbody tr")).map((row) =>
    Array.from(row.children).map((cell) => cell.innerText)
  );

  // ✅ Table Formatting
  doc.autoTable({
    head: [["Patient Name", "Email", "Treatment", "Amount", "Status", "Date"]],
    body: rows,
    startY: 70, // Adjusted for proper spacing
    theme: "striped",
    styles: {
      fontSize: 10,
      cellPadding: 3,
      valign: "middle",
    },
    headStyles: {
      fillColor: [41, 128, 185],
      textColor: [255, 255, 255],
      fontSize: 11,
      fontStyle: "bold",
    },
    alternateRowStyles: {
      fillColor: [240, 240, 240],
    },
  });

  // ✅ Footer Section
  const pageCount = doc.internal.getNumberOfPages();

  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);

    // ✅ "Prepared by" on the bottom **left**, moved higher
    doc.text(`Prepared By:`, 14, doc.internal.pageSize.height - 30);
    doc.text(preparedByName, 30, doc.internal.pageSize.height - 20);
    doc.text(preparedByPosition, 30, doc.internal.pageSize.height - 15);

    // ✅ Page number **centered**
    doc.text(
      `Page ${i} of ${pageCount}`,
      105,
      doc.internal.pageSize.height - 10,
      null,
      null,
      "center"
    );
  }

  // ✅ Save PDF
  doc.save("EJPL-PaymentReport.pdf");
});

// Attach event listener to the search bar
const paymentReportsSearch = document.getElementById("paymentReportsSearch");
paymentReportsSearch.addEventListener("input", function () {
  const searchTerm = this.value.toLowerCase();
  const rows = paymentList.querySelectorAll("tr");

  rows.forEach((row) => {
    const patientName = row.children[0]?.textContent.toLowerCase() || "";
    if (patientName.includes(searchTerm)) {
      row.style.display = "";
    } else {
      row.style.display = "none";
    }
  });
});
});
document.addEventListener("DOMContentLoaded", function () {
    const paymentList = document.getElementById("paymentList");
    const totalPaymentsEl = document.getElementById("totalPayments");
    const totalRevenueEl = document.getElementById("totalRevenue");
    const totalPaidEl = document.getElementById("totalPaid");
    const loadingIndicator = document.getElementById("loadingIndicator");
    const paymentDropdownBtn = document.getElementById("paymentdropdownBtn");
    const paymentDropdownContent = document.getElementById("paymentdropdownContent");
    const treatmentDropdownBtn = document.getElementById("treatmentdropdownBtn");
    const treatmentDropdownContent = document.getElementById("treatmentdropdownContent");
    const paymentfilterButton = document.getElementById("paymentfilterButton");
    const startDateInput = document.getElementById("paymentstartDate");
    const endDateInput = document.getElementById("paymentendDate");
    const downloadPaymentPdfBtn = document.getElementById("downloadPaymentPdfBtn");


    let selectedStatus = "";
    let selectedTreatment = "";

    // ✅ Toggle dropdown visibility when clicking the button
    paymentDropdownBtn.addEventListener("click", function () {
        paymentDropdownContent.classList.toggle("show");
    });

    treatmentDropdownBtn.addEventListener("click", function () {
        treatmentDropdownContent.classList.toggle("show");
    });

    // ✅ Handle dropdown selection for status
    paymentDropdownContent.querySelectorAll("div").forEach(item => {
        item.addEventListener("click", function () {
            selectedStatus = this.getAttribute("data-value");
            paymentDropdownBtn.textContent = this.textContent;
            paymentDropdownContent.classList.remove("show");

            console.log("✅ Selected Status:", selectedStatus);
        });
    });

    // ✅ Handle dropdown selection for treatment
    treatmentDropdownContent.querySelectorAll("div").forEach(item => {
        item.addEventListener("click", function () {
            selectedTreatment = this.getAttribute("data-value");
            treatmentDropdownBtn.textContent = this.textContent;
            treatmentDropdownContent.classList.remove("show");

            console.log("✅ Selected Treatment:", selectedTreatment);
        });
    });

    // ✅ Close dropdowns when clicking outside
    document.addEventListener("click", function (event) {
        if (!paymentDropdownBtn.contains(event.target) && !paymentDropdownContent.contains(event.target)) {
            paymentDropdownContent.classList.remove("show");
        }
        if (!treatmentDropdownBtn.contains(event.target) && !treatmentDropdownContent.contains(event.target)) {
            treatmentDropdownContent.classList.remove("show");
        }
    });

    // Fetch and display payments with filters
    async function fetchPayments() {
        const startDate = startDateInput.value ? startDateInput.value.trim() : null;
        const endDate = endDateInput.value ? endDateInput.value.trim() : null;
        let url = `/api/payment/getpayments?status=${selectedStatus || ""}&treatment=${selectedTreatment || ""}`;

        if (startDate) {
            url += `&startDate=${startDate}`;
        }
        if (endDate) {
            url += `&endDate=${endDate}`;
        }

        console.log("📡 Fetching Data from URL:", url);
        console.log("📅 Start Date:", startDate || "Not Set");
        console.log("📅 End Date:", endDate || "Not Set");
        console.log("📌 Status:", selectedStatus || "Not Set");
        console.log("🦷 Treatment:", selectedTreatment || "Not Set");

        loadingIndicator.style.display = "block";

        try {
            const response = await fetch(url);
            const data = await response.json();

            console.log("✅ API Response:", data);

            loadingIndicator.style.display = "none";

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
            loadingIndicator.style.display = "none";
        }
    }

    // Populate table with fetched data
    function populateTable(payments) {
        paymentList.innerHTML = "";

        if (payments.length === 0) {
            paymentList.innerHTML = "<tr><td colspan='6'>No data available</td></tr>";
            return;
        }

        payments.forEach(payment => {
            const row = document.createElement("tr");
            row.innerHTML = `
                <td>${payment.patientName}</td>
                <td>${payment.email}</td>
                <td>${payment.treatment}</td>
                <td>₱${(payment.amount / 100).toFixed(2)}</td>
                <td>${payment.status}</td>
                <td>${new Date(payment.createdAt).toLocaleDateString()}</td>
            `;
            paymentList.appendChild(row);
        });
    }

    // Update total transactions, revenue, and paid amount
    function updateSummary(payments) {
        totalPaymentsEl.textContent = payments.length;
        let totalRevenue = 0, totalPaid = 0;

        payments.forEach(payment => {
            totalRevenue += payment.amount;
            if (payment.status === "paid") {
                totalPaid += payment.amount;
            }
        });

        totalRevenueEl.textContent = `₱${(totalRevenue / 100).toFixed(2)}`;
        totalPaidEl.textContent = `₱${(totalPaid / 100).toFixed(2)}`;
    }

    // Attach event listener to the filter button
    paymentfilterButton.addEventListener("click", fetchPayments);

    // ✅ Function to download treatment report as PDF
    downloadPaymentPdfBtn.addEventListener("click", function () {
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF();

        // ✅ Add Large Logo (Positioned on the Left)
        const imgUrl = "../media/logo/EJPL.png"; // Replace with actual logo URL or Base64
        doc.addImage(imgUrl, "PNG", 14, 10, 40, 40);

        // ✅ Header Section
        doc.setFont("helvetica", "bold");
        doc.setFontSize(14);
        doc.text("EJPL Dental Clinic", 105, 20, null, null, "center");

        doc.setFont("helvetica", "normal");
        doc.setFontSize(10);
        doc.text("B25 L2 Santan St. Queens Row West, Bacoor City, Cavite, Philippines", 105, 26, null, null, "center");
        doc.text("Phone: 0915-179-7522 | Landline: (046) 502-2063", 105, 32, null, null, "center");

        // ✅ Horizontal line
        doc.setLineWidth(0.5);
        doc.line(14, 44, 196, 44);

        // ✅ Report Title
        doc.setFontSize(18);
        doc.text("Patient Payment Report", 105, 50, null, null, "center");

        // ✅ Date & Summary Information
        const now = new Date();
        const formattedDate = now.toLocaleString("en-US", { year: "numeric", month: "short", day: "2-digit", hour: "2-digit", minute: "2-digit", hour12: true }).replace(",", "");
        const totalPayments = totalPaymentsEl.textContent;

        doc.setFontSize(11);
        doc.text(`Total Patients: ${totalPayments}`, 14, 58);
        doc.text(`As of ${formattedDate}`, 14, 64);

        // ✅ Extract Table Data
        const table = document.querySelector("table");
        const rows = Array.from(table.querySelectorAll("tbody tr")).map(row =>
            Array.from(row.children).map(cell => cell.innerText)
        );

        // ✅ Table Formatting
        doc.autoTable({
            head: [["Name", "Gender", "Contact Number"]],
            body: rows,
            startY: 70,
            theme: "striped",
        });

        // ✅ Footer Section
        const pageCount = doc.internal.getNumberOfPages();
        const preparedByName = "Dr. Ely Jesse P. Legaspi"; // Replace dynamically with logged-in user
        const preparedByPosition = "Position in the Company"; // Replace dynamically if needed

        for (let i = 1; i <= pageCount; i++) {
            doc.setPage(i);

            // ✅ "Prepared by" on the bottom **left**, moved higher
            doc.text(`Prepared By:`, 14, doc.internal.pageSize.height - 30);
            doc.text(preparedByName, 30, doc.internal.pageSize.height - 20);
            doc.text(preparedByPosition, 30, doc.internal.pageSize.height - 15);

            // ✅ Page number **centered**
            doc.text(`Page ${i} of ${pageCount}`, 105, doc.internal.pageSize.height - 10, null, null, "center");
        }

        // ✅ Save PDF
        doc.save("EJPL-PaymentReport.pdf");
    });
});
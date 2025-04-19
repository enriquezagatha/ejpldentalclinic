document.addEventListener("DOMContentLoaded", function () {
  const startDateInput = document.getElementById("patientstartDate");
  const endDateInput = document.getElementById("patientendDate");
  const patientfilterButton = document.getElementById("patientfilterButton");
  const patientList = document.getElementById("patientList");
  const totalPatientsElement = document.getElementById("totalPatients");
  const downloadPdfBtn = document.getElementById("patientdownloadPdfBtn");

  const today = new Date().toISOString().split("T")[0];
  startDateInput.value = today;
  endDateInput.value = today;

  async function fetchReport() {
    try {
      const startDate = startDateInput.value;
      const endDate = endDateInput.value;

      if (!startDate || !endDate) {
        alert("Please select both start and end dates.");
        return;
      }

      // Show loading spinner
      patientList.innerHTML = `
        <tr>
          <td colspan="4" class="text-center py-6 text-gray-500">
            <i class="fas fa-spinner fa-spin text-4xl mb-2 text-gray-400"></i>
            <p class="text-lg font-semibold">Loading patient records...</p>
          </td>
        </tr>
      `;

      const response = await fetch(
        `/api/appointments/appointment-report?startDate=${startDate}&endDate=${endDate}`
      );
      const data = await response.json();

      console.log("Fetched appointments:", data.appointments); // ✅ Debug API response in console

      const appointments = data.appointments || []; // Ensure it's always an array

      patientList.innerHTML = ""; // Clear loading spinner

      if (appointments.length === 0) {
        patientList.innerHTML = `
          <tr>
            <td colspan="4" class="px-6 py-4 text-center text-gray-500">
              No patient records found.
            </td>
          </tr>
        `;
        totalPatientsElement.textContent = "0";
        return;
      }

      totalPatientsElement.textContent = appointments.length;

      appointments.forEach((appointment) => {
        const row = `
          <tr class="border-b hover:bg-gray-100">
            <td class="px-4 py-2 text-gray-700">${
              appointment.patientName || "N/A"
            }</td>
            <td class="px-4 py-2 text-gray-700">${
              appointment.patientGender || "N/A"
            }</td>
            <td class="px-4 py-2 text-gray-700">${
              appointment.contactNumber || "N/A"
            }</td>
            <td class="px-4 py-2 text-gray-700">${new Date(
              appointment.preferredDate
            ).toLocaleDateString()}</td>
          </tr>
        `;
        patientList.innerHTML += row;
      });
    } catch (error) {
      console.error("Error fetching report:", error);
      patientList.innerHTML = `
        <tr>
          <td colspan="4" class="px-6 py-4 text-center text-red-500">
            Error loading data. Please try again later.
          </td>
        </tr>
      `;
      totalPatientsElement.textContent = "0";
    }
  }

  // Automatically fetch records for the current day on page load
  fetchReport();

  patientfilterButton.addEventListener("click", fetchReport);

  // ✅ Update PDF Download Function
  downloadPdfBtn.addEventListener("click", function () {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();

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
    doc.text("Patient Record Report", 105, 50, null, null, "center");

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

    const totalPatients = totalPatientsElement.textContent;

    doc.setFont("helvetica", "normal");
    doc.setFontSize(11);
    doc.text(`Total Patients: ${totalPatients}`, 14, 58);
    doc.text(`As of ${formattedDate}`, 14, 64);

    // ✅ Extract Table Data
    const table = document.querySelector("table");
    const rows = Array.from(table.querySelectorAll("tbody tr")).map((row) =>
      Array.from(row.children).map((cell) => cell.innerText)
    );

    // ✅ Table Formatting
    doc.autoTable({
      head: [["Name", "Gender", "Contact Number"]],
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
    const preparedByName = "Dr. Ely Jesse P. Legaspi"; // Replace dynamically with logged-in user
    const preparedByPosition = "Position in the Company"; // Replace dynamically if needed

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
    doc.save("EJPL-PatientAppointmentReport.pdf");
  });
});

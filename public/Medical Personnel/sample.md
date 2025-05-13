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
downloadTreatmentPdfBtn.addEventListener("click", async function () {
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
  doc.text("Patient Treatment Report", 105, 50, null, null, "center");

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

  const totalTreatments = totalTreatmentsElement.textContent;
  const popularTreatments = popularTreatmentSpan.textContent;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(11);
  doc.text(`Most Popular Treatments: ${totalTreatments}`, 14, 58);
  doc.text(`Total Treatments: ${totalTreatments}`, 14, 60);
  doc.text(`As of ${formattedDate}`, 14, 64);

  // ✅ Extract Table Data
  const table = document.querySelector("table");
  const rows = Array.from(table.querySelectorAll("tbody tr")).map((row) =>
    Array.from(row.children).map((cell) => cell.innerText)
  );

  // ✅ Table Formatting
  doc.autoTable({
    head: [["Patient Name", "Treatment Name", "Treatment Date"]],
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
  doc.save("EJPL-PatientTreatmentReport.pdf");
});
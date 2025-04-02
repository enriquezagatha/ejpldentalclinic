document.addEventListener("DOMContentLoaded", function () {
    const treatmentList = document.getElementById("treatmentList");
    const totalTreatmentsSpan = document.getElementById("totalTreatments");
    const popularTreatmentSpan = document.getElementById("popularTreatment");
    const downloadTreatmentPdfBtn = document.getElementById("downloadTreatmentPdfBtn");
    const startDateInput = document.getElementById("startDate");
    const endDateInput = document.getElementById("endDate");
    const treatmentfilterButton = document.getElementById("treatmentfilterButton");

    // Custom dropdown elements
    const dropdownBtn = document.getElementById("dropdownBtn");
    const dropdownContent = document.getElementById("dropdownContent");
    const dropdownSearch = document.getElementById("dropdownSearch");
    let selectedTreatment = ""; // Holds selected treatment value

    // ✅ Automatically set start and end dates to today's date
    const today = new Date().toISOString().split("T")[0]; 
    startDateInput.value = today;
    endDateInput.value = today;

    async function fetchTreatmentReport() {
        try {
            const startDate = startDateInput.value;
            const endDate = endDateInput.value;

            if (!startDate || !endDate) {
                alert("Please select a start and end date.");
                return;
            }

            const response = await fetch(`/api/patientRecords/treatment-report?startDate=${startDate}&endDate=${endDate}&treatment=${encodeURIComponent(selectedTreatment)}`);
            const data = await response.json();

            console.log("Full API Response:", data); // ✅ Debugging: See full API data

            treatmentList.innerHTML = "";
            totalTreatmentsSpan.textContent = data.patients.length;

            if (data.patients.length === 0) {
                treatmentList.innerHTML = '<tr><td colspan="3">No treatment records found.</td></tr>';
                popularTreatmentSpan.textContent = "No Data"; 
                return;
            }

            let totalTreatments = 0;
            data.patients.forEach((record) => {
                record.treatments.forEach((treatment) => {
                    if (!selectedTreatment || treatment.treatmentType === selectedTreatment) { // Filter treatments
                        const row = `
                            <tr>
                                <td>${record.firstName} ${record.lastName}</td>
                                <td>${treatment.treatmentType || "No Name"}</td>
                                <td>${treatment.treatmentDate ? new Date(treatment.treatmentDate).toLocaleDateString() : "No Date"}</td>
                            </tr>
                        `;
                        treatmentList.innerHTML += row;
                        totalTreatments++;
                    }
                });
            });

            totalTreatmentsSpan.textContent = totalTreatments;

            function getMostPopularTreatment(patients) {
                const treatmentCount = {};
                patients.forEach((record) => {
                    record.treatments.forEach((treatment) => {
                        if (!selectedTreatment || treatment.treatmentType === selectedTreatment) { // Count only selected treatment
                            treatmentCount[treatment.treatmentType] = (treatmentCount[treatment.treatmentType] || 0) + 1;
                        }
                    });
                });

                return Object.keys(treatmentCount).reduce((a, b) => 
                    treatmentCount[a] > treatmentCount[b] ? a : b, 
                    "No Data"
                );
            }

            popularTreatmentSpan.textContent = getMostPopularTreatment(data.patients);

        } catch (error) {
            console.error("Error fetching treatment report:", error);
            treatmentList.innerHTML = '<tr><td colspan="3">Error loading data.</td></tr>';
            popularTreatmentSpan.textContent = "Error";
        }
    }

    // ✅ Custom Dropdown Logic
    dropdownBtn.addEventListener("click", function () {
        dropdownContent.style.display = dropdownContent.style.display === "block" ? "none" : "block";
    });

    dropdownSearch.addEventListener("keyup", function () {
        let searchValue = this.value.toLowerCase();
        let options = dropdownContent.querySelectorAll("div[data-value]");

        options.forEach(option => {
            let text = option.textContent.toLowerCase();
            option.style.display = text.includes(searchValue) ? "block" : "none";
        });
    });

    document.querySelectorAll(".dropdown-content div[data-value]").forEach(option => {
        option.addEventListener("click", function () {
            selectedTreatment = this.dataset.value;
            dropdownBtn.textContent = this.textContent;
            dropdownContent.style.display = "none";
        });
    });

    // ✅ Close dropdown when clicking outside
    document.addEventListener("click", function (event) {
        if (!dropdownBtn.contains(event.target) && !dropdownContent.contains(event.target)) {
            dropdownContent.style.display = "none";
        }
    });

    // ✅ Fetch report when clicking the filter button
    treatmentfilterButton.addEventListener("click", fetchTreatmentReport);

    // ✅ Function to download treatment report as PDF
    downloadTreatmentPdfBtn.addEventListener("click", function () {
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
        doc.text("B25 L2 Santan St. Queens Row West, Bacoor City, Cavite, Philippines", 105, 26, null, null, "center");
        doc.text("Phone: 0915-179-7522 | Landline: (046) 502-2063", 105, 32, null, null, "center");
    
        // ✅ Horizontal line under header
        doc.setLineWidth(0.5);
        doc.line(14, 44, 196, 44); // Positioned below contact details
    
        // ✅ Report Title (Moved Down for Better Spacing)
        doc.setFont("helvetica", "bold");
        doc.setFontSize(18);
        doc.text("Patient Treatment Report", 105, 50, null, null, "center");
    
        // ✅ Date & Summary Information
        const now = new Date();
        const options = { year: "numeric", month: "short", day: "2-digit", hour: "2-digit", minute: "2-digit", hour12: true };
        const formattedDate = now.toLocaleString("en-US", options).replace(",", "");
    
        const totalTreatments = totalTreatmentsSpan.textContent;
        const popularTreatments = popularTreatmentSpan.textContent;
    
        doc.setFont("helvetica", "normal");
        doc.setFontSize(11);
        doc.text(`Most Popular Treatments: ${totalTreatments}`, 14, 58);
        doc.text(`Total Treatments: ${popularTreatments}`, 14, 60);
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
            doc.text(`Page ${i} of ${pageCount}`, 105, doc.internal.pageSize.height - 10, null, null, "center");
        }
    
        // ✅ Save PDF
        doc.save("EJPL-PatientTreatmentReport.pdf");
    });            

    // ✅ Fetch report immediately when the page loads
    fetchTreatmentReport();
});
const TREATMENTS_API_URL = "http://localhost:3000/api/treatments";

let currentPage = 1;
const rowsPerPage = 10;

function renderPagination(totalRows) {
    const paginationContainer = document.getElementById('pagination');
    paginationContainer.innerHTML = '';

    const totalPages = Math.ceil(totalRows / rowsPerPage);

    for (let i = 1; i <= totalPages; i++) {
        const button = document.createElement('button');
        button.textContent = i;
        button.className = `px-3 py-1 mx-1 ${i === currentPage ? 'bg-[#2C4A66] text-white' : 'bg-gray-200 text-gray-700'} rounded-md`;
        button.addEventListener('click', () => {
            currentPage = i;
            fetchTreatments();
        });
        paginationContainer.appendChild(button);
    }
}

document.addEventListener("DOMContentLoaded", async () => {
    await fetchTreatments();  //Fetch treatments for the table

    //Only call updateTreatmentDropdown() if #treatment-select exists (prevents error)
    if (document.getElementById("treatment-select")) {
        updateTreatmentDropdown();
    }

    // Fix: Match the correct HTML IDs
    document.getElementById("open-treatment-modal-btn").addEventListener("click", openModal);
    document.getElementById("close-treatment-modal-btn").addEventListener("click", closeModal);
    document.getElementById("save-treatment-btn").addEventListener("click", saveTreatment);
});

//Fetch all treatments
async function fetchTreatments() {
    const tableBody = document.getElementById("treatment-table-body");
    tableBody.innerHTML = `
        <tr>
            <td colspan="3" class="px-4 py-6 text-center text-gray-500 font-medium">
                <div class="flex justify-center items-center space-x-2">
                    <span>Loading treatments...</span>
                </div>
            </td>
        </tr>
    `;

    try {
        const res = await fetch(TREATMENTS_API_URL);
        const treatments = await res.json();

        const start = (currentPage - 1) * rowsPerPage;
        const paginatedTreatments = treatments.slice(start, start + rowsPerPage);

        tableBody.innerHTML = ""; // Clear the loading message
        paginatedTreatments.forEach(treatment => {
            const row = document.createElement("tr");
            row.className = "border-b hover:bg-gray-100"; // Add row styling
            row.innerHTML = `
                <td class="px-4 py-2 text-gray-700">${treatment.name}</td>
                <td class="px-4 py-2 text-gray-700">${formatPrice(treatment.price)}</td>
                <td class="px-4 py-2 flex space-x-2 gap-2">
                    <button class="px-3 py-1 bg-[#2C4A66] text-white rounded-md hover:bg-[#1E354D] focus:outline-none focus:ring-2 focus:ring-blue-300" onclick="editTreatment('${treatment._id}', '${treatment.name}', ${treatment.price})">Edit</button>
                    <button class="px-3 py-1 bg-[#2C4A66] text-white rounded-md hover:bg-[#1E354D] focus:outline-none focus:ring-2 focus:ring-red-300" onclick="deleteTreatment('${treatment._id}')">Delete</button>
                </td>
            `;
            tableBody.appendChild(row);
        });

        renderPagination(treatments.length);

    } catch (error) {
        console.error("Error fetching treatments:", error);
        tableBody.innerHTML = `
            <tr>
                <td colspan="3" class="px-4 py-6 text-center text-red-500 font-medium">
                    Failed to load treatments. Please try again.
                </td>
            </tr>
        `;
    }
}

function formatPrice(price) {
    if (!price) return "₱0.00"; // Handle empty values

    if (!isNaN(price)) { 
        // Single number price
        return `₱${parseFloat(price).toLocaleString(undefined, { minimumFractionDigits: 2 })}`;
    }

    // ✅ Handle range format (e.g., "1000-1500")
    if (price.includes("-")) {
        const [min, max] = price.split("-").map(val => val.trim());
        if (!isNaN(min) && !isNaN(max)) {
            return `₱${parseFloat(min).toLocaleString()}-₱${parseFloat(max).toLocaleString()}`;
        }
    }

    return `₱${price}`; // Default case
}

//Update the dropdown dynamically after saving a treatment
async function updateTreatmentDropdown() {
    const treatmentSelect = document.getElementById("treatment-select");
    const treatmentPrice = document.getElementById("treatment-price");

    if (!treatmentSelect) return; //Exit if dropdown is not present

    try {
        const response = await fetch("http://localhost:3000/treatments");
        const treatments = await response.json();

        // Clear and populate dropdown
        treatmentSelect.innerHTML = '<option value="" disabled selected>Select Treatment</option>';
        treatments.forEach(treatment => {
            const option = document.createElement("option");
            option.value = treatment.name;
            option.dataset.price = treatment.price;
            option.textContent = treatment.name;
            treatmentSelect.appendChild(option);
        });

        // Update price display on selection change
        treatmentSelect.addEventListener("change", function () {
            const selectedOption = treatmentSelect.options[treatmentSelect.selectedIndex];
            const price = selectedOption.dataset.price || "0";
            treatmentPrice.textContent = `Price: ${formatPrice(selectedOption.dataset.price)}`;
        });

    } catch (error) {
        console.error("Error updating treatment dropdown:", error);
    }
}

//Open Modal for Adding / Editing
function openModal() {
    document.getElementById("treatment-modal").style.display = "flex";
}

//Close Modal
function closeModal() {
    document.getElementById("treatment-modal").style.display = "none";
    resetForm();
}

//Add or Update Treatment
async function saveTreatment() {
    const name = document.getElementById("treatment-name").value.trim();
    const price = document.getElementById("treatment-price").value.trim();
    const treatmentId = document.getElementById("save-treatment-btn").dataset.id;

    if (!name || !price) {
        return alert("Please enter a valid treatment name and price.");
    }

    try {
        // Fetch existing treatments to check for duplicate names
        const res = await fetch(TREATMENTS_API_URL);
        if (!res.ok) throw new Error("Failed to fetch treatments");

        const treatments = await res.json();
        const isDuplicate = treatments.some(treatment => 
            treatment.name.toLowerCase() === name.toLowerCase() && treatment._id !== treatmentId
        );

        if (isDuplicate) {
            return alert("A treatment with this name already exists. Please choose a different name.");
        }

        let response;
        if (treatmentId) {
            // Update Treatment
            response = await fetch(`${TREATMENTS_API_URL}/${treatmentId}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ name, price })
            });
        } else {
            // Add New Treatment
            response = await fetch(TREATMENTS_API_URL, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ name, price })
            });
        }

        if (!response.ok) throw new Error("Failed to save treatment");

        alert("Treatment saved successfully!");
        closeModal();
        fetchTreatments();

        // Only update dropdown if it exists
        if (document.getElementById("treatment-select")) {
            updateTreatmentDropdown();
        }
    } catch (error) {
        console.error("Error saving treatment:", error);
    }
}

//Edit Treatment
function editTreatment(id, name, price) {
    document.getElementById("treatment-name").value = name;
    document.getElementById("treatment-price").value = price;
    
    const saveBtn = document.getElementById("save-treatment-btn");
    saveBtn.dataset.id = id;
    saveBtn.textContent = "Update Treatment";

    openModal();
}

//Delete Treatment
async function deleteTreatment(id) {
    if (!confirm("Are you sure you want to delete this treatment?")) return;

    try {
        const response = await fetch(`${TREATMENTS_API_URL}/${id}`, { method: "DELETE" });
        if (!response.ok) throw new Error("Failed to delete treatment");

        alert("Treatment deleted successfully!");
        fetchTreatments();
    } catch (error) {
        console.error("Error deleting treatment:", error);
    }
}

//Reset Form
function resetForm() {
    document.getElementById("treatment-name").value = "";
    document.getElementById("treatment-price").value = "";
    
    const saveBtn = document.getElementById("save-treatment-btn");
    saveBtn.dataset.id = "";
    saveBtn.textContent = "Add Treatment";
}
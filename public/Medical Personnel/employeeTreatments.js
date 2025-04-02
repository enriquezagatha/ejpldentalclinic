const TREATMENTS_API_URL = "http://localhost:3000/api/treatments";

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
    try {
        const res = await fetch(TREATMENTS_API_URL);
        const treatments = await res.json();
        const tableBody = document.getElementById("treatment-table-body");

        tableBody.innerHTML = "";
        treatments.forEach(treatment => {
            const row = document.createElement("tr");
            row.innerHTML = `
                <td>${treatment.name}</td>
                <td>${formatPrice(treatment.price)}</td>
                <td>
                    <button onclick="editTreatment('${treatment._id}', '${treatment.name}', ${treatment.price})">Edit</button>
                    <button onclick="deleteTreatment('${treatment._id}')">Delete</button>
                </td>
            `;
            tableBody.appendChild(row);
        });

    } catch (error) {
        console.error("Error fetching treatments:", error);
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
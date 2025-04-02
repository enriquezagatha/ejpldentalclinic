document.addEventListener("DOMContentLoaded", function () {
    const discountModal = document.getElementById("discount-modal");
    const discountNameInput = document.getElementById("discountName");
    const discountPercentageInput = document.getElementById("discountPercentage");
    const discountIdInput = document.getElementById("discountId");
    const discountList = document.getElementById("discount-list");
    const modalTitle = document.getElementById("modal-title");

    // Open the modal for adding/editing
    function openDiscountModal(id = null, name = "", percentage = "") {
        discountModal.style.display = "block";
        discountIdInput.value = id || ""; // Store ID for edit
        discountNameInput.value = name;
        discountPercentageInput.value = percentage;
        modalTitle.innerText = id ? "Edit Discount" : "Add Discount";
    }

    // Close the modal
    function closeDiscountModal() {
        discountModal.style.display = "none";
        discountIdInput.value = "";
        discountNameInput.value = "";
        discountPercentageInput.value = "";
    }

    // Fetch and display discounts
    async function loadDiscounts() {
        try {
            const response = await fetch("http://localhost:3000/api/discounts");
            if (!response.ok) throw new Error("Failed to fetch discounts");

            const discounts = await response.json();
            discountList.innerHTML = ""; // Clear table

            discounts.forEach((discount) => {
                const row = document.createElement("tr");
                row.innerHTML = `
                    <td>${discount.name}</td>
                    <td>${discount.percentage}%</td>
                    <td>
                        <button onclick="openDiscountModal('${discount._id}', '${discount.name}', '${discount.percentage}')">Edit</button>
                        <button onclick="deleteDiscount('${discount._id}')">Delete</button>
                    </td>
                `;
                discountList.appendChild(row);
            });
        } catch (error) {
            console.error("Error loading discounts:", error);
            discountList.innerHTML = "<tr><td colspan='3'>Error loading discounts</td></tr>";
        }
    }

    // Save (Add/Edit) discount
    async function saveDiscount() {
        const id = discountIdInput.value;
        const name = discountNameInput.value.trim();
        const percentage = parseFloat(discountPercentageInput.value);

        if (!name || isNaN(percentage) || percentage < 0 || percentage > 100) {
            alert("Please enter a valid discount name and percentage (0-100).");
            return;
        }

        const method = id ? "PUT" : "POST"; // PUT for edit, POST for add
        const url = id ? `http://localhost:3000/api/discounts/${id}` : "http://localhost:3000/api/discounts";

        try {
            const response = await fetch(url, {
                method: method,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ name, percentage })
            });

            const result = await response.json();

            if (response.ok) {
                alert(id ? "Discount updated!" : "Discount added!");
                closeDiscountModal();
                loadDiscounts();
            } else {
                alert("Error: " + (result.error || "Unknown error"));
            }
        } catch (error) {
            console.error("Error saving discount:", error);
            alert("An error occurred while saving the discount.");
        }
    }

    // Delete a discount
    async function deleteDiscount(id) {
        if (!confirm("Are you sure you want to delete this discount?")) return;

        try {
            const response = await fetch(`http://localhost:3000/api/discount/${id}`, { method: "DELETE" });
            if (!response.ok) throw new Error("Failed to delete discount");

            alert("Discount deleted!");
            loadDiscounts();
        } catch (error) {
            console.error("Error deleting discount:", error);
            alert("An error occurred while deleting the discount.");
        }
    }

    // Expose functions globally
    window.openDiscountModal = openDiscountModal;
    window.closeDiscountModal = closeDiscountModal;
    window.saveDiscount = saveDiscount;
    window.deleteDiscount = deleteDiscount;

    // Load discounts on page load
    loadDiscounts();
});
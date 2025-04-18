document.addEventListener("DOMContentLoaded", function () {
  const discountModal = document.getElementById("discount-modal");
  const discountNameInput = document.getElementById("discountName");
  const discountPercentageInput = document.getElementById("discountPercentage");
  const discountIdInput = document.getElementById("discountId");
  const discountList = document.getElementById("discount-list");
  const modalTitle = document.getElementById("modal-title");

  let currentPage = 1;
  const rowsPerPage = 10;

  // Open the modal for adding/editing
  function openDiscountModal(id = null, name = "", percentage = "") {
    const discountModal = document.getElementById("discount-modal");
    const discountIdInput = document.getElementById("discountId");
    const discountNameInput = document.getElementById("discountName");
    const discountPercentageInput =
      document.getElementById("discountPercentage");
    const modalTitle = document.getElementById("modal-title");

    discountModal.classList.remove("hidden");
    discountModal.classList.add("flex");
    discountIdInput.value = id || ""; // Store ID for edit
    discountNameInput.value = name;
    discountPercentageInput.value = percentage;
    modalTitle.innerText = id ? "Edit Discount" : "Add Discount";
  }

  // Close the modal
  function closeDiscountModal() {
    const discountModal = document.getElementById("discount-modal");
    const discountIdInput = document.getElementById("discountId");
    const discountNameInput = document.getElementById("discountName");
    const discountPercentageInput =
      document.getElementById("discountPercentage");

    discountModal.classList.add("hidden");
    discountModal.classList.remove("flex");
    discountIdInput.value = "";
    discountNameInput.value = "";
    discountPercentageInput.value = "";
  }

  // Render paginated discounts
  function renderDiscounts(discounts) {
    const start = (currentPage - 1) * rowsPerPage;
    const end = start + rowsPerPage;
    const paginatedDiscounts = discounts.slice(start, end);

    discountList.innerHTML = ""; // Clear table

    paginatedDiscounts.forEach((discount) => {
      const row = document.createElement("tr");
      row.className = "border-b hover:bg-gray-100";
      row.innerHTML = `
                <td class="px-4 py-2 text-gray-700">${discount.name}</td>
                <td class="px-4 py-2 text-gray-700">${discount.percentage}%</td>
                <td class="px-4 py-2 text-gray-700">
                    <button class="px-3 py-1 bg-[#2C4A66] text-white rounded-md hover:bg-[#1E354D] focus:outline-none focus:ring-2 focus:ring-blue-300" onclick="openDiscountModal('${discount._id}', '${discount.name}', '${discount.percentage}')">Edit</button>
                    <button class="px-3 py-1 bg-[#2C4A66] text-white rounded-md hover:bg-[#1E354D] focus:outline-none focus:ring-2 focus:ring-red-300" onclick="deleteDiscount('${discount._id}')">Delete</button>
                </td>
            `;
      discountList.appendChild(row);
    });

    renderPagination(discounts.length);
  }

  // Render pagination controls
  function renderPagination(totalRows) {
    const paginationContainer = document.getElementById("pagination");
    paginationContainer.innerHTML = ""; // Clear pagination

    const totalPages = Math.ceil(totalRows / rowsPerPage);

    if (totalPages <= 1) {
      paginationContainer.style.display = "none"; // Hide pagination if only 1 page
      return;
    }

    paginationContainer.style.display = "flex"; // Show pagination if more than 1 page

    const maxVisiblePages = 3; // Maximum number of visible page buttons
    const startPage = Math.max(
      1,
      currentPage - Math.floor(maxVisiblePages / 2)
    );
    const endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);

    // Previous arrow
    if (currentPage > 1) {
      const prevButton = document.createElement("button");
      prevButton.innerHTML = "<span class='font-bold'>&lt;</span>"; // Use < for previous
      prevButton.className =
        "px-3 py-1 mx-1 bg-gray-200 text-gray-700 rounded-md";
      prevButton.addEventListener("click", () => {
        currentPage--;
        loadDiscounts();
      });
      paginationContainer.appendChild(prevButton);
    }

    // Page buttons
    for (let i = startPage; i <= endPage; i++) {
      const button = document.createElement("button");
      button.textContent = i;
      button.className = `px-3 py-1 mx-1 ${
        i === currentPage
          ? "bg-[#2C4A66] text-white"
          : "bg-gray-200 text-gray-700 hover:bg-gray-300"
      } rounded-md`;
      button.addEventListener("click", () => {
        currentPage = i;
        loadDiscounts();
      });
      paginationContainer.appendChild(button);
    }

    // Next arrow
    if (currentPage < totalPages) {
      const nextButton = document.createElement("button");
      nextButton.innerHTML = "<span class='font-bold'>&gt;</span>"; // Use > for next
      nextButton.className =
        "px-3 py-1 mx-1 bg-gray-200 text-gray-700 rounded-md";
      nextButton.addEventListener("click", () => {
        currentPage++;
        loadDiscounts();
      });
      paginationContainer.appendChild(nextButton);
    }
  }

  // Fetch and display discounts with pagination
  async function loadDiscounts() {
    try {
      // Show loading message
      discountList.innerHTML = `
      <tr id="loading-row">
          <td colspan="3" class="text-center py-6 text-gray-500">
              <i class="fas fa-spinner fa-spin text-4xl mb-2 text-gray-400"></i>
              <p class="text-lg font-semibold">Loading discounts...</p>
          </td>
      </tr>
    `;

      const response = await fetch("http://localhost:3000/api/discounts");
      if (!response.ok) throw new Error("Failed to fetch discounts");

      const discounts = await response.json();
      renderDiscounts(discounts);
    } catch (error) {
      console.error("Error loading discounts:", error);
      discountList.innerHTML = `
                <tr>
                    <td colspan="3" class="text-center py-4 text-red-500">Error loading discounts</td>
                </tr>
            `;
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
    const url = id
      ? `http://localhost:3000/api/discounts/${id}`
      : "http://localhost:3000/api/discounts";

    try {
      const response = await fetch(url, {
        method: method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, percentage }),
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
      const response = await fetch(`http://localhost:3000/api/discount/${id}`, {
        method: "DELETE",
      });
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

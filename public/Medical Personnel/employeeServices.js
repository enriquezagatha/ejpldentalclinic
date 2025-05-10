const SERVICE_API_URL = `${window.location.origin}/api/services`; // Dynamically set base URL

let currentPage = 1;
const rowsPerPage = 5;

function renderPagination(totalRows) {
  const paginationContainer = document.getElementById("pagination");
  paginationContainer.innerHTML = ""; // Clear existing pagination

  const totalPages = Math.ceil(totalRows / rowsPerPage);

  if (totalPages <= 1) {
    paginationContainer.style.display = "none"; // Hide pagination if only 1 page
    return;
  }

  paginationContainer.style.display = "flex"; // Show pagination if more than 1 page

  const maxVisiblePages = 3; // Maximum number of visible page buttons
  const startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
  const endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);

  // Previous arrow
  if (currentPage > 1) {
    const prevButton = document.createElement("button");
    prevButton.innerHTML = "<span class='font-bold'>&lt;</span>"; // Use < for previous
    prevButton.className =
      "px-3 py-1 mx-1 bg-gray-200 text-gray-700 rounded-md";
    prevButton.addEventListener("click", () => {
      currentPage--;
      fetchServices();
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
        : "bg-gray-200 text-gray-700"
    } rounded-md`;
    button.addEventListener("click", () => {
      currentPage = i;
      fetchServices();
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
      fetchServices();
    });
    paginationContainer.appendChild(nextButton);
  }
}

// Load services when page loads
document.addEventListener("DOMContentLoaded", fetchServices);

function showToast(message, bgColor = "bg-green-500") {
  const toast = document.getElementById("toast");
  const toastMessage = document.getElementById("toast-message");

  // Set message and background color
  toastMessage.textContent = message;
  toastMessage.className = `text-white px-6 py-3 rounded-lg shadow-lg transition-opacity duration-300 ease-in-out pointer-events-auto ${bgColor}`;

  toast.classList.remove("hidden");

  // Hide after 3 seconds
  setTimeout(() => {
    toast.classList.add("hidden");
  }, 2000);
}

function fetchServices() {
  const tableBody = document.getElementById("service-table-body");
  tableBody.innerHTML = `
    <tr id="loading-row">
        <td colspan="4" class="text-center py-6 text-gray-500">
            <i class="fas fa-spinner fa-spin text-4xl mb-2 text-gray-400"></i>
            <p class="text-lg font-semibold">Loading services...</p>
        </td>
    </tr>
  `;

  fetch(SERVICE_API_URL)
    .then((response) => response.json())
    .then((services) => {
      const start = (currentPage - 1) * rowsPerPage;
      const paginatedServices = services.slice(start, start + rowsPerPage);

      let rows = "";
      paginatedServices.forEach((service) => {
        rows += `
                    <tr class="border-b hover:bg-gray-100">
                        <td class="px-4 py-2 text-gray-700">${service.name}</td>
                        <td class="px-4 py-2 text-gray-700">${service.description}</td>
                        <td class="px-4 py-2">
                            <img src="${service.image}" alt="Service Image" class="w-20 h-20 object-cover rounded-md border border-gray-300">
                        </td>
                        <td class="px-4 py-2 flex space-x-2 gap-2 mt-6">
                            <button class="px-3 py-1 bg-[#2C4A66] text-white rounded-md hover:bg-[#1E354D] focus:outline-none focus:ring-2 focus:ring-blue-300" onclick="editService('${service._id}', '${service.name}', '${service.description}', '${service.image}')">Edit</button>
                            <button class="px-3 py-1 bg-[#2C4A66] text-white rounded-md hover:bg-[#1E354D] focus:outline-none focus:ring-2 focus:ring-red-300" onclick="deleteService('${service._id}')">Delete</button>
                        </td>
                    </tr>`;
      });
      tableBody.innerHTML = rows;

      renderPagination(services.length);
    })
    .catch((error) => {
      console.error("Error fetching services:", error);
      tableBody.innerHTML = `
                <tr>
                    <td colspan="4" class="px-4 py-6 text-center text-red-500 font-medium">
                        Failed to load services. Please try again.
                    </td>
                </tr>
            `;
    });
}

// Open modal for adding a new service
document
  .getElementById("open-service-modal-btn")
  .addEventListener("click", () => {
    document.getElementById("service-id").value = ""; // Reset hidden input
    document.getElementById("service-name").value = "";
    document.getElementById("service-desc").value = "";
    document.getElementById("service-modal-title").textContent =
      "Add New Service";
    document.getElementById("save-service-btn").textContent = "Add Service";
    document.getElementById("service-modal").style.display = "block";
  });

// Close modal
document
  .getElementById("close-service-modal-btn")
  .addEventListener("click", () => {
    document.getElementById("service-modal").style.display = "none";
  });

// Handle add/update service
document
  .getElementById("save-service-btn")
  .addEventListener("click", async () => {
    const id = document.getElementById("service-id").value;
    const name = document.getElementById("service-name").value.trim();
    const description = document.getElementById("service-desc").value.trim();
    const imageInput = document.getElementById("service-image").files[0];

    if (!name || !description) {
      showToast("Please enter service name and description.", "error");
      return;
    }    

    try {
      // Fetch existing services to check for duplicate names
      const response = await fetch(SERVICE_API_URL);
      if (!response.ok) {
        throw new Error("Failed to fetch services.");
      }

      const services = await response.json();
      const isDuplicate = services.some(
        (service) =>
          service.name.toLowerCase() === name.toLowerCase() &&
          service._id !== id
      );

      if (isDuplicate) {
        showToast("A service with this name already exists. Please choose a different name.", "error");
        return;
      }      

      // Prepare form data
      const formData = new FormData();
      formData.append("name", name);
      formData.append("description", description);
      if (imageInput) {
        formData.append("image", imageInput);
      }

      const method = id ? "PUT" : "POST";
      const url = id ? `${SERVICE_API_URL}/${id}` : SERVICE_API_URL;

      // Send request to API
      const saveResponse = await fetch(url, {
        method,
        body: formData,
      });

      if (!saveResponse.ok) {
        throw new Error("Failed to save service.");
      }

      // Reset form
      resetServiceForm();
      document.getElementById("service-modal").style.display = "none";
      fetchServices();
      showToast(id ? "Service updated successfully" : "Service added successfully");
    } catch (error) {
      console.error("Error saving service:", error);
      showToast("Error saving service. Please try again.");
    }
  });

// Edit service
function editService(id, name, description, image) {
  document.getElementById("service-id").value = id;
  document.getElementById("service-name").value = name;
  document.getElementById("service-desc").value = description;

  // Set image preview
  const imagePreview = document.getElementById("service-image-preview");
  imagePreview.src = image;
  imagePreview.style.display = "block";

  document.getElementById("service-modal-title").textContent = "Edit Service";
  document.getElementById("save-service-btn").textContent = "Update Service";
  document.getElementById("service-modal").style.display = "flex";
}

// Delete service
function deleteService(id) {
  const confirmationModal = document.getElementById("confirmation-modal");
  const confirmDeleteButton = document.getElementById("confirm-delete-btn");
  const cancelDeleteButton = document.getElementById("cancel-delete-btn");

  confirmationModal.style.display = "flex";

  confirmDeleteButton.onclick = () => {
    fetch(`${SERVICE_API_URL}/${id}`, { method: "DELETE" })
      .then((response) => {
        if (!response.ok) {
          throw new Error("Failed to delete service.");
        }
        fetchServices();
        showToast("Service deleted successfully!");
      })
      .catch((error) => {
        console.error("Error deleting service:", error);
        showToast("Error deleting service. Please try again.");
      })
      .finally(() => {
        confirmationModal.style.display = "none";
      });
  };

  cancelDeleteButton.onclick = () => {
    confirmationModal.style.display = "none";
  };
}

//Reset form
function resetServiceForm() {
  document.getElementById("service-id").value = "";
  document.getElementById("service-name").value = "";
  document.getElementById("service-desc").value = "";
  document.getElementById("service-image").value = "";
}

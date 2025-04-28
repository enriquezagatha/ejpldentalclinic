const DENTIST_API_URL = `${window.location.origin}/api/dentists`;
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
      displayDentists();
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
      displayDentists();
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
      displayDentists();
    });
    paginationContainer.appendChild(nextButton);
  }
}

// Fetch and display dentists
async function displayDentists() {
  const dentistTableBody = document.getElementById("dentist-table-body");

  // Display loading message
  dentistTableBody.innerHTML = `
    <tr id="loading-row">
        <td colspan="4" class="text-center py-6 text-gray-500">
            <i class="fas fa-spinner fa-spin text-4xl mb-2 text-gray-400"></i>
            <p class="text-lg font-semibold">Loading dentists...</p>
        </td>
    </tr>
  `;

  try {
    const response = await fetch(DENTIST_API_URL); // Ensure no duplicate variable declarations
    const dentists = await response.json();

    const start = (currentPage - 1) * rowsPerPage;
    const paginatedDentists = dentists.slice(start, start + rowsPerPage);

    dentistTableBody.innerHTML = ""; // Clear loading message

    paginatedDentists.forEach((dentist) => {
      // Create the full name with middle initial (if available)
      const middleInitial = dentist.middleName
        ? dentist.middleName.charAt(0) + "."
        : ""; // Get the middle initial
      const fullName = `${dentist.firstName} ${dentist.lastName}`.trim();

      dentistTableBody.innerHTML += `
                <tr class="border-b hover:bg-gray-100">
                    <td class="px-4 py-2 text-gray-700">${fullName}</td>
                    <td class="px-4 py-2 text-gray-700"><img src="${
                      dentist.image ? dentist.image : "default-image.jpg"
                    }" alt="dentist Image" class="dentist-img" width="50"></td>
                    <td class="px-4 py-2 text-gray-700">
                        <button class="px-3 py-1 bg-[#2C4A66] text-white rounded-md hover:bg-[#1E354D] focus:outline-none focus:ring-2 focus:ring-blue-300" 
                            onclick="editDentist(
                              '${dentist._id}', 
                              '${fullName.replace(/'/g, "\\'")}', 
                              '${dentist.image || ""}',
                              '${dentist.gender || ""}'
                            )">
                          Edit
                        </button>

                        <button class="px-3 py-1 bg-[#2C4A66] text-white rounded-md hover:bg-[#1E354D] focus:outline-none focus:ring-2 focus:ring-red-300" onclick="deleteDentist('${
                          dentist._id
                        }')">Delete</button>
                    </td>
                </tr>`;
    });

    renderPagination(dentists.length);
  } catch (error) {
    console.error("Error fetching dentists:", error);
    dentistTableBody.innerHTML = `
            <tr>
                <td colspan="4" class="px-4 py-6 text-center text-red-500 font-medium">
                    Failed to load dentists. Please try again.
                </td>
            </tr>
        `;
  }
}

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
  }, 3000);
}

// Add or update dentist (with image upload support)
async function addOrUpdateDentist() {
  const firstName = document.getElementById("dentist-first-name").value.trim();
  const lastName = document.getElementById("dentist-last-name").value.trim();
  const gender = document.getElementById("dentist-gender").value;
  const imageFile = document.getElementById("dentist-image").files[0];
  const editId = document.getElementById("editdentistId").value;

  // Validate required fields
  if (!firstName) {
    showToast("First name is required.", "bg-red-500");
    return;
  }
  if (!lastName) {
    showToast("Last name is required.", "bg-red-500");
    return;
  }
  if (!gender) {
    showToast("Please select a gender.", "bg-red-500");
    return;
  }

  const fullName = `${firstName} ${lastName}`.trim();

  try {
    const res = await fetch(DENTIST_API_URL);
    if (!res.ok) throw new Error("Failed to fetch dentists");

    const dentists = await res.json();
    const isDuplicate = dentists.some((dentist) => {
      const existingFullName = `${dentist.firstName || ""} ${dentist.lastName || ""}`.trim().toLowerCase();
      return existingFullName === fullName.toLowerCase() && dentist._id !== editId;
    });

    if (isDuplicate) {
      showToast("A dentist with this name already exists. Please choose a different name.", "bg-red-500");
      return;
    }

    const formData = new FormData();
    formData.append("firstName", firstName);
    formData.append("lastName", lastName);
    formData.append("gender", gender);
    if (imageFile) {
      formData.append("image", imageFile);
    }

    const url = editId ? `${DENTIST_API_URL}/${editId}` : DENTIST_API_URL;
    const method = editId ? "PUT" : "POST";

    const response = await fetch(url, {
      method,
      body: formData,
    });

    if (response.ok) {
      showToast(`Dentist ${editId ? "updated" : "added"} successfully!`);
      document.getElementById("dentist-modal").style.display = "none";
      displayDentists();
    } else {
      showToast("Failed to save dentist.", "bg-red-500");
    }
  } catch (error) {
    console.error("Error saving dentist:", error);
  }
}

// Edit dentist (populate fields)
function editDentist(id, fullName, image = "", gender = "") {
  const nameParts = fullName.split(" ");
  const firstName = nameParts[0];
  const lastName = nameParts[nameParts.length - 1];

  document.getElementById("dentist-first-name").value = firstName;
  document.getElementById("dentist-last-name").value = lastName;

  // Set gender dropdown value
  const genderDropdown = document.getElementById("dentist-gender");
  if (genderDropdown) {
    genderDropdown.value = gender || ""; // Set gender if available
  }

  document.getElementById("editdentistId").value = id;

  // Clear the image input field
  document.getElementById("dentist-image").value = "";

  // Display the current image as a preview
  const imagePreview = document.getElementById("dentist-image-preview");
  if (imagePreview) {
    if (image) {
      imagePreview.src = image;
      imagePreview.style.display = "block";
    } else {
      imagePreview.style.display = "none";
    }
  }

  // Update modal title
  document.getElementById("dentist-modal-title").innerText = "Edit Dentist Details";

  document.getElementById("dentist-modal").style.display = "flex";
}

// Custom confirmation modal
function showConfirmationModal(message, onConfirm) {
  const modal = document.createElement("div");
  modal.id = "confirmation-modal";
  modal.className = "fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50";

  modal.innerHTML = `
    <div class="bg-white p-6 rounded-lg shadow-lg w-96">
      <h2 class="text-lg font-semibold text-gray-800 mb-4">Delete Dentist</h2>
      <p class="text-gray-600 mb-6">${message}</p>
      <div class="flex justify-end space-x-4">
        <button id="cancel-delete-btn" class="px-4 py-2 bg-gray-300 text-gray-800 rounded-md hover:bg-gray-400">
          Cancel
        </button>
        <button id="confirm-delete-btn" class="px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600">
          Delete
        </button>
      </div>
    </div>
  `;

  document.body.appendChild(modal);

  document.getElementById("cancel-delete-btn").addEventListener("click", () => {
    document.body.removeChild(modal);
  });

  document.getElementById("confirm-delete-btn").addEventListener("click", () => {
    onConfirm();
    document.body.removeChild(modal);
  });
}

// Delete dentist
async function deleteDentist(id) {
  showConfirmationModal("Are you sure you want to delete this dentist?", async () => {
    await fetch(`${DENTIST_API_URL}/${id}`, { method: "DELETE" });
    showToast("Dentist deleted successfully!");
    displayDentists();
  });
}

// Open & close modal
document
  .getElementById("open-dentist-modal-btn")
  .addEventListener("click", () => {
    document.getElementById("dentist-modal").style.display = "flex";
  });

document
  .getElementById("close-dentist-modal-btn")
  .addEventListener("click", () => {
    document.getElementById("dentist-modal").style.display = "none";
  });

document
  .getElementById("save-dentist-btn")
  .addEventListener("click", addOrUpdateDentist);

// Load dentists on page load
displayDentists();

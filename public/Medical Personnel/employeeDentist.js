const DENTIST_API_URL = "http://localhost:3000/api/dentists";
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
    const response = await fetch(DENTIST_API_URL);
    const dentists = await response.json();

    const start = (currentPage - 1) * rowsPerPage;
    const paginatedDentists = dentists.slice(start, start + rowsPerPage);

    dentistTableBody.innerHTML = ""; // Clear loading message

    paginatedDentists.forEach((dentist) => {
      // Create the full name with middle initial (if available)
      const middleInitial = dentist.middleName
        ? dentist.middleName.charAt(0) + "."
        : ""; // Get the middle initial
      const fullName =
        `${dentist.firstName} ${dentist.secondName} ${middleInitial} ${dentist.lastName}`
          .replace(/\s+/g, " ")
          .trim();

      dentistTableBody.innerHTML += `
                <tr class="border-b hover:bg-gray-100">
                    <td class="px-4 py-2 text-gray-700">${fullName}</td>
                    <td class="px-4 py-2 text-gray-700">${dentist.contact}</td>
                    <td class="px-4 py-2 text-gray-700"><img src="${
                      dentist.image ? dentist.image : "default-image.jpg"
                    }" alt="dentist Image" class="dentist-img" width="50"></td>
                    <td class="px-4 py-2 text-gray-700">
                        <button class="px-3 py-1 bg-[#2C4A66] text-white rounded-md hover:bg-[#1E354D] focus:outline-none focus:ring-2 focus:ring-blue-300" onclick="editDentist('${
                          dentist._id
                        }', '${fullName.replace(/'/g, "\\'")}', '${
        dentist.contact
      }', '${dentist.image || ""}')">Edit</button>
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
  const secondName = document
    .getElementById("dentist-second-name")
    .value.trim();
  const middleName = document
    .getElementById("dentist-middle-name")
    .value.trim();
  const lastName = document.getElementById("dentist-last-name").value.trim();
  const contact = document.getElementById("dentist-contact").value.trim();
  const gender = document.getElementById("dentist-gender").value; // Get gender from the dropdown
  const imageFile = document.getElementById("dentist-image").files[0];
  const editId = document.getElementById("editdentistId").value;

  if (!firstName || !lastName || !contact || !gender) {
    showToast("Please enter first name, last name, contact number, and select gender.", "bg-red-500");
    return;
  }

  const fullName = `${firstName} ${secondName} ${middleName} ${lastName}`
    .replace(/\s+/g, " ")
    .trim();

  try {
    const res = await fetch(DENTIST_API_URL);
    if (!res.ok) throw new Error("Failed to fetch dentists");

    const dentists = await res.json();
    const isDuplicate = dentists.some((dentist) => {
      const existingFullName = `${dentist.firstName || ""} ${
        dentist.secondName || ""
      } ${dentist.middleName || ""} ${dentist.lastName || ""}`
        .replace(/\s+/g, " ")
        .trim()
        .toLowerCase();
      return (
        existingFullName === fullName.toLowerCase() && dentist._id !== editId
      );
    });

    if (isDuplicate) {
      showToast("A dentist with this name already exists. Please choose a different name.", "bg-red-500");
      return;
    }

    const formData = new FormData();
    formData.append("firstName", firstName);
    formData.append("secondName", secondName);
    formData.append("middleName", middleName);
    formData.append("lastName", lastName);
    formData.append("contact", contact);
    formData.append("gender", gender); // Append the gender to the form data
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
function editDentist(id, fullName, contact, image) {
  const nameParts = fullName.split(" ");
  const firstName = nameParts[0];
  const lastName = nameParts[nameParts.length - 1];
  const middleName =
    nameParts.length > 2 ? nameParts.slice(1, -1).join(" ") : "";

  document.getElementById("dentist-first-name").value = firstName;
  document.getElementById("dentist-second-name").value = middleName;
  document.getElementById("dentist-middle-name").value = middleName;
  document.getElementById("dentist-last-name").value = lastName;
  document.getElementById("dentist-contact").value = contact;
  document.getElementById("editdentistId").value = id;

  // Update modal title
  document.getElementById("dentist-modal-title").innerText =
    "Edit Dentist Details";

  document.getElementById("dentist-modal").style.display = "flex";
}

// Delete dentist
async function deleteDentist(id) {
  if (confirm("Are you sure you want to delete this dentist?")) {
    await fetch(`${DENTIST_API_URL}/${id}`, { method: "DELETE" });
    showToast("Dentist deleted successfully!");
    displayDentists();
  }
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

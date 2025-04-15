document.addEventListener("DOMContentLoaded", function () {
    loadStaffData();
    checkAuthorizationStatus();
});

// Reset Forms Safely
function resetForms() {
    const addStaffForm = document.getElementById("add-staff-form");
    const addStaffMessage = document.getElementById("add-staff-message");

    if (addStaffForm) addStaffForm.reset();
    if (addStaffMessage) addStaffMessage.innerText = "";
}

// Open Add Staff Modal
function openAddStaffModal() {
    resetForms(); // Ensure form resets before opening
    const modal = document.getElementById("add-staff-modal");
    modal.classList.remove("hidden");
    modal.classList.add("flex");
}

// Close Add Staff Modal
function closeAddStaffModal() {
    resetForms();
    const modal = document.getElementById("add-staff-modal");
    modal.classList.add("hidden");
    modal.classList.remove("flex");
}

// Open Remove Staff Modal
function openRemoveStaffModal() {
    resetForms(); // Reset before opening modal
    document.getElementById("remove-staff-modal").style.display = "flex";
}

// Close Remove Staff Modal
function closeRemoveStaffModal() {
    resetForms(); // Reset form fields
    document.getElementById("remove-staff-modal").style.display = "none";
}

// Load staff data from the backend
async function loadStaffData() {
    try {
        const response = await fetch("/api/medicalPersonnel/list");
        const staffTableBody = document.getElementById("staff-table-body");
        staffTableBody.innerHTML = ""; // Clear table

        if (response.ok) {
            const staffList = await response.json();

            const loggedInEmail = localStorage.getItem("userEmail");

            staffList.forEach(staff => {
                // Log the staff data to verify if `isAuthorizedPersonnel` is correctly set
                console.log("Staff Data: ", staff);

                const formattedBirthday = staff.birthday 
                    ? new Date(staff.birthday).toLocaleDateString("en-US", { 
                        year: "numeric", 
                        month: "long", 
                        day: "numeric" 
                    }) 
                    : "N/A";

                const isSelf = staff.email === loggedInEmail;

                const row = document.createElement("tr");
                row.className = "border-b hover:bg-gray-100";
                row.innerHTML = `
                    <td class="px-4 py-2 text-gray-700">${staff.firstName || "N/A"}</td>
                    <td class="px-4 py-2 text-gray-700">${staff.middleName || "N/A"}</td>
                    <td class="px-4 py-2 text-gray-700">${staff.lastName || "N/A"}</td>
                    <td class="px-4 py-2 text-gray-700">${formattedBirthday}</td>
                    <td class="px-4 py-2 text-gray-700">${staff.email || "N/A"}</td>
                    <td class="px-4 py-2 text-gray-700 text-center">
                        <div class="flex items-center justify-center space-x-2">
                            <span class="${staff.isAuthorizedPersonnel ? 'text-green-600 font-semibold' : 'text-red-600 font-semibold'}">
                                ${staff.isAuthorizedPersonnel ? 'Authorized' : 'Not Authorized'}
                            </span>
                            <label class="inline-flex items-center cursor-pointer">
                                <input type="checkbox" ${staff.isAuthorizedPersonnel ? "checked" : ""} 
                                    onchange="toggleAuthorization('${staff.email}', this.checked)"
                                    class="sr-only peer" ${isSelf ? "disabled" : ""}>
                                <div class="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:bg-green-500 transition-all duration-300 ${isSelf ? 'opacity-50 cursor-not-allowed' : ''}"></div>
                            </label>
                        </div>
                    </td>
                    <td class="px-4 py-2 text-gray-700">
                        ${isSelf ? '' : `
                            <button class="edit-btn px-3 py-1 bg-[#2C4A66] text-white rounded-md hover:bg-[#1E354D]" onclick="editStaff('${staff.email}')">Edit</button>
                            <button class="delete-btn px-3 py-1 bg-[#2C4A66] text-white rounded-md hover:bg-[#1E354D]" onclick="removeStaff('${staff.email}')">Delete</button>
                        `}
                    </td>
                `;
                staffTableBody.appendChild(row);
            });
        } else {
            console.error("Failed to fetch staff list");
        }
    } catch (error) {
        console.error("Error loading staff data:", error);
    }
}

// Add Staff Function
async function addStaff() {
    const firstName = document.getElementById("staff-firstName").value.trim();
    const middleName = document.getElementById("staff-middleName").value.trim();
    const lastName = document.getElementById("staff-lastName").value.trim();
    const birthday = document.getElementById("staff-birthday").value;
    const email = document.getElementById("staff-email").value.trim();
    const isAuthorizedPersonnel = document.getElementById("staff-authorized").checked;
    const messageDiv = document.getElementById("add-staff-message");

    if (!firstName || !lastName || !birthday || !email) {
        messageDiv.style.color = "red";
        messageDiv.innerText = "First Name, Last Name, Birthday, and Email are required.";
        setTimeout(() => (messageDiv.innerText = ""), 3000);
        return;
    }

    try {
        const response = await fetch("/api/medicalPersonnel/add", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ 
                firstName, 
                middleName, 
                lastName, 
                birthday, 
                email,
                isAuthorizedPersonnel // Pass the checkbox value
            })
        });

        const result = await response.json();

        if (response.ok) {
            messageDiv.style.color = "green";
            messageDiv.innerText = "Staff added successfully!";
            setTimeout(() => {
                closeAddStaffModal();
                showGeneratedCredentialsModal(result.password);
                loadStaffData();
            }, 5000);
        } else {
            messageDiv.style.color = "red";
            messageDiv.innerText = result.message || "Failed to add staff.";
        }
    } catch (error) {
        console.error("Error adding staff:", error);
        messageDiv.style.color = "red";
        messageDiv.innerText = "An error occurred. Please try again.";
    }

    setTimeout(() => {
        messageDiv.innerText = "";
    }, 10000);
}

// Function to close the auto-generated credentials modal
function closeGeneratedCredentialsModal() {
    const modal = document.getElementById("generated-credentials-modal");
    modal.classList.add("hidden");
    modal.classList.remove("flex");
}

// Show Generated Credentials Modal
function showGeneratedCredentialsModal(password) {
    const credentialsModal = document.getElementById("generated-credentials-modal");
    const passwordElement = document.getElementById("generated-password");

    passwordElement.innerHTML = `Password: <strong>${password}</strong>`;
    credentialsModal.classList.remove("hidden");
    credentialsModal.classList.add("flex");

    // Hide the credentials modal after 20 seconds
    setTimeout(() => {
        credentialsModal.classList.add("hidden");
        credentialsModal.classList.remove("flex");
        passwordElement.innerHTML = "";
    }, 20000);
}

// Generate a random password (8-12 characters)
function generatePassword() {
    const length = 10;
    const charset = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    let password = "";
    for (let i = 0; i < length; i++) {
        password += charset.charAt(Math.floor(Math.random() * charset.length));
    }
    return password;
}

// Remove Staff Function
async function removeStaff(email) {
    if (!email) {
        console.error("Email is required to remove staff.");
        return;
    }

    if (!confirm(`Are you sure you want to delete ${email}?`)) {
        return;
    }

    try {
        const response = await fetch("/api/medicalPersonnel/remove", {
            method: "DELETE",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email })
        });

        const result = await response.json();

        if (response.ok) {
            alert("Staff removed successfully!");
            loadStaffData(); // Refresh staff list
        } else {
            alert(result.message || "Failed to remove staff.");
        }
    } catch (error) {
        console.error("Error removing staff:", error);
        alert("An error occurred. Please try again.");
    }
}

// Toggle isAuthorizedPersonnel flag
async function toggleAuthorization(email, isAuthorized) {
    try {
        const response = await fetch('/api/medicalPersonnel/authorize', {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, isAuthorized })
        });

        const result = await response.json();
        if (response.ok) {
            console.log(result.message);
        } else {
            alert(result.message || 'Failed to update authorization status.');
        }
    } catch (error) {
        console.error('Error toggling authorization:', error);
        alert('An error occurred while updating authorization.');
    }
}

async function checkAuthorizationStatus() {
    try {
        const response = await fetch("/api/auth/status"); // Call backend to check authorization

        if (response.ok) {
            const data = await response.json();
            
            // Log the response to verify the data
            console.log("Authorization Status Response: ", data);

            if (data.authorized) {
                localStorage.setItem("userEmail", data.email); // Store logged-in user email
            } else {
                console.log("User is not authorized. Hiding staff-related elements...");
                
                // Hide buttons if not authorized
                const addButton = document.querySelector(".add-button");
                const removeButton = document.querySelector(".remove-button");

                if (addButton) addButton.style.display = "none";
                if (removeButton) removeButton.style.display = "none";

                // Hide Staff Management tab
                const staffTab = document.getElementById("staff-tab");
                if (staffTab) staffTab.style.display = "none";

                // Hide Staff Management section
                const staffSection = document.getElementById("staff-section");
                if (staffSection) {
                    staffSection.innerHTML = `
                        <div style="text-align: center; padding: 20px;">
                            <h2 style="color: red;">Access Denied</h2>
                            <p>You do not have permission to access this section.</p>
                        </div>
                    `;
                }
            }
        } else {
            console.error("Failed to fetch authorization status.");
        }
    } catch (error) {
        console.error("Error checking authorization status:", error);
    }
}

// Open Edit Staff Modal
function openEditStaffModal() {
    const modal = document.getElementById("edit-staff-modal");
    modal.classList.remove("hidden");
    modal.classList.add("flex");
}

// Close Edit Staff Modal
function closeEditStaffModal() {
    const modal = document.getElementById("edit-staff-modal");
    modal.classList.add("hidden");
    modal.classList.remove("flex");
}

// Edit Staff Function
async function editStaff(email) {
    console.log("Fetching staff data for:", email); // Log email to ensure it's being passed correctly

    try {
        const response = await fetch(`/api/medicalPersonnel/get/${email}`);
        const staff = await response.json();

        if (response.ok) {
            console.log("Staff data received:", staff); // Log staff data for debugging

            // Populate the form with the staff details for editing
            document.getElementById('edit-staff-firstName').value = staff.firstName || '';
            document.getElementById('edit-staff-middleName').value = staff.middleName || ''; // Optional field
            document.getElementById('edit-staff-lastName').value = staff.lastName || '';
            document.getElementById('edit-staff-birthday').value = staff.birthday || '';
            document.getElementById('edit-staff-email').value = staff.email || '';

            // Set the checkbox for isAuthorizedPersonnel
            document.getElementById('edit-staff-authorized').checked = staff.isAuthorizedPersonnel || false;

            // Open the modal to show the staff details
            openEditStaffModal();
        } else {
            console.error("Failed to fetch staff details:", staff.message || "Unknown error");
            alert(staff.message || 'Failed to fetch staff details.');
        }
    } catch (error) {
        console.error("Error editing staff:", error);
        alert("An error occurred while fetching staff details.");
    }
}

// Handle updating staff details
async function updateStaff() {
    const firstName = document.getElementById("edit-staff-firstName").value.trim();
    const middleName = document.getElementById("edit-staff-middleName").value.trim();
    const lastName = document.getElementById("edit-staff-lastName").value.trim();
    const birthday = document.getElementById("edit-staff-birthday").value;
    const email = document.getElementById("edit-staff-email").value.trim();
    const isAuthorizedPersonnel = document.getElementById("edit-staff-authorized").checked;
    const messageDiv = document.getElementById("edit-staff-message");

    const payload = {};
    if (firstName) payload.firstName = firstName;
    if (middleName) payload.middleName = middleName;
    if (lastName) payload.lastName = lastName;
    if (birthday) payload.birthday = birthday;
    if (email) payload.email = email;

    payload.isAuthorizedPersonnel = isAuthorizedPersonnel;

    try {
        const response = await fetch("/api/medicalPersonnel/update", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload)
        });

        const result = await response.json();

        if (response.ok) {
            messageDiv.style.color = "green";
            messageDiv.innerText = "Staff updated successfully!";
            setTimeout(() => {
                closeEditStaffModal();
                loadStaffData(); // Refresh staff data
            }, 2000);
        } else {
            messageDiv.style.color = "red";
            messageDiv.innerText = result.message || "Failed to update staff.";
        }
    } catch (error) {
        console.error("Error updating staff:", error);
        messageDiv.style.color = "red";
        messageDiv.innerText = "An error occurred. Please try again.";
    }

    setTimeout(() => {
        messageDiv.innerText = "";
    }, 10000);
}
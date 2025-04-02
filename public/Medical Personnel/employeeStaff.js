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
    document.getElementById("add-staff-modal").style.display = "flex";
}

// Close Add Staff Modal
function closeAddStaffModal() {
    resetForms();
    document.getElementById("add-staff-modal").style.display = "none";
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
            console.log("Staff List Response:", staffList); // Debugging

            staffList.forEach(staff => {
                console.log("Staff Data:", staff); // Log each staff entry

                // Format birthday as "Month Name, Day, Year"
                const formattedBirthday = staff.birthday 
                    ? new Date(staff.birthday).toLocaleDateString("en-US", { 
                        year: "numeric", 
                        month: "long", 
                        day: "numeric" 
                    }) 
                    : "N/A";

                const row = document.createElement("tr");
                row.innerHTML = `
                    <td>${staff.firstName || "N/A"}</td>
                    <td>${staff.middleName || "N/A"}</td>
                    <td>${staff.lastName || "N/A"}</td>
                    <td>${formattedBirthday}</td>
                    <td>${staff.email || "N/A"}</td>
                    <td>
                        <button class="edit-btn" onclick="editStaff('${staff.email}')">Edit</button>
                        <button class="delete-btn" onclick="removeStaff('${staff.email}')">Delete</button>
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
    const messageDiv = document.getElementById("add-staff-message");

    if (!firstName || !lastName || !birthday || !email) {
        messageDiv.style.color = "red";
        messageDiv.innerText = "First Name, Last Name, Birthday, and Email are required.";
        setTimeout(() => (messageDiv.innerText = ""), 3000);
        return;
    }

    console.log("User-provided email:", email); // Debugging email

    try {
        const response = await fetch("/api/medicalPersonnel/add", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ firstName, middleName, lastName, birthday, email })
        });

        const result = await response.json();
        console.log(result); // Debug response

        if (response.ok) {
            messageDiv.style.color = "green";
            messageDiv.innerText = "Staff added successfully!";

            setTimeout(() => {
                closeAddStaffModal(); // Close and reset modal
                document.getElementById("generated-password").innerHTML = `Password: <strong>${result.password}</strong>`;
                document.getElementById("generated-credentials-modal").style.display = "block";

                // Hide the credentials modal after 20 seconds
                setTimeout(() => {
                    document.getElementById("generated-credentials-modal").style.display = "none";
                    document.getElementById("generated-password").innerHTML = "";
                }, 20000);

                loadStaffData(); // Refresh staff list
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
    document.getElementById("generated-credentials-modal").style.display = "none";
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

async function checkAuthorizationStatus() {
    try {
        const response = await fetch("/api/auth/status"); // Call backend to check authorization

        if (response.ok) {
            const data = await response.json();
            
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

// Edit Staff Function (Placeholder)
function editStaff(email) {
    alert(`Edit feature is under development for ${email}`);
}
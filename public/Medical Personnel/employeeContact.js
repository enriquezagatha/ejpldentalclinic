const CONTACT_API_URL = "http://localhost:3000/api/contact";

// 🔹 Modal Elements
const modal = document.getElementById("add-contact-modal");
const openModalBtn = document.getElementById("open-add-modal-btn");
const closeModalBtn = document.querySelector(".close-modal");

// ✅ Reset Form Function
function resetContactForm() {
    document.getElementById("modal-landline").value = "";
    document.getElementById("modal-phone").value = "";
    document.getElementById("modal-facebook").value = "";
    document.getElementById("modal-facebook-text").value = "";
}

// ✅ Open the Modal & Reset Form
openModalBtn.addEventListener("click", () => {
    resetContactForm(); // Reset form before showing modal
    document.getElementById("modal-title").innerText = "Add Contact";
    document.getElementById("add-contact-btn").style.display = "block"; // Show Add Contact Button
    document.getElementById("save-contact-btn").style.display = "none"; // Hide Save Changes Button
    modal.style.display = "block";
});

// ✅ Close the Modal & Reset Form
closeModalBtn.addEventListener("click", () => {
    resetContactForm(); // Reset form when closing
    modal.style.display = "none";
});

// ✅ Close Modal if Click Outside
window.addEventListener("click", (event) => {
    if (event.target === modal) {
        resetContactForm();
        modal.style.display = "none";
    }
});

// ✅ Fetch and Display Contacts in Table
document.addEventListener("DOMContentLoaded", function () {
    loadContacts();
});

async function loadContacts() {
    try {
        const response = await fetch(CONTACT_API_URL);
        const contacts = await response.json();

        const contactTable = document.getElementById("contact-list");
        contactTable.innerHTML = ""; // Clear table before updating

        if (contacts && contacts.length > 0) {
            contacts.forEach(contact => {
                // Create a row for landline, if available
                if (contact.landline) {
                    const row = document.createElement("tr");
                    row.innerHTML = `
                        <td>Landline</td>
                        <td>${contact.landline}</td>
                        <td>
                            <button onclick="editContact('${contact._id}', 'landline')">Edit</button>
                            <button onclick="deleteContact('${contact._id}')">Delete</button>
                        </td>
                    `;
                    contactTable.appendChild(row);
                }

                // ✅ Create a row for phone, if available
                if (contact.phone) {
                    const row = document.createElement("tr");
                    row.innerHTML = `
                        <td>Phone</td>
                        <td>${contact.phone}</td>
                        <td>
                            <button onclick="editContact('${contact._id}', 'phone')">Edit</button>
                            <button onclick="deleteContact('${contact._id}')">Delete</button>
                        </td>
                    `;
                    contactTable.appendChild(row);
                }

                // ✅ Create a row for Facebook page, if available
                if (contact.facebook_page) {
                    const row = document.createElement("tr");
                    row.innerHTML = `
                        <td>Facebook Page</td>
                        <td><a href="${contact.facebook_page}" target="_blank">${contact.facebook_page}</a></td>
                        <td>
                            <button onclick="editContact('${contact._id}', 'facebook_page')">Edit</button>
                            <button onclick="deleteContact('${contact._id}')">Delete</button>
                        </td>
                    `;
                    contactTable.appendChild(row);
                }

                // ✅ Create a row for Facebook text, if available
                if (contact.facebook_text) {
                    const row = document.createElement("tr");
                    row.innerHTML = `
                        <td>Facebook Text</td>
                        <td>${contact.facebook_text}</td>
                        <td>
                            <button onclick="editContact('${contact._id}', 'facebook_text')">Edit</button>
                            <button onclick="deleteContact('${contact._id}')">Delete</button>
                        </td>
                    `;
                    contactTable.appendChild(row);
                }

            });
        }
    } catch (error) {
        console.error("Error loading contacts:", error);
    }
}

// ✅ Add a New Contact (From Modal)
document.getElementById("add-contact-btn").addEventListener("click", async function () {
    const landline = document.getElementById("modal-landline").value.trim();
    const phone = document.getElementById("modal-phone").value.trim();
    const facebook_page = document.getElementById("modal-facebook").value.trim();
    const facebook_text = document.getElementById("modal-facebook-text").value.trim();

    try {
        const response = await fetch(CONTACT_API_URL, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ landline, phone, facebook_page, facebook_text })
        });

        if (!response.ok) throw new Error("Failed to add contact");

        alert("Contact added successfully!");
        resetContactForm(); // ✅ Reset form after adding
        modal.style.display = "none"; // ✅ Close modal
        loadContacts(); // ✅ Reload the contact list
    } catch (error) {
        console.error("Error adding contact:", error);
    }
});

// ✅ Delete a Contact
async function deleteContact(contactField) {
    if (!confirm(`Are you sure you want to delete the ${contactField}?`)) return;

    try {
        const response = await fetch(CONTACT_API_URL, {
            method: "DELETE",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ field: contactField })
        });

        if (!response.ok) throw new Error("Failed to delete contact");

        alert(`${contactField} deleted successfully!`);
        loadContacts(); // Reload the contacts after deletion
    } catch (error) {
        console.error("Error deleting contact:", error);
    }
}

// ✅ Edit Contact
async function editContact(contactId, field) {
    try {
        // Fetch the contact by ID
        const response = await fetch(`${CONTACT_API_URL}/${contactId}`);
        const contact = await response.json();

        // Reset the modal fields
        resetContactForm();

        // Update the modal title to "Edit <field>"
        document.getElementById("modal-title").innerText = `Edit ${field}`;

        // Hide all input fields initially
        document.getElementById("landline-section").style.display = "none";
        document.getElementById("phone-section").style.display = "none";
        document.getElementById("facebook-section").style.display = "none";
        document.getElementById("facebook-text-section").style.display = "none";

        // Only show the relevant input field based on the 'field' argument
        if (field === "landline") {
            document.getElementById("landline-section").style.display = "block";
            document.getElementById("modal-landline").value = contact.landline || "";
        } else if (field === "phone") {
            document.getElementById("phone-section").style.display = "block";
            document.getElementById("modal-phone").value = contact.phone || "";
        } else if (field === "facebook_page") {
            document.getElementById("facebook-section").style.display = "block";
            document.getElementById("modal-facebook").value = contact.facebook_page || "";
        } else if (field === "facebook_text") {
            document.getElementById("facebook-text-section").style.display = "block";
            document.getElementById("modal-facebook-text").value = contact.facebook_text || "";
        }

        // Show the "Save Changes" button and hide the "Add Contact" button
        document.getElementById("add-contact-btn").style.display = "none"; // Hide Add Contact Button
        document.getElementById("save-contact-btn").style.display = "block"; // Show Save Changes Button

        // Show the modal
        modal.style.display = "block";

        // Handle save action for the edited contact (specific field)
        document.getElementById("save-contact-btn").addEventListener("click", async () => {
            let updatedValue;
            if (field === "landline") {
                updatedValue = document.getElementById("modal-landline").value.trim();
            } else if (field === "phone") {
                updatedValue = document.getElementById("modal-phone").value.trim();
            } else if (field === "facebook_page") {
                updatedValue = document.getElementById("modal-facebook").value.trim();
            } else if (field === "facebook_text") {
                updatedValue = document.getElementById("modal-facebook-text").value.trim();
            }

            try {
                const updateResponse = await fetch(`${CONTACT_API_URL}/${contactId}`, {
                    method: "PUT",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        [field]: updatedValue
                    })
                });

                if (!updateResponse.ok) throw new Error("Failed to update contact");

                alert(`${field} updated successfully!`);
                modal.style.display = "none"; // Close the modal after saving
                loadContacts(); // Reload the contact list
            } catch (error) {
                console.error("Error updating contact:", error);
            }
        });
    } catch (error) {
        console.error("Error fetching contact for edit:", error);
    }
}



// Update Contact in the Database
async function updateContact(field, value) {
    try {
        const response = await fetch(CONTACT_API_URL, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ [field]: value })
        });

        if (!response.ok) throw new Error("Failed to update contact");

        alert("Contact updated successfully!");
    } catch (error) {
        console.error("Error updating contact:", error);
    }
}
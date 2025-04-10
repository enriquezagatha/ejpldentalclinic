const DENTIST_API_URL = "http://localhost:3000/api/dentists";

// Fetch and display dentists
async function displayDentists() {
    const response = await fetch(DENTIST_API_URL);
    const dentists = await response.json();

    const dentistTableBody = document.getElementById("dentist-table-body");
    dentistTableBody.innerHTML = "";

    dentists.forEach((dentist) => {
        
        // Create the full name with middle initial (if available)
        const middleInitial = dentist.middleName ? dentist.middleName.charAt(0) + "." : ""; // Get the middle initial
        const fullName = `${dentist.firstName} ${dentist.secondName} ${middleInitial} ${dentist.lastName}`.replace(/\s+/g, " ").trim();

        dentistTableBody.innerHTML += `
            <tr>
                <td>${fullName}</td>
                <td>${dentist.contact}</td>
                <td><img src="${dentist.image ? dentist.image : 'default-image.jpg'}" alt="dentist Image" class="dentist-img" width="50"></td>
                <td>
                    <button onclick="editDentist('${dentist._id}', '${fullName.replace(/'/g, "\\'")}', '${dentist.contact}', '${dentist.image || ''}')">Edit</button>
                    <button onclick="deleteDentist('${dentist._id}')">Delete</button>
                </td>
            </tr>`;
    });
}

// Add or update dentist (with image upload support)
async function addOrUpdateDentist() {
    const firstName = document.getElementById("dentist-first-name").value.trim();
    const secondName = document.getElementById("dentist-second-name").value.trim();
    const middleName = document.getElementById("dentist-middle-name").value.trim();
    const lastName = document.getElementById("dentist-last-name").value.trim();
    const contact = document.getElementById("dentist-contact").value.trim();
    const gender = document.getElementById("dentist-gender").value; // Get gender from the dropdown
    const imageFile = document.getElementById("dentist-image").files[0];
    const editId = document.getElementById("editdentistId").value;

    if (!firstName || !lastName || !contact || !gender) {
        alert("Please enter first name, last name, contact number, and select gender.");
        return;
    }

    const fullName = `${firstName} ${secondName} ${middleName} ${lastName}`.replace(/\s+/g, " ").trim();

    try {
        const res = await fetch(DENTIST_API_URL);
        if (!res.ok) throw new Error("Failed to fetch dentists");

        const dentists = await res.json();
        const isDuplicate = dentists.some(dentist => {
            const existingFullName = `${dentist.firstName || ""} ${dentist.secondName || ""} ${dentist.middleName || ""} ${dentist.lastName || ""}`.replace(/\s+/g, " ").trim().toLowerCase();
            return existingFullName === fullName.toLowerCase() && dentist._id !== editId;
        });

        if (isDuplicate) {
            alert("A dentist with this name already exists. Please choose a different name.");
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
            body: formData
        });

        if (response.ok) {
            alert(`Dentist ${editId ? "updated" : "added"} successfully!`);
            document.getElementById("dentist-modal").style.display = "none";
            displayDentists();
        } else {
            alert("Failed to save dentist.");
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
    const middleName = nameParts.length > 2 ? nameParts.slice(1, -1).join(" ") : "";

    document.getElementById("dentist-first-name").value = firstName;
    document.getElementById("dentist-second-name").value = middleName;
    document.getElementById("dentist-middle-name").value = middleName;
    document.getElementById("dentist-last-name").value = lastName;
    document.getElementById("dentist-contact").value = contact;
    document.getElementById("editdentistId").value = id;
    document.getElementById("dentist-modal").style.display = "block";
}

// Delete dentist
async function deleteDentist(id) {
    if (confirm("Are you sure you want to delete this dentist?")) {
        await fetch(`${DENTIST_API_URL}/${id}`, { method: "DELETE" });
        displayDentists();
    }
}

// Open & close modal
document.getElementById("open-dentist-modal-btn").addEventListener("click", () => {
    document.getElementById("dentist-modal").style.display = "block";
});

document.getElementById("close-dentist-modal-btn").addEventListener("click", () => {
    document.getElementById("dentist-modal").style.display = "none";
});

document.getElementById("save-dentist-btn").addEventListener("click", addOrUpdateDentist);

// Load dentists on page load
displayDentists();
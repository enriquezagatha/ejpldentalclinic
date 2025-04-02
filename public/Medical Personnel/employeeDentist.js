const DENTIST_API_URL = "http://localhost:3000/api/dentists";

// Fetch and display dentists
async function displayDentists() {
    const response = await fetch(DENTIST_API_URL);
    const dentists = await response.json();

    const dentistTableBody = document.getElementById("dentist-table-body");
    dentistTableBody.innerHTML = "";
    dentists.forEach((dentist) => {
        dentistTableBody.innerHTML += `
            <tr>
                <td>${dentist.name}</td>
                <td>${dentist.contact}</td>
                <td><img src="${dentist.image ? dentist.image : 'default-image.jpg'}" alt="dentist Image" class="dentist-img" width="50"></td>
                <td>
                    <button onclick="editDentist('${dentist._id}', '${dentist.name}', '${dentist.contact}', '${dentist.image}')">Edit</button>
                    <button onclick="deleteDentist('${dentist._id}')">Delete</button>
                </td>
            </tr>`;
    });
}

// Add or update dentist (with image upload support)
async function addOrUpdateDentist() {
    const name = document.getElementById("dentist-name").value.trim();
    const contact = document.getElementById("dentist-contact").value.trim();
    const imageFile = document.getElementById("dentist-image").files[0];
    const editId = document.getElementById("editdentistId").value;

    if (!name || !contact) {
        alert("Please enter both name and contact number.");
        return;
    }

    try {
        // Fetch existing dentists to check for duplicate names
        const res = await fetch(DENTIST_API_URL);
        if (!res.ok) throw new Error("Failed to fetch dentists");

        const dentists = await res.json();
        const isDuplicate = dentists.some(dentist => 
            dentist.name.toLowerCase() === name.toLowerCase() && dentist._id !== editId
        );

        if (isDuplicate) {
            alert("A dentist with this name already exists. Please choose a different name.");
            return;
        }

        const formData = new FormData();
        formData.append("name", name);
        formData.append("contact", contact);
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
            alert(`dentist ${editId ? "updated" : "added"} successfully!`);
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
function editDentist(id, name, contact, image) {
    document.getElementById("dentist-name").value = name;
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
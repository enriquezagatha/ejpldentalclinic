function displayProfileInfo(data) {
    document.getElementById('full-name').innerText = `Full Name: ${data.firstName} ${data.lastName}`;
    document.getElementById('birthday-info').innerText = `Birthday: ${data.birthday}`;
    document.getElementById('email-info').innerText = `Email: ${data.email}`;
}

async function fetchProfile() {
    const response = await fetch('/api/patient/profile');
    if (response.ok) {
        const data = await response.json();
        displayProfileInfo(data);
    } else {
        console.error('Error fetching profile data');
    }
}

async function fetchAppointments() {
    const appointmentsResponse = await fetch('/api/appointments/patient/appointments'); // Call new endpoint
    if (appointmentsResponse.ok) {
        const appointmentsData = await appointmentsResponse.json();

        // Sort appointments by preferredDate in descending order (latest to oldest)
        appointmentsData.sort((a, b) => new Date(b.preferredDate) - new Date(a.preferredDate));

        console.log('Sorted Appointments:', appointmentsData); // Log the sorted appointments data
        displayAppointments(appointmentsData);
    } else {
        console.error('Error fetching appointments:', appointmentsResponse.statusText);
    }
}

// Make sure to define this array somewhere in your code
const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June', 
    'July', 'August', 'September', 'October', 'November', 'December'
];

function showLogoutModal() {
    const overlay = document.getElementById('logout-overlay');
    overlay.style.display = 'flex';
}

function confirmLogout(isConfirmed) {
    const overlay = document.getElementById('logout-overlay');
    if (isConfirmed) {
        window.location.href = "/main page/home.html";
    } else {
        overlay.style.display = 'none';
    }
}

function formatDate(dateString) {
    const [year, month, day] = dateString.split('-');
    const monthName = monthNames[parseInt(month, 10) - 1]; // Month is 0-indexed in arrays
    return `${monthName} ${day}, ${year}`; // Format: Month Name Day, Year
}

function toggleEditForm() {
    const overlay = document.getElementById('overlay');
    const formContainer = document.getElementById('form-container');
    
    const isHidden = formContainer.style.display === 'none' || formContainer.style.display === '';
    formContainer.style.display = isHidden ? 'block' : 'none';
    overlay.style.display = isHidden ? 'block' : 'none';

    if (!isHidden) {
        hideMessages();
    }
}

function hideMessages() {
    const errorMessageDiv = document.getElementById('error-message');
    const successMessageDiv = document.getElementById('success-message');
    errorMessageDiv.style.display = 'none';
    successMessageDiv.style.display = 'none';
}

function confirmSave() {
    document.getElementById('profileconfirmation-modal').style.display = 'flex';
}

function confirmChanges(isConfirmed) {
    const modal = document.getElementById('profileconfirmation-modal');
    if (isConfirmed) {
        updateProfile();
    }
    modal.style.display = 'none';
}

async function updateProfile() {
    const email = document.getElementById('edit-email').value;
    const currentPassword = document.getElementById('current-password').value;
    const newPassword = document.getElementById('new-password').value;

    const errorMessageDiv = document.getElementById('edit-error-message');
    const successMessageDiv = document.getElementById('edit-success-message');
    errorMessageDiv.innerText = '';
    errorMessageDiv.style.display = 'none';
    successMessageDiv.innerText = '';
    successMessageDiv.style.display = 'none';

    const response = await fetch('/api/patient/update', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, currentPassword, newPassword }),
    });

    if (response.ok) {
        const result = await response.json();
        let successMessage = '';
        if (result.emailUpdated) {
            successMessage += 'Email updated successfully. ';
        }
        if (result.passwordUpdated) {
            successMessage += 'Password updated successfully. ';
        }

        if (successMessage.trim()) {
            successMessageDiv.innerText = successMessage.trim();
            successMessageDiv.style.display = 'block';
        }

        setTimeout(() => {
            successMessageDiv.style.display = 'none';
        }, 3000);

        document.getElementById('edit-form').reset();

        const profileResponse = await fetch('/api/patient/profile');
        if (profileResponse.ok) {
            const patientData = await profileResponse.json();
            displayProfileInfo(patientData);
        } else {
            console.error('Error fetching updated patient profile:', profileResponse.statusText);
        }
    } else {
        const result = await response.json();
        errorMessageDiv.innerText = result.message || 'An error occurred during profile update.';
        errorMessageDiv.style.display = 'block';
    }
}

// Open picture modal
function openPictureModal() {
    const modal = document.getElementById("picture-options-modal");
    const profilePicture = document.getElementById("profile-picture").src;
    const preview = document.getElementById("profile-preview");
    preview.src = profilePicture; // Set the current picture as the preview
    modal.style.display = "flex";
}

// Close picture modal
function closePictureModal() {
    const modal = document.getElementById("picture-options-modal");
    modal.style.display = "none";
}

// Preview the selected image before uploading
function previewSelectedImage(event) {
    const file = event.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function (e) {
            const preview = document.getElementById("profile-preview");
            preview.src = e.target.result; // Set the preview image source
        };
        reader.readAsDataURL(file);
    }
}

// Show the upload confirmation modal
function showUploadConfirmation() {
    const confirmationModal = document.getElementById("upload-confirmation-modal");
    confirmationModal.style.display = "flex";
}

// Close the upload confirmation modal
function closeUploadConfirmation() {
    const confirmationModal = document.getElementById("upload-confirmation-modal");
    confirmationModal.style.display = "none";
}

// Display messages in modal
function showMessageInModal(isSuccess, message) {
    const successMessage = document.getElementById("modal-success-message");
    const errorMessage = document.getElementById("modal-error-message");

    if (isSuccess) {
        successMessage.textContent = message;
        successMessage.style.display = "block";
        errorMessage.style.display = "none";
    } else {
        errorMessage.textContent = message;
        errorMessage.style.display = "block";
        successMessage.style.display = "none";
    }

    // Auto-hide message after 3 seconds
    setTimeout(() => {
        successMessage.style.display = "none";
        errorMessage.style.display = "none";
    }, 3000);
}

// Confirm or cancel the upload
async function confirmUpload(isConfirmed) {
    closeUploadConfirmation();

    if (!isConfirmed) {
        showMessageInModal(false, "Upload canceled.");
    } else {
        const pictureInput = document.getElementById("upload-picture");

        if (!pictureInput.files || pictureInput.files.length === 0) {
            showMessageInModal(false, "Please select a picture to upload.");
        } else {
            const formData = new FormData();
            formData.append("profilePicture", pictureInput.files[0]);

            const response = await fetch("/api/patient/upload-profile-picture", {
                method: "POST",
                body: formData,
            }).catch(() => null); // Handle network errors by returning null

            if (!response) {
                showMessageInModal(false, "An error occurred during the upload.");
            } else if (response.ok) {
                const result = await response.json();
                document.getElementById("profile-picture").src = `/uploads/${result.filename}`;
                document.getElementById("profile-preview").src = `/uploads/${result.filename}`;
                pictureInput.value = ""; // Clear the file input field
                showMessageInModal(true, "Profile picture uploaded successfully.");
            } else {
                showMessageInModal(false, "Failed to upload profile picture.");
            }
        }
    }
}

// Upload the new profile picture
async function uploadProfilePicture() {
    const pictureInput = document.getElementById('upload-picture');
    if (!pictureInput.files || pictureInput.files.length === 0) {
        alert('Please select a picture to upload.');
        return;
    }

    const formData = new FormData();
    formData.append('profilePicture', pictureInput.files[0]);

    const response = await fetch('/api/patient/upload-profile-picture', {
        method: 'POST',
        body: formData
    });

    if (response.ok) {
        const result = await response.json();
        document.getElementById('profile-picture').src = `/uploads/${result.filename}`;
        document.getElementById('profile-preview').src = `/uploads/${result.filename}`;
        alert('Profile picture updated successfully.');
    } else {
        alert('Failed to upload profile picture.');
    }
}

// Function to delete the profile picture
async function deleteProfilePicture() {
    const response = await fetch('/api/patient/delete-profile-picture', {
        method: 'DELETE'
    });

    if (response.ok) {
        // Reset the profile picture to the default image
        const defaultPicture = "../media/default-profile.png";
        document.getElementById("profile-picture").src = defaultPicture;
        document.getElementById("profile-preview").src = defaultPicture;

        // Show success message
        showMessageInModal(true, "Profile picture deleted successfully.");
    } else {
        // Show error message
        showMessageInModal(false, "Failed to delete profile picture.");
    }
}

// Show the delete confirmation modal
function showDeleteConfirmation() {
    const confirmationModal = document.getElementById("delete-confirmation-modal");
    confirmationModal.style.display = "flex";
}

// Close the delete confirmation modal
function closeDeleteConfirmation() {
    const confirmationModal = document.getElementById("delete-confirmation-modal");
    confirmationModal.style.display = "none";
}

// Confirm or cancel the deletion
async function confirmDelete(isConfirmed) {
    closeDeleteConfirmation();

    if (!isConfirmed) {
        showMessageInModal(false, "Profile picture deletion canceled.");
    } else {
        const response = await fetch('/api/patient/delete-profile-picture', {
            method: 'DELETE'
        });

        if (response.ok) {
            // Reset the profile picture to the default image
            const defaultPicture = "../media/logo/default-profile.png";
            document.getElementById("profile-picture").src = defaultPicture;
            document.getElementById("profile-preview").src = defaultPicture;

            // Show success message
            showMessageInModal(true, "Profile picture deleted successfully.");
        } else {
            // Show error message
            showMessageInModal(false, "Failed to delete profile picture.");
        }
    }
}

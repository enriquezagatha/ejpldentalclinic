document.addEventListener("DOMContentLoaded", function () {
    loadFormData(); // Load saved form data when the page loads
});

// Function to navigate back
function goBackAppointment() {
    sessionStorage.removeItem("existingPatientFormData"); // Clear session storage
    window.location.href = "existing-step2appointment.html"; // Redirect to patient type selection
}

// Function to navigate to the next step
function goNextAppointment() {
    saveFormData(); // Save data before moving to the next step
        window.location.href = "existing-step3appointment.html"; // Change this to the next step URL
    /* if (validateForm()) {
    } */
}

// Function to validate form fields
/* function validateForm() {
    let fullName = document.getElementById("full-name").value.trim();
    let contactNumber = document.getElementById("contact-number").value.trim();
    let contactWarning = document.getElementById("contact-warning");
    let formWarning = document.getElementById("form-warning");

    // Hide warnings initially
    contactWarning.style.display = "none";
    formWarning.style.display = "none";

    if (fullName === "" || contactNumber === "") {
        formWarning.style.display = "block";
        return false;
    }

    if (!/^\d{11}$/.test(contactNumber)) {
        contactWarning.style.display = "block";
        return false;
    }

    return true;
} */

// Save form data to session storage
function saveFormData() {
    const fullName = document.getElementById("full-name").value.trim();
    const nameParts = fullName.split(" "); // Split full name into first and last names

    const formData = {
        firstName: nameParts[0] || "", // First part is first name
        lastName: nameParts.slice(1).join(" ") || "", // Remaining part is last name
        contactNumber: document.getElementById("contact-number").value.trim(),
    };

    sessionStorage.setItem("existingPatientFormData", JSON.stringify(formData)); // Store in sessionStorage
}

// Load form data from session storage
function loadFormData() {
    const savedData = JSON.parse(sessionStorage.getItem("existingPatientFormData"));
    
    if (savedData) {
        document.getElementById("full-name").value = savedData.fullName || '';
        document.getElementById("contact-number").value = savedData.contactNumber || '';
    }
}

// Optional: Clear session storage when canceling appointment
document.getElementById("cancel-appointment-btn")?.addEventListener("click", function () {
    sessionStorage.removeItem("existingPatientFormData");
});
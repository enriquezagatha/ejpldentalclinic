document.addEventListener("DOMContentLoaded", function () {
  loadFormData(); // Load saved form data when the page loads
});

function goBackAppointment() {
  sessionStorage.setItem("isNavigating", "true"); // Set flag for navigation
  saveFormData(); // Save only what's still needed
  window.location.href = "patient-existingappointmentdetails.html";
}

// Function to navigate to the next step
function goNextAppointment() {
  sessionStorage.setItem("isNavigating", "true"); // Set flag for navigation
  saveFormData(); // Save data before moving to the next step
  window.location.href = "patient-existingconfirmdetails.html"; // Change this to the next step URL
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
    firstName: nameParts[0] || "",
    lastName: nameParts.slice(1).join(" ") || "",
    contactNumber: document.getElementById("contact-number").value.trim(),
  };

  sessionStorage.setItem("existingPatientFormData", JSON.stringify(formData));
}

function loadFormData() {
  const savedData = JSON.parse(sessionStorage.getItem("existingPatientFormData"));

  if (savedData) {
    // Recombine first and last name to set the full name input
    const fullNameInput = document.getElementById("full-name");
    if (fullNameInput) {
      fullNameInput.value = `${savedData.firstName} ${savedData.lastName}`.trim();
    }

    const contactNumberInput = document.getElementById("contact-number");
    if (contactNumberInput) {
      contactNumberInput.value = savedData.contactNumber || "";
    }
  }
}

// Optional: Clear session storage when canceling appointment
document
  .getElementById("cancel-appointment-btn")
  ?.addEventListener("click", function () {
    sessionStorage.removeItem("existingPatientFormData");
  });

document.addEventListener("DOMContentLoaded", function () {
  loadFormData(); // Load saved form data when the page loads
  fetchPatientInfo(); // Fetch from API if needed

  // Contact number validation
  // function validateContactNumber(event) {
  //   const contactNumber = event.target;
  //   const contactWarning = document.getElementById('contact-warning');
    
  //   // Adjust validation to exclude the static "09" prefix
  //   const inputValue = contactNumber.value;
  //   if (inputValue.length > 9) { // Limit to 9 digits after "09"
  //     contactNumber.value = inputValue.slice(0, 9);
  //   }

  //   contactWarning.style.display = inputValue.length < 9 ? 'block' : 'none';
  //   if (inputValue.length === 9) {
  //     contactWarning.style.display = 'none'; // Hide warning if valid
  //   }
  // }

  // function validateFullName(event) {
  //   const fullName = event.target;
  //   const fullNameWarning = document.getElementById('name-warning');

  //   // Split the input by spaces and filter out empty strings (in case of extra spaces)
  //   const nameParts = fullName.value.trim().split(' ').filter(part => part !== '');

  //   if (nameParts.length < 2) {
  //     fullNameWarning.style.display = 'block';
  //   } else {
  //     fullNameWarning.style.display = 'none';
  //   }
  // }

  // document.getElementById('contact-number').addEventListener('input', validateContactNumber);
  // document.getElementById('full-name').addEventListener('input', validateFullName);
});

// Navigate back
function goBackAppointment() {
  sessionStorage.setItem("isNavigating", "true"); // Set flag for navigation
  saveFormData(); // Save only what's still needed
  window.location.href = "patient-existingappointmentdetails.html";
}

// Navigate next
function goNextAppointment() {
  sessionStorage.setItem("isNavigating", "true"); // Set flag for navigation
  // if (validateForm()) {
  saveFormData(); // Save data before moving to the next step
  window.location.href = "patient-existingconfirmdetails.html"; // Next step URL
  // }
}

// Validate form fields
// function validateForm() {
//   const requiredFields = ['full-name', 'contact-number'];

//   let formWarning = document.getElementById("form-warning");
//   formWarning.style.display = "none"; // Hide warning initially

//   for (let i = 0; i < requiredFields.length; i++) {
//     const field = document.getElementById(requiredFields[i]);
//     if (!field.value.trim()) {
//       formWarning.style.display = "block"; // Show warning message
//       field.focus(); // Focus the first empty field
//       return false;
//     }
//   }

//   const fullName = document.getElementById("full-name").value.trim();
//   if (fullName.split(" ").length < 2) {
//     formWarning.style.display = "block"; // Show warning message
//     return false;
//   }

//   const contactNumber = `09${document.getElementById("contact-number").value.trim()}`;
//   if (contactNumber.length !== 11 || !/^09\d{9}$/.test(contactNumber)) {
//     formWarning.style.display = "block"; // Show warning message
//     return false;
//   }

//   return true;
// }

// Save form data to session storage
function saveFormData() {
  const fullName = document.getElementById("full-name").value.trim();
  const nameParts = fullName.split(" ");

  const formData = {
    firstName: nameParts[0] || "",
    lastName: nameParts.slice(1).join(" ") || "",
    contactNumber: document.getElementById("contact-number").value.trim(),
  };

  sessionStorage.setItem("existingPatientFormData", JSON.stringify(formData));
}

// Load form data from session storage
function loadFormData() {
  const savedData = JSON.parse(sessionStorage.getItem("existingPatientFormData"));

  if (savedData) {
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

// Fetch patient info from server
async function fetchPatientInfo() {
  const fullNameInput = document.getElementById("full-name");
  const contactNumberInput = document.getElementById("contact-number");

  if (fullNameInput?.value.trim() && contactNumberInput?.value.trim()) {
    // If form is already filled, skip fetching
    return;
  }

  try {
    const response = await fetch("/api/patient/records", { method: "GET", credentials: "include" });

    if (!response.ok) {
      throw new Error("Failed to fetch patient info");
    }

    const patient = await response.json();
    console.log("Fetched Patient:", patient);

    if (patient && patient.firstName && patient.lastName) {
      if (fullNameInput && !fullNameInput.value.trim()) {
        fullNameInput.value = `${patient.firstName} ${patient.lastName}`;
      }

      if (contactNumberInput && !contactNumberInput.value.trim()) {
        let contactNumber = patient.contactNumber || "";
      
        if (contactNumber.length === 10) {
          contactNumberInput.value = contactNumber; // include the '9'
        } else {
          console.warn("Unexpected contact number format:", contactNumber);
          contactNumberInput.value = contactNumber;
        }
      }      
    }
  } catch (error) {
    console.error("Error fetching patient info:", error);
  }
}

// Clear session storage when canceling
document
  .getElementById("cancel-appointment-btn")
  ?.addEventListener("click", function () {
    sessionStorage.removeItem("existingPatientFormData");
  });
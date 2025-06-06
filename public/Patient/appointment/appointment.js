// Function to validate the form
function validateForm() {
    const requiredFields = [
        'gender',
        'address',
        'contact-number',
        'emergency-contact',
        'emergency-contact-number',
        'selected-history',
        'emergency-contact-relationship'
    ];

    let formWarning = document.getElementById("form-warning");
    formWarning.style.display = "none"; // Hide warning initially

    // Check if all required fields are filled
    for (let i = 0; i < requiredFields.length; i++) {
        const field = document.getElementById(requiredFields[i]);
        if (!field || !field.value.trim()) { // Ensure field exists and is not empty
            formWarning.style.display = "block"; // Show warning message
            field?.focus(); // Focus the first empty field
            return false;
        }
    }

    // Check if contact numbers are valid
    const contactNumber = document.getElementById("contact-number").value.trim();
    const emergencyContactNumber = document.getElementById("emergency-contact-number").value.trim();
    if (
        contactNumber.length !== 10 || 
        !/^\d{10}$/.test(contactNumber) || 
        emergencyContactNumber.length !== 10 || 
        !/^\d{10}$/.test(emergencyContactNumber)
    ) {
        document.getElementById('form-warning').style.display = 'block'; // Show warning message
        return false;
    }

    return true;
}

function goBackAppointment(event) {
    event.preventDefault(); // Prevent default form submission
    sessionStorage.setItem("isNavigating", "true"); // Set flag for navigation
    saveFormData();
    // Navigate to the correct HTML page
    window.location.href = "patient-newappointmentdetails.html"; // Corrected file path
}

function goNextAppointment(event) {
    sessionStorage.setItem("isNavigating", "true"); // Set flag for navigation
    if (validateForm()) {
        saveFormData(); // Save data before moving to the next step
        window.location.href = "patient-newconfirmdetails.html"; // Change this to the next step URL
    }
}

// Save form data to session storage
function saveFormData() {
    const formData = {
        firstName: document.getElementById('first-name')?.value || '',
        lastName: document.getElementById('last-name')?.value || '',
        age: document.getElementById('age')?.value || '',
        gender: document.getElementById('gender')?.value || '',
        address: document.getElementById('address')?.value || '',
        contactNumber: document.getElementById('contact-number')?.value || '',
        emailAddress: document.getElementById('email-address')?.value || '',
        emergencyContact: document.getElementById('emergency-contact')?.value || '',
        emergencyContactNumber: document.getElementById('emergency-contact-number')?.value || '',
        selectedHistory: document.getElementById('selected-history')?.value || '',
        emergencyContactRelationship: document.getElementById('emergency-contact-relationship')?.value || '',
    };
    sessionStorage.setItem('formData', JSON.stringify(formData));
}

function computeAge(birthday) {
    const birthDate = new Date(birthday);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();

    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
        age--;
    }

    return age;
}

// Load form data from session storage
async function loadFormData() {
    const savedData = JSON.parse(sessionStorage.getItem('formData'));

    // Fetch logged-in patient data from the server
    const response = await fetch('/api/patient/profile');
    const patient = await response.json();

    if (patient) {
        document.getElementById('first-name').value = patient.firstName || '';
        document.getElementById('last-name').value = patient.lastName || '';
        document.getElementById('email-address').value = patient.email || '';

        //compute age from bday
        if(patient.birthday){
            document.getElementById('age').value = computeAge(patient.birthday) || '';
        }
    }

    if (savedData) {
        document.getElementById('first-name').value = savedData.firstName || document.getElementById('first-name').value;
        document.getElementById('last-name').value = savedData.lastName || document.getElementById('last-name').value;
        document.getElementById('email-address').value = savedData.emailAddress || document.getElementById('email-address').value;
        document.getElementById('age').value = savedData.age || document.getElementById('age').value;
        document.getElementById('gender').value = savedData.gender || '';
        document.getElementById('address').value = savedData.address || '';
        document.getElementById('contact-number').value = savedData.contactNumber || '';
        document.getElementById('emergency-contact').value = savedData.emergencyContact || '';
        document.getElementById('emergency-contact-number').value = savedData.emergencyContactNumber || '';
        document.getElementById('selected-history').value = savedData.selectedHistory || '';
        document.getElementById('emergency-contact-relationship').value = savedData.emergencyContactRelationship || '';

        // Update dropdown button text
        document.querySelector('.dropdown-btn').textContent = savedData.selectedHistory || 'Select Medical History';
    }
}

document.addEventListener('DOMContentLoaded', function () {
    // Load form data (will be empty if not previously saved)
    loadFormData();

    // Add event listener to the dropdown button
    document.querySelector('.dropdown-btn').addEventListener('click', function (event) {
        var dropdownContent = document.querySelector('.dropdown-content');
        if (dropdownContent) {
            // Toggle visibility of dropdown content
            dropdownContent.style.display = dropdownContent.style.display === 'block' ? 'none' : 'block';
        } else {
            console.error('Dropdown content element not found');
        }
        event.stopPropagation(); // Prevent click from propagating to the document
    });

    // Hide dropdown content when clicking outside
    document.addEventListener('click', function () {
        var dropdownContent = document.querySelector('.dropdown-content');
        if (dropdownContent) {
            dropdownContent.style.display = 'none';
        }
    });

    // Add event listeners to all checkboxes inside the dropdown content
    document.querySelectorAll('.dropdown-content input[type="checkbox"]').forEach(function (checkbox) {
        checkbox.addEventListener('change', function () {
            var selected = [];
            var othersCheckbox = document.getElementById('others');
            var otherConditionTextBox = document.getElementById('other-condition');

            // Collect selected checkboxes values
            document.querySelectorAll('.dropdown-content input[type="checkbox"]:checked').forEach(function (checkedBox) {
                if (checkedBox !== othersCheckbox) {
                    selected.push(checkedBox.value);
                }
            });

            // Show or hide the 'Others' text box based on the 'Others' checkbox
            if (othersCheckbox && otherConditionTextBox) {
                otherConditionTextBox.style.display = othersCheckbox.checked ? 'block' : 'none';
            }

            // Add 'Others: [text]' if 'Others' is checked and has text
            if (othersCheckbox.checked && otherConditionTextBox.value.trim()) {
                selected.push('Others: ' + otherConditionTextBox.value.trim());
            }

            // Update button text
            var dropdownBtn = document.querySelector('.dropdown-btn');
            dropdownBtn.innerHTML = (selected.length > 0 ? selected.join(', ') : 'Select Medical History') + 
                ' <i class="fas fa-chevron-down text-[0.7rem] text-gray-400"></i>';

            // Update button text color
            dropdownBtn.classList.toggle('text-black', selected.length > 0);
            dropdownBtn.classList.toggle('text-gray-400', selected.length === 0);

            // Update hidden input value
            document.getElementById('selected-history').value = selected.join(', ');
        });
    });

    // Add event listener for text box input to handle 'Others' option
    document.getElementById('other-condition').addEventListener('input', function () {
        var othersCheckbox = document.getElementById('others');
        var selected = [];
        var otherConditionTextBox = document.getElementById('other-condition');

        // Collect selected checkboxes values
        document.querySelectorAll('.dropdown-content input[type="checkbox"]:checked').forEach(function (checkedBox) {
            if (checkedBox !== othersCheckbox) {
                selected.push(checkedBox.value);
            }
        });

        // Add 'Others: [text]' if 'Others' is checked and has text
        if (othersCheckbox.checked && otherConditionTextBox.value.trim()) {
            selected.push('Others: ' + otherConditionTextBox.value.trim());
        }

        // Update button text
        document.querySelector('.dropdown-btn').innerHTML = (selected.length > 0 ? selected.join(', ') : 'Select Medical History') + 
            ' <i class="fas fa-chevron-down text-[0.7rem] text-gray-400"></i>';

        // Update hidden input value
        document.getElementById('selected-history').value = selected.join(', ');
    });

    // Contact number validation
    function validateContactNumber(event) {
        const contactNumber = event.target;
        const contactWarning = document.getElementById('contact-warning');
        
        // Adjust validation to exclude the static "+63" prefix
        const inputValue = contactNumber.value;
        if (inputValue.length > 10) { // Limit to +63 digits after "+63"
        contactNumber.value = inputValue.slice(0, 10);
        }

        contactWarning.style.display = inputValue.length < 10 ? 'block' : 'none';
        if (inputValue.length === 10) {
        contactWarning.style.display = 'none'; // Hide warning if valid
        }
    }

    // Emergency contact validation
    function validateEmergencyContact(event) {
        const emergencyContactNumber = event.target;
        const emergencyContactWarning = document.getElementById('emergency-contact-warning');
        
        // Adjust validation to exclude the static "+63" prefix
        const inputValue = emergencyContactNumber.value;
        if (inputValue.length > 10) { // Limit to 9 digits after "+63"
          emergencyContactNumber.value = inputValue.slice(0, 10);
        }
    
        emergencyContactWarning.style.display = inputValue.length < 10 ? 'block' : 'none';
        if (inputValue.length === 10) {
          emergencyContactWarning.style.display = 'none'; // Hide warning if valid
        }
    }

    document.getElementById('contact-number').addEventListener('input', validateContactNumber);
    document.getElementById('emergency-contact-number').addEventListener('input', validateEmergencyContact);

    // Optional: Clear session storage on cancel appointment or other specific actions
    // document.getElementById('cancel-appointment-btn').addEventListener('click', function () {
    //     sessionStorage.removeItem('formData');
    // });
});

window.onload = function() {
    if (sessionStorage.getItem('isNavigating') !== 'true') {
        document.getElementById('contact-form').reset();
    }
};

function updateSelectColor(selectElement) {
    if (selectElement.value === "") {
        selectElement.classList.remove("text-black");
        selectElement.classList.add("text-gray-400");
    } else {
        selectElement.classList.remove("text-gray-400");
        selectElement.classList.add("text-black");
    }
}
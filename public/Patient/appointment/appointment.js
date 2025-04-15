// Function to validate the form
function validateForm() {
    const requiredFields = [
        'first-name',
        'last-name',
        'age',
        'gender',
        'address',
        'contact-number',
        'email-address',
        'emergency-contact',
        'emergency-contact-number',
        'selected-history',
        'emergency-contact-relationship'
    ];

    // Check if all required fields are filled
    /*for (let i = 0; i < requiredFields.length; i++) {
      const field = document.getElementById(requiredFields[i]);
      if (!field.value.trim()) {
      field.focus(); // Focus the first empty field
       return false;
       }
   }*/

    // Check if contact numbers are valid
    /*const contactNumber = document.getElementById('contact-number').value.trim();
    const emergencyContactNumber = document.getElementById('emergency-contact-number').value.trim();
    if (contactNumber.length < 11 || emergencyContactNumber.length < 11) {
        return false;
    }

    return true;*/
}

function goBackAppointment() {
    sessionStorage.removeItem('formData'); // Clear the form data from session storage
    window.location.href = "patient-newappointmentdetails.html";
}

function goNextAppointment(event) {
    saveFormData();  // Save form data before navigating
    window.location.href = "patient-newconfirmdetails.html";
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

// Load form data from session storage
function loadFormData() {
    const savedData = JSON.parse(sessionStorage.getItem('formData'));
    if (savedData) {
        document.getElementById('first-name').value = savedData.firstName || '';
        document.getElementById('last-name').value = savedData.lastName || '';
        document.getElementById('age').value = savedData.age || '';
        document.getElementById('gender').value = savedData.gender || '';
        document.getElementById('address').value = savedData.address || '';
        document.getElementById('contact-number').value = savedData.contactNumber || '';
        document.getElementById('email-address').value = savedData.emailAddress || '';
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
    /*function validateContactNumber(event) {
       const contactNumber = event.target;
       const contactWarning = document.getElementById('contact-warning');
       if (contactNumber.value.length > 11) {
       contactNumber.value = contactNumber.value.slice(0, 11); // Truncate to 11 characters
       }
       contactWarning.style.display = contactNumber.value.length < 11 ? 'block' : 'none';
    }*/

    // Emergency contact validation
    /*function validateEmergencyContact(event) {
       const emergencyContactNumber = event.target;
        const emergencyContactWarning = document.getElementById('emergency-contact-warning');
        if (emergencyContactNumber.value.length > 11) {
       emergencyContactNumber.value = emergencyContactNumber.value.slice(0, 11); // Truncate to 11 characters
       }
       emergencyContactWarning.style.display = emergencyContactNumber.value.length < 11 ? 'block' : 'none';
    }*/

    /*document.getElementById('contact-number').addEventListener('input', validateContactNumber);
    document.getElementById('emergency-contact-number').addEventListener('input', validateEmergencyContact);*/

    // Optional: Clear session storage on cancel appointment or other specific actions
    document.getElementById('cancel-appointment-btn').addEventListener('click', function () {
        sessionStorage.removeItem('formData');
    });
});

window.onload = function() {
    document.getElementById('contact-form').reset();
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

step 3
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Confirm Appointment</title>
    <link rel="stylesheet" href="patientscheduling.css">
    <style>
        /* Modal styles */
        .modal {
            display: none; /* Hidden by default */
            position: fixed; /* Stay in place */
            z-index: 1; /* Sit on top */
            left: 0;
            top: 0;
            width: 100%; /* Full width */
            height: 100%; /* Full height */
            overflow: auto; /* Enable scroll if needed */
            background-color: rgb(0,0,0); /* Fallback color */
            background-color: rgba(0,0,0,0.4); /* Black w/ opacity */
        }

        .modal-content {
            background-color: #2C3E50;
            margin: 15% auto; /* 15% from the top and centered */
            padding: 20px;
            border: 1px solid #888;
            width: 80%; /* Could be more or less, depending on screen size */
            text-align: center;
        }

        .close {
            color: #aaa;
            float: right;
            font-size: 28px;
            font-weight: bold;
        }

        .close:hover,
        .close:focus {
            color: black;
            text-decoration: none;
            cursor: pointer;
        }
    </style>
</head>
<body>
    <header>
        <nav class="nav-container">
            <img src="/media/logo/EJPL.png" alt="Logo" class="logo">
            <div class="nav-links">
                <a href="../patient-home.html" class="disabled-link">Home</a>
                <a href="../patient-aboutus.html" class="disabled-link">About Us</a>
                <a href="../patient-doctors.html" class="disabled-link">Doctors</a>
                <a href="../patient-services.html" class="disabled-link">Services</a>
                <a href="../patient-contact.html" class="disabled-link">Contact Us</a>
                <a href="../patient-location.html" class="disabled-link">Location</a>
            </div>
            <a href="../Patient/patient-notifications.html" class="notification-icon">
                <img src="../media/logo/notif.png" alt="Notification Icon">
                <span class="notification-badge"></span>
            </a>
            <a href="../patient-profile.html" class="disabled-link">
                <img src="/media/logo/profile.png" alt="Profile Icon" class="profile-icon">
            </a>
        </nav>
    </header>
        <main>
            <button class="appointment-back-button" onclick="goToAppointmentBack()">← Back</button>
            <button class="appointment-next-button" onclick="confirmAppointment()">Confirm Appointment</button>
            <div class="content">
                <h1>EJPL Dental Clinic Appointment Form</h1>
                <h2>Step 3: Confirm Your Appointment</h2>
                <div class="login-form">
                    <div class="confirmation-info">
                        <!-- Confirmation details will be dynamically inserted here -->
                    </div>

                    <!-- Modal for Confirmation Message -->
                    <div id="confirmation-modal" class="modal">
                        <div class="modal-content">
                            <span class="close" onclick="closeModal()">&times;</span>
                            <p id="confirmation-text"></p>
                        </div>
                    </div>
                </div>

                <!-- Receipt Section -->
                <div id="appointment-receipt" style="display: none;">
                    <h2>Appointment Confirmation Receipt</h2>
                    <p><strong>Clinic Name:</strong> EJPL Dental Clinic</p>
                    <div class="receipt-info">
                        <!-- Receipt details will be dynamically inserted here -->
                    </div>
                    <p><strong>Date of Confirmation:</strong> <span id="confirmation-date"></span></p>
                    <p>Please bring this receipt to the clinic on the day of your appointment.</p>
                </div>
            </div>
            <script>
                const monthNames = [
                    "January", "February", "March", "April", "May", "June",
                    "July", "August", "September", "October", "November", "December"
                ];

                const appointmentRecords = JSON.parse(localStorage.getItem('appointmentRecords')) || {}; // Load from localStorage or initialize as empty object

                function formatDate(dateStr) {
                    const [year, month, day] = dateStr.split('-');
                    const monthName = monthNames[parseInt(month, 10) - 1]; // Convert month number to month name
                    return `${monthName}-${day}-${year}`;
                }

                function loadConfirmationData() {
                    // Load form data from sessionStorage
                    const savedFormData = JSON.parse(sessionStorage.getItem('formData'));
                    const savedScheduleData = {
                        preferredDate: localStorage.getItem('preferredDate'),
                        preferredTime: localStorage.getItem('preferredTime'),
                        treatmentType: localStorage.getItem('treatmentType'),
                        treatmentPrice: localStorage.getItem('treatmentPrice'),
                    };

                    console.log('Saved Form Data:', savedFormData);
                    console.log('Saved Schedule Data:', savedScheduleData);

                    if (savedFormData) {
                        const confirmationHTML = `
                            <p><strong>Patient Name:</strong> ${savedFormData.firstName || 'N/A'} ${savedFormData.lastName || 'N/A'}</p>
                            <p><strong>Age:</strong> ${savedFormData.age || 'N/A'}</p>
                            <p><strong>Gender:</strong> ${savedFormData.gender || 'N/A'}</p>
                            <p><strong>Address:</strong> ${savedFormData.address || 'N/A'}</p>
                            <p><strong>Contact Number:</strong> ${savedFormData.contactNumber || 'N/A'}</p>
                            <p><strong>Email Address:</strong> ${savedFormData.emailAddress || 'N/A'}</p>
                            <p><strong>Medical History:</strong> ${savedFormData.selectedHistory || 'N/A'}</p>
                            <p><strong>Emergency Contact Person:</strong> ${savedFormData.emergencyContact || 'N/A'}</p>
                            <p><strong>Emergency Contact Number:</strong> ${savedFormData.emergencyContactNumber || 'N/A'}</p>
                            <p><strong>Emergency Contact Relationship:</strong> ${savedFormData.emergencyContactRelationship || 'N/A'}</p>
                            <p><strong>Preferred Date:</strong> ${savedScheduleData.preferredDate ? formatDate(savedScheduleData.preferredDate) : 'N/A'}</p>
                            <p><strong>Preferred Time:</strong> ${savedScheduleData.preferredTime || 'N/A'}</p>
                            <p><strong>Type of Treatment:</strong> ${savedScheduleData.treatmentType || 'N/A'}</p>
                            <p><strong>Treatment Price:</strong> ${savedScheduleData.treatmentPrice || 'N/A'}</p>
                        `;
                        document.querySelector('.confirmation-info').innerHTML = confirmationHTML;
                        document.querySelector('.receipt-info').innerHTML = confirmationHTML;
                        document.getElementById('confirmation-date').innerText = new Date().toLocaleDateString();
                    }
                }

                document.addEventListener('DOMContentLoaded', loadConfirmationData);

                function goToAppointmentBack() {
                    window.location.href = "step1appointment.html";
                }

                function openModal(message) {
                    document.getElementById('confirmation-text').innerText = message;
                    document.getElementById('confirmation-modal').style.display = 'block';
                }

                function closeModal() {
                    document.getElementById('confirmation-modal').style.display = 'none';
                }

                function confirmAppointment() {
                    const preferredTime = localStorage.getItem('preferredTime');

                    // Prepare the appointment details
                    const savedFormData = JSON.parse(sessionStorage.getItem('formData')) || {};
                    const savedScheduleData = {
                        preferredDate: localStorage.getItem('preferredDate'),
                        preferredTime: preferredTime,
                        treatmentType: localStorage.getItem('treatmentType'),
                        treatmentPrice: localStorage.getItem('treatmentPrice'),
                    };

                    // Data to send to the backend
                    const appointmentData = {
                        firstName: savedFormData.firstName || 'N/A',
                        lastName: savedFormData.lastName || 'N/A',
                        age: savedFormData.age || 'N/A',
                        gender: savedFormData.gender || 'N/A',
                        address: savedFormData.address || 'N/A',
                        contactNumber: savedFormData.contactNumber || 'N/A',
                        emailAddress: savedFormData.emailAddress || 'N/A',
                        selectedHistory: savedFormData.selectedHistory || 'N/A',
                        emergencyContact: savedFormData.emergencyContact || 'N/A',
                        preferredDate: savedScheduleData.preferredDate || 'N/A',
                        preferredTime: savedScheduleData.preferredTime || 'N/A',
                        treatmentType: savedScheduleData.treatmentType || 'N/A',
                        treatmentPrice: savedScheduleData.treatmentPrice || 'N/A',
                        emergencyContactNumber: savedFormData.emergencyContactNumber || 'N/A',
                        emergencyContactRelationship: savedFormData.emergencyContactRelationship || 'N/A',
                    };

                    // Send a POST request to the backend API
                    fetch('/api/appointments/patient/appointments', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify(appointmentData)
                    })
                    .then(response => {
                        if (response.status === 401) {
                            displayError('Unauthorized. Please log in to confirm your appointment.');
                        } else if (response.status === 400) { // Check for appointment slot full error
                            response.json().then(errorData => {
                                displayError(errorData.message || 'Appointment slot is full for this time.');
                            });
                        } else if (!response.ok) {
                            response.json().then(errorData => {
                                displayError(errorData.message || 'Network response was not ok');
                            });
                        } else {
                            return response.json(); // Proceed to the next promise
                        }
                    })
                    .then(data => {
                        if (data) {
                            if (data.success) { // Check if 'data.success' is true
                                const receiptUrl = `receipt.html?receiptDetails=${encodeURIComponent(JSON.stringify(appointmentData))}`;
                                window.location.href = receiptUrl;

                                // Clear session and local storage
                                sessionStorage.removeItem('formData');
                                localStorage.removeItem('preferredDate');
                                localStorage.removeItem('preferredTime');
                                localStorage.removeItem('treatmentType');
                                localStorage.removeItem('treatmentPrice');

                                // Clear confirmation display area if needed
                                document.querySelector('.confirmation-info').innerHTML = '';
                                document.getElementById('confirmation-message').style.display = 'none';
                                document.getElementById('confirmation-text').innerText = '';
                            }
                        }
                    });
                }

                function displayError(message) {
                    openModal(message); // Show the error message in the modal
                }

                function printReceipt() {
                    const receiptSection = document.getElementById('appointment-receipt').innerHTML;
                    const originalContent = document.body.innerHTML;

                    // Replace the body content with the receipt
                    document.body.innerHTML = receiptSection;

                    // Print the receipt
                    window.print();

                    // Restore the original content after printing
                    document.body.innerHTML = originalContent;

                    // Reload the page to bring back functionality after print
                    location.reload();

                }

            </script>
        </main>
    </body>
</html>
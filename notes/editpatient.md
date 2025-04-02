<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Edit Patient</title>
    <style>
        body { font-family: Arial, sans-serif; padding: 20px; }
        .form-group { margin-bottom: 15px; }
        label { display: block; margin-bottom: 5px; }
        input, textarea {
            width: 100%;
            padding: 8px;
            box-sizing: border-box;
        }
        textarea {
            height: 100px;
            resize: vertical;
        }
        .save-button, .add-button, .upload-button {
            padding: 10px 15px;
            background-color: #28a745;
            color: white;
            border: none;
            cursor: pointer;
            margin-top: 10px;
            margin-bottom: 10px;
        }
        .error { color: red; margin-top: 10px; }
        .modal {
            display: none;
            position: fixed;
            z-index: 1;
            left: 0;
            top: 0;
            width: 100%;
            height: 100%;
            background-color: rgba(0, 0, 0, 0.5);
            justify-content: center;
            align-items: center;
        }
        .modal-content {
            background-color: #fff;
            padding: 20px;
            border-radius: 5px;
            max-width: 400px;
            width: 100%;
            text-align: center;
        }
        .modal-buttons {
            display: flex;
            justify-content: space-between;
            margin-top: 20px;
        }
        .modal-buttons button {
            padding: 10px 15px;
            border: none;
            cursor: pointer;
        }
        .confirm-button { background-color: #28a745; color: white; }
        .cancel-button { background-color: #dc3545; color: white; }
        #message {
            margin-top: 20px;
            display: none;
        }
        table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 20px;
        }
        th, td {
            border: 1px solid #ddd;
            padding: 8px;
            text-align: left;
        }
        th {
            background-color: #f2f2f2;
        }
        .patient-details-container {
            border: 1px solid #ccc;
            border-radius: 5px;
            padding: 15px;
            margin-bottom: 20px;
        }
        .patient-details-title {
            font-size: 1.2em;
            margin-bottom: 10px;
        }

    </style>
</head>
<body>
    <button onclick="window.history.back();">Back</button>
    <h2>Edit Patient Details</h2>

    <div class="patient-details-container">
        <div class="patient-details-title">Patient Details</div>
        
        <label for="firstName">First Name:</label>
        <input type="text" id="firstName" readonly>
        
        <label for="lastName">Last Name:</label>
        <input type="text" id="lastName" readonly>
        
        <label for="age">Age:</label>
        <input type="text" id="age" readonly>
        
        <label for="gender">Gender:</label>
        <input type="text" id="gender" readonly>
        
        <label for="address">Address:</label>
        <input type="text" id="address" readonly>
        
        <label for="contactNumber">Contact Number:</label>
        <input type="text" id="contactNumber" readonly>

        <label for="emailAddress">Email Address:</label>
        <input type="text" id="emailAddress" readonly>
        
        <label for="emergencyContact">Emergency Contact:</label>
        <input type="text" id="emergencyContact" readonly>

        <label for="emergencyContactNumber">Emergency Contact Number:</label>
        <input type="text" id="emergencyContactNumber" readonly>

        <label for="emergencyContactRelationship">Relationship:</label>
        <input type="text" id="emergencyContactRelationship" readonly>

        <label for="selectedHistory">Medical History:</label>
        <input type="text" id="selectedHistory" readonly>


        <h3>Treatment History</h3>
        <table>
            <thead>
                <tr>
                    <th>Treatment Type</th>
                    <th>Treatment Date</th>
                </tr>
            </thead>
            <tbody id="treatmentTableBody">
                <!-- Treatment rows will be added dynamically here -->
            </tbody>
        </table>        
    </div>

    <script>
        async function fetchPatientDetails() {
            const urlParams = new URLSearchParams(window.location.search);
            const appointmentId = urlParams.get('appointmentId'); 
            const messageDiv = document.getElementById('message');

            if (!appointmentId) {
                messageDiv.textContent = 'No appointment selected.';
                messageDiv.style.color = 'red';
                messageDiv.style.display = 'block';
                return;
            }

            const response = await fetch(`/api/appointments/details?appointmentId=${encodeURIComponent(appointmentId)}`);

            if (response.ok) {
                const patient = await response.json();
                if (patient) {
                    displayPatientDetails(patient, appointmentId); // Pass appointmentId here
                } else {
                    messageDiv.textContent = 'Invalid patient data received.';
                    messageDiv.style.color = 'red';
                    messageDiv.style.display = 'block';
                }
            } else {
                messageDiv.textContent = 'Error fetching appointment details.';
                messageDiv.style.color = 'red';
                messageDiv.style.display = 'block';
            }
        }

        function displayPatientDetails(patient, appointmentId) { // Receive appointmentId as a parameter
            document.getElementById('firstName').value = patient.firstName || '';
            document.getElementById('lastName').value = patient.lastName || '';
            document.getElementById('age').value = patient.age || '';
            document.getElementById('gender').value = patient.gender || '';
            document.getElementById('address').value = patient.address || '';
            document.getElementById('contactNumber').value = patient.contactNumber || '';
            document.getElementById('emailAddress').value = patient.emailAddress || '';
            document.getElementById('emergencyContact').value = patient.emergencyContact || '';
            document.getElementById('emergencyContactNumber').value = patient.emergencyContactNumber || '';
            document.getElementById('emergencyContactRelationship').value = patient.emergencyContactRelationship || '';
            document.getElementById('selectedHistory').value = patient.selectedHistory || '';

            const treatmentTable = document.getElementById('treatmentTableBody');
            treatmentTable.innerHTML = '';

            if (!patient.treatments || patient.treatments.length === 0) {
                treatmentTable.innerHTML = '<tr><td colspan="2">No treatments found.</td></tr>';
                return;
            }

            patient.treatments.forEach((treatment, index) => {
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td>${treatment.treatmentType || 'N/A'}</td>
                    <td>${treatment.preferredDate || 'N/A'}</td>
                `;
                row.style.cursor = "pointer";
                row.addEventListener('click', () => {
                    window.location.href = `personnel-treatmentdetails.html?appointmentId=${appointmentId}&treatmentIndex=${index}`;
                });
                treatmentTable.appendChild(row);
            });
        }

        document.addEventListener('DOMContentLoaded', fetchPatientDetails);

    </script>
</body>
</html>
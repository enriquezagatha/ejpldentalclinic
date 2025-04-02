<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Treatment Details</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            margin: 20px;
            padding: 0;
            background-color: #f4f4f4;
        }

        h2, h3 {
            text-align: center;
            color: #333;
        }

        button {
            background-color: #007bff;
            color: white;
            border: none;
            padding: 10px 15px;
            margin: 5px;
            border-radius: 5px;
            cursor: pointer;
        }

        button:hover {
            background-color: #0056b3;
        }

        .back-button {
            display: block;
            margin: 10px 0;
        }

        table {
            width: 100%;
            border-collapse: collapse;
            background: white;
            margin-top: 10px;
        }

        th, td {
            border: 1px solid #ddd;
            padding: 10px;
            text-align: left;
        }

        th {
            background-color: #007bff;
            color: white;
        }

        input, textarea {
            width: 100%;
            padding: 8px;
            margin-top: 5px;
            border: 1px solid #ddd;
            border-radius: 4px;
        }

        .add-button {
            background-color: #28a745;
        }

        .add-button:hover {
            background-color: #218838;
        }

        .remove-button {
            background-color: #dc3545;
        }

        .remove-button:hover {
            background-color: #c82333;
        }

        .file-upload-container {
            margin-top: 15px;
            padding: 10px;
            background: white;
            border-radius: 5px;
            box-shadow: 0px 0px 5px rgba(0, 0, 0, 0.1);
        }

        .save-button {
            display: block;
            margin: 20px auto;
            background-color: #28a745;
        }

        .save-button:hover {
            background-color: #218838;
        }

        #message {
            text-align: center;
            font-size: 16px;
            margin-top: 15px;
            display: none;
        }

        /* Modal Styling */
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
            background-color: white;
            padding: 20px;
            border-radius: 5px;
            text-align: center;
            box-shadow: 0px 0px 10px rgba(0, 0, 0, 0.2);
        }

        .modal-buttons {
            margin-top: 10px;
        }

        .confirm-button {
            background-color: #28a745;
        }

        .confirm-button:hover {
            background-color: #218838;
        }

        .cancel-button {
            background-color: #dc3545;
        }

        .cancel-button:hover {
            background-color: #c82333;
        }
    </style>
</head>
<body>
    <button class="back-button" onclick="window.history.back();">Back</button>
    <h2>Treatment Details</h2>

    <h3>Treatment History</h3>
    <table>
        <thead>
            <tr>
                <th>Treatment Type</th>
                <th>Treatment Date</th>
            </tr>
        </thead>
        <tbody id="treatmentTableBody">
            <!-- Treatments will be dynamically inserted here -->
        </tbody>
    </table>

    <div>
        <label for="treatmentType">Treatment Type:</label>
        <input type="text" id="treatmentType">
    </div>    

    <div>
        <label for="treatmentDate">Treatment Date:</label>
        <input type="date" id="treatmentDate" name="treatmentDate" />
    </div>

    <div>
        <label for="procedure">Procedure Performed:</label>
        <textarea id="procedure"></textarea>
    </div>
    
    <label for="medicineType">Prescription Entries:</label>
    <table id="prescriptionTable">
        <thead>
            <tr>
                <th>Prescription Date</th>
                <th>Medicine Type</th>
                <th>Action</th>
            </tr>
        </thead>
        <tbody>
            <tr>
                <td><input type="date" class="prescriptionDate"></td>
                <td><input type="text" class="medicineType"></td>
                <td><button class="remove-button" onclick="removeRow(this)">Remove</button></td>
            </tr>
        </tbody>
    </table>
    <button class="add-button" onclick="addRow()">Add Prescription</button>

    <label for="treatmentNotes">Treatment Notes and Observation:</label>
    <textarea id="treatmentNotes"></textarea>

    <div id="fileUploadContainer" class="file-upload-container">
        <label for="fileUpload">Upload File (e.g., X-rays, Photos):</label>
        <input type="file" id="fileUpload" multiple>
        <button class="upload-button" onclick="uploadFiles()">Upload Files</button>
    </div>
    
    <div id="uploadedFilesContainer" style="margin-top: 15px;">
        <h4>Uploaded Files:</h4>
        <div id="uploadedImagesList"></div>
        <div id="uploadedOtherFilesList"></div>
    </div>        

    <!-- Delete Confirmation Modal -->
    <div id="deleteModal" class="modal">
        <div class="modal-content">
            <p>Are you sure you want to delete this file?</p>
            <div class="modal-buttons">
                <button class="confirm-button" onclick="confirmDelete()">Yes</button>
                <button class="cancel-button" onclick="closeDeleteModal()">No</button>
            </div>
        </div>
    </div>

    <button class="save-button" onclick="openModal()">Save</button>
    
    <div id="saveModal" class="modal">
        <div class="modal-content">
            <p>Are you sure you want to save these details?</p>
            <div class="modal-buttons">
                <button class="confirm-button" onclick="confirmSave()">Yes</button>
                <button class="cancel-button" onclick="closeModal()">No</button>
            </div>
        </div>
    </div>

    <div id="message"></div>

    <script>
        async function fetchTreatmentDetails() {
            const urlParams = new URLSearchParams(window.location.search);
            const appointmentId = urlParams.get('appointmentId');
            let treatmentIndex = urlParams.get('treatmentIndex');
            const messageDiv = document.getElementById('message');

            // Convert treatmentIndex to a number
            treatmentIndex = parseInt(treatmentIndex, 10);

            if (!appointmentId || isNaN(treatmentIndex)) {
                messageDiv.textContent = 'Invalid request. Missing appointment or treatment index.';
                messageDiv.style.color = 'red';
                messageDiv.style.display = 'block';
                return;
            }

            const response = await fetch(`/api/appointments/details?appointmentId=${encodeURIComponent(appointmentId)}`);

            if (response.ok) {
                const patient = await response.json();
                console.log("Fetched Patient Data:", patient); // Debugging log

                if (patient && patient.treatments && patient.treatments.length > treatmentIndex) {
                    console.log("Fetched Treatment Data:", patient.treatments[treatmentIndex]); // Check this log to confirm treatmentDate
                    displayTreatmentDetails(patient.treatments[treatmentIndex]);
                } else {
                    messageDiv.textContent = 'Treatment details not found.';
                    messageDiv.style.color = 'red';
                    messageDiv.style.display = 'block';
                }
            }
            else {
                messageDiv.textContent = 'Error fetching treatment details.';
                messageDiv.style.color = 'red';
                messageDiv.style.display = 'block';
            }
        }


        function displayTreatmentDetails(treatment) {
            console.log("Displaying treatment details:", treatment); // Debugging

            // Ensure treatmentDate is a valid string and is in the correct format (yyyy-MM-dd)
            const preferredDate = treatment.preferredDate || ''; // Get the treatment date from the treatment object
            if (preferredDate) {
                console.log("Setting treatmentDate:", preferredDate); // Debugging

                // Format the date to yyyy-MM-dd
                const formattedDate = formatDateToYYYYMMDD(preferredDate);
                console.log("Formatted Date:", formattedDate); // Check the format in the console

                // Set the treatmentDate value in the input field
                document.getElementById('treatmentDate').value = formattedDate;
            } else {
                console.log("No treatmentDate found");
            }

            // Set other fields
            document.getElementById('treatmentType').value = treatment.treatmentType || '';
            document.getElementById('treatmentNotes').value = treatment.treatmentNotes || '';
        }


        // Helper function to format the date to yyyy-MM-dd
        function formatDateToYYYYMMDD(date) {
            const d = new Date(date);
            const year = d.getFullYear();
            const month = String(d.getMonth() + 1).padStart(2, '0'); // Ensure 2 digits for month
            const day = String(d.getDate()).padStart(2, '0'); // Ensure 2 digits for day
            return `${year}-${month}-${day}`;
        }

        async function updateTreatmentDetails() {
            const urlParams = new URLSearchParams(window.location.search);
            const appointmentId = urlParams.get('appointmentId');
            let treatmentIndex = urlParams.get('treatmentIndex');
            const messageDiv = document.getElementById('message');

            treatmentIndex = parseInt(treatmentIndex, 10);

            if (!appointmentId || isNaN(treatmentIndex)) {
                messageDiv.textContent = 'Invalid request. Missing appointment or treatment index.';
                messageDiv.style.color = 'red';
                messageDiv.style.display = 'block';
                return;
            }

            const updatedTreatment = {
                treatmentType: document.getElementById('treatmentType').value,
                preferredDate: document.getElementById('treatmentDate').value,
                treatmentNotes: document.getElementById('treatmentNotes').value
            };

            console.log("Updated Treatment Sent to Backend:", updatedTreatment);

            const response = await fetch('/api/appointments/update-treatment', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ appointmentId, treatmentIndex, updatedTreatment })
            });

            if (response.ok) {
                const result = await response.json(); // Get the response with the updated patient record
                console.log("Updated record received:", result);

                messageDiv.textContent = 'Treatment updated successfully.';
                messageDiv.style.color = 'green';
                messageDiv.style.display = 'block';

                // Force refetch from backend to get the latest data
                const updatedData = await fetch(`/api/appointments/details?appointmentId=${encodeURIComponent(appointmentId)}`);
                const updatedRecord = await updatedData.json();

                console.log("Refetched Updated Treatment:", updatedRecord.treatments[treatmentIndex]);

                // Display the latest treatment details
                displayTreatmentDetails(updatedRecord.treatments[treatmentIndex]);

            } else {
                response.text().then(errorText => {
                    console.error("Error:", errorText);
                    messageDiv.textContent = `Error: ${errorText}`;
                    messageDiv.style.color = 'red';
                    messageDiv.style.display = 'block';
                });
            }
        }


        function openModal() {
            document.getElementById('saveModal').style.display = 'flex';
        }

        function closeModal() {
            document.getElementById('saveModal').style.display = 'none';
        }

        async function confirmSave() {
            await updateTreatmentDetails();
            await fetchTreatmentDetails();
            closeModal();
        }

        // Call fetchTreatmentDetails when the page loads
        window.onload = async function (){
            await fetchTreatmentDetails();
        };
    </script>
</body>
</html>
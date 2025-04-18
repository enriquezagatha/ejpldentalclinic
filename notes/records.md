<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Personnel - Home</title>
    <link rel="stylesheet" href="../Medical Personnel/mpstyle.css">
</head>
<body>
    <header>
        <nav class="nav-container">
            <img src="../media/logo/EJPL.png" alt="Logo" class="logo" onclick="window.location.href='personnel-home.html';" style="cursor: pointer;">
            <div class="nav-links">
                <a href="personnel-home.html">Home</a>
                <a href="personnel-records.html" class="active">Patient Records</a>
                <a href="personnel-balance.html">Tracking Balance</a>
                <a href="personnel-appointment.html">Appointment Data</a>
                <a href="personnel-management.html">Management</a>
            </div>
            <a href="personnel-profile.html">
                <img src="../media/logo/profile.png" alt="Profile Icon" class="profile-icon">
            </a>
        </nav>
    </header>
    <main>
        <div class="button-container">
            <button class="records-button" onclick="loadAndFilterAppointments('A-J')">A - J</button>
            <button class="records-button" onclick="loadAndFilterAppointments('K-T')">K - T</button>
            <button class="records-button" onclick="loadAndFilterAppointments('U-Z')">U - Z</button>
        </div>
        <table id="records-table">
            <thead>
                <tr>
                    <th>Name</th>
                </tr>
            </thead>
            <tbody id="appointments-tbody"></tbody>
        </table>
        <div id="loading" class="loading" style="display:none;">Loading appointments...</div>
    </main>
    
    <script>
        let allAppointments = [];

        function showTable() {
            document.getElementById('records-table').style.display = 'table'; // Show table on button click
        }

        function loadAndFilterAppointments(range) {
            showTable();
            fetchAppointments().then(() => filterAppointments(range));
        }

        async function fetchAppointments() {
            if (allAppointments.length === 0) { // Only fetch if not already fetched
                document.getElementById('loading').style.display = 'block';
                const response = await fetch('/api/appointments');
                document.getElementById('loading').style.display = 'none';

                if (response.ok) {
                    allAppointments = await response.json();
                    displayAppointments(allAppointments); // Ensure data is displayed
                } else {
                    console.error('Failed to fetch appointments:', response.status, response.statusText);
                    document.getElementById('appointments-tbody').innerHTML =
                        '<tr><td colspan="2" style="text-align: center;">Error loading appointments.</td></tr>';
                }
            } else {
                displayAppointments(allAppointments); // If data was already fetched, display it
            }
        }

        function displayAppointments(appointments) {
            const tbody = document.getElementById('appointments-tbody');
            tbody.innerHTML = '';

            if (appointments.length === 0) {
                tbody.innerHTML = '<tr><td colspan="2" style="text-align: center; padding: 20px;">No patient records found.</td></tr>';
                return;
            }

            // Grouping patients by full name to avoid duplicates
            const patientMap = new Map();

            appointments.forEach(appointment => {
                const fullName = `${appointment.firstName} ${appointment.lastName}`;

                if (!patientMap.has(fullName)) {
                    patientMap.set(fullName, {
                        id: appointment._id,
                        treatments: []
                    });
                }

                // Push the treatment details to the existing patient (but don't display it)
                patientMap.get(fullName).treatments.push(appointment.treatmentType);
            });

            // Render the grouped patients (without showing treatments)
            patientMap.forEach((data, fullName) => {
                const row = `<tr class="appointment-row" data-id="${data.id}">
                    <td>${fullName}</td>
                </tr>`;

                tbody.innerHTML += row;
            });

            // Add event listeners for opening patient details
            document.querySelectorAll('.appointment-row').forEach(row => {
                row.addEventListener('click', () => {
                    const patientId = row.getAttribute('data-id');
                    openPatientEditWindow(patientId);
                });
            });
        }

        function filterAppointments(range) {
            const filteredAppointments = allAppointments.filter(appointment => {
                const lastName = appointment.lastName.toUpperCase();
                if (range === 'A-J') {
                    return lastName >= 'A' && lastName <= 'J';
                } else if (range === 'K-T') {
                    return lastName >= 'K' && lastName <= 'T';
                } else if (range === 'U-Z') {
                    return lastName >= 'U' && lastName <= 'Z';
                }
                return true;
            });

            displayAppointments(filteredAppointments);
        }

        function openPatientEditWindow(appointmentId) {
            window.location.href = `personnel-editpatient.html?appointmentId=${encodeURIComponent(appointmentId)}`;
        }

        // Ensure data is loaded when the page starts
        fetchAppointments();

    </script>
</body>
</html>
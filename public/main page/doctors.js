const DOCTOR_API_URL = "http://localhost:3000/api/doctors"; // Backend URL

async function fetchDoctors() {
    try {
        const response = await fetch(DOCTOR_API_URL);
        const doctors = await response.json();
        const doctorsList = document.getElementById("doctors-list");

        doctorsList.innerHTML = ""; // Clear existing content
        doctors.forEach((doctor) => {
            doctorsList.innerHTML += `
                <div class="team-member">
                    <img src="${doctor.image ? doctor.image : 'https://via.placeholder.com/150'}" alt="${doctor.name}" onclick="toggleCredentials(this);">
                    <h3 onclick="toggleCredentials(this);">${doctor.name}</h3>
                    <div class="credentials">
                        <span class="close-btn" onclick="toggleCredentials(this);">&times;</span>
                        <p><strong>Contact:</strong> ${doctor.contact}</p>
                    </div>
                </div>`;
        });
    } catch (error) {
        console.error("Error fetching doctors:", error);
    }
}

// Toggle credentials display
function toggleCredentials(element) {
    let teamMember = element.closest('.team-member');
    let credentials = teamMember.querySelector('.credentials');

    credentials.style.display = (credentials.style.display === "none" || credentials.style.display === "") ? "block" : "none";
}

// Load doctors on page load
document.addEventListener("DOMContentLoaded", fetchDoctors);
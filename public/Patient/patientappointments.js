document.addEventListener('DOMContentLoaded', () => {
    document.querySelectorAll('.payButton').forEach(button => {
        button.addEventListener('click', () => {
            const modal = document.getElementById('paymentModal');
            if (modal) {
                modal.style.display = 'flex';
            }
        });
    });

    const closeModal = document.getElementById('closeModal');
    if (closeModal) {
        closeModal.addEventListener('click', () => {
            const modal = document.getElementById('paymentModal');
            if (modal) {
                modal.style.display = 'none';
            }
        });
    }

    fetchProfile();
});

async function fetchProfile() {
    try {
        const response = await fetch("/api/patient/profile");
        if (!response.ok) throw new Error("Failed to fetch patient profile");

        const patient = await response.json();
        const fullName = `${patient.firstName} ${patient.lastName}`;
        const sidebarFullName = document.getElementById('sidebar-full-name');
        const profilePicture = localStorage.getItem("profilePicture") || "../media/logo/default-profile.png";

        if (sidebarFullName) {
            sidebarFullName.textContent = fullName;
        }

        const sidebarProfilePicture = document.getElementById('sidebar-profile-picture');
        if (sidebarProfilePicture) {
            sidebarProfilePicture.src = profilePicture;
        }
    } catch (error) {
        console.error("Error fetching patient profile:", error);
    }
}

async function fetchAppointments() {
    const appointmentsResponse = await fetch('/api/appointments/patient/appointments'); // Call new endpoint
    if (appointmentsResponse.ok) {
        const appointmentsData = await appointmentsResponse.json();

        // Sort appointments by preferredDate in descending order (latest to oldest)
        appointmentsData.sort((a, b) => new Date(b.preferredDate) - new Date(a.preferredDate));

        console.log('Sorted Appointments:', appointmentsData); // Log the sorted appointments data
        displayAppointments(appointmentsData);
    } else {
        console.error('Error fetching appointments:', appointmentsResponse.statusText);
    }
}

function formatDate(dateString) {
    const date = new Date(dateString); // Parse the ISO date string
    const day = String(date.getDate()).padStart(2, '0'); // Ensure two-digit day
    const monthName = monthNames[date.getMonth()]; // Get month name
    const year = date.getFullYear(); // Get year
    return `${monthName} ${day}, ${year}`; // Format: Month Name Day, Year
}

const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June', 
    'July', 'August', 'September', 'October', 'November', 'December'
];
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

function displayProfileInfo(data) {
    const profilePicture = data.profilePicture 
    ? `/uploads/${data.profilePicture}` 
    : "../media/logo/default-profile.png";    
    document.getElementById('sidebar-profile-picture').src = profilePicture;
    document.getElementById('sidebar-full-name').innerText = `${data.firstName} ${data.lastName}`;
}


async function fetchProfile() {
    const response = await fetch('/api/patient/profile');
    if (response.ok) {
        const data = await response.json();
        displayProfileInfo(data);
    } else {
        console.error('Error fetching profile data');
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
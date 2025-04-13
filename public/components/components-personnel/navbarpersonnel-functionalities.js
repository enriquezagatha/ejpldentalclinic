document.addEventListener('DOMContentLoaded', async () => {
    const profileResponse = await fetch('/api/medicalPersonnel/profile');
    if (profileResponse.ok) {
        const personnelData = await profileResponse.json();
        displayProfileInfo(personnelData);

        // Set the profile picture if available
        const profilePictureElement = document.querySelector('.desktop-profile');
        profilePictureElement.src = personnelData.profilePicture 
            ? `/uploads/${personnelData.profilePicture}` 
            : '../media/logo/default-profile.png';
    }

    function toggleMobileDropdown() {
        const mobileDropdown = document.getElementById('mobile-profile-dropdown');
        const desktopDropdown = document.getElementById('desktop-profile-dropdown');

        // Toggle mobile dropdown visibility
        mobileDropdown.classList.toggle('hidden');

        // Ensure desktop dropdown is hidden on mobile
        if (window.innerWidth < 1024) {
            desktopDropdown.classList.add('hidden');
        }
    }

    document.getElementById('profile-container').addEventListener('click', function (event) {
        event.stopPropagation(); // Prevent triggering the outside click listener
        toggleMobileDropdown();
    });

    // Close mobile dropdown when clicking outside
    document.addEventListener('click', function (event) {
        const mobileDropdown = document.getElementById('mobile-profile-dropdown');
        const profileContainer = document.getElementById('profile-container');

        if (!mobileDropdown.contains(event.target) && !profileContainer.contains(event.target)) {
            mobileDropdown.classList.add('hidden');
        }
    });
});

function displayProfileInfo(data) {

    const birthday = new Date(data.birthday);
            
    // Check if the date is valid
    if (isNaN(birthday.getTime())) {
        console.error("Invalid birthday format");
        return;
    }
    
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    const formattedBirthday = birthday.toLocaleDateString(undefined, options);

    document.getElementById('profile-name').innerText = `${data.firstName}`;
    document.getElementById('full-name').innerText = `${data.firstName} ${data.lastName}`;
    document.getElementById('birthday-info').innerText = `${formattedBirthday}`;
    document.getElementById('email-info').innerText = `${data.email}`;
}

const notificationBell = document.getElementById('notification-bell');
const notificationDropdown = document.getElementById('notification-dropdown');
const mobileNotificationDropdown = document.getElementById('mobile-notification-dropdown');

notificationBell.addEventListener('click', () => {
    if (window.innerWidth >= 1024) {
        notificationDropdown.classList.toggle('hidden');
    } else {
        mobileNotificationDropdown.classList.toggle('hidden');
    }
});

document.addEventListener('click', (event) => {
    if (!notificationBell.contains(event.target)) {
        if (window.innerWidth >= 1024) {
            notificationDropdown.classList.add('hidden');
        } else {
            mobileNotificationDropdown.classList.add('hidden');
        }
    }
});

window.addEventListener('resize', () => {
    if (window.innerWidth >= 1024) {
        mobileNotificationDropdown.classList.add('hidden');
    } else {
        notificationDropdown.classList.add('hidden');
    }
});
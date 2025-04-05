fetch('../components/components-patient/navbar-patients.html')
.then(response => response.text())
.then(data => {
    document.getElementById('navbar-container').innerHTML = data;

    const mobileOpenButton = document.getElementById('mobile-open-button');
    const mobileMenu = document.getElementById('mobile-menu');

    mobileOpenButton.addEventListener('click', () => {
        const isHidden = mobileMenu.classList.contains('opacity-0');
        mobileMenu.classList.toggle('opacity-0', !isHidden);
        mobileMenu.classList.toggle('pointer-events-none', !isHidden);
        mobileMenu.classList.toggle('translate-y-0', isHidden);
        mobileMenu.classList.toggle('-translate-y-4', !isHidden);
        mobileOpenButton.innerHTML = isHidden ? '&#10005;' : '&#9776;';
    });

    function toggleDropdown(id) {
        const dropdown = document.getElementById(id);
        dropdown.classList.toggle('hidden');
    }

    window.toggleDropdown = toggleDropdown;

    function displayProfileInfo(data) {
        const profileName = document.getElementById('profile-name');
        if (data.firstName && data.lastName) {
            profileName.innerText = `${data.firstName} ${data.lastName}`;  // Display full name after fetching data
        } else {
            profileName.innerText = 'Guest';  // Fallback in case the data is missing
        }
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

    document.addEventListener('DOMContentLoaded', async () => {
        const profileName = document.getElementById('profile-name');
        
        // Set the initial profile name from sessionStorage (fallback to 'Guest')
        const userName = sessionStorage.getItem('firstName') || 'Loading...';
        profileName.textContent = userName;  // Display 'Loading...' until the data is fetched
        
        await fetchProfile();  // Fetch the profile data once the page is ready
    });
});

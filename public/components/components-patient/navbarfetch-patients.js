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
        const mobileProfileName = document.getElementById('mobile-profile-name');
        const profileImage = document.querySelector('.desktop-profile');
        const mobileProfileImage = document.querySelector('.mobile-profile');
        const firstName = data.firstName || 'Guest';
        const profilePic = data.profilePicture 
            ? `/uploads/${data.profilePicture}` 
            : '../media/logo/default-profile.png';

        if (profileName) profileName.innerText = firstName;
        if (mobileProfileName) mobileProfileName.innerText = firstName;
        if (profileImage) profileImage.src = profilePic;
        if (mobileProfileImage) mobileProfileImage.src = profilePic;
    }

    async function fetchProfile() {
        const response = await fetch('/api/patient/profile');
        if (response.ok) {
            const data = await response.json();
            displayProfileInfo(data);
        }
    }

    const profileName = document.getElementById('profile-name');
    const mobileProfileName = document.getElementById('mobile-profile-name');
    const profileImage = document.querySelector('.desktop-profile');
    const mobileProfileImage = document.querySelector('.mobile-profile');
    const userName = sessionStorage.getItem('firstName') || 'Loading...';
    const defaultPic = '../media/logo/default-profile.png';

    if (profileName) profileName.textContent = userName;
    if (mobileProfileName) mobileProfileName.textContent = userName;
    if (profileImage) profileImage.src = defaultPic;
    if (mobileProfileImage) mobileProfileImage.src = defaultPic;

    fetchProfile();
});

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
});

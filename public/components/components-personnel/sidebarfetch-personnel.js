fetch('../components/components-personnel/sidebar-personnel.html')
    .then(response => response.text())
    .then(data => {
        // Append the fetched content directly to the body
        document.body.insertAdjacentHTML('afterbegin', data);

        // Toggle sidebar visibility on hamburger click
        const hamburger = document.getElementById('hamburger');
        const sidebar = document.getElementById('sidebar');
        const closeSidebar = document.getElementById('close-sidebar');
        const sidebarOverlay = document.getElementById('sidebar-overlay');
        const mainContent = document.getElementById('main-content');

        // Open sidebar
        hamburger.addEventListener('click', () => {
            sidebar.classList.remove('-translate-x-full');
            sidebarOverlay.classList.remove('hidden');
            mainContent.classList.add('pointer-events-none'); // Disable interaction with main content
        });

        // Close sidebar
        closeSidebar.addEventListener('click', () => {
            sidebar.classList.add('-translate-x-full');
            sidebarOverlay.classList.add('hidden');
            mainContent.classList.remove('pointer-events-none'); // Re-enable interaction with main content
        });

        // Close sidebar when clicking on overlay
        sidebarOverlay.addEventListener('click', () => {
            sidebar.classList.add('-translate-x-full');
            sidebarOverlay.classList.add('hidden');
            mainContent.classList.remove('pointer-events-none'); // Re-enable interaction with main content
        });

        // Detect the current page based on the <h1> text
        const currentPage = document.querySelector('h1')?.textContent?.trim();
        const sidebarLinks = document.querySelectorAll('#sidebar ul li');

        sidebarLinks.forEach(link => {
            const linkText = link.textContent.trim();
            if (linkText === currentPage) {
                link.classList.remove('text-[#232931]'); // Remove the previous text class
                link.classList.add('bg-[#E3EBF9]', 'text-[#6E80D1]', 'current-page'); // Add the new classes
            }
        });
    });
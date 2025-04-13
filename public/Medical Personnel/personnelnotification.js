document.addEventListener('DOMContentLoaded', () => {
    fetch('/api/notifications')
        .then(response => response.json())
        .then(data => {
            if (data.success && Array.isArray(data.notifications)) {
                displayNotifications(data.notifications);
            } else {
                console.error('Failed to load notifications');
            }
        })
        .catch(err => {
            console.error('Error fetching notifications:', err);
        });

    const bell = document.getElementById('notification-icon');
    const dropdown = document.getElementById('notification-dropdown');

    bell.addEventListener('click', () => {
        dropdown.style.display = dropdown.style.display === 'none' ? 'block' : 'none';
    });

    // Close dropdown if clicking outside
    document.addEventListener('click', (e) => {
        if (!dropdown.contains(e.target) && !bell.contains(e.target)) {
            dropdown.style.display = 'none';
        }
    });
});

function displayNotifications(notifications) {
    const desktopContainer = document.getElementById('notification-list');
    const mobileContainer = document.getElementById('mobile-notification-list');
    
    desktopContainer.innerHTML = '';
    mobileContainer.innerHTML = '';

    if (notifications.length === 0) {
        const noNotificationsHTML = '<li style="padding: 10px;">No notifications yet.</li>';
        desktopContainer.innerHTML = noNotificationsHTML;
        mobileContainer.innerHTML = noNotificationsHTML;
        return;
    }

    document.getElementById('notification-count').style.display = 'inline-block';
    document.getElementById('notification-count').textContent = notifications.filter(n => !n.isRead).length;

    notifications.forEach(notification => {
        const itemHTML = `
            <li class="notification-item p-4 border-b border-gray-200">
                <strong class="block text-lg font-semibold text-gray-800">${notification.title}</strong>
                <p class="mt-1 text-sm text-gray-600">${notification.message}</p>
                <small class="block mt-2 text-xs text-gray-500">${new Date(notification.createdAt).toLocaleString()}</small>
            </li>
        `;

        desktopContainer.innerHTML += itemHTML;
        mobileContainer.innerHTML += itemHTML;
    });
}
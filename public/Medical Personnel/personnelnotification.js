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
    const container = document.getElementById('notification-list');
    container.innerHTML = '';

    if (notifications.length === 0) {
        container.innerHTML = '<li style="padding: 10px;">No notifications yet.</li>';
        return;
    }

    document.getElementById('notification-count').style.display = 'inline-block';
    document.getElementById('notification-count').textContent = notifications.filter(n => !n.isRead).length;

    notifications.forEach(notification => {
        const item = document.createElement('li');
        item.className = 'notification-item';
        item.style.padding = '10px';
        item.style.borderBottom = '1px solid #eee';
        item.innerHTML = `
            <strong>${notification.title}</strong><br>
            <p style="margin: 5px 0;">${notification.message}</p>
            <small style="color: gray;">${new Date(notification.createdAt).toLocaleString()}</small>
        `;
        container.appendChild(item);
    });
}
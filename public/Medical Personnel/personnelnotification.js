let recentlyDeletedNotifications = [];

document.addEventListener('DOMContentLoaded', () => {
    loadPersonnelNotifications();

    const bell = document.getElementById('notification-bell');
    const dropdown = document.getElementById('notification-dropdown');

    bell.addEventListener('click', (e) => {
        e.stopPropagation(); // Prevent dropdown from closing when the bell is clicked
        dropdown.style.display = dropdown.style.display === 'none' ? 'block' : 'none';
    });

    // Prevent closing dropdown when clicking inside dropdown or action buttons
    dropdown.addEventListener('click', (e) => {
        e.stopPropagation(); // Stop propagation when clicking inside the dropdown
    });

    // Keep dropdown open when clicking on checkboxes or action buttons
    document.addEventListener('click', (e) => {
        const isClickInsideDropdown = dropdown.contains(e.target);
        const isClickOnBell = bell.contains(e.target);
        const isClickOnActionButtonOrCheckbox = e.target.closest('#mark-read-btn, #mark-unread-btn, #delete-btn, .notification-checkbox');

        // Close dropdown only if the click is outside the dropdown and not on the bell or action buttons
        if (!isClickInsideDropdown && !isClickOnBell && !isClickOnActionButtonOrCheckbox) {
            dropdown.style.display = 'none';
        }
    });

    // Mark as Read
    document.getElementById('mark-read-btn')?.addEventListener('click', (e) => {
        e.stopPropagation(); // Prevent dropdown from closing
        markSelectedAsRead();
        dropdown.style.display = 'block'; // Keep dropdown open
    });

    // Mark as Unread
    document.getElementById('mark-unread-btn')?.addEventListener('click', (e) => {
        e.stopPropagation(); // Prevent dropdown from closing
        markSelectedAsUnread();
        dropdown.style.display = 'block'; // Keep dropdown open
    });

    // Delete selected notifications
    document.getElementById('delete-btn')?.addEventListener('click', (e) => {
        e.stopPropagation(); // Prevent dropdown from closing
        deleteSelectedNotifications();
        dropdown.style.display = 'block'; // Keep dropdown open
    });
});

function loadPersonnelNotifications() {
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
}

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
            <li class="notification-item flex items-start gap-4 p-4 border-b border-gray-200">
                <input type="checkbox" class="notification-checkbox mt-1" data-id="${notification._id}">
                <div class="flex-1">
                    <strong class="block text-lg font-semibold text-gray-800">${notification.title}</strong>
                    <p class="mt-1 text-sm ${notification.isRead ? 'text-gray-600' : 'text-black'}">
                        ${notification.message}
                    </p>
                    <small class="block mt-2 text-xs text-gray-500">
                        ${new Date(notification.createdAt).toLocaleString()}
                    </small>
                </div>
            </li>
        `;

        desktopContainer.innerHTML += itemHTML;
        mobileContainer.innerHTML += itemHTML;
    });

    // Prevent closing dropdown when checkbox is clicked
    setTimeout(() => {
        document.querySelectorAll('.notification-checkbox').forEach(cb => {
            cb.addEventListener('click', (e) => {
                e.stopPropagation(); // Prevent the click from reaching the document listener
            });
        });
    }, 0);
}

function getSelectedNotificationIds() {
    const checkboxes = document.querySelectorAll('.notification-checkbox:checked');
    return Array.from(checkboxes).map(cb => cb.dataset.id);
}

function markSelectedAsRead() {
    const ids = getSelectedNotificationIds();
    updateNotificationStatus(ids, 'read');
}

function markSelectedAsUnread() {
    const ids = getSelectedNotificationIds();
    updateNotificationStatus(ids, 'unread');
}

function updateNotificationStatus(ids, status) {
    if (ids.length === 0) {
        alert('No notifications selected.');
        return;
    }

    fetch(`/api/notifications/${status}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notificationIds: ids })
    })
    .then(res => res.json())
    .then(data => {
        if (data.success) {
            loadPersonnelNotifications();
        } else {
            alert("Failed to update notifications.");
        }
    })
    .catch(err => console.error("Error updating notification status:", err));
}

function deleteSelectedNotifications() {
    const ids = getSelectedNotificationIds();
    if (ids.length === 0) return alert('No notifications selected.');
    if (!confirm('Are you sure you want to delete selected notifications?')) return;

    recentlyDeletedNotifications = ids.map(id => ({ _id: id }));

    fetch('/api/notifications/delete', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notificationIds: ids })
    })
    .then(res => res.json())
    .then(data => {
        if (data.success) {
            showUndoNotification();
            loadPersonnelNotifications();
        } else {
            alert("Failed to delete notifications.");
        }
    });
}

function showUndoNotification() {
    const undoDiv = document.createElement('div');
    undoDiv.id = "undo-toast";
    undoDiv.style.position = "fixed";
    undoDiv.style.bottom = "20px";
    undoDiv.style.right = "20px";
    undoDiv.style.backgroundColor = "#333";
    undoDiv.style.color = "#fff";
    undoDiv.style.padding = "12px 20px";
    undoDiv.style.borderRadius = "8px";
    undoDiv.style.boxShadow = "0 2px 10px rgba(0,0,0,0.3)";
    undoDiv.style.zIndex = 9999;
    undoDiv.innerHTML = `
        Notification(s) deleted. <a href="#" style="color: #0af; text-decoration: underline;" onclick="undoDelete(event)">Undo</a>
    `;

    document.body.appendChild(undoDiv);

    setTimeout(() => {
        if (undoDiv.parentNode) {
            undoDiv.remove();
            recentlyDeletedNotifications = [];
        }
    }, 5000);
}

function undoDelete(event) {
    event.preventDefault();

    if (recentlyDeletedNotifications.length === 0) return;

    const payload = recentlyDeletedNotifications.map(n => ({ _id: n._id }));

    fetch('/api/notifications/restore', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notifications: payload })
    })
    .then(res => res.json())
    .then(data => {
        if (data.success) {
            recentlyDeletedNotifications = [];
            document.getElementById('undo-toast')?.remove();
            loadPersonnelNotifications();
        } else {
            alert("Failed to restore notifications.");
        }
    })
    .catch(err => {
        console.error("Error restoring notifications:", err);
    });
}
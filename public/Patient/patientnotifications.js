document.addEventListener('DOMContentLoaded', () => {
    const notificationDropdown = document.getElementById('notification-dropdown');
    const notificationBell = document.querySelector('.notification-bell');

    // Load notifications
    loadNotifications();
});

// Toggle the visibility of the notification dropdown
function toggleNotificationDropdown() {
    const dropdown = document.getElementById('notification-dropdown');
    dropdown.style.display = dropdown.style.display === 'block' ? 'none' : 'block';
}

// Function to load notifications
function loadNotifications() {
    fetch('/api/notifications', {
        credentials: 'same-origin'  // Ensure cookies (session) are sent
    })
    .then(response => response.json())
    .then(data => {
        console.log("Loading notifications:", data);  // Log data to see what's loaded
        if (data.success && data.notifications) {
            const notifications = data.notifications;
            const count = notifications.filter(n => !n.isRead).length;

            // Desktop elements
            const list = document.getElementById('notification-list');
            const countEl = document.getElementById('notification-count');

            // Mobile elements
            const mobileList = document.getElementById('mobile-notification-list');
            const mobileCountEl = document.getElementById('mobile-notification-count');

            // Clear existing notifications
            list.innerHTML = '';
            mobileList.innerHTML = '';

            // Update notification counts
            countEl.style.display = count > 0 ? 'inline-block' : 'none';
            mobileCountEl.style.display = count > 0 ? 'inline-block' : 'none';
            if (count > 0) {
                countEl.textContent = count;
                mobileCountEl.textContent = count;
            }

            // Populate notifications
            notifications.forEach(notification => {
                const li = document.createElement('li');
                const mobileLi = document.createElement('li');
                const date = new Date(notification.createdAt);
                const timeAgo = getTimeAgo(date);

                const imgSrc = notification.logoUrl || "../media/logo/EJPL.png";

                const notificationHTML = `
                    <div class="notification-item flex items-start gap-4 p-4 border-b border-gray-200">
                        <input type="checkbox" class="notification-checkbox mt-4" data-id="${notification._id}">
                        <img src="${imgSrc}" alt="Logo" class="notification-logo w-12 h-12 rounded-full object-cover"
                            onerror="this.onerror=null; this.src='../media/logo/EJPL.png';">
                        <div class="notification-text font-inter flex-1">
                            ${notification.isRead 
                                ? `<span class="text-sm text-gray-700">${notification.message}</span>` 
                                : `<strong class="text-sm text-gray-900">${notification.message}</strong>`}
                            <br>
                            <small class="text-xs text-gray-500">${timeAgo}</small>
                        </div>
                    </div>
                `;

                li.innerHTML = notificationHTML;
                mobileLi.innerHTML = notificationHTML;

                list.appendChild(li);
                mobileList.appendChild(mobileLi);
            });
        }
    })
    .catch(err => {
        console.error("Failed to load notifications:", err);
        alert("There was an issue loading your notifications. Please try again later.");
    });
}

// Function to calculate time ago
function getTimeAgo(date) {
    const now = new Date();
    const seconds = Math.floor((now - date) / 1000);

    if (seconds < 60) return `${seconds} second${seconds === 1 ? '' : 's'} ago`;
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes} minute${minutes === 1 ? '' : 's'} ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours} hour${hours === 1 ? '' : 's'} ago`;
    const days = Math.floor(hours / 24);
    return `${days} day${days === 1 ? '' : 's'} ago`;
}

// Function to mark selected notifications as read
function markSelectedAsRead() {
    const selectedIds = getSelectedNotificationIds();
    updateNotificationStatus(selectedIds, 'read');
}

// Function to mark selected notifications as unread
function markSelectedAsUnread() {
    const selectedIds = getSelectedNotificationIds();
    updateNotificationStatus(selectedIds, 'unread');
}

// Function to get selected notification IDs
function getSelectedNotificationIds() {
    const checkboxes = document.querySelectorAll('.notification-checkbox:checked');
    return Array.from(checkboxes).map(checkbox => checkbox.dataset.id);
}

// Function to update notification status (read/unread)
function updateNotificationStatus(notificationIds, status) {
    if (notificationIds.length === 0) {
        alert('No notifications selected.');
        return;
    }

    const endpoint = status === 'read' ? 'read' : 'unread';

    fetch(`/api/notifications/${endpoint}`, {
        method: 'PATCH',
        credentials: 'same-origin',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ notificationIds })
    })
    .then(res => res.json())
    .then(data => {
        if (data.success) {
            loadNotifications(); // Reload notifications after update
        } else {
            alert("Failed to update notification status.");
        }
    })
    .catch(err => {
        console.error("Error updating notification status:", err);
    });
}

let recentlyDeletedNotifications = []; // global cache

function deleteSelectedNotifications() {
    const selectedIds = getSelectedNotificationIds();

    if (selectedIds.length === 0) {
        alert('No notifications selected.');
        return;
    }

    if (!confirm("Are you sure you want to delete the selected notifications?")) return;

    // Prepare deleted notifications only by ID for undo
    const deletedData = selectedIds.map(id => ({ _id: id }));

    fetch('/api/notifications/delete', {
        method: 'DELETE',
        credentials: 'same-origin',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ notificationIds: selectedIds })
    })
    .then(res => res.json())
    .then(data => {
        if (data.success) {
            recentlyDeletedNotifications = deletedData;
            showUndoNotification(); // Show undo toast
            loadNotifications(); // Refresh list
        } else {
            alert("Failed to delete notifications.");
        }
    })
    .catch(err => {
        console.error("Error deleting notifications:", err);
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
            recentlyDeletedNotifications = []; // clear if not undone
        }
    }, 5000); // 5 sec timeout
}

function undoDelete(event) {
    event.preventDefault();

    if (recentlyDeletedNotifications.length === 0) return;

    const payload = recentlyDeletedNotifications.map(n => ({ _id: n._id }));

    fetch('/api/notifications/restore', {
        method: 'POST',
        credentials: 'same-origin',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ notifications: payload })
    })
    .then(res => res.json())
    .then(data => {
        if (data.success) {
            recentlyDeletedNotifications = [];
            document.getElementById('undo-toast')?.remove();

            // Reload notifications after restore
            loadNotifications();
        } else {
            console.error("Restore failed:", data.message || "Unknown error");
            alert("Failed to restore notifications.");
        }
    })
    .catch(err => {
        console.error("Error restoring notifications:", err);
    });
}
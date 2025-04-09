const Notification = require("../models/Notification");

// Get all notifications for the logged-in user (excluding soft-deleted)
exports.getUserNotifications = async (req, res) => {
    if (!req.session.user) {
        return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    try {
        const notifications = await Notification.find({
            user: req.session.user.id,
            isDeleted: false // ✅ Only fetch active ones
        }).sort({ createdAt: -1 });

        res.status(200).json({ success: true, notifications });
    } catch (err) {
        res.status(500).json({ success: false, message: "Failed to fetch notifications." });
    }
};

// Mark multiple notifications as read
exports.markMultipleAsRead = async (req, res) => {
    try {
        const { notificationIds } = req.body;
        await Notification.updateMany(
            { _id: { $in: notificationIds }, isDeleted: false }, // ✅ Only update active
            { $set: { isRead: true } }
        );
        res.json({ success: true });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, error: "Server error" });
    }
};

// Mark multiple as unread
exports.markMultipleAsUnread = async (req, res) => {
    try {
        const { notificationIds } = req.body;
        await Notification.updateMany(
            { _id: { $in: notificationIds }, isDeleted: false }, // ✅ Only update active
            { $set: { isRead: false } }
        );
        res.json({ success: true });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, error: "Server error" });
    }
};

// Soft-delete notifications (set isDeleted: true)
exports.deleteMultipleNotifications = async (req, res) => {
    try {
        const { notificationIds } = req.body;
        if (!Array.isArray(notificationIds) || notificationIds.length === 0) {
            return res.status(400).json({ success: false, message: "No notification IDs provided." });
        }

        await Notification.updateMany(
            { _id: { $in: notificationIds } },
            { $set: { isDeleted: true } } // ✅ Soft delete
        );

        res.json({ success: true });
    } catch (error) {
        console.error("Error deleting notifications:", error);
        res.status(500).json({ success: false, message: "Server error while deleting notifications." });
    }
};

// Restore soft-deleted notifications (set isDeleted: false)
exports.restoreNotifications = async (req, res) => {
    try {
        const { notifications } = req.body;

        console.log("Received for restore:", notifications);

        if (!Array.isArray(notifications) || notifications.length === 0) {
            return res.status(400).json({ success: false, message: "No notifications provided." });
        }

        const restoredNotifications = await Notification.updateMany(
            { _id: { $in: notifications.map(n => n._id) } },
            { $set: { isDeleted: false, isRead: false, isRestored: true } } // ✅ Un-delete & optionally mark unread
        );

        console.log("Notifications restored:", restoredNotifications);

        if (restoredNotifications.modifiedCount === 0) {
            return res.status(400).json({ success: false, message: "No notifications found to restore." });
        }

        const restored = await Notification.find({
            _id: { $in: notifications.map(n => n._id) }
        });

        res.json({ success: true, notifications: restored });
    } catch (error) {
        console.error("Error restoring notifications:", error);
        res.status(500).json({ success: false, message: "Error restoring notifications." });
    }
};

module.exports = exports;
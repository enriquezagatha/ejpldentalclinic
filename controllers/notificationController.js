// controllers/notificationController.js
const Notification = require("../models/Notification");

// Get all notifications for the logged-in user
exports.getUserNotifications = async (req, res) => {
    if (!req.session.user) {
        return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    try {
        const notifications = await Notification.find({ user: req.session.user.id }).sort({ createdAt: -1 });
        res.status(200).json({ success: true, notifications });
    } catch (err) {
        res.status(500).json({ success: false, message: "Failed to fetch notifications." });
    }
};

// Mark a notification as read
exports.markAsRead = async (req, res) => {
    try {
        const notification = await Notification.findByIdAndUpdate(
            req.params.id,
            { isRead: true },
            { new: true }
        );
        res.status(200).json({ success: true, notification });
    } catch (err) {
        res.status(500).json({ success: false, message: "Failed to update notification." });
    }
};

// Delete a notification
exports.deleteNotification = async (req, res) => {
    try {
        await Notification.findByIdAndDelete(req.params.id);
        res.status(200).json({ success: true, message: "Notification deleted." });
    } catch (err) {
        res.status(500).json({ success: false, message: "Failed to delete notification." });
    }
};

module.exports = exports;
const Notification = require('../models/Notification');

// Fetch notification count for a patient
exports.getNotificationCount = async (req, res) => {
    try {
        const patientId = req.user.id; // Assuming user is authenticated and their ID is available
        const unreadCount = await Notification.countDocuments({ patientId, read: false }); // Count unread notifications
        res.status(200).json({ count: unreadCount });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Failed to fetch notification count" });
    }
};

// Fetch all notifications for a patient
exports.getNotifications = async (req, res) => {
    try {
        const patientId = req.user.id; // Assuming user is authenticated and their ID is available
        const notifications = await Notification.find({ patientId })
            .sort({ createdAt: -1 })  // Sort by newest first
            .limit(10);  // Limit the number of notifications

        res.status(200).json({
            notifications,
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Failed to fetch notifications" });
    }
};

// Create a new notification for the patient (Appointment Confirmation)
exports.createNotification = async (req, res) => {
    try {
        const { patientId, message } = req.body;

        // Create a new notification document
        const newNotification = new Notification({
            patientId,
            message,
            read: false,  // Initially unread
        });

        await newNotification.save(); // Save to the database

        res.status(201).json({
            message: "Notification created successfully",
            notification: newNotification,
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Failed to create notification" });
    }
};

//Export the controller functions
module.exports = exports;
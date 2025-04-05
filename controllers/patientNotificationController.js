const PatientNotification = require('../models/PatientNotification');
const Patient = require('../models/Patient');

// Fetch notification count for a patient (based on session email)
exports.getNotificationCount = async (req, res) => {
    try {
        const email = req.session.user?.email;
        if (!email) return res.status(401).json({ message: "Unauthorized" });

        const unreadCount = await PatientNotification.countDocuments({ email, read: false });
        res.status(200).json({ count: unreadCount });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Failed to fetch notification count" });
    }
};

// Fetch all notifications for a patient (based on session email)
exports.getNotifications = async (req, res) => {
    try {
        const email = req.session.user?.email;
        if (!email) return res.status(401).json({ message: "Unauthorized" });

        const notifications = await PatientNotification.find({ email })
            .sort({ createdAt: -1 })
            .limit(10);

        res.status(200).json({ notifications });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Failed to fetch notifications" });
    }
};

// Create a new notification for the patient (Appointment Confirmation)
exports.createNotification = async (req, res) => {
    try {
        const { email, message } = req.body;

        if (!email || !message) {
            return res.status(400).json({ message: "Email and message are required" });
        }

        const user = await Patient.findOne({ email });
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        const newNotification = new PatientNotification({
            email,
            message,
            read: false,
        });

        await newNotification.save();

        res.status(201).json({
            message: "Notification created successfully",
            notification: newNotification,
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Failed to create notification" });
    }
};

// Mark a notification as read (by notificationId)
exports.markNotificationAsRead = async (req, res) => {
    try {
        const { notificationId } = req.params;

        await PatientNotification.findByIdAndUpdate(notificationId, { read: true });

        res.status(200).json({ message: "PatientNotification marked as read" });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Failed to mark notification as read" });
    }
};

module.exports = exports;
const Notification = require('../models/Notification');
const Patient = require('../models/Patient');
const MedicalPersonnel = require('../models/MedicalPersonnel');

// Fetch notification count for a patient (based on email)
exports.getNotificationCount = async (req, res) => {
    try {
        const email = req.user.email; // Assuming user is authenticated and their email is available
        const unreadCount = await Notification.countDocuments({ email, read: false }); // Count unread notifications
        res.status(200).json({ count: unreadCount });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Failed to fetch notification count" });
    }
};

// Fetch all notifications for a patient (based on email)
exports.getNotifications = async (req, res) => {
    try {
        const email = req.user.email; // Assuming user is authenticated and their email is available
        const notifications = await Notification.find({ email })
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
        const { email, message, userType } = req.body;

        // Check if email exists (either for patient or medical personnel)
        const user = await Patient.findOne({ email }) || await MedicalPersonnel.findOne({ email });

        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        // Create a new notification document
        const newNotification = new Notification({
            email, // Use the email
            message,
            userType, // 'patient' or 'medicalPersonnel'
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

// Mark a notification as read (by notificationId)
exports.markNotificationAsRead = async (req, res) => {
    try {
        const { notificationId } = req.params;
        await Notification.findByIdAndUpdate(notificationId, { read: true });

        res.status(200).json({ message: "Notification marked as read" });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Failed to mark notification as read" });
    }
};

//Export the controller functions
module.exports = exports;
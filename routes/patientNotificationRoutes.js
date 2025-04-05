const express = require('express');
const router = express.Router();
const patientNotificationController = require('../controllers/patientNotificationController');

// Route to fetch notification count
router.get('/count', patientNotificationController.getNotificationCount);

// Route to fetch all notifications
router.get('/get', patientNotificationController.getNotifications);

// Route to create a new notification
router.post('/create', patientNotificationController.createNotification);

// Route to mark a notification as read
router.patch('/:notificationId/mark-read', patientNotificationController.markNotificationAsRead);

module.exports = router;
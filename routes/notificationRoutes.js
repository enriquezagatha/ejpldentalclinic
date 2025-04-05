const express = require('express');
const router = express.Router();
const notificationController = require('../controllers/notificationController');

// Route to fetch notification count
router.get('/count', notificationController.getNotificationCount);

// Route to fetch all notifications
router.get('/', notificationController.getNotifications);

// Route to create a new notification
router.post('/create', notificationController.createNotification);

// Route to mark a notification as read
router.patch('/:notificationId/mark-read', notificationController.markNotificationAsRead);

module.exports = router;
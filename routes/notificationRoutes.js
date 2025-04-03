const express = require('express');
const router = express.Router();
const notificationController = require('../controllers/notificationController');
const authMiddleware = require('../middleware/authMiddleware'); // Assuming you have auth middleware

// Route to fetch notification count
router.get('/count', authMiddleware, notificationController.getNotificationCount);

// Route to fetch all notifications
router.get('/', authMiddleware, notificationController.getNotifications);

// Route to create a new notification
router.post('/create', authMiddleware, notificationController.createNotification);

// Route to mark a notification as read
router.patch('/:notificationId/mark-read', authMiddleware, notificationController.markNotificationAsRead);

module.exports = router;
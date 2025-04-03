const express = require('express');
const router = express.Router();
const notificationController = require('../controllers/notificationController');
const authMiddleware = require('../middleware/authMiddleware'); // Assuming you have auth middleware

// Route to fetch notification count
router.get('/count', authMiddleware, notificationController.getNotificationCount);

// Route to fetch all notifications
router.get('/', authMiddleware, notificationController.getNotifications);

router.post('/create', authMiddleware, notificationController.createNotification);

module.exports = router;

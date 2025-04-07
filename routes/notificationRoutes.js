const express = require("express");
const router = express.Router();
const notificationController = require("../controllers/notificationController");

router.get("/", notificationController.getUserNotifications);
router.patch("/:id/read", notificationController.markAsRead);
router.patch("/:id/unread", notificationController.markAsUnread);
router.delete("/:id", notificationController.deleteNotification);

module.exports = router;
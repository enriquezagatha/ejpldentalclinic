const express = require("express");
const router = express.Router();
const notificationController = require("../controllers/notificationController");

router.get("/", notificationController.getUserNotifications);
router.patch("/read", notificationController.markMultipleAsRead);
router.patch("/unread", notificationController.markMultipleAsUnread);
router.delete("/delete", notificationController.deleteMultipleNotifications);
router.post("/restore", notificationController.restoreNotifications);

module.exports = router;
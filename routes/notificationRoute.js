const express = require("express");
const router = express.Router();

const {
  createNotification,
  getAllNotifications,
  updateNotificationStatus
} = require("../controllers/notificationController");

router.post("/", createNotification);
router.get("/", getAllNotifications);
router.put("/:id/status", updateNotificationStatus);

module.exports = router;
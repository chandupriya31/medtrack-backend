const NotificationModel = require("../models/notificationModel");
const admin = require("../config/firebaseAdmin");

exports.createNotification = async (req, res) => {
  try {
    const user_id = req.user.user_id;

    const notification =
      await NotificationModel.create({
        user_id,
        ...req.body,
      });

    res.status(201).json(notification);

  } catch (err) {

    if (err.message === "Unauthorized access") {
      return res.status(403).json({
        message: err.message,
      });
    }

    res.status(500).json({ message: "Server error" });
  }
};

exports.getAllNotifications = async (req, res) => {
  try {
    const user_id = req.user.user_id;

    const notifications =
      await NotificationModel.getAllByUser(user_id);

    res.json(notifications);

  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};

exports.updateNotificationStatus = async (req, res) => {
  try {
    const user_id = req.user.user_id;

    const updated =
      await NotificationModel.updateStatus(
        req.params.id,
        user_id,
        req.body.status
      );

    if (!updated)
      return res.status(404).json({
        message: "Notification not found",
      });

    res.json(updated);

  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};

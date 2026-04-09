const express = require("express");
const router = express.Router();

const {
  getRemindersByPatient,
  createReminder
} = require("../controllers/reminderController");

router.get("/:patientId", getRemindersByPatient);
router.post("/", createReminder);

module.exports = router;

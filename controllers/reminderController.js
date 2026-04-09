const ReminderModel = require("../models/reminderModel");

const getRemindersByPatient = async (req, res) => {
  try {
    const reminders = await ReminderModel.getRemindersByPatient(
      req.params.patientId,
    );
    res.json(reminders);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const createReminder = async (req, res) => {
  try {
    const reminder = await ReminderModel.createReminder(req.body);
    res.json(reminder);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

module.exports = { getRemindersByPatient, createReminder };

const pool = require("../db");

const ReminderModel = {
  getRemindersByPatient: async (patient_id) => {
    const res = await pool.query(
      `SELECT r.id AS reminder_id, r.reminder_time,
              m.name AS medicine_name, m.dosage, m.frequency, m.status
       FROM reminders r
       JOIN medicines m ON r.medicine_id = m.medicine_id
       WHERE m.patient_id = $1
       ORDER BY r.reminder_time ASC`,
      [patient_id],
    );
    return res.rows;
  },

  createReminder: async ({ medicine_id, reminder_time }) => {
    const res = await pool.query(
      "INSERT INTO reminders (medicine_id, reminder_time) VALUES ($1,$2) RETURNING *",
      [medicine_id, reminder_time],
    );
    return res.rows[0];
  },
};

module.exports = ReminderModel;

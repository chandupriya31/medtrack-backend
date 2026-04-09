const cron = require("node-cron");
const db = require("../db");
const { generateLogsForSchedule } = require("../services/doseGeneratorServices");
const { getPatientId, sendPushNotification } = require("../services/notificationService");

cron.schedule("5 0 * * *", async () => {

  const today = new Date()
    .toLocaleDateString("en-CA", { timeZone: "Asia/Kolkata" });

  const schedules = await db("medicine_schedules as ms")
    .join("medicines as m", "ms.medicine_id", "m.medicine_id")
    .where("m.status", "active")
    .whereRaw("? BETWEEN m.start_date AND m.end_date", [today])
    .select("ms.schedule_id");

  for (let s of schedules) {
    await generateLogsForSchedule(s.schedule_id, today);
  }

}, {
  timezone: "Asia/Kolkata"
});

cron.schedule("* * * * *", async () => {
  console.log("Checking pending reminders... PID:", process.pid);

  const today = new Date().toISOString().split("T")[0];

  try {
    await db.transaction(async (trx) => {
      const doses = await trx("dose_logs")
        .where({
          dose_date: today,
          status: "PENDING",
        })
        .andWhereRaw("dose_time <= CURRENT_TIME")
        .forUpdate()
        .skipLocked();

      for (let dose of doses) {

        const updated = await trx("dose_logs")
          .where({
            dose_log_id: dose.dose_log_id,
            status: "PENDING",
          })
          .update({ status: "NOTIFIED" });

        if (!updated) continue;

        const patientId = await getPatientId(dose.schedule_id);

        try {
          await sendPushNotification(dose);

          await trx("notifications").insert({
            dose_log_id: dose.dose_log_id,
            patient_id: patientId,
            message: "Time to take your medicine",
            delivery_type: "PUSH",
            status: "SENT",
            sent_at: trx.fn.now(),
          });

        } catch (err) {
          console.log("Push insert skipped (duplicate):", err.message);
        }
      }
    });

    console.log("Reminder check completed.");

  } catch (error) {
    console.error("Reminder cron failed:", error);
  }
}, {
  timezone: "Asia/Kolkata",
});

cron.schedule("*/15 * * * *", async () => {
  try {
    console.log("Marking missed doses...");

    const today = new Date().toISOString().split("T")[0];

    await db("dose_logs")
      .where("dose_date", today)
      .andWhere("status", "NOTIFIED")
      .andWhereRaw("dose_time < CURRENT_TIME - INTERVAL '30 minutes'")
      .update({ status: "MISSED" });

    console.log("Missed doses update completed.");
  } catch (error) {
    console.error("Missed cron failed:", error);
  }
});
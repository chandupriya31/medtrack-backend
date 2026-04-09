const db = require("../db");

const DoseLogModel = {

  verifyScheduleOwnership: async (schedule_id, user_id) => {
    return await db("medicine_schedules as ms")
      .join("medicines as m", "ms.medicine_id", "m.medicine_id")
      .join("patients as p", "m.patient_id", "p.patient_id")
      .where({
        "ms.schedule_id": schedule_id,
        "p.user_id": user_id,
      })
      .first();
  },

  generateForDate: async (schedule_id, user_id, date) => {

    const schedule = await this.verifyScheduleOwnership(
      schedule_id,
      user_id
    );

    if (!schedule)
      throw new Error("Unauthorized schedule access");

    const times = await db("schedule_times")
      .where({ schedule_id })
      .select("dose_time");

    if (!times.length) return [];

    const logs = [];

    for (let t of times) {
      try {
        const inserted = await db("dose_logs")
          .insert({
            schedule_id,
            dose_date: date,
            dose_time: t.dose_time,
            status: "PENDING",
          })
          .returning("*");

        logs.push(inserted[0]);
      } catch (err) {
        if (!err.message.includes("unique_dose_log")) {
          throw err;
        }
      }
    }

    return logs;
  },

  getTodayDoses: async (user_id, date) => {

    return await db("dose_logs as dl")
      .join("medicine_schedules as ms", "dl.schedule_id", "ms.schedule_id")
      .join("medicines as m", "ms.medicine_id", "m.medicine_id")
      .join("patients as p", "m.patient_id", "p.patient_id")
      .where({
        "dl.dose_date": date,
        "p.user_id": user_id,
      })
      .select(
        "dl.*",
        "m.name as medicine_name",
        "p.name as patient_name"
      )
      .orderBy("dl.dose_time", "asc");
  },

  markAsTaken: async (dose_log_id, user_id) => {

    const dose = await db("dose_logs as dl")
      .join("medicine_schedules as ms", "dl.schedule_id", "ms.schedule_id")
      .join("medicines as m", "ms.medicine_id", "m.medicine_id")
      .join("patients as p", "m.patient_id", "p.patient_id")
      .where({
        "dl.dose_log_id": dose_log_id,
        "p.user_id": user_id,
      })
      .select("dl.*")
      .first();

    if (!dose) return null;

    if (!["PENDING", "NOTIFIED"].includes(dose.status))
      return dose;

    const updated = await db("dose_logs")
      .where({ dose_log_id })
      .update({
        status: "TAKEN",
        taken_at: db.fn.now(),
      })
      .returning("*");

    return updated[0];
  },

  markMissedForPast: async (date) => {
    return await db("dose_logs")
      .where("dose_date", "<", date)
      .andWhere("status", "PENDING")
      .update({ status: "MISSED" });
  },
  markAsMissed: async (dose_log_id, user_id) => {

    const dose = await db("dose_logs as dl")
      .join("medicine_schedules as ms", "dl.schedule_id", "ms.schedule_id")
      .join("medicines as m", "ms.medicine_id", "m.medicine_id")
      .join("patients as p", "m.patient_id", "p.patient_id")
      .where({
        "dl.dose_log_id": dose_log_id,
        "p.user_id": user_id,
      })
      .select("dl.*")
      .first();

    if (!dose) return null;

    if (!["PENDING", "NOTIFIED"].includes(dose.status))
      return dose;

    const updated = await db("dose_logs")
      .where({ dose_log_id })
      .update({
        status: "MISSED",
        updated_at: db.fn.now(),
      })
      .returning("*");

    return updated[0];
  },

};

module.exports = DoseLogModel;
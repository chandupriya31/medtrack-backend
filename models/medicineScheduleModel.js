const db = require("../db");
const { generateLogsForSchedule } = require("../services/doseGeneratorServices");

const MedicineScheduleModel = {
  verifyMedicineOwnership: async (medicine_id, user_id) => {
    return await db("medicines as m")
      .join("patients as p", "m.patient_id", "p.patient_id")
      .where({
        "m.medicine_id": medicine_id,
        "p.user_id": user_id,
      })
      .first();
  },

  getByMedicine: async (medicine_id, user_id) => {

    const medicine = await MedicineScheduleModel.verifyMedicineOwnership(
      medicine_id,
      user_id
    );

    if (!medicine) return null;

    const schedules = await db("medicine_schedules")
      .where({ medicine_id })
      .orderBy("created_at", "desc");

    for (let schedule of schedules) {
      schedule.times = await db("schedule_times")
        .where({ schedule_id: schedule.schedule_id })
        .select("schedule_time_id", "dose_time")
        .orderBy("dose_time", "asc");
    }

    return schedules;
  },

  create: async ({
    medicine_id,
    user_id,
    frequency,
    interval_hours,
    start_time,
    dose_times
  }) => {

    const medicine =
      await MedicineScheduleModel.verifyMedicineOwnership(
        medicine_id,
        user_id
      );

    if (!medicine)
      throw new Error("Unauthorized medicine access");

    return await db.transaction(async (trx) => {

      const inserted = await trx("medicine_schedules")
        .insert({
          medicine_id,
          frequency,
          interval_hours,
          start_time,
        })
        .returning("*");

      const schedule = inserted[0];

      if (frequency !== "interval" && dose_times?.length > 0) {
        await trx("schedule_times").insert(
          dose_times.map(time => ({
            schedule_id: schedule.schedule_id,
            dose_time: time,
          }))
        );
      }

      const today = new Date()
        .toLocaleDateString("en-CA", { timeZone: "Asia/Kolkata" });

      const medicineStart = new Date(medicine.start_date)
        .toLocaleDateString("en-CA", { timeZone: "Asia/Kolkata" });

      const medicineEnd = new Date(medicine.end_date)
        .toLocaleDateString("en-CA", { timeZone: "Asia/Kolkata" });

      if (
        medicineStart <= today &&
        medicineEnd >= today &&
        medicine.status === "active"
      ) {
        await generateLogsForSchedule(
          schedule.schedule_id,
          today,
          trx
        );
      }

      return schedule;
    });
  },

  delete: async (schedule_id, user_id) => {

    const schedule = await db("medicine_schedules as ms")
      .join("medicines as m", "ms.medicine_id", "m.medicine_id")
      .join("patients as p", "m.patient_id", "p.patient_id")
      .where({
        "ms.schedule_id": schedule_id,
        "p.user_id": user_id,
      })
      .select("ms.*")
      .first();

    if (!schedule) return null;

    await db("medicine_schedules")
      .where({ schedule_id })
      .del();

    return schedule;
  },

};

module.exports = MedicineScheduleModel;
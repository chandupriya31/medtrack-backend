const db = require("../db"); // your knex instance

const HistoryModel = {

  getCompletedMedicines: async () => {
    return await db("dose_logs as dl")
      .join("medicine_schedules as ms", "dl.schedule_id", "ms.schedule_id")
      .join("medicines as m", "ms.medicine_id", "m.medicine_id")
      .join("patients as p", "m.patient_id", "p.patient_id")
      .where("dl.status", "TAKEN")
      .select(
        "dl.*",
        "m.name as medicine_name",
        "p.name as patient_name"
      )
      .orderBy("dl.dose_date", "desc")
      .orderBy("dl.dose_time", "desc");
  },

  getMissedDoses: async () => {
    return await db("dose_logs as dl")
      .join("medicine_schedules as ms", "dl.schedule_id", "ms.schedule_id")
      .join("medicines as m", "ms.medicine_id", "m.medicine_id")
      .join("patients as p", "m.patient_id", "p.patient_id")
      .where("dl.status", "MISSED")
      .select(
        "dl.*",
        "m.name as medicine_name",
        "p.name as patient_name"
      )
      .orderBy("dl.dose_date", "desc")
      .orderBy("dl.dose_time", "desc");
  },

  getPatientHistory: async (patient_id) => {
    return await db("dose_logs as dl")
      .join("medicine_schedules as ms", "dl.schedule_id", "ms.schedule_id")
      .join("medicines as m", "ms.medicine_id", "m.medicine_id")
      .join("patients as p", "m.patient_id", "p.patient_id")
      .where("p.patient_id", patient_id)
      .select(
        "dl.*",
        "m.name as medicine_name",
        "p.name as patient_name"
      )
      .orderBy("dl.dose_date", "desc")
      .orderBy("dl.dose_time", "desc");
  },

};

module.exports = HistoryModel;
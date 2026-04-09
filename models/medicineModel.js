const db = require("../db");

const MedicineModel = {
  async getAllByUser(user_id) {
    try {
      const medicines = await db("medicines as m")
        .join("patients as p", "m.patient_id", "p.patient_id")
        .where("p.user_id", user_id)
        .select(
          "m.*",
          "p.name as patient_name",
          "p.age",
          "p.gender"
        )
        .orderBy("m.created_at", "desc");

      return medicines;
    } catch (err) {
      throw err;
    }
  },
  getByPatient: async (patient_id, user_id) => {
    return await db("medicines as m")
      .join("patients as p", "m.patient_id", "p.patient_id")
      .where({
        "m.patient_id": patient_id,
        "p.user_id": user_id,
      })
      .select("m.*")
      .orderBy("m.start_date", "desc");
  },

  getById: async (medicine_id, user_id) => {

    return await db("medicines as m")
      .join("patients as p", "m.patient_id", "p.patient_id")
      .where({
        "m.medicine_id": medicine_id,
        "p.user_id": user_id,
      })
      .select("m.*")
      .first();
  },

  create: async ({
    patient_id,
    user_id,
    name,
    dosage,
    instructions,
    start_date,
    end_date,
  }) => {

    const patient = await db("patients")
      .where({ patient_id, user_id })
      .first();

    if (!patient) {
      throw new Error("Unauthorized patient access");
    }

    const duration =
      Math.ceil(
        (new Date(end_date) - new Date(start_date)) /
        (1000 * 60 * 60 * 24)
      ) + 1;

    const medicine = await db("medicines")
      .insert({
        patient_id,
        name,
        dosage,
        instructions,
        start_date,
        end_date,
        duration,
        status: "active",
      })
      .returning("*");

    return medicine[0];
  },

  update: async ({
    medicine_id,
    user_id,
    name,
    dosage,
    instructions,
    start_date,
    end_date,
    status,
  }) => {

    const existing = await this.getById(medicine_id, user_id);

    if (!existing) return null;

    const duration =
      Math.ceil(
        (new Date(end_date) - new Date(start_date)) /
        (1000 * 60 * 60 * 24)
      ) + 1;

    const updated = await db("medicines")
      .where({ medicine_id })
      .update({
        name,
        dosage,
        instructions,
        start_date,
        end_date,
        duration,
        status,
        updated_at: db.fn.now(),
      })
      .returning("*");

    return updated[0];
  },

  delete: async (medicine_id, user_id) => {

    const existing = await this.getById(medicine_id, user_id);

    if (!existing) return null;

    const deleted = await db("medicines")
      .where({ medicine_id })
      .del()
      .returning("*");

    return deleted[0];
  }

};

module.exports = MedicineModel;
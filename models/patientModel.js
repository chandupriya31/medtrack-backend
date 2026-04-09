const db = require("../db");

const PatientModel = {
  getAllByUser: async (user_id) => {
    return await db("patients")
      .where({ user_id })
      .orderBy("created_at", "desc");
  },

  getById: async (patient_id, user_id) => {
    return await db("patients")
      .where({ patient_id, user_id })
      .first();
  },

  create: async ({
    user_id,
    name,
    age,
    gender,
    phone_number,
    medical_condition,
    doctor_name,
  }) => {

    const patient = await db("patients")
      .insert({
        user_id,
        name,
        age,
        gender,
        phone_number,
        medical_condition,
        doctor_name,
      })
      .returning("*");

    return patient[0];
  },

  update: async ({
    patient_id,
    user_id,
    name,
    age,
    gender,
    phone_number,
    medical_condition,
    doctor_name,
  }) => {

    const updated = await db("patients")
      .where({ patient_id, user_id })
      .update({
        name,
        age,
        gender,
        phone_number,
        medical_condition,
        doctor_name,
        updated_at: db.fn.now(),
      })
      .returning("*");

    return updated[0];
  },

  delete: async (patient_id, user_id) => {

    const deleted = await db("patients")
      .where({ patient_id, user_id })
      .del()
      .returning("*");

    return deleted[0];
  }

};

module.exports = PatientModel;
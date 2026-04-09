const PatientModel = require("../models/patientModel");

exports.getPatients = async (req, res) => {
  try {
    const user_id = req.user.user_id;

    const patients = await PatientModel.getAllByUser(user_id);

    res.json(patients);
  } catch (err) {
    console.log(err, 'in getPatients');
    res.status(500).json({ message: "Server error" });
  }
};

exports.getPatientById = async (req, res) => {
  try {
    const user_id = req.user.user_id;

    const patient = await PatientModel.getById(
      req.params.id,
      user_id
    );

    if (!patient)
      return res.status(404).json({ message: "Patient not found" });

    res.json(patient);

  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};
exports.addPatient = async (req, res) => {
  try {
    const user_id = req.user.user_id;

    const {
      name,
      age,
      gender,
      phone_number,
      medical_condition,
      doctor_name,
    } = req.body;

    if (!name || !age || !gender || !phone_number) {
      return res.status(400).json({ message: "Required fields missing" });
    }

    const newPatient = await PatientModel.create({
      user_id,
      name,
      age,
      gender,
      phone_number,
      medical_condition,
      doctor_name,
    });

    res.status(201).json({ message: "Patient added successfully" });

  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};

exports.updatePatient = async (req, res) => {
  try {
    const user_id = req.user.user_id;

    const updated = await PatientModel.update({
      patient_id: req.params.id,
      user_id,
      ...req.body,
    });

    if (!updated)
      return res.status(404).json({ message: "Patient not found" });

    res.json({ message: "Patient updated successfully" });

  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};

exports.deletePatient = async (req, res) => {
  try {
    const user_id = req.user.user_id;

    const deleted = await PatientModel.delete(
      req.params.id,
      user_id
    );

    if (!deleted)
      return res.status(404).json({ message: "Patient not found" });

    res.json({ message: "Patient deleted successfully" });

  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};


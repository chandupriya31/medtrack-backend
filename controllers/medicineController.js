const MedicineModel = require("../models/medicineModel");

exports.getAllMedicinesByUser = async (req, res) => {
  try {
    const user_id = req.user.user_id;

    const medicines = await MedicineModel.getAllByUser(user_id);

    res.json(medicines);

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

exports.getMedicinesByPatient = async (req, res) => {
  try {
    const user_id = req.user.user_id;
    const { patientId } = req.params;

    const medicines = await MedicineModel.getByPatient(
      patientId,
      user_id
    );

    res.json(medicines);

  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};

exports.getMedicineById = async (req, res) => {
  try {
    const user_id = req.user.user_id;

    const medicine = await MedicineModel.getById(
      req.params.id,
      user_id
    );

    if (!medicine)
      return res.status(404).json({ message: "Medicine not found" });

    res.json(medicine);

  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};

exports.addMedicine = async (req, res) => {
  try {
    const user_id = req.user.user_id;

    const medicine = await MedicineModel.create({
      user_id,
      ...req.body,
    });

    res.status(201).json(medicine);

  } catch (err) {
    if (err.message === "Unauthorized patient access") {
      return res.status(403).json({ message: err.message });
    }

    res.status(500).json({ message: "Server error" });
  }
};

exports.updateMedicine = async (req, res) => {
  try {
    const user_id = req.user.user_id;

    const updated = await MedicineModel.update({
      medicine_id: req.params.id,
      user_id,
      ...req.body,
    });

    if (!updated)
      return res.status(404).json({ message: "Medicine not found" });

    res.json(updated);

  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};

exports.deleteMedicine = async (req, res) => {
  try {
    const user_id = req.user.user_id;

    const deleted = await MedicineModel.delete(
      req.params.id,
      user_id
    );

    if (!deleted)
      return res.status(404).json({ message: "Medicine not found" });

    res.json({ message: "Medicine deleted successfully" });

  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};

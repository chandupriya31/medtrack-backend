const DoseModel = require("../models/doseModel");
const MedicineScheduleModel = require("../models/medicineScheduleModel");

exports.getSchedulesByMedicine = async (req, res) => {
  try {
    const user_id = req.user.user_id;
    const { medicineId } = req.params;

    const schedules =
      await MedicineScheduleModel.getByMedicine(
        medicineId,
        user_id
      );

    if (!schedules)
      return res.status(404).json({
        message: "Medicine not found",
      });

    res.json(schedules);

  } catch (err) {
    console.log(err,'error in get schedules');
    res.status(500).json({ message: "Server error" });
  }
};

exports.createSchedule = async (req, res) => {
  try {
    const user_id = req.user.user_id;

    const schedule =
      await MedicineScheduleModel.create({
        user_id,
        ...req.body,
      });

    res.status(201).json(schedule);

  } catch (err) {
    console.log(err, 'in createSchedule');
    if (err.message === "Unauthorized medicine access") {
      return res.status(403).json({
        message: err.message,
      });
    }

    res.status(500).json({ message: "Server error" });
  }
};

exports.deleteSchedule = async (req, res) => {
  try {
    const user_id = req.user.user_id;

    const deleted =
      await MedicineScheduleModel.delete(
        req.params.id,
        user_id
      );

    if (!deleted)
      return res.status(404).json({
        message: "Schedule not found",
      });

    res.json({
      message: "Schedule deleted successfully",
    });

  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};


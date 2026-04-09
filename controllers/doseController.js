const DoseLogModel = require("../models/doseModel");

exports.generateTodayLogs = async (req, res) => {
  try {
    const user_id = req.user.user_id;
    const { scheduleId } = req.params;

    const today = new Date().toISOString().split("T")[0];

    const logs = await DoseLogModel.generateForDate(
      scheduleId,
      user_id,
      today
    );

    res.json(logs);

  } catch (err) {
    if (err.message === "Unauthorized schedule access") {
      return res.status(403).json({ message: err.message });
    }

    res.status(500).json({ message: "Server error" });
  }
};

exports.getTodayDoses = async (req, res) => {
  try {
    const user_id = req.user.user_id;
    const today = new Date().toISOString().split("T")[0];

    const doses = await DoseLogModel.getTodayDoses(
      user_id,
      today
    );

    res.json(doses);

  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};

exports.markDoseTaken = async (req, res) => {
  try {
    const user_id = req.user.user_id;

    const updated = await DoseLogModel.markAsTaken(
      req.params.id,
      user_id
    );

    if (!updated)
      return res.status(404).json({
        message: "Dose not found",
      });

    res.json(updated);

  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};

exports.markDoseMissed = async (req, res) => {
  try {
    const user_id = req.user.user_id;

    const updated = await DoseLogModel.markAsMissed(
      req.params.id,
      user_id
    );

    if (!updated)
      return res.status(404).json({
        message: "Dose not found",
      });

    res.json(updated);

  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};
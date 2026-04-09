const HistoryModel = require("../models/historyModel");

const getHistory = async (req, res) => {
  try {
    const history = await HistoryModel.getCompletedMedicines();
    const missed = await HistoryModel.getMissedDoses();

    res.json({ completed: history, missed });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const getPatientHistory = async (req, res) => {
  try {
    const { patient_id } = req.params;

    const allHistory =
      await HistoryModel.getPatientHistory(patient_id);

    const completed = allHistory.filter(
      (d) => d.status === "TAKEN"
    );

    const missed = allHistory.filter(
      (d) => d.status === "MISSED"
    );

    res.json({ completed, missed });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

module.exports = {
  getHistory,
  getPatientHistory,
};
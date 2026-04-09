
const express = require("express");
const router = express.Router();

const {
  getHistory,
  getPatientHistory
} = require("../controllers/historyController");
router.get("/", getHistory);

router.get("/patient/:patient_id", getPatientHistory);

module.exports = router;

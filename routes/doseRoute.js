const express = require("express");
const router = express.Router();

const {
  generateTodayLogs,
  getTodayDoses,
  markDoseTaken,
  markDoseMissed,
} = require("../controllers/doseController");

router.post("/generate/:scheduleId", generateTodayLogs);
router.get("/today", getTodayDoses);
router.put("/taken/:id", markDoseTaken);
router.put("/missed/:id", markDoseMissed);

module.exports = router;
const express = require("express");
const router = express.Router();
const {
  getSchedulesByMedicine,
  createSchedule,
  deleteSchedule
} = require("../controllers/medicineSheduleController");

router.get("/medicine/:medicineId", getSchedulesByMedicine);
router.post("/", createSchedule);
router.delete("/:id", deleteSchedule);

module.exports = router;
const express = require("express");
const router = express.Router();
const authenticateToken = require("../middileware/authMiddleware");
const { getPatients, addPatient, updatePatient, deletePatient } = require("../controllers/patientController");

router.use(authenticateToken);

router.get("/", getPatients);
router.post("/", addPatient);
router.put("/:id", updatePatient);
router.delete("/:id", deletePatient);

module.exports = router;

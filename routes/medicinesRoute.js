const express = require("express");
const router = express.Router();
const {
  getMedicinesByPatient,
  addMedicine,
  updateMedicine,
  deleteMedicine,
  getAllMedicinesByUser,
} = require("../controllers/medicineController");

router.get("/",getAllMedicinesByUser);
router.get("/patient/:patientId", getMedicinesByPatient);
router.post("/", addMedicine);
router.put("/:id", updateMedicine);
router.delete("/:id", deleteMedicine);

module.exports = router;

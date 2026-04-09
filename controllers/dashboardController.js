const db = require("../db");

exports.getDashboard = async (req, res) => {
  try {
    const user_id = req.user.user_id;

    // 🔹 Active Medicines
    const activeMedicines = await db("medicines as m")
      .select(
        "m.medicine_id",
        "m.name as medicine_name",
        "m.end_date",
        "m.status",
        "p.name as patient_name"
      )
      .join("patients as p", "p.patient_id", "m.patient_id")
      .where("p.user_id", user_id)
      .where("m.start_date", "<=", db.fn.now())
      .where("m.end_date", ">=", db.fn.now())
      .where("m.status", "active")
      .orderBy("m.end_date");

    // 🔹 Today's Doses (ALL statuses)
    const todayDoses = await db("dose_logs as d")
      .select(
        "d.dose_log_id",
        "d.dose_date",
        "d.dose_time",
        "d.status",
        "m.name as medicine_name",
        "p.name as patient_name"
      )
      .join("medicine_schedules as s", "s.schedule_id", "d.schedule_id")
      .join("medicines as m", "m.medicine_id", "s.medicine_id")
      .join("patients as p", "p.patient_id", "m.patient_id")
      .where("p.user_id", user_id)
      .whereRaw("d.dose_date = CURRENT_DATE")
      .orderBy("d.dose_time");

    // 🔹 Ending Today
    const endingToday = await db("medicines as m")
      .select(
        "m.name as medicine_name",
        "p.name as patient_name"
      )
      .join("patients as p", "p.patient_id", "m.patient_id")
      .where("p.user_id", user_id)
      .whereRaw("m.end_date = CURRENT_DATE")
      .where("m.status", "active");

    res.json({
      activeMedicines,
      todayDoses,
      endingToday,
    });

  } catch (error) {
    console.error("Dashboard API error:", error);
    res.status(500).json({ message: "Failed to load dashboard" });
  }
};
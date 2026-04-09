const db = require("../db");
const admin = require("../config/firebaseAdmin");

async function getPatientId(schedule_id) {
  const result = await db("medicine_schedules as ms")
    .join("medicines as m", "ms.medicine_id", "m.medicine_id")
    .select("m.patient_id")
    .where("ms.schedule_id", schedule_id)
    .first();

  return result?.patient_id;
}

async function sendPushNotification(dose) {
  const patient = await db("medicine_schedules as ms")
    .join("medicines as m", "ms.medicine_id", "m.medicine_id")
    .join("patients as p", "m.patient_id", "p.patient_id")
    .join("users as u", "p.user_id", "u.user_id")
    .select("u.device_token")
    .where("ms.schedule_id", dose.schedule_id)
    .first();

  if (!patient?.device_token) {
    console.log("No device token found");
    return;
  }

  const message = {
    token: patient.device_token,
    notification: {
      title: "Medicine Reminder 💊",
      body: `Time to take your medicine (${dose.dose_time})`,
    },
    android: {
      priority: "high",
    },
  };

  try {
    await admin.messaging().send(message);
    console.log("Push notification sent successfully");
  } catch (error) {
    console.error("FCM send error:", error);
  }
}

module.exports = {
  getPatientId,
  sendPushNotification,
};
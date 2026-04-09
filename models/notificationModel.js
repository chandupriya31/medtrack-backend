const db = require("../db");

const NotificationModel = {
  verifyOwnership: async (dose_log_id, user_id) => {
    return await db("dose_logs as dl")
      .join("medicine_schedules as ms", "dl.schedule_id", "ms.schedule_id")
      .join("medicines as m", "ms.medicine_id", "m.medicine_id")
      .join("patients as p", "m.patient_id", "p.patient_id")
      .where({
        "dl.dose_log_id": dose_log_id,
        "p.user_id": user_id,
      })
      .select("p.patient_id")
      .first();
  },

  create: async ({
    dose_log_id,
    user_id,
    message,
    delivery_type
  }) => {

    const ownership =
      await this.verifyOwnership(dose_log_id, user_id);

    if (!ownership)
      throw new Error("Unauthorized access");

    const inserted = await db("notifications")
      .insert({
        dose_log_id,
        patient_id: ownership.patient_id,
        message,
        delivery_type,
        status: "SENT",
        sent_at: db.fn.now(),
      })
      .returning("*");

    return inserted[0];
  },

  getAllByUser: async (user_id) => {

    return await db("notifications as n")
      .join("patients as p", "n.patient_id", "p.patient_id")
      .where("p.user_id", user_id)
      .select("n.*", "p.name as patient_name")
      .orderBy("n.created_at", "desc");
  },

  updateStatus: async (notification_id, user_id, status) => {

    const notification = await db("notifications as n")
      .join("patients as p", "n.patient_id", "p.patient_id")
      .where({
        "n.notification_id": notification_id,
        "p.user_id": user_id,
      })
      .select("n.*")
      .first();

    if (!notification) return null;

    const updated = await db("notifications")
      .where({ notification_id })
      .update({
        status,
        retry_count:
          status === "FAILED"
            ? notification.retry_count + 1
            : notification.retry_count,
      })
      .returning("*");

    return updated[0];
  }

};

module.exports = NotificationModel;
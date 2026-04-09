const db = require("../db");

const generateIntervalTimes = (startTime, intervalHours) => {
  const times = [];

  let [hours, minutes] = startTime.split(":").map(Number);

  const now = new Date();
  const dateStart = new Date();
  dateStart.setHours(hours);
  dateStart.setMinutes(minutes);
  dateStart.setSeconds(0);

  while (dateStart.getDate() === now.getDate()) {
    const hh = dateStart.getHours().toString().padStart(2, "0");
    const mm = dateStart.getMinutes().toString().padStart(2, "0");

    times.push(`${hh}:${mm}`);

    dateStart.setHours(dateStart.getHours() + intervalHours);
  }

  return times;
};

const generateLogsForSchedule = async (scheduleId, date, trx = db) => {
  const schedule = await trx("medicine_schedules")
    .where({ schedule_id: scheduleId })
    .first();

  if (!schedule) return;

  let times = [];

  if (schedule.frequency === "interval") {
    times = generateIntervalTimes(
      schedule.start_time,
      schedule.interval_hours
    );
  } else {
    const rows = await trx("schedule_times")
      .where({ schedule_id: scheduleId })
      .orderBy("dose_time");

    times = rows.map(r => r.dose_time);
  }

  if (!times.length) return;

  const doseRecords = times.map((t) => ({
    schedule_id: scheduleId,
    dose_date: date,
    dose_time: t,
    status: "PENDING",
  }));

  await trx("dose_logs")
    .insert(doseRecords)
    .onConflict(["schedule_id", "dose_date", "dose_time"])
    .ignore();
};

module.exports = { generateLogsForSchedule };
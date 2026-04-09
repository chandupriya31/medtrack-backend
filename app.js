const express = require("express");
const cors = require("cors");
require("dotenv").config();
require('./cron/remainder');

const admin = require("./config/firebaseAdmin");


const patientRoutes = require("./routes/patientRoute");
const medicineRoutes = require("./routes/medicinesRoute");
const doseRoutes = require("./routes/doseRoute");
const scheduleRoutes = require("./routes/medicineScheduleRoute");
const notificationRoutes = require("./routes/notificationRoute");
const historyRoutes = require("./routes/historyRoute");
const reminderRoutes = require("./routes/remindersRoute");
const dashboardRoutes = require("./routes/dashboardRoute");
const authRoutes = require("./routes/authRoute");
const authenticateToken = require("./middileware/authMiddleware");
const app = express();


app.use(cors());
app.use(express.json());

app.use((req, res, next) => {
  console.log("Incoming request:", req.method, req.url);
  next();
});

const deviceToken = "fs6LklhRR5ez1fT3UisHan:APA91bHQt8obhk_-yCVMo_h7leSf0mQFyD6M2wnHXwp698BB6ujKorg-KGOEqdVuMzPuNmrYU3ZZ6t-hA5HkjpzJkE_MkY8Fwr-o2D9yR0R7p4joPZQS_cQ";

app.get("/api/test-push", async (req, res) => {
  try {
    const response = await admin.messaging().send({
      token: deviceToken,
      notification: {
        title: "Test Notification",
        body: "If you see this, push works!",
      },
      android: {
        priority: "high",
        notification: {
          channelId: "default",
        },
      },
    });

    console.log("Push response:", response);
    res.send("Push sent successfully");
  } catch (error) {
    console.error("Push error:", error);
    res.status(500).send(error.message);
  }
});

app.use("/api/auth", authRoutes);
app.use(authenticateToken)
app.use("/api/patient", patientRoutes);
app.use("/api/medicines", medicineRoutes);
app.use("/api/doses", doseRoutes);
app.use("/api/schedules", scheduleRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/history", historyRoutes);
app.use("/api/reminders", reminderRoutes);
app.use("/api/dashboard", dashboardRoutes);

const PORT = process.env.PORT || 5001;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);

  //   startMedicineCron();
});

module.exports = app;

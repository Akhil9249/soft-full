const express = require("express");
const cors = require("cors");
const morgan = require("morgan");
require("dotenv").config();

const connectDb = require("./config/db");
const { startAttendanceCron } = require("./cron/attendanceCron");

const registerAndLoginRoute = require("./routes/registerAndLoginRoute");
const staffRoutes = require("./routes/staffRoutes");
const internRoutes = require("./routes/internRoutes");
const categoryRoutes = require("./routes/categoryRoutes");
const courseRoutes = require("./routes/courseRoutes");
const courseTypeRoutes = require("./routes/courseTypeRoutes");
const courseDurationRoutes = require("./routes/courseDurationRoutes");
const moduleRoutes = require("./routes/moduleRoutes");
const topicRoutes = require("./routes/topicRoutes");
const batchRoutes = require("./routes/batchRoutes");
const timingRoutes = require("./routes/timingRoutes");
const weeklyScheduleRoutes = require("./routes/weeklyScheduleRoutes");
const pageRoutes = require("./routes/pageRoutes");
const notificationRoutes = require("./routes/notificationRoutes");
const roleRoutes = require("./routes/roleRoutes");
const branchRoutes = require("./routes/branchRoutes");
const daysRoutes = require("./routes/daysRoutes");
const daysCombinationRoutes = require("./routes/daysCombinationRoutes");
const taskRoutes = require("./routes/taskRoutes");
const materialRoutes = require("./routes/materialRoutes");
const internsAttendanceRoutes = require("./routes/internsAttendanceRoutes");
const mentorCardRoutes = require("./routes/mentorCardRoutes");
const leaveRequestRoutes = require("./routes/leaveRequestRoutes");

const errorHandle = require("./middlewares/errorHandle");

const app = express();

// Morgan middleware
app.use(morgan("dev"));

// CORS
const allowedOrigins = [
  "http://localhost:5173",
  "http://localhost:5174",
  process.env.FRONTENT_URI,
];

app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin) return callback(null, true);

      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      } else {
        return callback(new Error("Not allowed by CORS"));
      }
    },
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    credentials: true,
  })
);

// Middleware
app.use(express.json());

// Test route
app.get("/", (req, res) => {
  res.send("Hello from Express on Vercel!");
});

// Routes
app.use("/api", registerAndLoginRoute);

app.use("/api/staff", staffRoutes);
app.use("/api/intern", internRoutes);
app.use("/api/roles", roleRoutes);

app.use("/api/category", categoryRoutes);
app.use("/api/course", courseRoutes);
app.use("/api/course-types", courseTypeRoutes);
app.use("/api/course-durations", courseDurationRoutes);

app.use("/api/module", moduleRoutes);
app.use("/api/topics", topicRoutes);

app.use("/api/batches", batchRoutes);
app.use("/api/timings", timingRoutes);
app.use("/api/weekly-schedules", weeklyScheduleRoutes);

app.use("/api/pages", pageRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/branches", branchRoutes);
app.use("/api/days", daysRoutes);
app.use("/api/days-combinations", daysCombinationRoutes);
app.use("/api/tasks", taskRoutes);
app.use("/api/materials", materialRoutes);
app.use("/api/interns-attendance", internsAttendanceRoutes);
app.use("/api/mentor-card", mentorCardRoutes);
app.use("/api/leave-requests", leaveRequestRoutes);

// Error handler
app.use(errorHandle);

// Start server only AFTER DB connection
const PORT = process.env.PORT || 3000;

const startServer = async () => {
  try {
    // Wait for DB connection
    await connectDb();

    // Start cron after DB connects
    startAttendanceCron();

    app.listen(PORT, () => {
      console.log(`✅ Server running on port ${PORT}`);
    });
  } catch (error) {
    console.error("❌ Server startup failed:", error);
  }
};

startServer();
// routes/internsAttendanceRoutes.js
const express = require("express");
const router = express.Router();
const {
  addInternsAttendance,
  getInternsAttendance,
  getInternsAttendanceById,
  updateInternsAttendance,
  deleteInternsAttendance,
  getInternsAttendanceByDateRange,
  getInternsAttendanceSummary,
  createDailyAttendanceForAllInterns,
  updateSingleInternAttendance,
  getAttendanceSummaryReport,
  getInternsByAttendanceDate,
  getMentorInterns,
  getMentorBatches,
  getInternsAttendanceByMonth,
  getMyAttendance
} = require("../controllers/attendance/internsAttendanceController");

const { checkAuth } = require("../middlewares/checkAuth");
const { checkPermission } = require("../middlewares/checkPermission");

// Async wrapper to handle promises
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

// -------------------- INTERNS ATTENDANCE ROUTES --------------------

// GET /api/interns-attendance/my-attendance - Get logged-in intern's attendance records
router.get("/my-attendance", checkAuth, asyncHandler(getMyAttendance));

// GET /api/interns-attendance - Get all interns attendance with pagination and filters
router.get("/", checkAuth, checkPermission('attendanceManagement', 'viewAttendance'), asyncHandler(getInternsAttendance));

// GET /api/interns-attendance/interns-by-date - Get interns based on attendance collection for a specific date
router.get("/interns-by-date", checkAuth, checkPermission('attendanceManagement', 'viewAttendance'), asyncHandler(getInternsByAttendanceDate));

// GET /api/interns-attendance/summary-report - Get detailed attendance summary report
router.get("/summary-report", checkAuth, checkPermission('attendanceManagement', 'viewAttendance'), asyncHandler(getAttendanceSummaryReport));

// GET /api/interns-attendance/date-range - Get interns attendance by date range
router.get("/date-range/range", checkAuth, checkPermission('attendanceManagement', 'viewAttendance'), asyncHandler(getInternsAttendanceByDateRange));

// GET /api/interns-attendance/summary - Get interns attendance summary
router.get("/summary/overview", checkAuth, checkPermission('attendanceManagement', 'viewAttendance'), asyncHandler(getInternsAttendanceSummary));

// GET /api/interns-attendance/mentor-interns/:mentorId? - Get interns for a mentor based on WeeklySchedule
router.get("/mentor-interns/:mentorId?", checkAuth, checkPermission('attendanceManagement', 'viewAttendance'), asyncHandler(getMentorInterns));

// GET /api/interns-attendance/mentor-batches/:mentorId? - Get batches for a mentor based on WeeklySchedule
router.get("/mentor-batches/:mentorId?", checkAuth, checkPermission('attendanceManagement', 'viewAttendance'), asyncHandler(getMentorBatches));

// GET /api/interns-attendance/month - Get all interns attendance for a specific month
router.get("/month", checkAuth, checkPermission('attendanceManagement', 'viewAttendance'), asyncHandler(getInternsAttendanceByMonth));

// GET /api/interns-attendance/:id - Get single interns attendance by ID
router.get("/:id", checkAuth, checkPermission('attendanceManagement', 'viewAttendance'), asyncHandler(getInternsAttendanceById));

// POST /api/interns-attendance - Create new interns attendance
router.post("/", checkAuth, checkPermission('attendanceManagement', 'addAttendance'), asyncHandler(addInternsAttendance));

// PUT /api/interns-attendance/update-single - Update single intern attendance
router.put("/update-single", checkAuth, checkPermission('attendanceManagement', 'editAttendance'), asyncHandler(updateSingleInternAttendance));

// PUT /api/interns-attendance/:id - Update interns attendance
router.put("/:id", checkAuth, checkPermission('attendanceManagement', 'editAttendance'), asyncHandler(updateInternsAttendance));

// DELETE /api/interns-attendance/:id - Delete interns attendance (soft delete)
router.delete("/:id", checkAuth, checkPermission('attendanceManagement', 'deleteAttendance'), asyncHandler(deleteInternsAttendance));

// POST /api/interns-attendance/create-daily - Create daily attendance for all ongoing interns
router.post("/create-daily", checkAuth, checkPermission('attendanceManagement', 'addAttendance'), asyncHandler(createDailyAttendanceForAllInterns));

module.exports = router;








module.exports = router;

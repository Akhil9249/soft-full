// routes/weeklyScheduleRoutes.js
const express = require("express");
const router = express.Router();
const weeklyScheduleController = require("../controllers/schedule/weeklyScheduleController");
const { checkAuth } = require("../middlewares/checkAuth");
const { checkPermission } = require("../middlewares/checkPermission");

// Async wrapper to handle promises
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

// Basic CRUD operations
router.get("/mentors-batches", checkAuth, checkPermission('weeklySchedule', 'viewSchedule'), asyncHandler(weeklyScheduleController.getAllMentorsWithBatches));
router.get("/", checkAuth, checkPermission('weeklySchedule', 'viewSchedule'), asyncHandler(weeklyScheduleController.getWeeklySchedules));
router.post("/", checkAuth, checkPermission('weeklySchedule', 'addSchedule'), asyncHandler(weeklyScheduleController.createWeeklySchedule));
router.get("/my-schedule", checkAuth, asyncHandler(weeklyScheduleController.getWeeklyScheduleByInternId));
router.get("/intern/:userId", checkAuth, (req, res, next) => {
  if (req.params.userId === req.userId) {
    return next();
  }
  checkPermission('weeklySchedule', 'viewSchedule')(req, res, next);
}, asyncHandler(weeklyScheduleController.getWeeklyScheduleByInternId));
router.get("/:id", checkAuth, checkPermission('weeklySchedule', 'viewSchedule'), asyncHandler(weeklyScheduleController.getWeeklyScheduleById));
router.put("/:id", checkAuth, checkPermission('weeklySchedule', 'editSchedule'), asyncHandler(weeklyScheduleController.updateWeeklySchedule));
router.delete("/:id", checkAuth, checkPermission('weeklySchedule', 'deleteSchedule'), asyncHandler(weeklyScheduleController.deleteWeeklySchedule));

// Advanced operations for managing schedule structure
router.post("/:id/time", checkAuth, checkPermission('weeklySchedule', 'editSchedule'), asyncHandler(weeklyScheduleController.addTimeToSchedule));
router.post("/:id/sub-details", checkAuth, checkPermission('weeklySchedule', 'editSchedule'), asyncHandler(weeklyScheduleController.addSubDetailsToTime));
router.post("/:id/batch", checkAuth, checkPermission('weeklySchedule', 'editSchedule'), asyncHandler(weeklyScheduleController.addBatchToSubDetails));
router.delete("/:id/batch", checkAuth, checkPermission('weeklySchedule', 'editSchedule'), asyncHandler(weeklyScheduleController.removeBatchFromSubDetails));
router.put("/:id/subject", checkAuth, checkPermission('weeklySchedule', 'editSchedule'), asyncHandler(weeklyScheduleController.updateSubjectInSubDetails));
router.put("/:id/note", checkAuth, checkPermission('weeklySchedule', 'editSchedule'), asyncHandler(weeklyScheduleController.updateNoteInSubDetails));

module.exports = router;

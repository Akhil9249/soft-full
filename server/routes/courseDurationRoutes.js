// routes/courseDurationRoutes.js
const express = require("express");
const router = express.Router();
const courseDurationController = require("../controllers/course-management/courseDurationController");
const { checkAuth } = require("../middlewares/checkAuth");
const { checkPermission } = require("../middlewares/checkPermission");

router.post("/", checkAuth, checkPermission('courseManagement', 'addCourse'), courseDurationController.createCourseDuration);
router.get("/", checkAuth, checkPermission('courseManagement', 'viewCourse'), courseDurationController.getCourseDurations);
router.put("/:id", checkAuth, checkPermission('courseManagement', 'editCourse'), courseDurationController.updateCourseDuration);
router.delete("/:id", checkAuth, checkPermission('courseManagement', 'deleteCourse'), courseDurationController.deleteCourseDuration);

module.exports = router;

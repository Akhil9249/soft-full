// routes/courseTypeRoutes.js
const express = require("express");
const router = express.Router();
const courseTypeController = require("../controllers/course-management/courseTypeController");
const { checkAuth } = require("../middlewares/checkAuth");
const { checkPermission } = require("../middlewares/checkPermission");

router.post("/", checkAuth, checkPermission('courseManagement', 'addCourse'), courseTypeController.createCourseType);
router.get("/", checkAuth, checkPermission('courseManagement', 'viewCourse'), courseTypeController.getCourseTypes);
router.put("/:id", checkAuth, checkPermission('courseManagement', 'editCourse'), courseTypeController.updateCourseType);
router.delete("/:id", checkAuth, checkPermission('courseManagement', 'deleteCourse'), courseTypeController.deleteCourseType);

module.exports = router;

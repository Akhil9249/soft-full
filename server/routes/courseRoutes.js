// routes/courseRoutes.js
const express = require("express");
const router = express.Router();
const courseController = require("../controllers/course-management/courseController");
const { checkAuth } = require("../middlewares/checkAuth");
const { checkPermission } = require("../middlewares/checkPermission");

router.post("/",checkAuth, checkPermission('courseManagement', 'addCourse'), courseController.createCourse);
router.get("/",checkAuth, checkPermission('courseManagement', 'viewCourse'), courseController.getCourses);
router.get("/:id",checkAuth, checkPermission('courseManagement', 'viewCourse'), courseController.getCourseById);
router.put("/:id",checkAuth, checkPermission('courseManagement', 'editCourse'), courseController.updateCourse);
router.delete("/:id",checkAuth, checkPermission('courseManagement', 'deleteCourse'), courseController.deleteCourse);

module.exports = router;

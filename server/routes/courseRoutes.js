// routes/courseRoutes.js
const express = require("express");
const router = express.Router();
const courseController = require("../controllers/course-management/courseController");
const { checkAuth } = require("../middlewares/checkAuth");
const { checkPermission } = require("../middlewares/checkPermission");
const { upload } = require("../uploads/multer");

router.post("/",checkAuth, checkPermission('courseManagement', 'addCourse'), upload.single('syllabus'), courseController.createCourse);
router.get("/",checkAuth, checkPermission('courseManagement', 'viewCourse'), courseController.getCourses);
router.get("/:id",checkAuth, checkPermission('courseManagement', 'viewCourse'), courseController.getCourseById);
router.get("/:id/syllabus/download", checkAuth, checkPermission('courseManagement', 'viewCourse'), courseController.downloadSyllabus);
router.put("/:id",checkAuth, checkPermission('courseManagement', 'editCourse'), upload.single('syllabus'), courseController.updateCourse);
router.delete("/:id",checkAuth, checkPermission('courseManagement', 'deleteCourse'), courseController.deleteCourse);

module.exports = router;

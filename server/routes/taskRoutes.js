// routes/taskRoutes.js
const express = require("express");
const router = express.Router();
const taskController = require("../controllers/task-management/taskController");
const { upload } = require("../uploads/multer");
const { checkAuth } = require("../middlewares/checkAuth");
const { checkPermission } = require("../middlewares/checkPermission");

// Basic CRUD operations
router.get("/",checkAuth, checkPermission('taskManagement', 'viewTask'), taskController.getTasks);
router.post("/",checkAuth, checkPermission('taskManagement', 'addTask'), upload.single('attachments'), taskController.createTask);
router.get("/:id",checkAuth, checkPermission('taskManagement', 'viewTask'), taskController.getTaskById);
router.put("/:id",checkAuth, checkPermission('taskManagement', 'editTask'), upload.single('attachments'), taskController.updateTask);
router.delete("/:id",checkAuth, checkPermission('taskManagement', 'deleteTask'), taskController.deleteTask);

// Additional task operations
router.get("/batch/:batchName",checkAuth, checkPermission('taskManagement', 'viewTask'), taskController.getTasksByBatch);
router.get("/mentor/:mentorName",checkAuth, checkPermission('taskManagement', 'viewTask'), taskController.getTasksByMentor);
router.get("/status/:status",checkAuth, checkPermission('taskManagement', 'viewTask'), taskController.getTasksByStatus);
router.patch("/:id/status",checkAuth, checkPermission('taskManagement', 'updateTaskStatus'), taskController.updateTaskStatus);
router.patch("/:id/marks",checkAuth, checkPermission('taskManagement', 'updateTaskMarks'), taskController.updateTaskMarks);

module.exports = router;

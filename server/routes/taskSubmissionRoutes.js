const express = require("express");
const router = express.Router();
const taskSubmissionController = require("../controllers/task-management/taskSubmissionController");
const { upload } = require("../uploads/multer");
const { checkAuth } = require("../middlewares/checkAuth");
const { checkPermission } = require("../middlewares/checkPermission");

// Intern actions (Submitting and viewing their own submissions)
router.post("/", checkAuth, upload.array('attachments', 10), taskSubmissionController.createSubmission);
router.get("/my-submissions", checkAuth, taskSubmissionController.getMySubmissions);

// Mentor/Admin actions (Viewing submissions for a specific task and grading)
router.get("/task/:taskId", checkAuth, checkPermission('taskManagement', 'viewTask'), taskSubmissionController.getTaskSubmissions);
router.get("/:id", checkAuth, taskSubmissionController.getSubmissionById);
router.patch("/:id/grade", checkAuth, checkPermission('taskManagement', 'updateTaskMarks'), taskSubmissionController.gradeSubmission);
router.get("/:id/download", checkAuth, taskSubmissionController.downloadSubmissionAttachment);

module.exports = router;

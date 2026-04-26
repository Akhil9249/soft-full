// routes/staffRoutes.js
const express = require("express");
const router = express.Router();
const staffController = require("../controllers/administration/staffController");
const { upload } = require("../uploads/multer");
const { checkAuth } = require("../middlewares/checkAuth");
const { checkPermission } = require("../middlewares/checkPermission");

// Routes
router.get("/",checkAuth, checkPermission('mentorManagement', 'viewMentor'), staffController.getStaff); // Get all staff
router.get("/all", checkAuth, checkPermission('mentorManagement', 'viewMentor'), staffController.getAllStaff); // Get all staff without pagination
router.get("/active/all", checkAuth, checkPermission('mentorManagement', 'viewMentor'), staffController.getAllActiveStaff); // Get all active staff without pagination
router.post("/",checkAuth, checkPermission('mentorManagement', 'addMentor'), upload.fields([{ name: 'photo', maxCount: 1 },{ name: 'resume', maxCount: 1 }]), staffController.addStaff); // Create staff
router.get("/:id",checkAuth, checkPermission('mentorManagement', 'viewMentor'), staffController.getStaffById); // Get single staff
router.put("/:id",checkAuth, checkPermission('mentorManagement', 'editMentor'), upload.fields([{ name: 'photo', maxCount: 1 },{ name: 'resume', maxCount: 1 }]), staffController.updateStaff); // Update staff
router.delete("/:id",checkAuth, checkPermission('mentorManagement', 'deleteMentor'), staffController.deleteStaff); // Delete staff

module.exports = router;

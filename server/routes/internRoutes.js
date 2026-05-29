// routes/internRoutes.js
const express = require("express");
const router = express.Router();
const internController = require("../controllers/administration/internController");
const {checkAuth }= require("../middlewares/checkAuth");
const { upload } = require("../uploads/multer");
const { checkPermission } = require("../middlewares/checkPermission");

router.get("/", checkAuth, checkPermission('studentManagement', 'viewStudent'), internController.getInterns);
router.get("/search", checkAuth, checkPermission('studentManagement', 'viewStudent'), internController.searchInterns);
router.get("/details", checkAuth, checkPermission('studentManagement', 'viewStudent'), internController.getInternDetails);
router.get("/:id", checkAuth, checkPermission('studentManagement', 'viewStudent'), internController.getInternById);
router.get("/:id/resume/download", checkAuth, checkPermission('studentManagement', 'viewStudent'), internController.downloadResume);
router.post("/", checkAuth, checkPermission('studentManagement', 'addStudent'), upload.fields([{ name: 'photo', maxCount: 1 },{ name: 'resume', maxCount: 1 }]), internController.addIntern);
router.put("/:id", checkAuth, checkPermission('studentManagement', 'editStudent'), upload.fields([{ name: 'photo', maxCount: 1 },{ name: 'resume', maxCount: 1 }]), internController.updateIntern);
router.delete("/:id", checkAuth, checkPermission('studentManagement', 'deleteStudent'), internController.deleteIntern);

module.exports = router;
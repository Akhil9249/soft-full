// routes/moduleRoutes.js
const express = require("express");
const router = express.Router();
const moduleController = require("../controllers/syllabus-management/moduleController");
const { upload } = require("../uploads/multer");
const { checkAuth } = require("../middlewares/checkAuth");
const { checkPermission } = require("../middlewares/checkPermission");
        
router.get("/",checkAuth, checkPermission('moduleManagement', 'viewModule'), moduleController.getModules);
router.post("/",checkAuth, checkPermission('moduleManagement', 'addModule'), upload.single('moduleImage'), moduleController.createModule);
router.get("/:id",checkAuth, checkPermission('moduleManagement', 'viewModule'), moduleController.getModuleById);
router.put("/:id",checkAuth, checkPermission('moduleManagement', 'editModule'), upload.single('moduleImage'), moduleController.updateModule);
router.delete("/:id",checkAuth, checkPermission('moduleManagement', 'deleteModule'), moduleController.deleteModule);
router.delete("/:moduleId/topics/:topicId",checkAuth, checkPermission('moduleManagement', 'deleteModule'), moduleController.removeTopicFromModule);

module.exports = router;

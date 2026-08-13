// routes/batchRoutes.js
const express = require("express");
const router = express.Router();
const batchController = require("../controllers/schedule/batchController");
const { upload } = require("../uploads/multer");
const { checkAuth } = require("../middlewares/checkAuth");
const { checkPermission } = require("../middlewares/checkPermission");

router.get("/", checkAuth, checkPermission('batchManagement', 'viewBatch'), batchController.getBatches);
router.get("/all", checkAuth, checkPermission('batchManagement', 'viewBatch'), batchController.getAllBatches);
router.get("/:id", checkAuth, checkPermission('batchManagement', 'viewBatch'), batchController.getBatchById);
router.post("/", checkAuth, checkPermission('batchManagement', 'addBatch'), batchController.createBatch);
router.put("/:id", checkAuth, checkPermission('batchManagement', 'editBatch'), batchController.updateBatch);
router.delete("/:id", checkAuth, checkPermission('batchManagement', 'deleteBatch'), batchController.deleteBatch);

// Intern routes
router.post("/:id/interns", checkAuth, checkPermission('batchManagement', 'editBatch'), batchController.addIntern); // add intern
router.delete("/:id/interns/:internId", checkAuth, checkPermission('batchManagement', 'editBatch'), batchController.removeIntern); // remove intern

module.exports = router;

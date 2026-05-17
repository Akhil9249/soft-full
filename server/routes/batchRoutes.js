// routes/batchRoutes.js
const express = require("express");
const router = express.Router();
const batchController = require("../controllers/schedule/batchController");
const { upload } = require("../uploads/multer");
const { checkAuth } = require("../middlewares/checkAuth");

router.get("/", checkAuth, batchController.getBatches);
router.get("/all", checkAuth, batchController.getAllBatches);
router.get("/:id", checkAuth, batchController.getBatchById);
router.post("/", checkAuth, batchController.createBatch);
router.put("/:id", checkAuth, batchController.updateBatch);
router.delete("/:id", checkAuth, batchController.deleteBatch);

// Intern routes
router.post("/:id/interns", checkAuth, batchController.addIntern); // add intern
router.delete("/:id/interns/:internId", checkAuth, batchController.removeIntern); // remove intern

module.exports = router;

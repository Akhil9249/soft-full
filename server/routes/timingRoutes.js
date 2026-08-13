// routes/timingRoutes.js
const express = require("express");
const router = express.Router();
const timingController = require("../controllers/schedule/timingController");
const { checkAuth } = require("../middlewares/checkAuth");
const { checkPermission } = require("../middlewares/checkPermission");

router.post("/", checkAuth, checkPermission('scheduleTiming', 'addTiming'), timingController.createTiming);
router.get("/", checkAuth, checkPermission('scheduleTiming', 'viewTiming'), timingController.getTimings);
router.get("/:id", checkAuth, checkPermission('scheduleTiming', 'viewTiming'), timingController.getTimingById);
router.put("/:id", checkAuth, checkPermission('scheduleTiming', 'editTiming'), timingController.updateTiming);
router.delete("/:id", checkAuth, checkPermission('scheduleTiming', 'deleteTiming'), timingController.deleteTiming);

module.exports = router;

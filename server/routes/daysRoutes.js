// routes/daysRoutes.js
const express = require("express");
const router = express.Router();
const daysController = require("../controllers/settings/daysController");

// Day routes
router.get("/", daysController.getDays);
router.post("/", daysController.createDay);
router.get("/:id", daysController.getDayById);
router.put("/:id", daysController.updateDay);
router.delete("/:id", daysController.deleteDay);
router.patch("/:id/toggle-status", daysController.toggleDayStatus);

module.exports = router;

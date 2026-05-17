// routes/daysCombinationRoutes.js
const express = require("express");
const router = express.Router();
const daysCombinationController = require("../controllers/settings/daysCombinationController");

// Day Combination routes
router.get("/", daysCombinationController.getDayCombinations);
router.post("/", daysCombinationController.createDayCombination);
router.get("/:id", daysCombinationController.getDayCombinationById);
router.put("/:id", daysCombinationController.updateDayCombination);
router.delete("/:id", daysCombinationController.deleteDayCombination);
router.patch("/:id/toggle-status", daysCombinationController.toggleDayCombinationStatus);

module.exports = router;

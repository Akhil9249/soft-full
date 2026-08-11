// routes/daysCombinationRoutes.js
const express = require("express");
const router = express.Router();
const daysCombinationController = require("../controllers/settings/daysCombinationController");
const { checkAuth } = require("../middlewares/checkAuth");

// Day Combination routes
router.get("/", checkAuth, daysCombinationController.getDayCombinations);
router.post("/", daysCombinationController.createDayCombination);
router.get("/:id", daysCombinationController.getDayCombinationById);
router.put("/:id", daysCombinationController.updateDayCombination);
router.delete("/:id", daysCombinationController.deleteDayCombination);
router.patch("/:id/toggle-status", daysCombinationController.toggleDayCombinationStatus);

module.exports = router;

// routes/branchRoutes.js
const express = require("express");
const router = express.Router();
const branchController = require("../controllers/settings/branchController");
const { checkAuth } = require("../middlewares/checkAuth");
const { checkPermission } = require("../middlewares/checkPermission");

// Branch routes
router.get("/", checkAuth, checkPermission('branchManagement', 'viewBranch'), branchController.getBranches);
router.post("/", checkAuth, checkPermission('branchManagement', 'addBranch'), branchController.createBranch);
router.get("/:id", checkAuth, checkPermission('branchManagement', 'viewBranch'), branchController.getBranchById);
router.put("/:id", checkAuth, checkPermission('branchManagement', 'editBranch'), branchController.updateBranch);
router.delete("/:id", checkAuth, checkPermission('branchManagement', 'deleteBranch'), branchController.deleteBranch);
router.patch("/:id/toggle-status", checkAuth, checkPermission('branchManagement', 'editBranch'), branchController.toggleBranchStatus);
router.patch("/:id/days",  branchController.updateBranchDays);

module.exports = router;

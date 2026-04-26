// routes/roleRoutes.js
const express = require("express");
const router = express.Router();
const roleController = require("../controllers/administration/roleController");
const { checkAuth } = require("../middlewares/checkAuth");

// Role CRUD operations
router.post("/",checkAuth, roleController.createRole);
router.get("/",checkAuth, roleController.getRoles);
router.get("/all",checkAuth, roleController.getAllRoles);
router.get("/:id",checkAuth, roleController.getRoleById);
router.put("/:id",checkAuth, roleController.updateRole);
router.delete("/:id",checkAuth, roleController.deleteRole);

// Role-specific operations
router.get("/role/:roleName",checkAuth, roleController.getRoleByRoleName);
router.get("/permissions/:roleName",checkAuth, roleController.getRolePermissions);

module.exports = router;

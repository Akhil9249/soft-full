// routes/userRoutes.js
const express = require("express");
const router = express.Router();
const userController = require("../controllers/administration/userController");
const { checkAuth } = require("../middlewares/checkAuth");

// User CRUD and status operations
router.get("/", checkAuth, userController.getUser);
router.get("/profile", checkAuth, userController.getUserById);
router.put("/status/:id", checkAuth, userController.toggleUserStatus);
router.put("/:id", checkAuth, userController.updateUser);
router.delete("/:id", checkAuth, userController.deleteUser);

module.exports = router;

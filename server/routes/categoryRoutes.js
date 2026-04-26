// routes/categoryRoutes.js
const express = require("express");
const router = express.Router();
const categoryController = require("../controllers/course-management/categoryController");
const { checkAuth } = require("../middlewares/checkAuth");
const { checkPermission } = require("../middlewares/checkPermission");

router.get("/",checkAuth, checkPermission('categoryManagement', 'viewCategory'), categoryController.getCategories);
router.post("/",checkAuth, checkPermission('categoryManagement', 'addCategory'), categoryController.createCategory);
router.get("/:id",checkAuth, checkPermission('categoryManagement', 'viewCategory'), categoryController.getCategoryById);
router.put("/:id",checkAuth, checkPermission('categoryManagement', 'editCategory'), categoryController.updateCategory);
router.delete("/:id",checkAuth, checkPermission('categoryManagement', 'deleteCategory'), categoryController.deleteCategory);

module.exports = router;

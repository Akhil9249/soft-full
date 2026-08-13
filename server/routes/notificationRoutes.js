const express = require('express');
const router = express.Router();
const {
  createNotification,
  getNotifications,
  getNotificationById,
  updateNotification,
  deleteNotification
} = require('../controllers/settings/notificationController');
const { checkAuth } = require('../middlewares/checkAuth');
const { checkPermission } = require('../middlewares/checkPermission');

// Async wrapper to handle promises
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

// Create notification
router.post("/", checkAuth, checkPermission('notificationManagement', 'addNotification'), asyncHandler(createNotification));

// Get all notifications
router.get("/", checkAuth, checkPermission('notificationManagement', 'viewNotification'), asyncHandler(getNotifications));

// Get notification by ID
router.get("/:id", checkAuth, checkPermission('notificationManagement', 'viewNotification'), asyncHandler(getNotificationById));

// Update notification
router.put("/:id", checkAuth, checkPermission('notificationManagement', 'editNotification'), asyncHandler(updateNotification));

// Delete notification (soft delete)
router.delete("/:id", checkAuth, checkPermission('notificationManagement', 'deleteNotification'), asyncHandler(deleteNotification));

module.exports = router;
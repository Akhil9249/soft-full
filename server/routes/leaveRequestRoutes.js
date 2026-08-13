const express = require('express');
const router = express.Router();
const {
  createLeaveRequest,
  getMyLeaveRequests,
  getAllLeaveRequests,
  updateLeaveRequestStatus,
} = require('../controllers/attendance/leaveRequestController');
const { checkAuth } = require('../middlewares/checkAuth');
const { checkPermission } = require('../middlewares/checkPermission');

// User routes
router.post('/', checkAuth, createLeaveRequest);
router.get('/my', checkAuth, getMyLeaveRequests);

// Admin/Staff routes
router.get('/all', checkAuth, checkPermission('leaveRequestManagement', 'viewLeaveRequest'), getAllLeaveRequests);
router.patch('/:id/status', checkAuth, checkPermission('leaveRequestManagement', 'editLeaveRequest'), updateLeaveRequestStatus);

module.exports = router;

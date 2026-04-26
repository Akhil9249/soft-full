const express = require('express');
const router = express.Router();
const {
  createLeaveRequest,
  getMyLeaveRequests,
  getAllLeaveRequests,
  updateLeaveRequestStatus,
} = require('../controllers/attendance/leaveRequestController');
const { checkAuth } = require('../middlewares/checkAuth');

// User routes
router.post('/', checkAuth, createLeaveRequest);
router.get('/my', checkAuth, getMyLeaveRequests);

// Admin/Staff routes
router.get('/all', checkAuth, getAllLeaveRequests);
router.patch('/:id/status', checkAuth, updateLeaveRequestStatus);

module.exports = router;

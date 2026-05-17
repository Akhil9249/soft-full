const LeaveRequest = require("../../models/attendance/leaveRequestModal");
const mongoose = require("mongoose");

// @desc    Create a new leave request
// @route   POST /api/leave-requests
// @access  Private
const createLeaveRequest = async (req, res) => {
  try {
    const { leaveType, startDate, endDate, reason, attachments } = req.body;
    const userId = req.userId; // From checkAuth middleware

    if (!leaveType || !startDate || !endDate || !reason) {
      return res.status(400).json({ message: "Please provide all required fields" });
    }

    // Calculate total days
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffTime = Math.abs(end - start);
    const totalDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;

    const leaveRequest = await LeaveRequest.create({
      user: userId,
      leaveType,
      startDate,
      endDate,
      totalDays,
      reason,
      attachments,
    });

    res.status(201).json({
      success: true,
      data: leaveRequest,
      message: "Leave request submitted successfully",
    });
  } catch (error) {
    res.status(500).json({ message: error.message || "Server Error" });
  }
};

// @desc    Get logged in user's leave requests
// @route   GET /api/leave-requests/my
// @access  Private
const getMyLeaveRequests = async (req, res) => {
  try {
    const leaveRequests = await LeaveRequest.find({ user: req.userId }).sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: leaveRequests.length,
      data: leaveRequests,
    });
  } catch (error) {
    res.status(500).json({ message: error.message || "Server Error" });
  }
};

// @desc    Get all leave requests (Admin/Staff only)
// @route   GET /api/leave-requests
// @access  Private/Admin
const getAllLeaveRequests = async (req, res) => {
  try {
    const leaveRequests = await LeaveRequest.find()
      .populate("user", "name email fullName")
      .populate("reviewedBy", "name fullName")
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: leaveRequests.length,
      data: leaveRequests,
    });
  } catch (error) {
    res.status(500).json({ message: error.message || "Server Error" });
  }
};

// @desc    Update leave request status (Approve/Reject)
// @route   PATCH /api/leave-requests/:id/status
// @access  Private/Admin
const updateLeaveRequestStatus = async (req, res) => {
  try {
    const { status, rejectionReason } = req.body;
    const leaveRequestId = req.params.id;
    const reviewerId = req.userId;

    if (!["APPROVED", "REJECTED"].includes(status)) {
      return res.status(400).json({ message: "Invalid status. Use APPROVED or REJECTED" });
    }

    const leaveRequest = await LeaveRequest.findById(leaveRequestId);

    if (!leaveRequest) {
      return res.status(404).json({ message: "Leave request not found" });
    }

    leaveRequest.status = status;
    leaveRequest.reviewedBy = reviewerId;
    leaveRequest.reviewedAt = Date.now();
    
    if (status === "REJECTED" && rejectionReason) {
      leaveRequest.rejectionReason = rejectionReason;
    }

    await leaveRequest.save();

    res.status(200).json({
      success: true,
      data: leaveRequest,
      message: `Leave request ${status.toLowerCase()} successfully`,
    });
  } catch (error) {
    res.status(500).json({ message: error.message || "Server Error" });
  }
};

module.exports = {
  createLeaveRequest,
  getMyLeaveRequests,
  getAllLeaveRequests,
  updateLeaveRequestStatus,
};

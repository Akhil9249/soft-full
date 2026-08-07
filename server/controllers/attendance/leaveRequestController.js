const LeaveRequest = require("../../models/attendance/leaveRequestModal");
const { Staff } = require("../../models/administration/staffModel");
const Intern = require("../../models/administration/internModel");
const { User } = require("../../models/administration/userModel");
const mongoose = require("mongoose");

// @desc    Create a new leave request
// @route   POST /api/leave-requests
// @access  Private
const createLeaveRequest = async (req, res) => {
  try {
    const { leaveDurationType, leaveType, date, startDate, endDate, reason, attachments } = req.body;
    const userId = req.userId; // From checkAuth middleware

    if (!leaveType) {
      return res.status(400).json({ message: "Please provide leave type" });
    }
    if (!reason) {
      return res.status(400).json({ message: "Please provide reason" });
    }

    const durationType = leaveDurationType || "SINGLE";
    let savedDate = null;
    let savedStartDate = null;
    let savedEndDate = null;
    let totalDays = 0;

    if (durationType === "SINGLE") {
      if (!date) {
        return res.status(400).json({ message: "Please provide leave date" });
      }
      savedDate = new Date(date);
      totalDays = 1;
    } else {
      if (!startDate) {
        return res.status(400).json({ message: "Please provide start date" });
      }
      if (!endDate) {
        return res.status(400).json({ message: "Please provide end date" });
      }
      savedStartDate = new Date(startDate);
      savedEndDate = new Date(endDate);
      
      if (savedStartDate > savedEndDate) {
        return res.status(400).json({ message: "Start date cannot be after end date" });
      }

      const diffTime = Math.abs(savedEndDate - savedStartDate);
      totalDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
    }

    // Resolve branch and user model type dynamically
    let userBranch = null;
    let userModel = "User";

    // 1. Check if logged-in user is an Intern
    const intern = await Intern.findById(userId);
    if (intern) {
      userModel = "Intern";
      userBranch = intern.branch;
    } else {
      // 2. Check if logged-in user is a Staff
      const staff = await Staff.findById(userId);
      if (staff) {
        userModel = "Staff";
        userBranch = staff.branch;
      } else {
        // 3. Fallback check for User/Admin
        const user = await User.findById(userId);
        if (user) {
          userModel = "User";
          userBranch = user.branch;
        }
      }
    }

    if (!userBranch) {
      return res.status(400).json({ message: "No branch associated with your user account. Please contact administrator." });
    }

    const leaveRequest = await LeaveRequest.create({
      user: userId,
      userModel,
      branch: userBranch,
      leaveDurationType: durationType,
      leaveType,
      date: savedDate,
      startDate: savedStartDate,
      endDate: savedEndDate,
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
    const page = req.query.page ? parseInt(req.query.page) : null;
    const limit = req.query.limit ? parseInt(req.query.limit) : null;

    if (page && limit) {
      const skip = (page - 1) * limit;
      const totalCount = await LeaveRequest.countDocuments({ user: req.userId });
      const totalPages = Math.ceil(totalCount / limit);

      const leaveRequests = await LeaveRequest.find({ user: req.userId })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit);

      return res.status(200).json({
        success: true,
        count: leaveRequests.length,
        data: leaveRequests,
        pagination: {
          currentPage: page,
          totalPages,
          totalCount,
          hasNextPage: page < totalPages,
          hasPrevPage: page > 1,
          limit
        }
      });
    } else {
      const leaveRequests = await LeaveRequest.find({ user: req.userId }).sort({ createdAt: -1 });
      return res.status(200).json({
        success: true,
        count: leaveRequests.length,
        data: leaveRequests,
      });
    }
  } catch (error) {
    res.status(500).json({ message: error.message || "Server Error" });
  }
};

// @desc    Get all leave requests (Admin/Staff only)
// @route   GET /api/leave-requests
// @access  Private/Admin
const getAllLeaveRequests = async (req, res) => {
  try {
    // Pagination parameters
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 5;
    const skip = (page - 1) * limit;

    // Search and filter parameters
    const search = req.query.search || '';
    const branch = req.query.branch || '';
    const month = req.query.month || '';
    const year = req.query.year || '';
    const date = req.query.date || '';

    // Build query object
    let query = {};

    // Branch filter
    if (branch && mongoose.Types.ObjectId.isValid(branch)) {
      query.branch = branch;
    }

    // Date range filter for startDate/endDate (specific date or month/year)
    if (date) {
      const queryDate = new Date(date);
      const startOfDay = new Date(Date.UTC(queryDate.getUTCFullYear(), queryDate.getUTCMonth(), queryDate.getUTCDate(), 0, 0, 0));
      const endOfDay = new Date(Date.UTC(queryDate.getUTCFullYear(), queryDate.getUTCMonth(), queryDate.getUTCDate(), 23, 59, 59, 999));
      query.$or = [
        { date: { $gte: startOfDay, $lte: endOfDay } },
        { startDate: { $lte: endOfDay }, endDate: { $gte: startOfDay } }
      ];
    } else if (year) {
      const startYear = parseInt(year);
      let startDateVal, endDateVal;
      if (month) {
        const startMonth = parseInt(month) - 1; // JS months are 0-11
        startDateVal = new Date(Date.UTC(startYear, startMonth, 1, 0, 0, 0));
        endDateVal = new Date(Date.UTC(startYear, startMonth + 1, 1, 0, 0, 0));
      } else {
        startDateVal = new Date(Date.UTC(startYear, 0, 1, 0, 0, 0));
        endDateVal = new Date(Date.UTC(startYear + 1, 0, 1, 0, 0, 0));
      }
      query.$or = [
        { date: { $gte: startDateVal, $lt: endDateVal } },
        { startDate: { $gte: startDateVal, $lt: endDateVal } }
      ];
    }

    // User details filter (search)
    if (search) {
      const searchRegex = new RegExp(search, 'i');
      const queries = [
        Intern.find({
          $or: [
            { fullName: { $regex: searchRegex } },
            { email: { $regex: searchRegex } },
            { officialEmail: { $regex: searchRegex } },
            { batch: { $regex: searchRegex } }
          ]
        }).select('_id').then(res => res.map(d => d._id.toString())),
        Staff.find({
          $or: [
            { fullName: { $regex: searchRegex } },
            { email: { $regex: searchRegex } },
            { officialEmail: { $regex: searchRegex } }
          ]
        }).select('_id').then(res => res.map(d => d._id.toString())),
        User.find({
          $or: [
            { name: { $regex: searchRegex } },
            { email: { $regex: searchRegex } }
          ]
        }).select('_id').then(res => res.map(d => d._id.toString()))
      ];

      const [internIds, staffIds, userIds] = await Promise.all(queries);
      const allowedUserIds = [...internIds, ...staffIds, ...userIds];
      query.user = { $in: allowedUserIds };
    }

    // Get total count for pagination
    const totalCount = await LeaveRequest.countDocuments(query);
    const totalPages = Math.ceil(totalCount / limit);

    const leaveRequests = await LeaveRequest.find(query)
      .populate("user", "name email fullName batch course time")
      .populate("branch", "branchName")
      .populate("reviewedBy", "name fullName")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    res.status(200).json({
      success: true,
      count: leaveRequests.length,
      data: leaveRequests,
      pagination: {
        currentPage: page,
        totalPages,
        totalCount,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
        limit
      }
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

    // Resolve reviewedByModel dynamically
    let reviewedByModel = "Staff";
    const isStaff = await Staff.exists({ _id: reviewerId });
    if (!isStaff) {
      const isUser = await User.exists({ _id: reviewerId });
      if (isUser) {
        reviewedByModel = "User";
      }
    }
    leaveRequest.reviewedByModel = reviewedByModel;
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

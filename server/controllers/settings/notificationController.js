// controllers/notificationController.js
const Notification = require("../../models/settings/notificationModel");
const FCMToken = require("../../models/settings/fcmTokenModel");
const internModel = require("../../models/administration/internModel");
const { User } = require("../../models/administration/userModel");
const { Staff } = require("../../models/administration/staffModel");
const Batch = require("../../models/schedule/batchModel");
const { sendMulticastNotification } = require("../../config/firebase");

// Create Notification
const createNotification = async (req, res) => {
  try {
    const { 
      title, 
      content, 
      type, 
      branch, 
      audience, 
      batches, 
      courses, 
      interns, 
      individualInterns, 
      pushNotification 
    } = req.body;

    if (!title || !content || !type || !audience) {
      return res.status(400).json({ message: "Title, content, type, and audience are required fields" });
    }

    // Validate audience-specific fields
    if (audience === "By batches" && (!batches || batches.length === 0)) {
      return res.status(400).json({ message: "Batches must be selected when audience is 'By batches'" });
    }
    
    if (audience === "By courses" && (!courses || courses.length === 0)) {
      return res.status(400).json({ message: "Courses must be selected when audience is 'By courses'" });
    }
    
    if (audience === "Individual interns" && (!individualInterns || individualInterns.length === 0)) {
      return res.status(400).json({ message: "Individual interns must be selected when audience is 'Individual interns'" });
    }

    const newNotification = await Notification.create({
      title,
      content,
      type,
      branch: branch || null,
      audience,
      batches: batches || [],
      courses: courses || [],
      interns: interns || [],
      individualInterns: individualInterns || [],
      pushNotification: pushNotification !== undefined ? pushNotification : true,
    });

    // Populate the response with referenced data
    const populatedNotification = await Notification.findById(newNotification._id)
      .populate('branch', 'branchName')
      .populate('batches', 'batchName')
      .populate('courses', 'courseName')
      .populate('interns', 'fullName email')
      .populate('individualInterns', 'fullName email');

    // Send push notification unconditionally for every notification
    console.log("📢 Push notification triggered!");
    try {
      let userIds = [];
      const targetQuery = { isActive: true };
      if (branch) targetQuery.branch = branch;

      if (audience === "All interns") {
        const targetInterns = await internModel.find(targetQuery).select('_id');
        userIds = targetInterns.map(i => i._id);
      } else if (audience === "By batches" && batches && batches.length > 0) {
        const batchDocs = await Batch.find({ _id: { $in: batches } }).select('batchName');
        const batchNames = batchDocs.map(b => b.batchName);
        targetQuery.batch = { $in: batchNames };
        const targetInterns = await internModel.find(targetQuery).select('_id');
        userIds = targetInterns.map(i => i._id);
      } else if (audience === "By courses" && courses && courses.length > 0) {
        targetQuery.course = { $in: courses };
        const targetInterns = await internModel.find(targetQuery).select('_id');
        userIds = targetInterns.map(i => i._id);
      } else if (audience === "Individual interns" && individualInterns && individualInterns.length > 0) {
        userIds = individualInterns;
      }

      if (userIds.length > 0) {
        const fcmDocs = await FCMToken.find({ userId: { $in: userIds } }).select('token');
        const tokens = fcmDocs.map(d => d.token);
        if (tokens.length > 0) {
          await sendMulticastNotification(tokens, title, content, {
            notificationId: newNotification._id.toString(),
            type: type
          });
          console.log(`Successfully dispatched FCM notifications to ${tokens.length} tokens.`);
        } else {
          console.log("No registered FCM tokens found for targeted audience.");
        }
      } else {
        console.log("No targeted interns resolved for push notification.");
      }
    } catch (pushErr) {
      console.error("Failed to process push notifications:", pushErr);
    }

    res.status(201).json({ 
      message: "Notification created successfully", 
      data: populatedNotification 
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get All Notifications
const getNotifications = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 5;
    const { type, audience, branch } = req.query;
    
    // Calculate pagination values
    const skip = (page - 1) * limit;

    // Build filter
    const filter = { isActive: true };
    if (type) {
      filter.type = type;
    }
    if (audience) {
      filter.audience = audience;
    }
    if (branch) {
      // branch can be ObjectId string or populated; store is ObjectId so match by id
      filter.branch = branch;
    }

    const totalCount = await Notification.countDocuments(filter);
    const totalPages = Math.ceil(totalCount / limit);
    
    // Calculate pagination metadata
    const hasNextPage = page < totalPages;
    const hasPrevPage = page > 1;
    const startIndex = skip + 1;
    const endIndex = Math.min(skip + limit, totalCount);
    
    // Calculate page numbers to display (smart pagination)
    const getPageNumbers = (currentPage, totalPages) => {
      const maxVisible = 5;
      let startPage, endPage;
      
      if (totalPages <= maxVisible) {
        startPage = 1;
        endPage = totalPages;
      } else {
        if (currentPage <= 3) {
          startPage = 1;
          endPage = maxVisible;
        } else if (currentPage >= totalPages - 2) {
          startPage = totalPages - maxVisible + 1;
          endPage = totalPages;
        } else {
          startPage = currentPage - 2;
          endPage = currentPage + 2;
        }
      }
      
      return Array.from({ length: endPage - startPage + 1 }, (_, i) => startPage + i);
    };

    const notifications = await Notification.find(filter)
      .populate('branch', 'branchName')
      .populate('batches', 'batchName')
      .populate('courses', 'courseName')
      .populate('interns', 'fullName email')
      .populate('individualInterns', 'fullName email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);
    
    res.status(200).json({ 
      message: "Notifications retrieved successfully", 
      data: notifications,
      pagination: {
        currentPage: page,
        totalPages,
        totalCount,
        limit,
        skip,
        hasNextPage,
        hasPrevPage,
        startIndex,
        endIndex,
        pageNumbers: getPageNumbers(page, totalPages),
        displayInfo: {
          showing: `${startIndex} to ${endIndex}`,
          total: totalCount,
          pageInfo: `Page ${page} of ${totalPages}`
        }
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get Notification by ID
const getNotificationById = async (req, res) => {
  try {
    const notification = await Notification.findById(req.params.id)
      .populate('branch', 'branchName')
      .populate('batches', 'batchName')
      .populate('courses', 'courseName')
      .populate('interns', 'fullName email')
      .populate('individualInterns', 'fullName email');
    
    if (!notification) return res.status(404).json({ message: "Notification not found" });
    res.status(200).json({ message: "Notification retrieved successfully", data: notification });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Update Notification
const updateNotification = async (req, res) => {
  try {
    const { 
      title, 
      content, 
      type, 
      branch, 
      audience, 
      batches, 
      courses, 
      interns, 
      individualInterns, 
      pushNotification 
    } = req.body;

    // Validate audience-specific fields if audience is being updated
    if (audience === "By batches" && (!batches || batches.length === 0)) {
      return res.status(400).json({ message: "Batches must be selected when audience is 'By batches'" });
    }
    
    if (audience === "By courses" && (!courses || courses.length === 0)) {
      return res.status(400).json({ message: "Courses must be selected when audience is 'By courses'" });
    }
    
    if (audience === "Individual interns" && (!individualInterns || individualInterns.length === 0)) {
      return res.status(400).json({ message: "Individual interns must be selected when audience is 'Individual interns'" });
    }

    const updated = await Notification.findByIdAndUpdate(
      req.params.id, 
      {
        title,
        content,
        type,
        branch: branch || null,
        audience,
        batches: batches || [],
        courses: courses || [],
        interns: interns || [],
        individualInterns: individualInterns || [],
        pushNotification: pushNotification !== undefined ? pushNotification : true,
      },
      {
        new: true,
        runValidators: true,
      }
    )
      .populate('branch', 'branchName')
      .populate('batches', 'batchName')
      .populate('courses', 'courseName')
      .populate('interns', 'fullName email')
      .populate('individualInterns', 'fullName email');

    if (!updated) return res.status(404).json({ message: "Notification not found" });
    res.status(200).json({ message: "Notification updated successfully", data: updated });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Delete Notification (Soft Delete)
const deleteNotification = async (req, res) => {
  try {
    // const deleted = await Notification.findByIdAndUpdate(
    //   req.params.id, 
    //   { isActive: false }, 
    //   { new: true }
    // );
    
    const deleted = await Notification.findByIdAndDelete(req.params.id);
    
    if (!deleted) return res.status(404).json({ message: "Notification not found" });
    res.status(200).json({ message: "Notification deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Register FCM Token
const registerFCMToken = async (req, res) => {
  try {
    const { token } = req.body;
    if (!token) {
      return res.status(400).json({ message: "Token is required" });
    }

    const userId = req.userId;

    // Detect user type
    let userModel = "";
    const isStaff = await Staff.exists({ _id: userId });
    if (isStaff) {
      userModel = "Staff";
    } else {
      const isIntern = await internModel.exists({ _id: userId });
      if (isIntern) {
        userModel = "Intern";
      } else {
        const isUser = await User.exists({ _id: userId });
        if (isUser) {
          userModel = "User";
        }
      }
    }

    if (!userModel) {
      return res.status(404).json({ message: "User not found" });
    }

    // Upsert token
    await FCMToken.findOneAndUpdate(
      { token },
      { userId, userModel, token },
      { upsert: true, new: true }
    );

    res.status(200).json({ message: "FCM token registered successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get Intern Notifications (retrieves notifications targeted to the logged-in intern)
const getInternNotifications = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const internId = req.userId;
    // Find the intern
    const intern = await internModel.findById(internId);
    if (!intern) {
      return res.status(404).json({ message: "Intern not found" });
    }

    // Find the batch document corresponding to the intern's batch name string
    let batchId = null;
    if (intern.batch) {
      const batchDoc = await Batch.findOne({ batchName: intern.batch });
      if (batchDoc) {
        batchId = batchDoc._id;
      }
    }

    // Build the query targeted to the intern
    const query = {
      isActive: true,
      isDeleted: false,
      $and: [
        { $or: [ { branch: null }, { branch: intern.branch } ] },
        {
          $or: [
            { audience: "All interns" },
            ...(batchId ? [{ audience: "By batches", batches: batchId }] : []),
            ...(intern.course ? [{ audience: "By courses", courses: intern.course }] : []),
            { audience: "Individual interns", individualInterns: internId }
          ]
        }
      ]
    };

    const totalCount = await Notification.countDocuments(query);
    const totalPages = Math.ceil(totalCount / limit);
    const hasNextPage = page < totalPages;
    const hasPrevPage = page > 1;
    const startIndex = skip + 1;
    const endIndex = Math.min(skip + limit, totalCount);

    const notifications = await Notification.find(query)
      .populate('branch', 'branchName')
      .populate('batches', 'batchName')
      .populate('courses', 'courseName')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const modifiedNotifications = notifications.map(notification => {
      const doc = notification.toObject();
      doc.isRead = notification.readBy ? notification.readBy.some(id => id.toString() === internId.toString()) : false;
      delete doc.readBy;
      return doc;
    });

    res.status(200).json({
      message: "Notifications retrieved successfully",
      data: modifiedNotifications,
      pagination: {
        currentPage: page,
        totalPages,
        totalCount,
        limit,
        skip,
        hasNextPage,
        hasPrevPage,
        startIndex,
        endIndex
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Mark notification as read
const markNotificationAsRead = async (req, res) => {
  try {
    const internId = req.userId;
    const notificationId = req.params.id;

    const notification = await Notification.findByIdAndUpdate(
      notificationId,
      { $addToSet: { readBy: internId } },
      { new: true }
    );

    if (!notification) {
      return res.status(404).json({ message: "Notification not found" });
    }

    res.status(200).json({ message: "Notification marked as read successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get unread notifications count for intern
const getUnreadCount = async (req, res) => {
  try {
    const internId = req.userId;
    const intern = await internModel.findById(internId);
    if (!intern) {
      return res.status(404).json({ message: "Intern not found" });
    }

    let batchId = null;
    if (intern.batch) {
      const batchDoc = await Batch.findOne({ batchName: intern.batch });
      if (batchDoc) {
        batchId = batchDoc._id;
      }
    }

    const query = {
      isActive: true,
      isDeleted: false,
      readBy: { $ne: internId },
      $and: [
        { $or: [ { branch: null }, { branch: intern.branch } ] },
        {
          $or: [
            { audience: "All interns" },
            ...(batchId ? [{ audience: "By batches", batches: batchId }] : []),
            ...(intern.course ? [{ audience: "By courses", courses: intern.course }] : []),
            { audience: "Individual interns", individualInterns: internId }
          ]
        }
      ]
    };

    const count = await Notification.countDocuments(query);
    res.status(200).json({ count });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  createNotification,
  getNotifications,
  getNotificationById,
  updateNotification,
  deleteNotification,
  registerFCMToken,
  getInternNotifications,
  markNotificationAsRead,
  getUnreadCount,
};

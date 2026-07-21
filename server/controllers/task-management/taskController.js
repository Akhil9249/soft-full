const Task = require("../../models/task-management/taskModel");
const { cloudinary } = require("../../uploads/multer");
const mongoose = require("mongoose");

// Helper to extract Cloudinary public ID and delete the file
const deleteFromCloudinary = async (url) => {
  if (!url || typeof url !== 'string' || !url.includes('cloudinary.com')) return;
  try {
    const parts = url.split('/upload/');
    if (parts.length < 2) return;
    
    let pathPart = parts[1].replace(/^v\d+\//, ''); // Remove version
    const isRaw = url.includes('/raw/upload/');
    
    let publicId = pathPart;
    if (!isRaw) {
      // Remove extension for images
      const lastDotIndex = pathPart.lastIndexOf('.');
      if (lastDotIndex !== -1) {
        publicId = pathPart.substring(0, lastDotIndex);
      }
    }
    
    await cloudinary.uploader.destroy(publicId, { resource_type: isRaw ? 'raw' : 'image' });
    console.log(`Deleted from cloudinary: ${publicId}`);
  } catch (err) {
    console.error('Failed to delete from Cloudinary:', err);
  }
};

// Helper function to validate that only one audience field has data
const validateSingleAudienceField = (batches, interns, individualInterns) => {
  const audienceFields = [
    { field: 'batches', data: batches },
    { field: 'interns', data: interns },
    { field: 'individualInterns', data: individualInterns }
  ];
  
  const fieldsWithData = audienceFields.filter(field => field.data && field.data.length > 0);
  
  if (fieldsWithData.length > 1) {
    return {
      isValid: false,
      message: `Only one audience type can be specified at a time. Found data in: ${fieldsWithData.map(f => f.field).join(', ')}`
    };
  }
  
  return { isValid: true };
};

// Create new task
const createTask = async (req, res) => {
  try {
    const {
      title,
      taskType,
      module,
      assignedMentor,
      startDate,
      dueDate,
      description,
      attachments,
      totalMarks,
      achievedMarks,
      status,
      audience,
      branch,
      batches,
      interns,
      individualInterns
    } = req.body;

    console.log("Creating task:", {
      title,
      taskType,
      module,
      assignedMentor,
      startDate,
      dueDate,
      description,
      attachments,
      totalMarks,
      achievedMarks,
      status,
      audience,
      branch,
      batches,
      interns,
      individualInterns
    });

    // Validate required fields
    if (!title || !taskType || !module || !assignedMentor || !startDate || !dueDate || !description || !audience) {
      if (req.file) await deleteFromCloudinary(req.file.path);
      return res.status(400).json({
        message: "Title, task type, module, assigned mentor, start date, due date, description, and audience are required"
      });
    }

    // Parse branch safely (supports raw arrays and JSON strings)
    let branchArray = [];
    if (branch) {
      try {
        branchArray = Array.isArray(branch) ? branch : JSON.parse(branch);
      } catch (e) {
        branchArray = [branch];
      }
    }

    if (!branchArray || branchArray.length === 0) {
      if (req.file) await deleteFromCloudinary(req.file.path);
      return res.status(400).json({
        message: "At least one branch must be selected"
      });
    }

    // Validate taskType enum
    if (!["Weekly Task", "Daily Task"].includes(taskType)) {
      if (req.file) await deleteFromCloudinary(req.file.path);
      return res.status(400).json({
        message: "Task type must be either 'Weekly Task' or 'Daily Task'"
      });
    }

    // Validate audience enum
    if (!["All interns", "By batches", "Individual interns"].includes(audience)) {
      if (req.file) await deleteFromCloudinary(req.file.path);
      return res.status(400).json({
        message: "Audience must be one of: 'All interns', 'By batches', 'Individual interns'"
      });
    }

    // Clean audience-specific fields based on selected audience
    let cleanBatches = [];
    let cleanInterns = [];
    let cleanIndividualInterns = [];

    if (audience === "By batches") {
      cleanBatches = batches || [];
    } else if (audience === "Individual interns") {
      cleanIndividualInterns = individualInterns || [];
    }

    // Validate audience-specific fields
    if (audience === "By batches" && cleanBatches.length === 0) {
      if (req.file) await deleteFromCloudinary(req.file.path);
      return res.status(400).json({
        message: "Batches are required when audience is 'By batches'"
      });
    }

    if (audience === "Individual interns" && cleanIndividualInterns.length === 0) {
      if (req.file) await deleteFromCloudinary(req.file.path);
      return res.status(400).json({
        message: "Individual interns are required when audience is 'Individual interns'"
      });
    }

    // Validate that only one audience field can have data at a time (using cleaned data)
    const audienceValidation = validateSingleAudienceField(cleanBatches, cleanInterns, cleanIndividualInterns);
    if (!audienceValidation.isValid) {
      if (req.file) await deleteFromCloudinary(req.file.path);
      return res.status(400).json({
        message: audienceValidation.message
      });
    }

    // Validate dates
    const start = new Date(startDate);
    const due = new Date(dueDate);
    
    // Check if dates are valid
    if (isNaN(start.getTime()) || isNaN(due.getTime())) {
      if (req.file) await deleteFromCloudinary(req.file.path);
      return res.status(400).json({
        message: "Invalid date format"
      });
    }
    
    // Compare dates (due date should be after start date)
    if (start >= due) {
      if (req.file) await deleteFromCloudinary(req.file.path);
      return res.status(400).json({
        message: "Due date must be after start date"
      });
    }

    // Handle uploaded file
    let attachmentsValue = attachments || null;
    if (req.file) {
      attachmentsValue = req.file.path; // Cloudinary URL
    } else if (attachments && typeof attachments === 'string' && attachments.trim() !== '') {
      // Existing URL passed from frontend
      attachmentsValue = attachments.trim();
    }

    const newTask = await Task.create({
      title: title.trim(),
      taskType: taskType,
      module: module.trim(),
      assignedMentor: assignedMentor,
      startDate: start,
      dueDate: due,
      description: description.trim(),
      attachments: attachmentsValue,
      totalMarks: totalMarks ? Number(totalMarks) : 0,
      achievedMarks: achievedMarks ? Number(achievedMarks) : 0,
      status: status || "Pending",
      audience: audience,
      branch: branchArray,
      batches: cleanBatches,
      interns: cleanInterns,
      individualInterns: cleanIndividualInterns
    });

    res.status(201).json({
      message: "Task created successfully",
      data: newTask
    });
  } catch (error) {
    if (req.file) await deleteFromCloudinary(req.file.path);
    console.log("Error creating task:", error);
    res.status(500).json({ message: error.message });
  }
};

// Get all tasks
const getTasks = async (req, res) => {
  try {
    // Pagination parameters
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 5;
    const skip = (page - 1) * limit;

    // Search parameters
    const search = req.query.search || '';
    const taskType = req.query.taskType || '';
    const status = req.query.status || '';
    const audience = req.query.audience || '';
    const branch = req.query.branch || '';

    // Build query object: only list the task if exist branches in the branch section
    let query = { 
      isActive: true,
      branch: { $exists: true, $not: { $size: 0 } }
    };

    // Add search functionality
    if (search) {
      const searchRegex = new RegExp(search, 'i');
      query.$or = [
        { title: { $regex: searchRegex } },
        { module: { $regex: searchRegex } },
        { description: { $regex: searchRegex } }
      ];
    }

    // Add filters
    if (taskType) {
      query.taskType = taskType;
    }
    if (status) {
      query.status = status;
    }
    if (audience) {
      query.audience = audience;
    }

    // Role-based branch restriction: only super admin sees all
    if (req.userId) {
      const { Staff } = require("../../models/administration/staffModel");
      const loggedInStaff = await Staff.findById(req.userId).populate('role');
      if (loggedInStaff && loggedInStaff.role && loggedInStaff.role.role.toLowerCase() !== 'super admin') {
        if (loggedInStaff.branch) {
          query.branch = { $in: [loggedInStaff.branch] };
        }
      } else if (branch && mongoose.Types.ObjectId.isValid(branch)) {
        query.branch = { $in: [new mongoose.Types.ObjectId(branch)] };
      }
    } else if (branch && mongoose.Types.ObjectId.isValid(branch)) {
      query.branch = { $in: [new mongoose.Types.ObjectId(branch)] };
    }

    // Get total count for pagination
    const totalCount = await Task.countDocuments(query);
    const totalPages = Math.ceil(totalCount / limit);

    // Get paginated results
    const tasks = await Task.find(query)
      .populate('assignedMentor', 'fullName email')
      .populate('branch', 'branchName location')
      .populate('batches', 'batchName description branch')
      .populate({
        path: 'interns',
        select: 'fullName email branch courseStatus',
        match: { courseStatus: 'Ongoing' }
      })
      .populate({
        path: 'individualInterns',
        select: 'fullName email branch courseStatus',
        match: { courseStatus: 'Ongoing' }
      })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);
    
    console.log('Found tasks:', tasks.length);
    res.status(200).json({
      message: "Tasks retrieved successfully",
      data: tasks,
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
    console.error('Error fetching tasks:', error);
    res.status(500).json({ message: error.message });
  }
};

// Get single task by ID
const getTaskById = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id)
      .populate('assignedMentor', 'fullName email')
      .populate('branch', 'branchName location')
      .populate('batches', 'batchName description branch')
      .populate({
        path: 'interns',
        select: 'fullName email branch courseStatus',
        match: { courseStatus: 'Ongoing' }
      })
      .populate({
        path: 'individualInterns',
        select: 'fullName email branch courseStatus',
        match: { courseStatus: 'Ongoing' }
      });

    if (!task) {
      return res.status(404).json({ message: "Task not found" });
    }

    res.status(200).json({
      message: "Task retrieved successfully",
      data: task
    });
  } catch (error) {
    console.error('Error fetching task:', error);
    res.status(500).json({ message: error.message });
  }
};

// Update task
const updateTask = async (req, res) => {
  try {
    // Get current task to check existing audience and preserve/delete attachment
    const currentTask = await Task.findById(req.params.id);
    if (!currentTask) {
      if (req.file) await deleteFromCloudinary(req.file.path);
      return res.status(404).json({ message: "Task not found" });
    }

    const {
      title,
      taskType,
      module,
      assignedMentor,
      startDate,
      dueDate,
      description,
      attachments,
      totalMarks,
      achievedMarks,
      status,
      audience,
      branch,
      batches,
      interns,
      individualInterns
    } = req.body;

    // Validate taskType enum if provided
    if (taskType && !["Weekly Task", "Daily Task"].includes(taskType)) {
      if (req.file) await deleteFromCloudinary(req.file.path);
      return res.status(400).json({
        message: "Task type must be either 'Weekly Task' or 'Daily Task'"
      });
    }

    // Validate audience enum if provided
    if (audience && !["All interns", "By batches", "Individual interns"].includes(audience)) {
      if (req.file) await deleteFromCloudinary(req.file.path);
      return res.status(400).json({
        message: "Audience must be one of: 'All interns', 'By batches', 'Individual interns'"
      });
    }

    const activeAudience = audience || currentTask.audience;
    const isAudienceChanged = audience && audience !== currentTask.audience;

    // Clean audience-specific fields: if audience changes or is reset, clean other fields.
    // If not changed, fallback to existing or provided values.
    let cleanBatches = [];
    let cleanInterns = [];
    let cleanIndividualInterns = [];

    if (activeAudience === "By batches") {
      cleanBatches = batches !== undefined ? batches : (isAudienceChanged ? [] : currentTask.batches);
    } else if (activeAudience === "Individual interns") {
      cleanIndividualInterns = individualInterns !== undefined ? individualInterns : (isAudienceChanged ? [] : currentTask.individualInterns);
    }

    // Validate audience-specific fields
    if (activeAudience === "By batches" && cleanBatches.length === 0) {
      if (req.file) await deleteFromCloudinary(req.file.path);
      return res.status(400).json({
        message: "Batches are required when audience is 'By batches'"
      });
    }

    if (activeAudience === "Individual interns" && cleanIndividualInterns.length === 0) {
      if (req.file) await deleteFromCloudinary(req.file.path);
      return res.status(400).json({
        message: "Individual interns are required when audience is 'Individual interns'"
      });
    }

    // Validate that only one audience field can have data at a time
    const audienceValidation = validateSingleAudienceField(cleanBatches, cleanInterns, cleanIndividualInterns);
    if (!audienceValidation.isValid) {
      if (req.file) await deleteFromCloudinary(req.file.path);
      return res.status(400).json({
        message: audienceValidation.message
      });
    }

    // Parse branch safely (supports raw arrays and JSON strings)
    let branchArray = undefined;
    if (branch !== undefined) {
      try {
        branchArray = Array.isArray(branch) ? branch : JSON.parse(branch);
      } catch (e) {
        branchArray = [branch];
      }
    }

    if (branchArray !== undefined && branchArray.length === 0) {
      if (req.file) await deleteFromCloudinary(req.file.path);
      return res.status(400).json({
        message: "At least one branch must be selected"
      });
    }

    // Validate dates if provided
    if (startDate && dueDate) {
      const start = new Date(startDate);
      const due = new Date(dueDate);
      
      // Check if dates are valid
      if (isNaN(start.getTime()) || isNaN(due.getTime())) {
        if (req.file) await deleteFromCloudinary(req.file.path);
        return res.status(400).json({
          message: "Invalid date format"
        });
      }
      
      // Compare dates (due date should be after start date)
      if (start >= due) {
        if (req.file) await deleteFromCloudinary(req.file.path);
        return res.status(400).json({
          message: "Due date must be after start date"
        });
      }
    }

    const updateData = {};
    if (title) updateData.title = title.trim();
    if (taskType) updateData.taskType = taskType;
    if (module) updateData.module = module.trim();
    if (assignedMentor) updateData.assignedMentor = assignedMentor;
    if (startDate) updateData.startDate = new Date(startDate);
    if (dueDate) updateData.dueDate = new Date(dueDate);
    if (description) updateData.description = description.trim();
    
    // Handle uploaded file - remove attachments from updateData first to handle it separately
    delete updateData.attachments;
    
    let attachmentsValue = currentTask.attachments || undefined;
    if (req.file) {
      // New file uploaded
      console.log('New attachment uploaded:', req.file.originalname, req.file.mimetype, req.file.path);
      if (currentTask.attachments && currentTask.attachments !== req.file.path) {
        await deleteFromCloudinary(currentTask.attachments);
      }
      attachmentsValue = req.file.path; // Cloudinary URL
      updateData.attachments = attachmentsValue;
    } else if (attachments && typeof attachments === 'string' && attachments.trim() !== '') {
      // Existing URL passed from frontend
      console.log('Preserving existing attachment URL:', attachments);
      attachmentsValue = attachments.trim();
      updateData.attachments = attachmentsValue;
    } else {
      console.log('No attachment update - preserving existing:', currentTask.attachments);
    }
    // If neither req.file nor attachments string is provided, attachmentsValue stays as existing value
    // and we don't add it to updateData, so the existing value is preserved
    if (totalMarks !== undefined) updateData.totalMarks = Number(totalMarks);
    if (achievedMarks !== undefined) updateData.achievedMarks = Number(achievedMarks);
    if (status) updateData.status = status;
    if (audience) updateData.audience = audience;
    if (branchArray !== undefined) updateData.branch = branchArray;
    
    // Clear out non-active audience fields completely in database
    updateData.batches = cleanBatches;
    updateData.interns = cleanInterns;
    updateData.individualInterns = cleanIndividualInterns;

    const updated = await Task.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    )
    .populate('assignedMentor', 'fullName email')
    .populate('branch', 'branchName location')
    .populate('batches', 'batchName description branch')
    .populate({
      path: 'interns',
      select: 'fullName email branch courseStatus',
      match: { courseStatus: 'Ongoing' }
    })
    .populate({
      path: 'individualInterns',
      select: 'fullName email branch courseStatus',
      match: { courseStatus: 'Ongoing' }
    });

    if (!updated) {
      return res.status(404).json({ message: "Task not found" });
    }

    res.status(200).json({
      message: "Task updated successfully",
      data: updated
    });
  } catch (error) {
    if (req.file) await deleteFromCloudinary(req.file.path);
    console.log("Error updating task:", error);
    res.status(400).json({ message: error.message });
  }
};

// Delete task (soft delete)
const deleteTask = async (req, res) => {
  try {
    const updated = await Task.findByIdAndUpdate(
      req.params.id,
      { isActive: false },
      { new: true }
    );

    if (!updated) {
      return res.status(404).json({ message: "Task not found" });
    }

    res.status(200).json({
      message: "Task deleted successfully",
      data: updated
    });
  } catch (error) {
    console.log("Error deleting task:", error);
    res.status(500).json({ message: error.message });
  }
};

// Get tasks by batch
const getTasksByBatch = async (req, res) => {
  try {
    const { batchId } = req.params;
    const tasks = await Task.find({ 
      batches: batchId, 
      isActive: true 
    }).sort({ createdAt: -1 });

    res.status(200).json({
      message: "Tasks retrieved successfully",
      data: tasks
    });
  } catch (error) {
    console.error('Error fetching tasks by batch:', error);
    res.status(500).json({ message: error.message });
  }
};

// Get tasks by mentor
const getTasksByMentor = async (req, res) => {
  try {
    const { mentorId } = req.params;
    const tasks = await Task.find({ 
      assignedMentor: mentorId, 
      isActive: true 
    }).sort({ createdAt: -1 });

    res.status(200).json({
      message: "Tasks retrieved successfully",
      data: tasks
    });
  } catch (error) {
    console.error('Error fetching tasks by mentor:', error);
    res.status(500).json({ message: error.message });
  }
};

// Get tasks by status
const getTasksByStatus = async (req, res) => {
  try {
    const { status } = req.params;
    const tasks = await Task.find({ 
      status: status, 
      isActive: true 
    }).sort({ createdAt: -1 });

    res.status(200).json({
      message: "Tasks retrieved successfully",
      data: tasks
    });
  } catch (error) {
    console.error('Error fetching tasks by status:', error);
    res.status(500).json({ message: error.message });
  }
};

// Update task status
const updateTaskStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const { id } = req.params;

    if (!status || !["Pending", "In Progress", "Completed", "Cancelled"].includes(status)) {
      return res.status(400).json({
        message: "Valid status is required (Pending, In Progress, Completed, Cancelled)"
      });
    }

    const updated = await Task.findByIdAndUpdate(
      id,
      { status },
      { new: true, runValidators: true }
    );

    if (!updated) {
      return res.status(404).json({ message: "Task not found" });
    }

    res.status(200).json({
      message: "Task status updated successfully",
      data: updated
    });
  } catch (error) {
    console.log("Error updating task status:", error);
    res.status(400).json({ message: error.message });
  }
};

// Update task marks
const updateTaskMarks = async (req, res) => {
  try {
    const { achievedMarks, totalMarks } = req.body;
    const { id } = req.params;

    const updateData = {};
    if (achievedMarks !== undefined) updateData.achievedMarks = Number(achievedMarks);
    if (totalMarks !== undefined) updateData.totalMarks = Number(totalMarks);

    // Auto-update status to Completed if marks are provided
    if (achievedMarks !== undefined && totalMarks !== undefined) {
      if (Number(achievedMarks) >= Number(totalMarks)) {
        updateData.status = "Completed";
      } else if (Number(achievedMarks) > 0) {
        updateData.status = "In Progress";
      }
    }

    const updated = await Task.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    );

    if (!updated) {
      return res.status(404).json({ message: "Task not found" });
    }

    res.status(200).json({
      message: "Task marks updated successfully",
      data: updated
    });
  } catch (error) {
    console.log("Error updating task marks:", error);
    res.status(400).json({ message: error.message });
  }
};

// Get tasks by course
const getTasksByCourse = async (req, res) => {
  try {
    res.status(200).json({
      message: "Courses audience is deprecated and courses are no longer supported.",
      data: []
    });
  } catch (error) {
    console.error('Error fetching tasks by course:', error);
    res.status(500).json({ message: error.message });
  }
};

// Get tasks by intern
const getTasksByIntern = async (req, res) => {
  try {
    const { internId } = req.params;
    const tasks = await Task.find({ 
      $or: [
        { interns: internId },
        { individualInterns: internId }
      ],
      isActive: true 
    }).sort({ createdAt: -1 });

    res.status(200).json({
      message: "Tasks retrieved successfully",
      data: tasks
    });
  } catch (error) {
    console.error('Error fetching tasks by intern:', error);
    res.status(500).json({ message: error.message });
  }
};

// Get tasks by audience type
const getTasksByAudience = async (req, res) => {
  try {
    const { audienceType } = req.params;
    const tasks = await Task.find({ 
      audience: audienceType, 
      isActive: true 
    }).sort({ createdAt: -1 });

    res.status(200).json({
      message: "Tasks retrieved successfully",
      data: tasks
    });
  } catch (error) {
    console.error('Error fetching tasks by audience:', error);
    res.status(500).json({ message: error.message });
  }
};

// Get tasks by task type
const getTasksByType = async (req, res) => {
  try {
    const { taskType } = req.params;
    const tasks = await Task.find({ 
      taskType: taskType, 
      isActive: true 
    }).sort({ createdAt: -1 });

    res.status(200).json({
      message: "Tasks retrieved successfully",
      data: tasks
    });
  } catch (error) {
    console.error('Error fetching tasks by type:', error);
    res.status(500).json({ message: error.message });
  }
};

// Download task attachment (proxy through backend to avoid CORS issues)
const downloadTaskAttachment = async (req, res) => {
  try {
    const { id } = req.params;

    const task = await Task.findById(id);
    if (!task || !task.attachments) {
      return res.status(404).json({ message: "Task or attachment not found" });
    }

    const fileUrl = task.attachments;

    // Use axios to fetch file from Cloudinary
    const axios = require('axios');
    const cleanAxios = axios.create(); // Create an isolated instance with no default headers or interceptors

    try {
      // Fetch file as stream from Cloudinary
      const response = await cleanAxios.get(fileUrl, {
        responseType: 'stream',
        timeout: 30000, // 30 second timeout
        maxRedirects: 5
      });

      // Extract filename from URL
      const urlParts = fileUrl.split('/');
      let filename = urlParts[urlParts.length - 1] || 'attachment.pdf';

      // Clean up filename (remove query parameters if any)
      if (filename.includes('?')) {
        filename = filename.split('?')[0];
      }

      // Format filename with task title and original extension
      if (task.title) {
        const safeName = task.title.replace(/[^a-z0-9]/gi, '_');
        const ext = filename.includes('.') ? filename.substring(filename.lastIndexOf('.')) : '.pdf';
        filename = `${safeName}_Attachment${ext}`;
      }

      // Set headers for file download
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      res.setHeader('Content-Type', response.headers['content-type'] || 'application/octet-stream');
      res.setHeader('Content-Length', response.headers['content-length'] || '');

      // Pipe the file stream to response
      response.data.pipe(res);

    } catch (fetchError) {
      console.error('Error fetching file from Cloudinary:', fetchError.message);

      // Fallback: try native http/https
      const https = require('https');
      const http = require('http');
      const parsedUrl = new URL(fileUrl);
      const protocol = parsedUrl.protocol === 'https:' ? https : http;

      protocol.get(fileUrl, (response) => {
        if (response.statusCode !== 200) {
          return res.status(response.statusCode).json({
            message: `Failed to fetch file from Cloudinary. Status: ${response.statusCode}`
          });
        }

        const urlParts = fileUrl.split('/');
        let filename = urlParts[urlParts.length - 1] || 'attachment.pdf';
        if (task.title) {
          const safeName = task.title.replace(/[^a-z0-9]/gi, '_');
          const ext = filename.includes('.') ? filename.substring(filename.lastIndexOf('.')) : '.pdf';
          filename = `${safeName}_Attachment${ext}`;
        }

        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
        res.setHeader('Content-Type', response.headers['content-type'] || 'application/octet-stream');

        // Pipe the file stream to response
        response.pipe(res);
      }).on('error', (error) => {
        console.error('Error downloading file:', error);
        res.status(500).json({ message: 'Error downloading file from Cloudinary' });
      });
    }

  } catch (error) {
    console.error('Error in downloadTaskAttachment:', error);
    res.status(500).json({ message: error.message || 'Error downloading file' });
  }
};

module.exports = {
  createTask,
  getTasks,
  getTaskById,
  updateTask,
  deleteTask,
  getTasksByBatch,
  getTasksByMentor,
  getTasksByStatus,
  updateTaskStatus,
  updateTaskMarks,
  getTasksByCourse,
  getTasksByIntern,
  getTasksByAudience,
  getTasksByType,
  downloadTaskAttachment
};

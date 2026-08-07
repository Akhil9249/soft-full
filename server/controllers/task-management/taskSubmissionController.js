const TaskSubmission = require("../../models/task-management/taskSubmissionModel");
const Task = require("../../models/task-management/taskModel");
const { cloudinary } = require("../../uploads/multer");
const mongoose = require("mongoose");
const axios = require("axios");

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

// Create or update task submission
const createSubmission = async (req, res) => {
  try {
    const { task, submissionText } = req.body;
    const githubRepository = req.body.githubRepository || req.body.githubRepo;
    const liveDemoUrl = req.body.liveDemoUrl || req.body.liveDemo;
    const internId = req.userId;

    if (!task) {
      if (req.files && req.files.length > 0) {
        for (const file of req.files) {
          await deleteFromCloudinary(file.path);
        }
      }
      return res.status(400).json({ message: "Task ID is required" });
    }

    // Check if the task exists
    const taskExists = await Task.findById(task);
    if (!taskExists) {
      if (req.files && req.files.length > 0) {
        for (const file of req.files) {
          await deleteFromCloudinary(file.path);
        }
      }
      return res.status(404).json({ message: "Task not found" });
    }

    let attachmentUrls = [];
    if (req.files && req.files.length > 0) {
      attachmentUrls = req.files.map(file => file.path);
    }

    // Check for existing submission
    let existingSubmission = await TaskSubmission.findOne({ task, intern: internId });

    if (existingSubmission) {
      if (existingSubmission.status === "Graded") {
        if (req.files && req.files.length > 0) {
          for (const file of req.files) {
            await deleteFromCloudinary(file.path);
          }
        }
        return res.status(400).json({ message: "Task has already been graded and cannot be re-submitted" });
      }

      // If updating/re-submitting, delete old files if new ones are uploaded
      if (attachmentUrls.length > 0 && existingSubmission.attachments && existingSubmission.attachments.length > 0) {
        const oldAttachments = Array.isArray(existingSubmission.attachments) 
          ? existingSubmission.attachments 
          : [existingSubmission.attachments];
        for (const oldAttachment of oldAttachments) {
          await deleteFromCloudinary(oldAttachment);
        }
      }

      existingSubmission.submissionText = submissionText || existingSubmission.submissionText;
      if (attachmentUrls.length > 0) {
        existingSubmission.attachments = attachmentUrls;
      }
      if (githubRepository !== undefined) {
        existingSubmission.githubRepository = githubRepository;
      }
      if (liveDemoUrl !== undefined) {
        existingSubmission.liveDemoUrl = liveDemoUrl;
      }
      existingSubmission.status = "Submitted";
      existingSubmission.feedback = "";
      existingSubmission.achievedMarks = 0;
      existingSubmission.gradedBy = null;
      existingSubmission.gradedAt = null;

      await existingSubmission.save();

      return res.status(200).json({
        message: "Submission updated successfully",
        data: existingSubmission
      });
    }

    // Create new submission
    const newSubmission = new TaskSubmission({
      task,
      intern: internId,
      submissionText: submissionText || "",
      attachments: attachmentUrls,
      githubRepository: githubRepository || "",
      liveDemoUrl: liveDemoUrl || "",
      status: "Submitted"
    });

    await newSubmission.save();

    res.status(201).json({
      message: "Task submitted successfully",
      data: newSubmission
    });
  } catch (error) {
    console.error("Error creating submission:", error);
    if (req.files && req.files.length > 0) {
      for (const file of req.files) {
        await deleteFromCloudinary(file.path);
      }
    }
    res.status(500).json({ message: error.message });
  }
};

// Get current intern's submissions
const getMySubmissions = async (req, res) => {
  try {
    const internId = req.userId;
    const page = req.query.page ? parseInt(req.query.page) : null;
    const limit = req.query.limit ? parseInt(req.query.limit) : null;

    if (page && limit) {
      const skip = (page - 1) * limit;
      const totalCount = await TaskSubmission.countDocuments({ intern: internId });
      const totalPages = Math.ceil(totalCount / limit);

      const submissions = await TaskSubmission.find({ intern: internId })
        .populate("task")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit);

      return res.status(200).json({
        message: "Submissions retrieved successfully",
        data: submissions,
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
      const submissions = await TaskSubmission.find({ intern: internId })
        .populate("task")
        .sort({ createdAt: -1 });

      return res.status(200).json({
        message: "Submissions retrieved successfully",
        data: submissions
      });
    }
  } catch (error) {
    console.error("Error in getMySubmissions:", error);
    res.status(500).json({ message: error.message });
  }
};

// Get all submissions for a task (Mentor/Admin view)
const getTaskSubmissions = async (req, res) => {
  try {
    const { taskId } = req.params;
    const submissions = await TaskSubmission.find({ task: taskId })
      .populate("task")
      .populate("intern", "fullName email internPhoneNumber admissionNumber")
      .populate("gradedBy", "fullName")
      .sort({ createdAt: -1 });

    res.status(200).json({
      message: "Task submissions retrieved successfully",
      data: submissions
    });
  } catch (error) {
    console.error("Error in getTaskSubmissions:", error);
    res.status(500).json({ message: error.message });
  }
};

// Get a submission by ID
const getSubmissionById = async (req, res) => {
  try {
    const { id } = req.params;
    const submission = await TaskSubmission.findById(id)
      .populate("task")
      .populate("intern", "fullName email internPhoneNumber admissionNumber")
      .populate("gradedBy", "fullName");

    if (!submission) {
      return res.status(404).json({ message: "Submission not found" });
    }

    res.status(200).json({
      message: "Submission retrieved successfully",
      data: submission
    });
  } catch (error) {
    console.error("Error in getSubmissionById:", error);
    res.status(500).json({ message: error.message });
  }
};

// Grade a task submission
const gradeSubmission = async (req, res) => {
  try {
    const { id } = req.params;
    const { achievedMarks, feedback, status } = req.body;
    const graderId = req.userId; // The staff ID from token

    const submission = await TaskSubmission.findById(id).populate("task");
    if (!submission) {
      return res.status(404).json({ message: "Submission not found" });
    }

    // Validate marks
    const maxMarks = submission.task?.totalMarks || 0;
    if (achievedMarks !== undefined && (achievedMarks < 0 || achievedMarks > maxMarks)) {
      return res.status(400).json({ message: `Achieved marks must be between 0 and task's max marks (${maxMarks})` });
    }

    if (achievedMarks !== undefined) submission.achievedMarks = Number(achievedMarks);
    if (feedback !== undefined) submission.feedback = feedback;
    if (status !== undefined) {
      submission.status = status;
    } else {
      submission.status = "Graded";
    }
    
    submission.gradedBy = graderId;
    submission.gradedAt = new Date();

    await submission.save();

    res.status(200).json({
      message: "Submission graded successfully",
      data: submission
    });
  } catch (error) {
    console.error("Error in gradeSubmission:", error);
    res.status(500).json({ message: error.message });
  }
};

// Download attachment proxy (bypasses CORS issues)
const downloadSubmissionAttachment = async (req, res) => {
  try {
    const { id } = req.params;
    const submission = await TaskSubmission.findById(id).populate("intern", "fullName");
    
    if (!submission || !submission.attachments || (Array.isArray(submission.attachments) && submission.attachments.length === 0)) {
      return res.status(404).json({ message: "Submission or attachment not found" });
    }

    let fileUrl;
    if (Array.isArray(submission.attachments)) {
      const index = parseInt(req.query.index) || 0;
      fileUrl = submission.attachments[index] || submission.attachments[0];
    } else {
      fileUrl = submission.attachments;
    }

    const cleanAxios = axios.create();

    try {
      const response = await cleanAxios.get(fileUrl, {
        responseType: 'stream',
        timeout: 30000,
        maxRedirects: 5
      });

      const urlParts = fileUrl.split('/');
      let filename = urlParts[urlParts.length - 1] || 'submission_file';

      if (filename.includes('?')) {
        filename = filename.split('?')[0];
      }

      if (submission.intern && submission.intern.fullName) {
        const safeName = submission.intern.fullName.replace(/[^a-z0-9]/gi, '_');
        const ext = filename.includes('.') ? filename.substring(filename.lastIndexOf('.')) : '';
        filename = `${safeName}_Submission${ext}`;
      }

      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      res.setHeader('Content-Type', response.headers['content-type'] || 'application/octet-stream');
      res.setHeader('Content-Length', response.headers['content-length'] || '');

      response.data.pipe(res);
    } catch (fetchError) {
      console.error('Error fetching submission file:', fetchError.message);
      res.status(500).json({ message: 'Error fetching submission attachment' });
    }
  } catch (error) {
    console.error('Error in downloadSubmissionAttachment:', error);
    res.status(500).json({ message: error.message || 'Error downloading file' });
  }
};

module.exports = {
  createSubmission,
  getMySubmissions,
  getTaskSubmissions,
  getSubmissionById,
  gradeSubmission,
  downloadSubmissionAttachment
};

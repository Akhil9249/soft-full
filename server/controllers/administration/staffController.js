// controllers/staffController.js
const mongoose = require("mongoose");
const { Staff } = require("../../models/administration/staffModel");
const WeeklySchedule = require("../../models/schedule/weeklyScheduleModel");
const Timing = require("../../models/schedule/timingModel");
const { generatePasswordHash } = require("../../utils/bcrypt");
const { cloudinary } = require("../../uploads/multer");

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

// Helper function to create default weekly schedule for a mentor
const createDefaultWeeklySchedule = async (mentorId) => {
  try {
    // Check if weekly schedule already exists for this mentor
    const existingSchedule = await WeeklySchedule.findOne({ mentor: mentorId });
    if (existingSchedule) {
      console.log(`Weekly schedule already exists for mentor ${mentorId}`);
      return existingSchedule;
    }

    // Get default timings (you may need to adjust this based on your timing data)
    // const defaultTimings = await Timing.find({ isActive: true }).limit(3);
    const defaultTimings = await Timing.find().limit(3);
    
    if (defaultTimings.length === 0) {
      console.log('No default timings found, creating weekly schedule without specific timings');
      // Create a weekly schedule with empty schedule array
      const weeklySchedule = await WeeklySchedule.create({
        mentor: mentorId,
        schedule: []
      });
      return weeklySchedule;
    }

    // Create default schedule structure
    const defaultSchedule = defaultTimings.map(timing => ({
      time: timing._id,
      sub_details: [
        {
          days: "MWF",
          subject: "No class assigned",
          batch: []
        },
        {
          days: "TTS", 
          subject: "No class assigned",
          batch: []
        }
      ]
    }));

    const weeklySchedule = await WeeklySchedule.create({
      mentor: mentorId,
      schedule: defaultSchedule
    });

    console.log(`Default weekly schedule created for mentor ${mentorId}`);
    return weeklySchedule;
  } catch (error) {
    console.error('Error creating default weekly schedule:', error);
    throw error;
  }
};

// -------------------- CREATE Staff --------------------
const addStaff = async (req, res) => {
  try {
    const {
      fullName,
      dateOfBirth,
      gender,
      email,
      staffPhoneNumber,
      staffWhatsAppNumber,
      staffPermanentAddress,
      district,
      state,
      photo,
      department,
      branch,
      yearsOfExperience,
      dateOfJoining,
      employmentStatus,
      resignationDate,
      resume,
      remarks,
      role,
      officialEmail,
      password,
      isMentor,
      time
    } = req.body;

    // Validate required fields according to schema
    if (!fullName || !dateOfBirth || !gender || !email || !staffPhoneNumber || 
        !department || !dateOfJoining || !employmentStatus || !officialEmail || !password) {
      return res.status(400).json({ message: "All required fields must be provided" });
    }

    // Validate branch if provided (should be ObjectId or empty)
    if (branch && branch.trim() === '') {
      branch = null; // Set to null if empty string
    }

    // Validate gender enum
    if (!["Male", "Female", "Other"].includes(gender)) {
      return res.status(400).json({ message: "Gender must be Male, Female, or Other" });
    }

    // Validate employment status enum
    if (!["Active", "Inactive"].includes(employmentStatus)) {
      return res.status(400).json({ message: "Employment status must be Active or Inactive" });
    }


    // Validate role ObjectId if provided
    if (role && !mongoose.Types.ObjectId.isValid(role)) {
      return res.status(400).json({ message: "Invalid role ID format" });
    }

    // Check duplicate email
    const existingEmail = await Staff.findOne({ email });
    if (existingEmail) {
      return res.status(400).json({ message: "Staff with this email already exists" });
    }

    // Check duplicate official email
    const existingOfficialEmail = await Staff.findOne({ officialEmail });
    if (existingOfficialEmail) {
      return res.status(400).json({ message: "Staff with this official email already exists" });
    }

    // Handle uploaded files
    let photoUrl = photo || null;
    let resumeUrl = resume || null;
    
    if (req.files) {
      // Handle photo upload
      if (req.files.photo && req.files.photo[0]) {
        photoUrl = req.files.photo[0].path; // Cloudinary URL
      }
      
      // Handle resume upload
      if (req.files.resume && req.files.resume[0]) {
        resumeUrl = req.files.resume[0].path; // Cloudinary URL
      }
    }

    // Hash password
    const hashedPassword = await generatePasswordHash(password);

    // Create staff
    const newStaff = await Staff.create({
      fullName,
      dateOfBirth,
      gender,
      email,
      staffPhoneNumber,
      staffWhatsAppNumber,
      staffPermanentAddress,
      district,
      state,
      photo: photoUrl,
      department,
      branch,
      yearsOfExperience: yearsOfExperience || 0,
      dateOfJoining,
      employmentStatus,
      resignationDate,
      resume: resumeUrl,
      remarks,
      role: role,
      officialEmail,
      password: hashedPassword,
      isActive: true,
      isMentor: isMentor === 'true' || isMentor === true,
      time: time ? (Array.isArray(time) ? time : JSON.parse(time || "[]")).filter(Boolean) : []
    });

    // Populate branch and role fields for response
    const populatedStaff = await Staff.findById(newStaff._id)
      .populate('branch', 'branchName')
      .populate('role', 'role description')
      .select('-password');

    // Create weekly schedule if the staff member is a mentor
    // Note: We'll check the role after populating it
    if (populatedStaff.role && populatedStaff.role.role === 'mentor') {
      try {
        await createDefaultWeeklySchedule(newStaff._id);
        console.log(`Weekly schedule created for new mentor: ${newStaff.fullName}`);
      } catch (scheduleError) {
        console.error('Error creating weekly schedule for mentor:', scheduleError);
        // Don't fail the staff creation if weekly schedule creation fails
      }
    }

    res.status(201).json({ 
      message: "Staff created successfully", 
      data: populatedStaff 
    });
  } catch (error) {
    res.status(500).json({ message: error.message || "Error creating staff" });
  }
};

// -------------------- READ All Staff --------------------
const getStaff = async (req, res) => {
  try {
    // Pagination parameters
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 5;
    const skip = (page - 1) * limit;

    // Search parameters
    const search = req.query.search || '';
    const department = req.query.department || '';
    const employmentStatus = req.query.employmentStatus || '';
    let branch = req.query.branch || '';

    // Build query object
    let query = {};

    // Restrict branch and exclude own details for admin
    if (req.userId) {
      const loggedInUser = await Staff.findById(req.userId).populate('role');
      if (loggedInUser && loggedInUser.role && loggedInUser.role.role.toLowerCase() === 'admin') {
        branch = loggedInUser.branch; // Override to admin's branch
        query._id = { $ne: req.userId };
      }
    }

    // Add search functionality
    if (search) {
      const searchRegex = new RegExp(search, 'i');
      query.$or = [
        { fullName: { $regex: searchRegex } },
        { email: { $regex: searchRegex } },
        { officialEmail: { $regex: searchRegex } },
        { staffPhoneNumber: { $regex: searchRegex } },
        { department: { $regex: searchRegex } }
      ];
    }

    // Add filters
    if (department) {
      query.department = department;
    }
    if (employmentStatus) {
      query.employmentStatus = employmentStatus;
    }
    if (branch) {
      // Validate that branch is a valid ObjectId
      if (mongoose.Types.ObjectId.isValid(branch)) {
        query.branch = branch;
      }
    }

    // Get total count for pagination
    const totalCount = await Staff.countDocuments(query);
    const totalPages = Math.ceil(totalCount / limit);

    // Get paginated results
    const staff = await Staff.find(query)
      .populate('branch', 'branchName')
      .populate('role', 'role description')
      .select('-password')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);
    
    res.status(200).json({ 
      message: "Staff fetched successfully",
      success: true, 
      data: staff,
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
    res.status(500).json({ message: error.message || "Error fetching staff" });
  }
};

// -------------------- GET ALL STAFF (NO PAGINATION) --------------------
const getAllStaff = async (req, res) => {
  try {
    let query = {};
    if (req.userId) {
      const loggedInUser = await Staff.findById(req.userId).populate('role');
      if (loggedInUser && loggedInUser.role && loggedInUser.role.role.toLowerCase() === 'admin') {
        query.branch = loggedInUser.branch;
        query._id = { $ne: req.userId };
      }
    }

    const staff = await Staff.find(query)
      .populate('branch', 'branchName')
      .populate('role', 'role description')
      .select('-password')
      .sort({ createdAt: -1 });
    
    res.status(200).json({ 
      success: true,
      message: "All staff fetched successfully", 
      data: staff 
    });
  } catch (error) {
    res.status(500).json({ message: error.message || "Error fetching all staff" });
  }
};

// -------------------- GET ALL ACTIVE STAFF (NO PAGINATION) --------------------
const getAllActiveStaff = async (req, res) => {
  try {
    let query = { isActive: true };
    if (req.userId) {
      const loggedInUser = await Staff.findById(req.userId).populate('role');
      if (loggedInUser && loggedInUser.role && loggedInUser.role.role.toLowerCase() === 'admin') {
        query.branch = loggedInUser.branch;
        query._id = { $ne: req.userId };
      }
    }

    const staff = await Staff.find(query)
      .populate('branch', 'branchName')
      .populate('role', 'role description')
      .select('-password')
      .sort({ createdAt: -1 });
    
    res.status(200).json({ 
      success: true,
      message: "All active staff fetched successfully", 
      data: staff 
    });
  } catch (error) {
    res.status(500).json({ message: error.message || "Error fetching all active staff" });
  }
};

// -------------------- READ Single Staff --------------------
const getStaffById = async (req, res) => {
  try {
    const staff = await Staff.findById(req.params.id)
      .populate('branch', 'branchName')
      .populate('role', 'role description')
      .select('-password');
    if (!staff) {
      return res.status(404).json({ message: "Staff not found" });
    }
    res.status(200).json({ 
      message: "Staff fetched successfully", 
      data: staff 
    });
  } catch (error) {
    res.status(500).json({ message: error.message || "Error fetching staff" });
  }
};

// -------------------- UPDATE Staff --------------------
const updateStaff = async (req, res) => {
  try {
    const {
      fullName,
      dateOfBirth,
      gender,
      email,
      staffPhoneNumber,
      staffWhatsAppNumber,
      staffPermanentAddress,
      district,
      state,
      photo,
      department,
      branch,
      yearsOfExperience,
      dateOfJoining,
      employmentStatus,
      resignationDate,
      resume,
      remarks,
      role,
      officialEmail,
      password,
      isActive,
      isMentor,
      time
    } = req.body;

    // Validate gender enum if provided
    if (gender && !["Male", "Female", "Other"].includes(gender)) {
      return res.status(400).json({ message: "Gender must be Male, Female, or Other" });
    }

    // Validate employment status enum if provided
    if (employmentStatus && !["Active", "Inactive"].includes(employmentStatus)) {
      return res.status(400).json({ message: "Employment status must be Active or Inactive" });
    }


    // Validate role ObjectId if provided
    if (role && !mongoose.Types.ObjectId.isValid(role)) {
      return res.status(400).json({ message: "Invalid role ID format" });
    }

    // Check for duplicate email if email is being updated
    if (email) {
      const existingEmail = await Staff.findOne({ email, _id: { $ne: req.params.id } });
      if (existingEmail) {
        return res.status(400).json({ message: "Staff with this email already exists" });
      }
    }

    // Check for duplicate official email if officialEmail is being updated
    if (officialEmail) {
      const existingOfficialEmail = await Staff.findOne({ officialEmail, _id: { $ne: req.params.id } });
      if (existingOfficialEmail) {
        return res.status(400).json({ message: "Staff with this official email already exists" });
      }
    }

    // Validate branch if provided (should be ObjectId or empty)
    if (branch && branch.trim() === '') {
      branch = null; // Set to null if empty string
    }

    const existingStaff = await Staff.findById(req.params.id);
    if (!existingStaff) {
      return res.status(404).json({ message: "Staff not found" });
    }

    // Handle uploaded files
    let photoUrl = photo || undefined;
    let resumeUrl = resume || undefined;
    
    if (req.files) {
      // Handle photo upload - only update if new file is uploaded
      if (req.files.photo && req.files.photo[0]) {
        if (existingStaff.photo && existingStaff.photo !== req.files.photo[0].path) {
          await deleteFromCloudinary(existingStaff.photo);
        }
        photoUrl = req.files.photo[0].path; // Cloudinary URL
      }
      
      // Handle resume upload - only update if new file is uploaded
      if (req.files.resume && req.files.resume[0]) {
        if (existingStaff.resume && existingStaff.resume !== req.files.resume[0].path) {
          await deleteFromCloudinary(existingStaff.resume);
        }
        resumeUrl = req.files.resume[0].path; // Cloudinary URL
      }
    }

    // Hash password if provided
    let hashedPassword;
    if (password) {
      hashedPassword = await generatePasswordHash(password);
    }

    // Prepare update object
    const updateData = {
      fullName,
      dateOfBirth,
      gender,
      email,
      staffPhoneNumber,
      staffWhatsAppNumber,
      staffPermanentAddress,
      district,
      state,
      photo: photoUrl,
      department,
      branch,
      yearsOfExperience,
      dateOfJoining,
      employmentStatus,
      resignationDate,
      resume: resumeUrl,
      remarks,
      role,
      officialEmail,
      isActive,
      isMentor: isMentor !== undefined ? (isMentor === 'true' || isMentor === true) : undefined,
    };

    if (time !== undefined) {
      try {
        updateData.time = Array.isArray(time) ? time : JSON.parse(time || "[]").filter(Boolean);
      } catch (e) {
        updateData.time = [time].filter(Boolean);
      }
    }

    // Add hashed password if provided
    if (hashedPassword) {
      updateData.password = hashedPassword;
    }

    // Remove undefined values
    Object.keys(updateData).forEach(key => {
      if (updateData[key] === undefined) {
        delete updateData[key];
      }
    });

    const staff = await Staff.findByIdAndUpdate(req.params.id, updateData, {
      new: true,
      runValidators: true,
    })
      .populate('branch', 'branchName')
      .populate('role', 'role description')
      .select('-password');

    if (!staff) {
      return res.status(404).json({ message: "Staff not found" });
    }

    // Create weekly schedule if the staff member is updated to be a mentor and doesn't have one
    if (staff.role && staff.role.role === 'mentor') {
      try {
        await createDefaultWeeklySchedule(staff._id);
        console.log(`Weekly schedule created/verified for mentor: ${staff.fullName}`);
      } catch (scheduleError) {
        console.error('Error creating weekly schedule for mentor:', scheduleError);
        // Don't fail the staff update if weekly schedule creation fails
      }
    }

    res.status(200).json({ 
      message: "Staff updated successfully", 
      data: staff 
    });
  } catch (error) {
    res.status(400).json({ message: error.message || "Error updating staff" });
  }
};

// -------------------- DELETE Staff --------------------
const deleteStaff = async (req, res) => {
  try {
    const staffToDelete = await Staff.findById(req.params.id);
    if (!staffToDelete) {
      return res.status(404).json({ message: "Staff not found" });
    }

    // Delete photo and resume from Cloudinary
    if (staffToDelete.photo) {
      await deleteFromCloudinary(staffToDelete.photo);
    }
    if (staffToDelete.resume) {
      await deleteFromCloudinary(staffToDelete.resume);
    }

    const staff = await Staff.findByIdAndDelete(req.params.id).select('-password');
    res.status(200).json({ 
      message: "Staff deleted successfully",
      data: { deletedStaff: staff }
    });
  } catch (error) {
    res.status(500).json({ message: error.message || "Error deleting staff" });
  }
};

// -------------------- SEARCH Staff --------------------
const searchStaff = async (req, res) => {
  try {
    const { q } = req.query;
    
    if (!q || q.trim() === '') {
      return res.status(400).json({ message: "Search query is required" });
    }

    const searchTerm = q.trim();
    
    // Create search regex for case-insensitive search
    const searchRegex = new RegExp(searchTerm, 'i');
    
    let query = {
      $or: [
        { fullName: { $regex: searchRegex } },
        { email: { $regex: searchRegex } },
        { officialEmail: { $regex: searchRegex } },
        { staffPhoneNumber: { $regex: searchRegex } },
        { department: { $regex: searchRegex } },
        { employmentStatus: { $regex: searchRegex } }
      ]
    };

    if (req.userId) {
      const loggedInUser = await Staff.findById(req.userId).populate('role');
      if (loggedInUser && loggedInUser.role && loggedInUser.role.role.toLowerCase() === 'admin') {
        query.branch = loggedInUser.branch;
        query._id = { $ne: req.userId };
      }
    }

    // Search in multiple fields
    const staff = await Staff.find(query)
      .populate('branch', 'branchName')
      .populate('role', 'role description')
      .select('-password')
      .limit(20); // Limit results to 20 for performance

    res.status(200).json({ 
      message: `Found ${staff.length} staff member(s) matching "${searchTerm}"`,
      data: staff 
    });
  } catch (error) {
    res.status(500).json({ message: error.message || "Error searching staff" });
  }
};

// -------------------- GET STAFF BY EMPLOYMENT STATUS --------------------
const getStaffByStatus = async (req, res) => {
  try {
    const { status } = req.params; // 'Active' or 'Inactive'
    
    if (!["Active", "Inactive"].includes(status)) {
      return res.status(400).json({ message: "Status must be Active or Inactive" });
    }
    
    const staff = await Staff.find({ employmentStatus: status })
      .populate('branch', 'branchName')
      .populate('role', 'role description')
      .select('-password')
      .sort({ createdAt: -1 });
    
    res.status(200).json({ 
      message: `Staff with status '${status}' fetched successfully`, 
      data: staff 
    });
  } catch (error) {
    res.status(500).json({ message: error.message || "Error fetching staff by status" });
  }
};

// -------------------- GET STAFF BY BRANCH --------------------
const getStaffByBranch = async (req, res) => {
  try {
    const { branchId } = req.params;
    
    const staff = await Staff.find({ branch: branchId })
      .populate('branch', 'branchName')
      .populate('role', 'role description')
      .select('-password')
      .sort({ createdAt: -1 });
    
    res.status(200).json({ 
      message: "Staff by branch fetched successfully", 
      data: staff 
    });
  } catch (error) {
    res.status(500).json({ message: error.message || "Error fetching staff by branch" });
  }
};

// -------------------- GET STAFF BY DEPARTMENT --------------------
const getStaffByDepartment = async (req, res) => {
  try {
    const { department } = req.params;
    
    const staff = await Staff.find({ department })
      .populate('branch', 'branchName')
      .populate('role', 'role description')
      .select('-password')
      .sort({ createdAt: -1 });
    
    res.status(200).json({ 
      message: `Staff in department '${department}' fetched successfully`, 
      data: staff 
    });
  } catch (error) {
    res.status(500).json({ message: error.message || "Error fetching staff by department" });
  }
};

// -------------------- TOGGLE STAFF STATUS --------------------
const toggleStaffStatus = async (req, res) => {
  try {
    const staff = await Staff.findById(req.params.id);
    if (!staff) return res.status(404).json({ message: "Staff not found" });
    
    staff.isActive = !staff.isActive;
    await staff.save();
    
    const updatedStaff = await Staff.findById(staff._id)
      .populate('branch', 'branchName')
      .populate('role', 'role description')
      .select('-password');
    
    res.status(200).json({ 
      message: `Staff ${updatedStaff.isActive ? 'activated' : 'deactivated'} successfully`, 
      data: updatedStaff 
    });
  } catch (error) {
    res.status(500).json({ message: error.message || "Error toggling staff status" });
  }
};

// -------------------- GET STAFF BY ROLE --------------------
const getStaffByRole = async (req, res) => {
  try {
    const { roleId } = req.params; // Role ObjectId
    
    if (!mongoose.Types.ObjectId.isValid(roleId)) {
      return res.status(400).json({ message: "Invalid role ID format" });
    }
    
    const staff = await Staff.find({ role: roleId })
      .populate('branch', 'branchName')
      .populate('role', 'role description')
      .select('-password')
      .sort({ createdAt: -1 });
    
    res.status(200).json({ 
      message: `Staff with role ID '${roleId}' fetched successfully`, 
      data: staff 
    });
  } catch (error) {
    res.status(500).json({ message: error.message || "Error fetching staff by role" });
  }
};

// -------------------- DOWNLOAD STAFF RESUME --------------------
const downloadResume = async (req, res) => {
  try {
    const { id } = req.params;

    const staff = await Staff.findById(id);
    if (!staff || !staff.resume) {
      return res.status(404).json({ message: "Staff or resume not found" });
    }

    const resumeUrl = staff.resume;

    // Use axios to fetch file from Cloudinary
    const axios = require('axios');
    const cleanAxios = axios.create(); // Create an isolated instance with no default headers or interceptors

    try {
      // Fetch file as stream from Cloudinary
      const response = await cleanAxios.get(resumeUrl, {
        responseType: 'stream',
        timeout: 30000, // 30 second timeout
        maxRedirects: 5
      });

      // Extract filename from URL or use staff's name
      const urlParts = resumeUrl.split('/');
      let filename = urlParts[urlParts.length - 1] || 'resume.pdf';

      // Clean up filename (remove query parameters if any)
      if (filename.includes('?')) {
        filename = filename.split('?')[0];
      }

      // Format filename with staff's name
      if (staff.fullName) {
        const safeName = staff.fullName.replace(/[^a-z0-9]/gi, '_');
        filename = `${safeName}_Resume.pdf`;
      }

      // Set headers for file download
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      res.setHeader('Content-Type', response.headers['content-type'] || 'application/pdf');
      res.setHeader('Content-Length', response.headers['content-length'] || '');

      // Pipe the file stream to response
      response.data.pipe(res);

    } catch (fetchError) {
      console.error('Error fetching file from Cloudinary:', fetchError.message);

      // If axios fails, try native http/https as fallback
      const https = require('https');
      const http = require('http');
      const parsedUrl = new URL(resumeUrl);
      const protocol = parsedUrl.protocol === 'https:' ? https : http;

      protocol.get(resumeUrl, (response) => {
        if (response.statusCode !== 200) {
          return res.status(response.statusCode).json({
            message: `Failed to fetch file from Cloudinary. Status: ${response.statusCode}`
          });
        }

        const urlParts = resumeUrl.split('/');
        let filename = urlParts[urlParts.length - 1] || 'resume.pdf';
        if (staff.fullName) {
          const safeName = staff.fullName.replace(/[^a-z0-9]/gi, '_');
          filename = `${safeName}_Resume.pdf`;
        }

        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
        res.setHeader('Content-Type', response.headers['content-type'] || 'application/pdf');

        // Pipe the file stream to response
        response.pipe(res);
      }).on('error', (error) => {
        console.error('Error downloading file:', error);
        res.status(500).json({ message: 'Error downloading file from Cloudinary' });
      });
    }

  } catch (error) {
    console.error('Error in downloadResume:', error);
    res.status(500).json({ message: error.message || 'Error downloading resume' });
  }
};

module.exports = {
  addStaff,
  getStaff,
  getAllStaff,
  getAllActiveStaff,
  getStaffById,
  updateStaff,
  deleteStaff,
  searchStaff,
  getStaffByStatus,
  getStaffByBranch,
  getStaffByDepartment,
  toggleStaffStatus,
  getStaffByRole,
  downloadResume,
};

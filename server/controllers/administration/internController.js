// controllers/internController.js
// const Intern = require("../models/internModel");
const Intern = require("../../models/administration/internModel");
const { Staff } = require("../../models/administration/staffModel");
const bcrypt = require("bcrypt");
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

// -------------------- CREATE Intern --------------------
const addIntern = async (req, res) => {
  try {
    const {
      fullName,
      dateOfBirth,
      gender,
      email,
      internPhoneNumber,
      internWhatsAppNumber,
      guardianName,
      fatherName,
      motherName,
      guardianParentPhone,
      internPermanentAddress,
      district,
      state,
      photo,
      course,
      branch,
      courseStartedDate,
      completionDate,
      batch,
      courseStatus,
      careerAdvisor,
      remarks,
      internSyllabusStatus,
      placementStatus,
      linkedin,
      portfolio,
      companyName,
      jobRole,
      resume,
      officialEmail,
      password
    } = req.body;

    // Validate required fields according to schema
    if (!fullName || !dateOfBirth || !gender || !email || !internPhoneNumber || !branch || !courseStartedDate || !officialEmail || !password) {
      return res.status(400).json({ message: "All required fields must be provided" });
    }

    // Validate gender enum
    if (!["Male", "Female", "Other"].includes(gender)) {
      return res.status(400).json({ message: "Gender must be Male, Female, or Other" });
    }

    // Validate role enum if provided
    if (req.body.role && !["Intern", "Mentor", "Admin"].includes(req.body.role)) {
      return res.status(400).json({ message: "Role must be Intern, Mentor, or Admin" });
    }

    // Check duplicate email
    const existingEmail = await Intern.findOne({ email });
    if (existingEmail) {
      return res.status(400).json({ message: "Intern with this email already exists" });
    }

    // Check duplicate official email
    const existingOfficialEmail = await Intern.findOne({ officialEmail });
    if (existingOfficialEmail) {
      return res.status(400).json({ message: "Intern with this official email already exists" });
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

    // Create intern
    const newIntern = await Intern.create({
      fullName,
      dateOfBirth,
      gender,
      email,
      internPhoneNumber,
      internWhatsAppNumber,
      guardianName,
      fatherName,
      motherName,
      guardianParentPhone,
      internPermanentAddress,
      district,
      state,
      photo: photoUrl,
      course,
      branch,
      courseStartedDate,
      completionDate,
      batch,
      courseStatus: courseStatus || "Active",
      careerAdvisor,
      remarks,
      internSyllabusStatus: internSyllabusStatus || "Not Started",
      placementStatus: placementStatus || "Not Placed",
      linkedin,
      portfolio,
      companyName,
      jobRole,
      resume: resumeUrl,
      role: req.body.role || "Intern",
      officialEmail,
      password: hashedPassword,
      isActive: true
    });

    // Populate course and branch fields for response
    const populatedIntern = await Intern.findById(newIntern._id)
      .populate('course', 'courseName')
      .populate('branch', 'branchName')
      .populate('careerAdvisor', 'fullName email')
      .select('-password');

    res.status(201).json({ 
      message: "Intern created successfully", 
      data: populatedIntern 
    });
  } catch (error) {
    res.status(500).json({ message: error.message || "Internal Server Error" });
  }
};

// -------------------- READ All Interns --------------------
const getInterns = async (req, res) => {
  try {
    // Pagination parameters
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 4;
    const skip = (page - 1) * limit;

    console.log("req.query", req.query);

    // Search parameters
    const search = req.query.search || '';
    const courseStatus = req.query.courseStatus || '';
    const course = req.query.course || '';
    const branch = req.query.branch || '';
    const batch = req.query.batch || '';

    // Build query object
    let query = {};

    // Add search functionality
    if (search) {
      const searchRegex = new RegExp(search, 'i');
      query.$or = [
        { fullName: { $regex: searchRegex } },
        { email: { $regex: searchRegex } },
        { internPhoneNumber: { $regex: searchRegex } },
        { batch: { $regex: searchRegex } }
      ];
    }

    // Add filters
    if (courseStatus) {
      query.courseStatus = courseStatus;
    }
    if (course) {
      query.course = course;
    }
    if (branch) {
      query.branch = branch;
    }
    if (batch) {
      query.batch = batch;
    }

    // Role-based branch restriction: only super admin sees all
    if (req.userId) {
      const loggedInStaff = await Staff.findById(req.userId).populate('role');
      if (loggedInStaff && loggedInStaff.role && loggedInStaff.role.role.toLowerCase() !== 'super admin') {
        if (loggedInStaff.branch) {
          query.branch = loggedInStaff.branch;
        }
      }
    }

    // Get total count for pagination
    const totalCount = await Intern.countDocuments(query);
    const totalPages = Math.ceil(totalCount / limit);

    // Get paginated results
    const interns = await Intern.find(query)
      .populate('course', 'courseName')
      .populate('branch', 'branchName')
      .populate('careerAdvisor', 'fullName email')
      .select('-password')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    console.log("interns", interns.length);

    if(!interns) return res.status(404).json({ message: "No interns found" });

    res.status(200).json({ 
      message: "Interns fetched successfully", 
      data: interns,
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
    res.status(500).json({ message: error.message || "Error fetching interns" });
  }
};

// -------------------- READ Single Intern --------------------
const getInternById = async (req, res) => {
  try {
    const intern = await Intern.findById(req.params.id)
      .populate('course', 'courseName')
      .populate('branch', 'branchName')
      .populate('careerAdvisor', 'fullName email')
      .select('-password');
    if (!intern) return res.status(404).json({ message: "Intern not found" });
    res.status(200).json({ 
      message: "Intern fetched successfully", 
      data: intern 
    });
  } catch (error) {
    res.status(500).json({ message: error.message || "Error fetching intern" });
  }
};

// -------------------- READ Single Intern Details --------------------
const getInternDetails = async (req, res) => {
  try {
    const intern = await Intern.findById(req.userId)
      .populate('course', 'courseName')
      .populate('branch', 'branchName')
      .populate('careerAdvisor', 'fullName email')
      .select('-password -_id');
    if (!intern) return res.status(404).json({ message: "Intern not found" });
    res.status(200).json({ 
      message: "Intern fetched successfully", 
      data: intern 
    });
  } catch (error) {
    res.status(500).json({ message: error.message || "Error fetching intern" });
  }
};

// -------------------- UPDATE Intern --------------------
const updateIntern = async (req, res) => {
  try {
    const {
      fullName,
      dateOfBirth,
      gender,
      email,
      internPhoneNumber,
      internWhatsAppNumber,
      guardianName,
      fatherName,
      motherName,
      guardianParentPhone,
      internPermanentAddress,
      district,
      state,
      photo,
      course,
      branch,
      courseStartedDate,
      completionDate,
      batch,
      courseStatus,
      careerAdvisor,
      remarks,
      internSyllabusStatus,
      placementStatus,
      linkedin,
      portfolio,
      companyName,
      jobRole,
      resume,
      officialEmail,
      password,
      role,
      isActive
    } = req.body;

    // Validate gender enum if provided
    if (gender && !["Male", "Female", "Other"].includes(gender)) {
      return res.status(400).json({ message: "Gender must be Male, Female, or Other" });
    }

    // Validate role enum if provided
    if (role && !["Intern", "Mentor", "Admin"].includes(role)) {
      return res.status(400).json({ message: "Role must be Intern, Mentor, or Admin" });
    }

    // Validate courseStatus enum if provided
    if (courseStatus && !["Active", "Inactive", "Ongoing", "Dropped", "Completed", "Long leave"].includes(courseStatus)) {
      return res.status(400).json({ message: "Course status must be Active, Inactive, Ongoing, Dropped, Completed, or Long leave" });
    }

    // Validate internSyllabusStatus enum if provided
    if (internSyllabusStatus && !["Not Started", "Learning", "mini Project", "Main Project"].includes(internSyllabusStatus)) {
      return res.status(400).json({ message: "Syllabus status must be Not Started, Learning, mini Project, or Main Project" });
    }

    // Validate placementStatus enum if provided
    if (placementStatus && !["To be started", "In Progress", "Offer Declined", "Placed", "Not Placed"].includes(placementStatus)) {
      return res.status(400).json({ message: "Placement status must be To be started, In Progress, Offer Declined, Placed, or Not Placed" });
    }

    // Check for duplicate email if email is being updated
    if (email) {
      const existingEmail = await Intern.findOne({ email, _id: { $ne: req.params.id } });
      if (existingEmail) {
        return res.status(400).json({ message: "Intern with this email already exists" });
      }
    }

    // Check for duplicate official email if officialEmail is being updated
    if (officialEmail) {
      const existingOfficialEmail = await Intern.findOne({ officialEmail, _id: { $ne: req.params.id } });
      if (existingOfficialEmail) {
        return res.status(400).json({ message: "Intern with this official email already exists" });
      }
    }

    // Handle uploaded files
    // First, get existing intern to preserve existing URLs if no new file is uploaded
    const existingIntern = await Intern.findById(req.params.id);
    let photoUrl = existingIntern ? existingIntern.photo : undefined;
    let resumeUrl = existingIntern ? existingIntern.resume : undefined;
    
    // If photo is provided in body (existing URL as string), use it
    if (photo && typeof photo === 'string' && photo.trim() !== '') {
      photoUrl = photo;
    }
    
    // If resume is provided in body (existing URL as string), use it
    if (resume && typeof resume === 'string' && resume.trim() !== '') {
      resumeUrl = resume;
    }
    
    // Override with new files if uploaded
    if (req.files) {
      // Handle photo upload
      if (req.files.photo && req.files.photo[0]) {
        if (existingIntern && existingIntern.photo && existingIntern.photo !== req.files.photo[0].path) {
          await deleteFromCloudinary(existingIntern.photo);
        }
        photoUrl = req.files.photo[0].path; // Cloudinary URL
      }
      
      // Handle resume upload
      if (req.files.resume && req.files.resume[0]) {
        if (existingIntern && existingIntern.resume && existingIntern.resume !== req.files.resume[0].path) {
          await deleteFromCloudinary(existingIntern.resume);
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
      internPhoneNumber,
      internWhatsAppNumber,
      guardianName,
      fatherName,
      motherName,
      guardianParentPhone,
      internPermanentAddress,
      district,
      state,
      photo: photoUrl,
      course,
      branch,
      courseStartedDate,
      completionDate,
      batch,
      courseStatus,
      careerAdvisor,
      remarks,
      internSyllabusStatus,
      placementStatus,
      linkedin,
      portfolio,
      companyName,
      jobRole,
      resume: resumeUrl,
      role,
      officialEmail,
      isActive
    };

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

    const intern = await Intern.findByIdAndUpdate(req.params.id, updateData, {
      new: true,
      runValidators: true,
    })
      .populate('course', 'courseName')
      .populate('branch', 'branchName')
      .populate('careerAdvisor', 'fullName email')
      .select('-password');

    if (!intern) return res.status(404).json({ message: "Intern not found" });
    res.status(200).json({ 
      message: "Intern updated successfully", 
      data: intern 
    });
  } catch (error) {
    res.status(400).json({ message: error.message || "Error updating intern" });
  }
};

// -------------------- DELETE Intern --------------------
const deleteIntern = async (req, res) => {
  try {
    const internToDelete = await Intern.findById(req.params.id);
    if (!internToDelete) return res.status(404).json({ message: "Intern not found" });

    // Delete photo and resume from Cloudinary
    if (internToDelete.photo) {
      await deleteFromCloudinary(internToDelete.photo);
    }
    if (internToDelete.resume) {
      await deleteFromCloudinary(internToDelete.resume);
    }

    const intern = await Intern.findByIdAndDelete(req.params.id).select('-password');
    res.status(200).json({ 
      message: "Intern deleted successfully",
      data: { deletedIntern: intern }
    });
  } catch (error) {
    res.status(500).json({ message: error.message || "Error deleting intern" });
  }
};

// -------------------- SEARCH Interns --------------------
const searchInterns = async (req, res) => {
  try {
    const { q, branch } = req.query;
    
    if (!q || q.trim() === '') {
      return res.status(400).json({ message: "Search query is required" });
    }

    const searchTerm = q.trim();
    
    // Create search regex for case-insensitive search
    const searchRegex = new RegExp(searchTerm, 'i');
    
    // Search in multiple fields
    let query = {
      $or: [
        { fullName: { $regex: searchRegex } },
        { email: { $regex: searchRegex } },
        { officialEmail: { $regex: searchRegex } },
        { internPhoneNumber: { $regex: searchRegex } },
        { batch: { $regex: searchRegex } },
        { companyName: { $regex: searchRegex } },
        { jobRole: { $regex: searchRegex } }
      ]
    };

    // Role-based branch restriction: only super admin sees all
    if (req.userId) {
      const loggedInStaff = await Staff.findById(req.userId).populate('role');
      if (loggedInStaff && loggedInStaff.role && loggedInStaff.role.role.toLowerCase() !== 'super admin') {
        if (loggedInStaff.branch) {
          query.branch = loggedInStaff.branch;
        }
      } else if (branch) {
        query.branch = branch;
      }
    } else if (branch) {
      query.branch = branch;
    }

    const interns = await Intern.find(query)
      .populate('course', 'courseName')
      .populate('branch', 'branchName')
      .populate('careerAdvisor', 'fullName email')
      .select('-password')
      .limit(20); // Limit results to 20 for performance

    res.status(200).json({ 
      message: `Found ${interns.length} intern(s) matching "${searchTerm}"`,
      data: interns 
    });
  } catch (error) {
    res.status(500).json({ message: error.message || "Error searching interns" });
  }
};

// -------------------- GET INTERNS BY STATUS --------------------
const getInternsByStatus = async (req, res) => {
  try {
    const { status } = req.params; // courseStatus, internSyllabusStatus, or placementStatus
    const { type } = req.query; // 'course', 'syllabus', or 'placement'
    
    let query = {};
    
    switch (type) {
      case 'course':
        query.courseStatus = status;
        break;
      case 'syllabus':
        query.internSyllabusStatus = status;
        break;
      case 'placement':
        query.placementStatus = status;
        break;
      default:
        return res.status(400).json({ message: "Invalid type parameter. Use 'course', 'syllabus', or 'placement'" });
    }
    
    // Role-based branch restriction: only super admin sees all
    if (req.userId) {
      const loggedInStaff = await Staff.findById(req.userId).populate('role');
      if (loggedInStaff && loggedInStaff.role && loggedInStaff.role.role.toLowerCase() !== 'super admin') {
        if (loggedInStaff.branch) {
          query.branch = loggedInStaff.branch;
        }
      }
    }

    const interns = await Intern.find(query)
      .populate('course', 'courseName')
      .populate('branch', 'branchName')
      .populate('careerAdvisor', 'fullName email')
      .select('-password')
      .sort({ createdAt: -1 });
    
    res.status(200).json({ 
      message: `Interns with ${type} status '${status}' fetched successfully`, 
      data: interns 
    });
  } catch (error) {
    res.status(500).json({ message: error.message || "Error fetching interns by status" });
  }
};

// -------------------- GET INTERNS BY BRANCH --------------------
const getInternsByBranch = async (req, res) => {
  try {
    const { branchId } = req.params;
    let query = { branch: branchId };

    // Role-based branch restriction: only super admin sees all
    if (req.userId) {
      const loggedInStaff = await Staff.findById(req.userId).populate('role');
      if (loggedInStaff && loggedInStaff.role && loggedInStaff.role.role.toLowerCase() !== 'super admin') {
        if (loggedInStaff.branch) {
          query.branch = loggedInStaff.branch; // Overrides branchId if not super admin
        }
      }
    }
    
    const interns = await Intern.find(query)
      .populate('course', 'courseName')
      .populate('branch', 'branchName')
      .populate('careerAdvisor', 'fullName email')
      .select('-password')
      .sort({ createdAt: -1 });
    
    res.status(200).json({ 
      message: "Interns by branch fetched successfully", 
      data: interns 
    });
  } catch (error) {
    res.status(500).json({ message: error.message || "Error fetching interns by branch" });
  }
};

// -------------------- TOGGLE INTERN STATUS --------------------
const toggleInternStatus = async (req, res) => {
  try {
    const intern = await Intern.findById(req.params.id);
    if (!intern) return res.status(404).json({ message: "Intern not found" });
    
    intern.isActive = !intern.isActive;
    await intern.save();
    
    const updatedIntern = await Intern.findById(intern._id)
      .populate('course', 'courseName')
      .populate('branch', 'branchName')
      .populate('careerAdvisor', 'fullName email')
      .select('-password');
    
    res.status(200).json({ 
      message: `Intern ${updatedIntern.isActive ? 'activated' : 'deactivated'} successfully`, 
      data: updatedIntern 
    });
  } catch (error) {
    res.status(500).json({ message: error.message || "Error toggling intern status" });
  }
};

// -------------------- DOWNLOAD INTERN RESUME --------------------
const downloadResume = async (req, res) => {
  try {
    const { id } = req.params;

    const intern = await Intern.findById(id);
    if (!intern || !intern.resume) {
      return res.status(404).json({ message: "Student or resume not found" });
    }

    const resumeUrl = intern.resume;

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

      // Extract filename from URL or use student's name
      const urlParts = resumeUrl.split('/');
      let filename = urlParts[urlParts.length - 1] || 'resume.pdf';

      // Clean up filename (remove query parameters if any)
      if (filename.includes('?')) {
        filename = filename.split('?')[0];
      }

      // Format filename with student's name
      if (intern.fullName) {
        const safeName = intern.fullName.replace(/[^a-z0-9]/gi, '_');
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
        if (intern.fullName) {
          const safeName = intern.fullName.replace(/[^a-z0-9]/gi, '_');
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
  addIntern,
  getInterns,
  getInternById,
  getInternDetails,
  updateIntern,
  deleteIntern,
  searchInterns,
  getInternsByStatus,
  getInternsByBranch,
  toggleInternStatus,
  downloadResume,
};

const Material = require("../../models/task-management/material");
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

// Create new material
const createMaterial = async (req, res) => {
  try {
    const {
      title,
      mentor,
      attachments,
      audience,
      branch,
      batches,
      courses,
      categories,
      interns,
      individualInterns,
      allowDownload
    } = req.body;

    console.log("Creating material:", {
      title,
      mentor,
      attachments,
      audience,
      branch,
      batches,
      courses,
      categories,
      interns,
      individualInterns
    });

    // Validate required fields
    if (!title || !mentor || !audience) {
      if (req.file) await deleteFromCloudinary(req.file.path);
      return res.status(400).json({
        message: "Title, mentor, and audience are required"
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

    // Handle uploaded file
    let attachmentsValue = attachments || null;
    if (req.file) {
      attachmentsValue = req.file.path; // Cloudinary URL
    } else if (attachments && typeof attachments === 'string' && attachments.trim() !== '') {
      // Existing URL passed from frontend
      attachmentsValue = attachments.trim();
    }

    // Validate audience enum
    if (!["All interns", "By batches", "By Courses", "By Category", "Individual interns"].includes(audience)) {
      if (req.file) await deleteFromCloudinary(req.file.path);
      return res.status(400).json({
        message: "Audience must be one of: 'All interns', 'By batches', 'By Courses', 'By Category', 'Individual interns'"
      });
    }

    // Clean audience-specific fields based on selected audience
    let cleanBatches = [];
    let cleanCourses = [];
    let cleanCategories = [];
    let cleanIndividualInterns = [];

    if (audience === "By batches") {
      cleanBatches = batches || [];
    } else if (audience === "By Courses") {
      cleanCourses = courses || [];
    } else if (audience === "By Category") {
      cleanCategories = categories || [];
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

    if (audience === "By Courses" && cleanCourses.length === 0) {
      if (req.file) await deleteFromCloudinary(req.file.path);
      return res.status(400).json({
        message: "Courses are required when audience is 'By Courses'"
      });
    }

    if (audience === "By Category" && cleanCategories.length === 0) {
      if (req.file) await deleteFromCloudinary(req.file.path);
      return res.status(400).json({
        message: "Categories are required when audience is 'By Category'"
      });
    }

    if (audience === "Individual interns" && cleanIndividualInterns.length === 0) {
      if (req.file) await deleteFromCloudinary(req.file.path);
      return res.status(400).json({
        message: "Individual interns are required when audience is 'Individual interns'"
      });
    }

    const newMaterial = await Material.create({
      title: title.trim(),
      mentor: mentor,
      attachments: attachmentsValue,
      audience: audience,
      branch: branchArray,
      batches: cleanBatches,
      courses: cleanCourses,
      categories: cleanCategories,
      individualInterns: cleanIndividualInterns,
      allowDownload: allowDownload !== undefined ? (allowDownload === 'true' || allowDownload === true) : true
    });

    res.status(201).json({
      message: "Material created successfully",
      data: newMaterial
    });
  } catch (error) {
    if (req.file) await deleteFromCloudinary(req.file.path);
    console.error('Error creating material:', error);
    res.status(500).json({ message: error.message });
  }
};

// Get all materials
const getMaterials = async (req, res) => {
  try {
    // Pagination parameters
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 5;
    const skip = (page - 1) * limit;

    // Search parameters
    const search = req.query.search || '';
    const audience = req.query.audience || '';
    const mentor = req.query.mentor || '';
    const branch = req.query.branch || '';

    // Build query object
    let query = {
      isActive: true,
      branch: { $exists: true, $not: { $size: 0 } }
    };

    // Add search functionality
    if (search) {
      const searchRegex = new RegExp(search, 'i');
      query.$or = [
        { title: { $regex: searchRegex } },
        { attachments: { $regex: searchRegex } }
      ];
    }

    // Add filters
    if (audience) {
      query.audience = audience;
    }
    if (mentor) {
      query.mentor = mentor;
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
    const totalCount = await Material.countDocuments(query);
    const totalPages = Math.ceil(totalCount / limit);

    // Get paginated results
    const materials = await Material.find(query)
      .populate('mentor', 'fullName email')
      .populate('branch', 'branchName location')
      .populate('batches', 'batchName description branch')
      .populate('courses', 'courseName description')
      .populate('categories', 'categoryName')
      .populate({
        path: 'individualInterns',
        select: 'fullName email branch courseStatus',
        match: { courseStatus: 'Ongoing' }
      })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    console.log('Found materials:', materials.length);
    res.status(200).json({
      message: "Materials retrieved successfully",
      data: materials,
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
    console.error('Error fetching materials:', error);
    res.status(500).json({ message: error.message });
  }
};

// Get single material by ID
const getMaterialById = async (req, res) => {
  try {
    const { id } = req.params;
    const material = await Material.findById(id)
      .populate('mentor', 'fullName email')
      .populate('branch', 'branchName location')
      .populate('batches', 'batchName description branch')
      .populate('courses', 'courseName description')
      .populate('categories', 'categoryName')
      .populate({
        path: 'individualInterns',
        select: 'fullName email branch courseStatus',
        match: { courseStatus: 'Ongoing' }
      });

    if (!material) {
      return res.status(404).json({
        message: "Material not found"
      });
    }

    res.status(200).json({
      message: "Material retrieved successfully",
      data: material
    });
  } catch (error) {
    console.error('Error fetching material:', error);
    res.status(500).json({ message: error.message });
  }
};

// Update material
const updateMaterial = async (req, res) => {
  try {
    const { id } = req.params;

    const currentMaterial = await Material.findById(id);
    if (!currentMaterial) {
      if (req.file) await deleteFromCloudinary(req.file.path);
      return res.status(404).json({
        message: "Material not found"
      });
    }

    const {
      title,
      mentor,
      attachments,
      audience,
      branch,
      batches,
      courses,
      categories,
      individualInterns,
      allowDownload
    } = req.body;

    // Validate audience if provided
    if (audience && !["All interns", "By batches", "By Courses", "By Category", "Individual interns"].includes(audience)) {
      if (req.file) await deleteFromCloudinary(req.file.path);
      return res.status(400).json({
        message: "Audience must be one of: 'All interns', 'By batches', 'By Courses', 'By Category', 'Individual interns'"
      });
    }

    const activeAudience = audience || currentMaterial.audience;
    const isAudienceChanged = audience && audience !== currentMaterial.audience;

    // Clean audience-specific fields based on selected audience
    let cleanBatches = [];
    let cleanCourses = [];
    let cleanCategories = [];
    let cleanIndividualInterns = [];

    if (activeAudience === "By batches") {
      cleanBatches = batches !== undefined ? batches : (isAudienceChanged ? [] : currentMaterial.batches);
    } else if (activeAudience === "By Courses") {
      cleanCourses = courses !== undefined ? courses : (isAudienceChanged ? [] : currentMaterial.courses);
    } else if (activeAudience === "By Category") {
      cleanCategories = categories !== undefined ? categories : (isAudienceChanged ? [] : currentMaterial.categories);
    } else if (activeAudience === "Individual interns") {
      cleanIndividualInterns = individualInterns !== undefined ? individualInterns : (isAudienceChanged ? [] : currentMaterial.individualInterns);
    }

    // Validate audience-specific fields
    if (activeAudience === "By batches" && cleanBatches.length === 0) {
      if (req.file) await deleteFromCloudinary(req.file.path);
      return res.status(400).json({
        message: "Batches are required when audience is 'By batches'"
      });
    }

    if (activeAudience === "By Courses" && cleanCourses.length === 0) {
      if (req.file) await deleteFromCloudinary(req.file.path);
      return res.status(400).json({
        message: "Courses are required when audience is 'By Courses'"
      });
    }

    if (activeAudience === "By Category" && cleanCategories.length === 0) {
      if (req.file) await deleteFromCloudinary(req.file.path);
      return res.status(400).json({
        message: "Categories are required when audience is 'By Category'"
      });
    }

    if (activeAudience === "Individual interns" && cleanIndividualInterns.length === 0) {
      if (req.file) await deleteFromCloudinary(req.file.path);
      return res.status(400).json({
        message: "Individual interns are required when audience is 'Individual interns'"
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

    const updateData = {};
    if (title) updateData.title = title.trim();
    if (mentor) updateData.mentor = mentor;

    // Handle uploaded file - remove attachments from updateData first to handle it separately
    delete updateData.attachments;

    let attachmentsValue = currentMaterial.attachments || undefined;
    if (req.file) {
      // New file uploaded

      // Delete old attachment from Cloudinary if it exists
      if (currentMaterial.attachments && currentMaterial.attachments !== req.file.path) {
        await deleteFromCloudinary(currentMaterial.attachments);
      }

      console.log('New attachment uploaded:', req.file.originalname, req.file.mimetype, req.file.path);
      attachmentsValue = req.file.path; // Cloudinary URL
      updateData.attachments = attachmentsValue;
    } else if (attachments && typeof attachments === 'string' && attachments.trim() !== '') {
      // Existing URL passed from frontend
      console.log('Preserving existing attachment URL:', attachments);
      attachmentsValue = attachments.trim();
      updateData.attachments = attachmentsValue;
    }

    if (audience) updateData.audience = audience;
    if (branchArray !== undefined) updateData.branch = branchArray;
    if (allowDownload !== undefined) {
      updateData.allowDownload = (allowDownload === 'true' || allowDownload === true);
    }
    updateData.batches = cleanBatches;
    updateData.courses = cleanCourses;
    updateData.categories = cleanCategories;
    updateData.individualInterns = cleanIndividualInterns;

    const updatedMaterial = await Material.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    )
      .populate('mentor', 'fullName email')
      .populate('branch', 'branchName location')
      .populate('batches', 'batchName description branch')
      .populate('courses', 'courseName description')
      .populate('categories', 'categoryName')
      .populate({
        path: 'individualInterns',
        select: 'fullName email branch courseStatus',
        match: { courseStatus: 'Ongoing' }
      });

    if (!updatedMaterial) {
      return res.status(404).json({
        message: "Material not found"
      });
    }

    res.status(200).json({
      message: "Material updated successfully",
      data: updatedMaterial
    });
  } catch (error) {
    if (req.file) await deleteFromCloudinary(req.file.path);
    console.error('Error updating material:', error);
    res.status(500).json({ message: error.message });
  }
};

// Delete material (soft delete + delete attachment from cloudinary)
const deleteMaterial = async (req, res) => {
  try {
    const { id } = req.params;

    // Find material first to get the attachment URL
    const materialToDelete = await Material.findById(id);

    if (!materialToDelete) {
      return res.status(404).json({
        message: "Material not found"
      });
    }

    // Delete the file from Cloudinary
    if (materialToDelete.attachments) {
      await deleteFromCloudinary(materialToDelete.attachments);
    }

    // Soft delete the material and remove the attachment reference
    const material = await Material.findByIdAndUpdate(
      id,
      { isActive: false, attachments: null },
      { new: true }
    );

    res.status(200).json({
      message: "Material deleted successfully"
    });
  } catch (error) {
    console.error('Error deleting material:', error);
    res.status(500).json({ message: error.message });
  }
};

// Get materials by mentor
const getMaterialsByMentor = async (req, res) => {
  try {
    const { mentorId } = req.params;
    const materials = await Material.find({
      mentor: mentorId,
      isActive: true
    })
      .populate('mentor', 'fullName email')
      .populate('branch', 'branchName location')
      .populate('batches', 'batchName description branch')
      .populate({
        path: 'individualInterns',
        select: 'fullName email branch courseStatus',
        match: { courseStatus: 'Ongoing' }
      })
      .sort({ createdAt: -1 });

    res.status(200).json({
      message: "Materials retrieved successfully",
      data: materials
    });
  } catch (error) {
    console.error('Error fetching materials by mentor:', error);
    res.status(500).json({ message: error.message });
  }
};

// Get materials by batch
const getMaterialsByBatch = async (req, res) => {
  try {
    const { batchId } = req.params;
    const materials = await Material.find({
      $or: [
        { audience: "All interns" },
        { audience: "By batches", batches: batchId }
      ],
      isActive: true
    })
      .populate('mentor', 'fullName email')
      .populate('branch', 'branchName location')
      .populate('batches', 'batchName description branch')
      .populate({
        path: 'individualInterns',
        select: 'fullName email branch courseStatus',
        match: { courseStatus: 'Ongoing' }
      })
      .sort({ createdAt: -1 });

    res.status(200).json({
      message: "Materials retrieved successfully",
      data: materials
    });
  } catch (error) {
    console.error('Error fetching materials by batch:', error);
    res.status(500).json({ message: error.message });
  }
};

// Get materials by course
const getMaterialsByCourse = async (req, res) => {
  try {
    res.status(200).json({
      message: "Courses audience is deprecated and courses are no longer supported.",
      data: []
    });
  } catch (error) {
    console.error('Error fetching materials by course:', error);
    res.status(500).json({ message: error.message });
  }
};

// Get materials by audience
const getMaterialsByAudience = async (req, res) => {
  try {
    const { audience } = req.params;
    const materials = await Material.find({
      audience: audience,
      isActive: true
    })
      .populate('mentor', 'fullName email')
      .populate('branch', 'branchName location')
      .populate('batches', 'batchName description branch')
      .populate({
        path: 'individualInterns',
        select: 'fullName email branch courseStatus',
        match: { courseStatus: 'Ongoing' }
      })
      .sort({ createdAt: -1 });

    res.status(200).json({
      message: "Materials retrieved successfully",
      data: materials
    });
  } catch (error) {
    console.error('Error fetching materials by audience:', error);
    res.status(500).json({ message: error.message });
  }
};

// Download attachment file (proxy through backend to avoid CORS issues)
const downloadAttachment = async (req, res) => {
  try {
    const { id } = req.params;

    console.log("id*******************", id);

    // Get material to retrieve attachment URL
    const material = await Material.findById(id);
    if (!material || !material.attachments) {
      return res.status(404).json({ message: "Material or attachment not found" });
    }

    if (material.allowDownload === false) {
      const Intern = require("../../models/administration/internModel");
      const isIntern = await Intern.exists({ _id: req.userId });
      if (isIntern) {
        return res.status(403).json({ message: "Downloading this material is disabled by the mentor/administrator." });
      }
    }

    const attachmentUrl = material.attachments;

    // Use axios to fetch file from Cloudinary
    const axios = require('axios');
    const cleanAxios = axios.create(); // Create an isolated instance with no default headers or interceptors

    try {
      // Fetch file as stream from Cloudinary
      const response = await cleanAxios.get(attachmentUrl, {
        responseType: 'stream',
        timeout: 30000, // 30 second timeout
        maxRedirects: 5
      });

      // Extract filename from URL or use material title
      const urlParts = attachmentUrl.split('/');
      let filename = urlParts[urlParts.length - 1] || 'attachment';

      // Clean up filename (remove query parameters if any)
      if (filename.includes('?')) {
        filename = filename.split('?')[0];
      }

      // Use material title as base if available
      if (material.title && filename === 'attachment') {
        const extension = attachmentUrl.includes('.pdf') ? '.pdf' :
          attachmentUrl.match(/\.(jpg|jpeg|png)$/i) ? attachmentUrl.match(/\.(jpg|jpeg|png)$/i)[0] : '';
        filename = `${material.title.replace(/[^a-z0-9]/gi, '_')}${extension}`;
      }

      // Set headers for file download
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      res.setHeader('Content-Type', response.headers['content-type'] || 'application/octet-stream');
      res.setHeader('Content-Length', response.headers['content-length'] || '');

      // Pipe the file stream to response
      response.data.pipe(res);

    } catch (fetchError) {
      console.error('Error fetching file from Cloudinary:', fetchError.message);

      // If axios fails, try native http/https as fallback
      const https = require('https');
      const http = require('http');
      const parsedUrl = new URL(attachmentUrl);
      const protocol = parsedUrl.protocol === 'https:' ? https : http;

      protocol.get(attachmentUrl, (response) => {
        if (response.statusCode !== 200) {
          return res.status(response.statusCode).json({
            message: `Failed to fetch file from Cloudinary. Status: ${response.statusCode}`
          });
        }

        // Set headers for file download
        const urlParts = attachmentUrl.split('/');
        const filename = urlParts[urlParts.length - 1] || 'attachment';

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
    console.error('Error in downloadAttachment:', error);
    res.status(500).json({ message: error.message || 'Error downloading attachment' });
  }
};

// Helper to build a comprehensive query to list all materials accessible to a specific intern
// according to batches, categories, courses, interns and individualInterns
const buildInternMaterialsQuery = async (internId) => {
  const Intern = require("../../models/administration/internModel");
  const Batch = require("../../models/schedule/batchModel");
  const Course = require("../../models/course-management/courseModel");

  const intern = await Intern.findById(internId);
  if (!intern) {
    return { intern: null, query: null, baseConditions: [] };
  }

  let queryInternObjectId = null;
  if (internId && mongoose.Types.ObjectId.isValid(internId)) {
    queryInternObjectId = new mongoose.Types.ObjectId(internId);
  }

  const internIdList = [queryInternObjectId, internId ? internId.toString() : null].filter(Boolean);

  const branchId = intern.branch;
  let queryBranchObjectId = null;
  if (branchId && mongoose.Types.ObjectId.isValid(branchId)) {
    queryBranchObjectId = new mongoose.Types.ObjectId(branchId);
  }
  const branchIdList = [branchId, queryBranchObjectId].filter(Boolean);

  // 1. Resolve all batches that this intern belongs to
  const batchQueryOr = [
    { interns: { $in: internIdList } }
  ];

  if (intern.batch) {
    const rawBatch = intern.batch.toString().trim();
    batchQueryOr.push({ batchName: rawBatch });
    batchQueryOr.push({ batchName: { $regex: new RegExp(`^${rawBatch}$`, 'i') } });
    if (mongoose.Types.ObjectId.isValid(rawBatch)) {
      batchQueryOr.push({ _id: new mongoose.Types.ObjectId(rawBatch) });
    }
  }

  const matchedBatches = await Batch.find({
    $or: batchQueryOr,
    isDeleted: { $ne: true }
  }).select('_id');

  const batchIdsSet = new Set(matchedBatches.map(b => b._id.toString()));
  if (intern.batch && mongoose.Types.ObjectId.isValid(intern.batch)) {
    batchIdsSet.add(intern.batch.toString());
  }

  const batchObjectIds = Array.from(batchIdsSet).map(id => new mongoose.Types.ObjectId(id));

  // 2. Resolve intern's course category for By Category matching
  let internCategoryId = null;
  if (intern.course) {
    const courseObj = await Course.findById(intern.course).select('category');
    if (courseObj && courseObj.category) {
      internCategoryId = courseObj.category;
    }
  }

  // 3. Build comprehensive audience matching conditions
  const baseConditions = [];

  // Condition 1: All interns (respecting branch restriction if specified)
  baseConditions.push({
    audience: { $regex: /^all interns$/i },
    ...(branchIdList.length > 0 ? {
      $or: [
        { branch: { $in: branchIdList } },
        { branch: null },
        { branch: { $size: 0 } }
      ]
    } : {})
  });

  // Condition 2: By batches (all batches associated with this intern)
  if (batchObjectIds.length > 0) {
    baseConditions.push({
      audience: { $regex: /^by batches$/i },
      batches: { $in: batchObjectIds }
    });
    baseConditions.push({
      batches: { $in: batchObjectIds }
    });
  }

  // Condition 3: By Category (category corresponding to intern's course)
  if (internCategoryId) {
    const categoryIds = [internCategoryId];
    if (mongoose.Types.ObjectId.isValid(internCategoryId)) {
      categoryIds.push(new mongoose.Types.ObjectId(internCategoryId));
    }
    baseConditions.push({
      audience: { $regex: /^by category$/i },
      categories: { $in: categoryIds }
    });
    baseConditions.push({
      categories: { $in: categoryIds }
    });
  }

  // Condition 4: By Courses (intern's enrolled course)
  if (intern.course) {
    const courseIds = [intern.course];
    if (mongoose.Types.ObjectId.isValid(intern.course)) {
      courseIds.push(new mongoose.Types.ObjectId(intern.course));
    }
    baseConditions.push({
      audience: { $regex: /^by course(s)?$/i },
      courses: { $in: courseIds }
    });
    baseConditions.push({
      courses: { $in: courseIds }
    });
  }

  // Condition 5: Individual interns (matching both individualInterns and interns fields)
  baseConditions.push({
    audience: { $regex: /^individual interns$/i },
    $or: [
      { individualInterns: { $in: internIdList } },
      { interns: { $in: internIdList } }
    ]
  });
  baseConditions.push({
    individualInterns: { $in: internIdList }
  });
  baseConditions.push({
    interns: { $in: internIdList }
  });

  const query = {
    isActive: { $ne: false },
    isDeleted: { $ne: true },
    $or: baseConditions
  };

  return { intern, query, baseConditions, batchObjectIds, internCategoryId };
};

// Get materials for the logged-in intern
const getMyMaterials = async (req, res) => {
  try {
    const internId = req.userId;
    if (!internId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const { intern, query, baseConditions } = await buildInternMaterialsQuery(internId);
    if (!intern) {
      return res.status(404).json({ message: "Intern not found" });
    }

    // Pagination parameters
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 5;
    const skip = (page - 1) * limit;

    // Search and filter parameters
    const search = req.query.search || '';
    const mentor = req.query.mentor || '';
    const audience = req.query.audience || '';

    // Apply audience filter if provided
    if (audience) {
      if (audience === "By batches") {
        query.audience = { $regex: /^by batches$/i };
      } else if (audience === "By Category") {
        query.audience = { $regex: /^by category$/i };
      } else if (audience === "By Courses") {
        query.audience = { $regex: /^by course(s)?$/i };
      } else if (audience === "Individual interns") {
        query.audience = { $regex: /^individual interns$/i };
      } else if (audience === "All interns") {
        query.audience = { $regex: /^all interns$/i };
      } else {
        query.audience = audience;
      }
    }

    // Apply search filter (title and attachment file name)
    if (search) {
      const searchRegex = new RegExp(search, 'i');
      query.$and = query.$and || [];
      query.$and.push({
        $or: [
          { title: { $regex: searchRegex } },
          { attachments: { $regex: searchRegex } }
        ]
      });
    }

    // Apply mentor filter
    if (mentor) {
      if (mongoose.Types.ObjectId.isValid(mentor)) {
        query.mentor = new mongoose.Types.ObjectId(mentor);
      } else {
        query.mentor = mentor;
      }
    }

    // Get total count for pagination
    const totalCount = await Material.countDocuments(query);
    const totalPages = Math.ceil(totalCount / limit);

    // Get paginated results with complete population
    const materials = await Material.find(query)
      .populate('mentor', 'fullName email')
      .populate('branch', 'branchName location')
      .populate('batches', 'batchName description branch')
      .populate('courses', 'courseName description')
      .populate('categories', 'categoryName')
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

    // Also get distinct mentors for the filter dropdown
    const allAssignedMaterials = await Material.find({
      isActive: { $ne: false },
      isDeleted: { $ne: true },
      $or: baseConditions
    }).populate('mentor', 'fullName email');

    const uniqueMentorsMap = new Map();
    allAssignedMaterials.forEach(m => {
      if (m.mentor && m.mentor._id) {
        uniqueMentorsMap.set(m.mentor._id.toString(), m.mentor);
      }
    });
    const uniqueMentors = Array.from(uniqueMentorsMap.values());

    res.status(200).json({
      message: "Materials retrieved successfully",
      data: materials,
      mentors: uniqueMentors,
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
    console.error('Error fetching intern materials:', error);
    res.status(500).json({ message: error.message });
  }
};

// Get materials for a specific intern by internId (accessible with internId parameter)
const getMaterialsByIntern = async (req, res) => {
  try {
    const { internId } = req.params;
    if (!internId) {
      return res.status(400).json({ message: "Intern ID is required" });
    }

    const { intern, query, baseConditions } = await buildInternMaterialsQuery(internId);
    if (!intern) {
      return res.status(404).json({ message: "Intern not found" });
    }

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const search = req.query.search || '';
    const mentor = req.query.mentor || '';
    const audience = req.query.audience || '';

    if (audience) {
      query.audience = { $regex: new RegExp(`^${audience}$`, 'i') };
    }

    if (search) {
      const searchRegex = new RegExp(search, 'i');
      query.$and = query.$and || [];
      query.$and.push({
        $or: [
          { title: { $regex: searchRegex } },
          { attachments: { $regex: searchRegex } }
        ]
      });
    }

    if (mentor) {
      if (mongoose.Types.ObjectId.isValid(mentor)) {
        query.mentor = new mongoose.Types.ObjectId(mentor);
      } else {
        query.mentor = mentor;
      }
    }

    const totalCount = await Material.countDocuments(query);
    const totalPages = Math.ceil(totalCount / limit);

    const materials = await Material.find(query)
      .populate('mentor', 'fullName email')
      .populate('branch', 'branchName location')
      .populate('batches', 'batchName description branch')
      .populate('courses', 'courseName description')
      .populate('categories', 'categoryName')
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

    res.status(200).json({
      message: "Materials retrieved successfully for intern",
      data: materials,
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
    console.error('Error fetching materials by intern:', error);
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  createMaterial,
  getMaterials,
  getMaterialById,
  updateMaterial,
  deleteMaterial,
  getMaterialsByMentor,
  getMaterialsByBatch,
  getMaterialsByCourse,
  getMaterialsByAudience,
  downloadAttachment,
  getMyMaterials,
  getMaterialsByIntern
};

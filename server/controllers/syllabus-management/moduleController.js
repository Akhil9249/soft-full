  // controllers/moduleController.js
const Module = require("../../models/syllabus-management/moduleModel");
const Course = require("../../models/course-management/courseModel");
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

// Create new module
const createModule = async (req, res) => {
  try {
    const { moduleName, course, moduleImage, topics } = req.body;

    if (!moduleName || !course) {
      if (req.file) await deleteFromCloudinary(req.file.path);
      return res.status(400).json({ message: "Module name and course are required" });
    }

    // Check if course exists
    const existingCourse = await Course.findById(course);
    if (!existingCourse) {
      if (req.file) await deleteFromCloudinary(req.file.path);
      return res.status(404).json({ message: "Course not found" });
    }

    // Check if module with same name already exists in this course
    const existingModule = await Module.findOne({ moduleName, course });
    if (existingModule) {
      if (req.file) await deleteFromCloudinary(req.file.path);
      return res.status(400).json({ message: "Module with this name already exists in this course" });
    }

    // Handle uploaded file
    let moduleImageUrl = moduleImage || null;
    if (req.file) {
      moduleImageUrl = req.file.path; // Cloudinary URL
    }

    const newModule = await Module.create({
      moduleName,
      course,
      moduleImage: moduleImageUrl,
      topics: topics || [],
      totalTopics: topics ? topics.length : 0
    });

    // Add module to course's modules array
    existingCourse.modules.push(newModule._id);
    existingCourse.totalModules = existingCourse.modules.length;
    await existingCourse.save();

    res.status(201).json({ message: "Module created successfully", data: newModule });
  } catch (error) {
    if (req.file) await deleteFromCloudinary(req.file.path);
    res.status(500).json({ message: error.message });
  }
};

// Get all modules
const getModules = async (req, res) => {
  try {
    // Pagination parameters
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 5;
    const skip = (page - 1) * limit;

    // Search parameters
    const search = req.query.search || '';
    const course = req.query.course || '';

    // Build query object
    let query = {};

    // Add search functionality
    if (search) {
      const searchRegex = new RegExp(search, 'i');
      query.$or = [
        { moduleName: { $regex: searchRegex } }
      ];
    }

    // Add course filter
    if (course) {
      query.course = course;
    }

    // Get total count for pagination
    const totalCount = await Module.countDocuments(query);
    const totalPages = Math.ceil(totalCount / limit);

    // Get paginated results
    const modules = await Module.find(query)
      .populate("course", "courseName")
      .populate("topics", "topicName")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);
    
    res.status(200).json({ 
      message: "Modules retrieved successfully", 
      data: modules,
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
    res.status(500).json({ message: error.message });
  }
};

// Get single module
const getModuleById = async (req, res) => {
  try {
    const module = await Module.findById(req.params.id)
      .populate("course", "courseName")
      .populate("topics", "topicName");
    if (!module) return res.status(404).json({ message: "Module not found" });
    res.status(200).json({ message: "Module retrieved successfully", data: module });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Update module
const updateModule = async (req, res) => {
  try {
    const { topics, course: newCourseId, moduleImage } = req.body;
    
    // Get current module to check if course is changing
    const currentModule = await Module.findById(req.params.id);
    if (!currentModule) {
      if (req.file) await deleteFromCloudinary(req.file.path);
      return res.status(404).json({ message: "Module not found" });
    }

    const updateData = { ...req.body };
    
    // Handle uploaded file - remove moduleImage from updateData first to handle it separately
    delete updateData.moduleImage;
    
    let moduleImageUrl = currentModule.moduleImage || null;
    
    if (req.file) {
      // If we are uploading a new document, delete the old one from Cloudinary!
      if (currentModule.moduleImage && currentModule.moduleImage !== req.file.path) {
        await deleteFromCloudinary(currentModule.moduleImage);
      }
      moduleImageUrl = req.file.path; // Cloudinary URL
      updateData.moduleImage = moduleImageUrl;
    } else if (moduleImage && typeof moduleImage === 'string' && moduleImage.trim() !== '') {
      // Existing URL passed from frontend
      moduleImageUrl = moduleImage;
      updateData.moduleImage = moduleImageUrl;
    }
    
    // If topics array is being updated, calculate totalTopics
    if (topics !== undefined) {
      updateData.totalTopics = topics.length;
    }

    // If course is changing, update course arrays
    if (newCourseId && newCourseId !== currentModule.course.toString()) {
      // Remove module from old course
      const oldCourse = await Course.findById(currentModule.course);
      if (oldCourse) {
        oldCourse.modules = oldCourse.modules.filter(moduleId => moduleId.toString() !== currentModule._id.toString());
        oldCourse.totalModules = oldCourse.modules.length;
        await oldCourse.save();
      }

      // Add module to new course
      const newCourse = await Course.findById(newCourseId);
      if (newCourse) {
        newCourse.modules.push(currentModule._id);
        newCourse.totalModules = newCourse.modules.length;
        await newCourse.save();
      }
    }

    const updated = await Module.findByIdAndUpdate(req.params.id, updateData, {
      new: true,
      runValidators: true,
    })
      .populate("course", "courseName")
      .populate("topics", "topicName");

    res.status(200).json({ message: "Module updated successfully", data: updated });
  } catch (error) {
    if (req.file) await deleteFromCloudinary(req.file.path);
    res.status(400).json({ message: error.message });
  }
};

// Remove topic from module
const removeTopicFromModule = async (req, res) => {
  try {
    const { moduleId, topicId } = req.params;

    const module = await Module.findById(moduleId);
    if (!module) return res.status(404).json({ message: "Module not found" });

    // Check if topic exists in module's topics array
    const topicIndex = module.topics.findIndex(topic => topic.toString() === topicId);
    if (topicIndex === -1) {
      return res.status(404).json({ message: "Topic not found in this module" });
    }

    // Remove topic from module's topics array
    module.topics.splice(topicIndex, 1);
    module.totalTopics = module.topics.length;
    await module.save();

    // Remove module reference from topic
    const Topic = require("../../models/syllabus-management/topicModel");
    await Topic.findByIdAndUpdate(topicId, { module: null });

    res.status(200).json({ 
      message: "Topic removed from module successfully", 
      data: module 
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Delete module
const deleteModule = async (req, res) => {
  try {
    const module = await Module.findById(req.params.id);
    if (!module) return res.status(404).json({ message: "Module not found" });

    // Clean up module file if it exists on Cloudinary
    if (module.moduleImage) {
      await deleteFromCloudinary(module.moduleImage);
    }

    await Module.findByIdAndDelete(req.params.id);

    // Remove module from course's modules array
    const course = await Course.findById(module.course);
    if (course) {
      course.modules = course.modules.filter(moduleId => moduleId.toString() !== module._id.toString());
      course.totalModules = course.modules.length;
      await course.save();
    }

    res.status(200).json({ message: "Module deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Download module file (proxy through backend to avoid CORS issues)
const downloadModuleFile = async (req, res) => {
  try {
    const { id } = req.params;

    const module = await Module.findById(id);
    if (!module || !module.moduleImage) {
      return res.status(404).json({ message: "Module or document not found" });
    }

    const fileUrl = module.moduleImage;

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
      let filename = urlParts[urlParts.length - 1] || 'document.pdf';

      // Clean up filename (remove query parameters if any)
      if (filename.includes('?')) {
        filename = filename.split('?')[0];
      }

      // Format filename with module name and original extension
      if (module.moduleName) {
        const safeName = module.moduleName.replace(/[^a-z0-9]/gi, '_');
        const ext = filename.includes('.') ? filename.substring(filename.lastIndexOf('.')) : '.pdf';
        filename = `${safeName}_Document${ext}`;
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
      const parsedUrl = new URL(fileUrl);
      const protocol = parsedUrl.protocol === 'https:' ? https : http;

      protocol.get(fileUrl, (response) => {
        if (response.statusCode !== 200) {
          return res.status(response.statusCode).json({
            message: `Failed to fetch file from Cloudinary. Status: ${response.statusCode}`
          });
        }

        const urlParts = fileUrl.split('/');
        let filename = urlParts[urlParts.length - 1] || 'document.pdf';
        if (module.moduleName) {
          const safeName = module.moduleName.replace(/[^a-z0-9]/gi, '_');
          const ext = filename.includes('.') ? filename.substring(filename.lastIndexOf('.')) : '.pdf';
          filename = `${safeName}_Document${ext}`;
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
    console.error('Error in downloadModuleFile:', error);
    res.status(500).json({ message: error.message || 'Error downloading file' });
  }
};

module.exports = {
  createModule,
  getModules,
  getModuleById,
  updateModule,
  removeTopicFromModule,
  deleteModule,
  downloadModuleFile,
};

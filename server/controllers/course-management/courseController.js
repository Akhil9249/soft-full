// controllers/courseController.js
const Course = require("../../models/course-management/courseModel");
const Category = require("../../models/course-management/categoryModel");
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

// Create new course
const createCourse = async (req, res) => {
  try {
    const { courseName, duration, category, courseType, courseFee, modules } = req.body;

    if (!courseName || !duration || !category || !courseType || !courseFee) {
      if (req.file) await deleteFromCloudinary(req.file.path);
      return res.status(400).json({ message: "All fields are required" });
    }

    // Check if category exists
    const existingCategory = await Category.findById(category);
    if (!existingCategory) {
      if (req.file) await deleteFromCloudinary(req.file.path);
      return res.status(404).json({ message: "Category not found" });
    }

    // Check if course with same name already exists in this category
    const existingCourse = await Course.findOne({ courseName, category });
    if (existingCourse) {
      if (req.file) await deleteFromCloudinary(req.file.path);
      return res.status(400).json({ message: "Course with this name already exists in this category" });
    }

    let syllabusUrl = null;
    if (req.file) {
      syllabusUrl = req.file.path;
    }

    const newCourse = await Course.create({
      courseName,
      duration,
      category,
      courseType,
      courseFee,
      syllabus: syllabusUrl,
      modules: modules || [],
      totalModules: modules ? modules.length : 0
    });

    // Add course to category's courses array
    existingCategory.courses.push(newCourse._id);
    existingCategory.totalCourses = existingCategory.courses.length;
    await existingCategory.save();

    res.status(201).json({ message: "Course created successfully", data: newCourse });
  } catch (error) {
    if (req.file) await deleteFromCloudinary(req.file.path);
    res.status(500).json({ message: error.message }); 
  }
};

// Get all courses
const getCourses = async (req, res) => {
  try {
    // Pagination parameters
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 5;
    const skip = (page - 1) * limit;

    // Search parameters
    const search = req.query.search || '';
    const category = req.query.category || '';
    const courseType = req.query.courseType || '';

    // Build query object
    let query = {};

    // Add search functionality
    if (search) {
      const searchRegex = new RegExp(search, 'i');
      query.$or = [
        { courseName: { $regex: searchRegex } },
        { duration: { $regex: searchRegex } },
        { courseType: { $regex: searchRegex } }
      ];
    }

    // Add filters
    if (category) {
      query.category = category;
    }
    if (courseType) {
      query.courseType = courseType;
    }

    // Get total count for pagination
    const totalCount = await Course.countDocuments(query);
    const totalPages = Math.ceil(totalCount / limit);

    // Get paginated results
    const courses = await Course.find(query)
      .populate("category", "categoryName branch")
      .populate("modules", "moduleName totalTopics")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);
    
    res.status(200).json({ 
      message: "Courses retrieved successfully", 
      data: courses,
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

// Get single course
const getCourseById = async (req, res) => {
  try {
    const course = await Course.findById(req.params.id)
      .populate("category", "categoryName")
      .populate("modules", "moduleName totalTopics");
    if (!course) return res.status(404).json({ message: "Course not found" });
    res.status(200).json({ message: "Course retrieved successfully", data: course });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Update course
const updateCourse = async (req, res) => {
  try {
    const { modules, category: newCategoryId, syllabus } = req.body;
    
    // Get current course to check if category is changing
    const currentCourse = await Course.findById(req.params.id);
    if (!currentCourse) {
      if (req.file) await deleteFromCloudinary(req.file.path);
      return res.status(404).json({ message: "Course not found" });
    }

    const updateData = { ...req.body };
    let syllabusUrl = currentCourse.syllabus;

    if (syllabus && typeof syllabus === 'string' && syllabus.trim() !== '') {
      syllabusUrl = syllabus;
    }

    if (req.file) {
      // If we are uploading a new syllabus, delete the old one from Cloudinary!
      if (currentCourse.syllabus && currentCourse.syllabus !== req.file.path) {
        await deleteFromCloudinary(currentCourse.syllabus);
      }
      syllabusUrl = req.file.path;
    }

    updateData.syllabus = syllabusUrl;
    
    // If modules array is being updated, calculate totalModules
    if (modules !== undefined) {
      updateData.totalModules = modules.length;
    }

    // If category is changing, update category arrays
    if (newCategoryId && newCategoryId !== currentCourse.category.toString()) {
      // Remove course from old category
      const oldCategory = await Category.findById(currentCourse.category);
      if (oldCategory) {
        oldCategory.courses = oldCategory.courses.filter(courseId => courseId.toString() !== currentCourse._id.toString());
        oldCategory.totalCourses = oldCategory.courses.length;
        await oldCategory.save();
      }

      // Add course to new category
      const newCategory = await Category.findById(newCategoryId);
      if (newCategory) {
        newCategory.courses.push(currentCourse._id);
        newCategory.totalCourses = newCategory.courses.length;
        await newCategory.save();
      }
    }

    const updated = await Course.findByIdAndUpdate(req.params.id, updateData, {
      new: true,
      runValidators: true,
    })
      .populate("category", "categoryName")
      .populate("modules", "moduleName totalTopics");

    res.status(200).json({ message: "Course updated successfully", data: updated });
  } catch (error) {
    if (req.file) await deleteFromCloudinary(req.file.path);
    res.status(400).json({ message: error.message });
  }
};

// Delete course
const deleteCourse = async (req, res) => {
  try {
    const course = await Course.findById(req.params.id);
    if (!course) return res.status(404).json({ message: "Course not found" });

    // Clean up syllabus file if it exists
    if (course.syllabus) {
      await deleteFromCloudinary(course.syllabus);
    }

    await Course.findByIdAndDelete(req.params.id);

    // Remove course from category's courses array
    const category = await Category.findById(course.category);
    if (category) {
      category.courses = category.courses.filter(courseId => courseId.toString() !== course._id.toString());
      category.totalCourses = category.courses.length;
      await category.save();
    }

    res.status(200).json({ message: "Course deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Download course syllabus (proxy through backend to avoid CORS issues)
const downloadSyllabus = async (req, res) => {
  try {
    const { id } = req.params;

    const course = await Course.findById(id);
    if (!course || !course.syllabus) {
      return res.status(404).json({ message: "Course or syllabus not found" });
    }

    const syllabusUrl = course.syllabus;

    // Use axios to fetch file from Cloudinary
    const axios = require('axios');
    const cleanAxios = axios.create(); // Create an isolated instance with no default headers or interceptors

    try {
      // Fetch file as stream from Cloudinary
      const response = await cleanAxios.get(syllabusUrl, {
        responseType: 'stream',
        timeout: 30000, // 30 second timeout
        maxRedirects: 5
      });

      // Extract filename from URL or use course name
      const urlParts = syllabusUrl.split('/');
      let filename = urlParts[urlParts.length - 1] || 'syllabus.pdf';

      // Clean up filename (remove query parameters if any)
      if (filename.includes('?')) {
        filename = filename.split('?')[0];
      }

      // Format filename with course name
      if (course.courseName) {
        const safeName = course.courseName.replace(/[^a-z0-9]/gi, '_');
        filename = `${safeName}_Syllabus.pdf`;
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
      const parsedUrl = new URL(syllabusUrl);
      const protocol = parsedUrl.protocol === 'https:' ? https : http;

      protocol.get(syllabusUrl, (response) => {
        if (response.statusCode !== 200) {
          return res.status(response.statusCode).json({
            message: `Failed to fetch file from Cloudinary. Status: ${response.statusCode}`
          });
        }

        const urlParts = syllabusUrl.split('/');
        let filename = urlParts[urlParts.length - 1] || 'syllabus.pdf';
        if (course.courseName) {
          const safeName = course.courseName.replace(/[^a-z0-9]/gi, '_');
          filename = `${safeName}_Syllabus.pdf`;
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
    console.error('Error in downloadSyllabus:', error);
    res.status(500).json({ message: error.message || 'Error downloading syllabus' });
  }
};

module.exports = {
  createCourse,
  getCourses,
  getCourseById,
  updateCourse,
  deleteCourse,
  downloadSyllabus,
};

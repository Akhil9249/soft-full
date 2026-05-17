// controllers/course-management/courseTypeController.js
const CourseType = require("../../models/course-management/courseTypeModel");

// Create new course type
const createCourseType = async (req, res) => {
  try {
    const { type, description } = req.body;

    if (!type || !description) {
      return res.status(400).json({ message: "Type and description are required" });
    }

    const newType = await CourseType.create({ type, description });
    res.status(201).json({ message: "Course type created successfully", data: newType });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get all course types
const getCourseTypes = async (req, res) => {
  try {
    const courseTypes = await CourseType.find().sort({ createdAt: -1 });
    res.status(200).json({ 
      message: "Course types retrieved successfully", 
      data: courseTypes 
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Update course type
const updateCourseType = async (req, res) => {
  try {
    const updated = await CourseType.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    
    if (!updated) return res.status(404).json({ message: "Course type not found" });

    res.status(200).json({ message: "Course type updated successfully", data: updated });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Delete course type
const deleteCourseType = async (req, res) => {
  try {
    const type = await CourseType.findByIdAndDelete(req.params.id);
    if (!type) return res.status(404).json({ message: "Course type not found" });

    res.status(200).json({ message: "Course type deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  createCourseType,
  getCourseTypes,
  updateCourseType,
  deleteCourseType,
};

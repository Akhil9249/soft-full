// controllers/course-management/courseDurationController.js
const CourseDuration = require("../../models/course-management/courseDurationModel");

// Create new course duration
const createCourseDuration = async (req, res) => {
  try {
    const { duration, description } = req.body;

    if (!duration || !description) {
      return res.status(400).json({ message: "Duration and description are required" });
    }

    const newDuration = await CourseDuration.create({ duration, description });
    res.status(201).json({ message: "Course duration created successfully", data: newDuration });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get all course durations
const getCourseDurations = async (req, res) => {
  try {
    const courseDurations = await CourseDuration.find().sort({ createdAt: -1 });
    res.status(200).json({ 
      message: "Course durations retrieved successfully", 
      data: courseDurations 
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Update course duration
const updateCourseDuration = async (req, res) => {
  try {
    const updated = await CourseDuration.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    
    if (!updated) return res.status(404).json({ message: "Course duration not found" });

    res.status(200).json({ message: "Course duration updated successfully", data: updated });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Delete course duration
const deleteCourseDuration = async (req, res) => {
  try {
    const durationObj = await CourseDuration.findByIdAndDelete(req.params.id);
    if (!durationObj) return res.status(404).json({ message: "Course duration not found" });

    res.status(200).json({ message: "Course duration deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  createCourseDuration,
  getCourseDurations,
  updateCourseDuration,
  deleteCourseDuration,
};

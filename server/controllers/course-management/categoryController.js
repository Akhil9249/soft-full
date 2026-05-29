// controllers/categoryController.js
const Category = require("../../models/course-management/categoryModel");
const mongoose = require("mongoose");

// Create new category
const createCategory = async (req, res) => {
  try {
    const { categoryName, branch, courses } = req.body;

    if (!categoryName || !branch || (Array.isArray(branch) && branch.length === 0)) {
      return res.status(400).json({ message: "Category name and branch are required" });
    }

    // Ensure branch is an array
    const branchArray = Array.isArray(branch) ? branch : [branch];

    // Check if category with same name already exists
    const existingCategory = await Category.findOne({ categoryName });
    if (existingCategory) {
      return res.status(400).json({ message: "Category with this name already exists" });
    }

    const newCategory = await Category.create({
      categoryName,
      branch: branchArray,
      courses: courses || [],
      totalCourses: courses ? courses.length : 0
    });

    const populatedCategory = await Category.findById(newCategory._id)
      .populate("branch", "branchName")
      .populate("courses", "courseName duration courseType courseFee");

    res.status(201).json({ message: "Category created successfully", data: populatedCategory });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get all categories
const getCategories = async (req, res) => {
  try {
    // Pagination parameters
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 5;
    const skip = (page - 1) * limit;

    // Search parameters
    const search = req.query.search || '';
    const branch = req.query.branch || '';

    // Build query object
    let query = {};

    // Add search functionality
    if (search) {
      const searchRegex = new RegExp(search, 'i');
      
      // Let's find any branches matching the search query
      const matchingBranchIds = [];
      try {
        const Branch = require("../../models/settings/branchModel");
        const matchingBranches = await Branch.find({ branchName: { $regex: searchRegex } }).select("_id");
        matchingBranches.forEach(b => matchingBranchIds.push(b._id));
      } catch (err) {
        console.error("Failed to load Branch model or search branches:", err);
      }

      query.$or = [
        { categoryName: { $regex: searchRegex } }
      ];

      if (matchingBranchIds.length > 0) {
        query.$or.push({ branch: { $in: matchingBranchIds } });
      }
    }

    // Add branch filter
    if (branch) {
      try {
        const Branch = require("../../models/settings/branchModel");
        const foundBranch = await Branch.findOne({ branchName: branch });
        if (foundBranch) {
          query.branch = foundBranch._id;
        } else {
          // If branch name is not found, force query to return empty
          query.branch = new mongoose.Types.ObjectId();
        }
      } catch (err) {
        console.error("Failed to filter by branch name:", err);
      }
    }

    // Get total count for pagination
    const totalCount = await Category.countDocuments(query);
    const totalPages = Math.ceil(totalCount / limit);

    // Get paginated results
    const categories = await Category.find(query)
      .populate("branch", "branchName")
      .populate("courses", "courseName duration courseType courseFee")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);
    
    res.status(200).json({ 
      message: "Categories retrieved successfully", 
      data: categories,
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

// Get single category
const getCategoryById = async (req, res) => {
  try {
    const category = await Category.findById(req.params.id)
      .populate("branch", "branchName")
      .populate("courses", "courseName duration courseType courseFee");
    if (!category) return res.status(404).json({ message: "Category not found" });
    res.status(200).json({ message: "Category retrieved successfully", data: category });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Update category
const updateCategory = async (req, res) => {
  try {
    const { courses, branch } = req.body;
    
    const updateData = { ...req.body };
    
    // If courses array is being updated, calculate totalCourses
    if (courses !== undefined) {
      updateData.totalCourses = courses.length;
    }

    // Coerce branch to array if provided
    if (branch !== undefined) {
      updateData.branch = Array.isArray(branch) ? branch : [branch];
    }

    const updated = await Category.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    )
      .populate("branch", "branchName")
      .populate("courses", "courseName duration courseType courseFee");

    if (!updated) return res.status(404).json({ message: "Category not found" });
    res.status(200).json({ message: "Category updated successfully", data: updated });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Delete category
const deleteCategory = async (req, res) => {
  try {
    const deleted = await Category.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ message: "Category not found" });
    res.status(200).json({ message: "Category deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  createCategory,
  getCategories,
  getCategoryById,
  updateCategory,
  deleteCategory,
};

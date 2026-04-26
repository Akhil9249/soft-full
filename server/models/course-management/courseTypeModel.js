// models/courseModel.js
const mongoose = require("mongoose");
const courseTypeSchema = new mongoose.Schema({
  type: { type: String, required: true }, // e.g. Online, Offline, Hybrid
  description: { type: String, required: true },
  isActive: { 
    type: Boolean, 
    default: true 
  },
}, { timestamps: true });

module.exports = mongoose.model("CourseType", courseTypeSchema);
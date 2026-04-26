// models/courseModel.js
const mongoose = require("mongoose");

const courseDurationSchema = new mongoose.Schema({
  duration: { type: String, required: true }, // e.g. "3 Months"
  description: { type: String, required: true },
  isActive: { 
    type: Boolean, 
    default: true 
  },
}, { timestamps: true });

module.exports = mongoose.model("CourseDuration", courseDurationSchema);

// models/moduleModel.js
const mongoose = require("mongoose");

const materialSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true },
  mentor: { type: mongoose.Schema.Types.ObjectId, ref: "Staff", required: true },
  attachments: { type: String, required: true },
  branch: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: "Branch",
    required: true
  }],
  audience: {
    type: String,
    enum: ["All interns", "By batches", "By Branches", "Individual interns"],
    default: "All interns",
    required: true
  },
  batches: {
    type: [mongoose.Schema.Types.ObjectId],
    ref: "Batch",
    default: []
  },
  interns: {
    type: [mongoose.Schema.Types.ObjectId],
    ref: "Intern",
    default: []
  },
  individualInterns: {
    type: [mongoose.Schema.Types.ObjectId],
    ref: "Intern",
    default: []
  },
  isActive: { type: Boolean, default: true },
  isDeleted: {
    type: Boolean,
    default: false,
  },

  deletedAt: {
    type: Date,
    default: null,
  }
}, { timestamps: true });
module.exports = mongoose.model("Material", materialSchema);

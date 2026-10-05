// models/notificationModel.js
const mongoose = require("mongoose");

const notificationSchema = new mongoose.Schema({
  title: { type: String, required: [true, "Notification title is required"], trim: true },
  content: { type: String, required: [true, "Notification content is required"] },
  type: { type: String, required: [true, "Notification type is required"], enum: ["Task Notification", "Weekly Schedule", "Common Notification", "Announcement", "Reminder"] }, // example types
  branch: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: "Branch",
    required: [true, "Branch selection is required"]
  }],
  audience: {
    type: String,
    enum: ["All interns", "By batches", "By Courses", "By Category", "Individual interns"],
    default: "All interns",
    required: [true, "Audience selection is required"]
  },
  batches: {
    type: [mongoose.Schema.Types.ObjectId],
    ref: "Batch",
    default: []
  },
  courses: {
    type: [mongoose.Schema.Types.ObjectId],
    ref: "Course",
    default: []
  },
  categories: {
    type: [mongoose.Schema.Types.ObjectId],
    ref: "Category",
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
  readBy: {
    type: [mongoose.Schema.Types.ObjectId],
    ref: "Intern",
    default: []
  },
  pushNotification: { type: Boolean, default: true },
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

module.exports = mongoose.model("Notification", notificationSchema);

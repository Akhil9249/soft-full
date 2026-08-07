const mongoose = require("mongoose");

const leaveRequestSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      refPath: "userModel",
      required: true,
    },
    userModel: {
      type: String,
      required: true,
      enum: ["User", "Intern", "Staff"],
      default: "User",
    },

    branch: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Branch",
      required: true,
    },

    leaveDurationType: {
      type: String,
      enum: ["SINGLE", "MULTIPLE"],
      required: true,
      default: "SINGLE",
    },

    leaveType: {
      type: String,
      enum: ["SICK", "PERSONAL", "MEDICAL", "FAMILY", "EXAM", "EVENT", "OTHER"],
      required: true,
    },

    date: {
      type: Date,
    },

    startDate: {
      type: Date,
    },

    endDate: {
      type: Date,
    },

    totalDays: {
      type: Number,
      required: true,
    },

    reason: {
      type: String,
      required: true,
      trim: true,
    },

    status: {
      type: String,
      enum: ["PENDING", "APPROVED", "REJECTED"],
      default: "PENDING",
    },

    appliedAt: {
      type: Date,
      default: Date.now,
    },

    reviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      refPath: "reviewedByModel",
    },
    reviewedByModel: {
      type: String,
      enum: ["User", "Staff"],
      default: "Staff",
    },

    reviewedAt: {
      type: Date,
    },

    rejectionReason: {
      type: String,
      trim: true,
    },

    attachments: [
      {
        fileUrl: String,
        fileName: String,
      },
    ],
    isDeleted: {
      type: Boolean,
      default: false,
    },

    deletedAt: {
      type: Date,
      default: null,
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model("LeaveRequest", leaveRequestSchema);
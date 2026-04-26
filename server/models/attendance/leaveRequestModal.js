const mongoose = require("mongoose");

const leaveRequestSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User", // or "Intern" / "Employee"
      required: true,
    },
    
    branch: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Branch",
      required: true,
    },

    // leaveType: {
    //   type: String,
    //   enum: ["SICK", "CASUAL", "PAID", "UNPAID", "OTHER"],
    //   required: true,
    // },

    leaveType: {
      type: String,
      enum: ["SICK","PERSONAL","MEDICAL","FAMILY","EXAM","EVENT","OTHER"],
      required: true,
    },

    startDate: {
      type: Date,
      required: true,
    },

    endDate: {
      type: Date,
      required: true,
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
      ref: "Staff", // Manager/Admin
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
  },
  { timestamps: true }
);

module.exports = mongoose.model("LeaveRequest", leaveRequestSchema);
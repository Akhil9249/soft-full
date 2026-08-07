const mongoose = require("mongoose");

const taskSubmissionSchema = new mongoose.Schema({
  task: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Task",
    required: true
  },
  intern: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Intern",
    required: true
  },
  submissionText: {
    type: String,
    trim: true,
    default: ""
  },
  attachments: {
    type: [String], // Array of file paths or URLs
    default: []
  },
  githubRepository: {
    type: String,
    trim: true,
    default: ""
  },
  liveDemoUrl: {
    type: String,
    trim: true,
    default: ""
  },
  status: {
    type: String,
    enum: ["Submitted", "Graded", "Rejected"],
    default: "Submitted"
  },
  achievedMarks: {
    type: Number,
    default: 0
  },
  feedback: {
    type: String,
    trim: true,
    default: ""
  },
  gradedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Staff",
    default: null
  },
  gradedAt: {
    type: Date,
    default: null
  }
}, { timestamps: true });

module.exports = mongoose.model("TaskSubmission", taskSubmissionSchema);

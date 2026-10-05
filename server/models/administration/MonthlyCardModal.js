const mongoose = require("mongoose");

const monthlyMentorCardSchema = new mongoose.Schema({
    internId: { type: mongoose.Schema.Types.ObjectId, ref: "Intern" },
    month: { type: Number },
    // subject: { type: mongoose.Schema.Types.ObjectId, ref: "Module" },
    // subject: { type: String },
    // topic: { type: mongoose.Schema.Types.ObjectId, ref: "Topic" },
    // startDate: { type: Date },
    // endDate: { type: Date },
    // topic: { type: String },
    aptitude: { type: String },
    aptitude_marks: { type: Number },
    aptitude_total: { type: Number },
    isAptitude: { type: Boolean },
    logical: { type: String },
    logical_marks: { type: Number },
    logical_total: { type: Number },
    isLogical: { type: Boolean },
    technical: { type: String },
    technical_marks: { type: Number },
    technical_total: { type: Number },
    isTechnical: { type: Boolean },
    communication: { type: String },
    communication_marks: { type: Number },
    communication_total: { type: Number },
    isCommunication: { type: Boolean },
    totalDays: { type: Number },
    attend: { type: String },
 
    note: { type: String },
    mentorId: { type: mongoose.Schema.Types.ObjectId, ref: "Staff" },
      isDeleted: {
    type: Boolean,
    default: false,
  },

  deletedAt: {
    type: Date,
    default: null,
  },
}, { timestamps: true });

monthlyMentorCardSchema.index({ internId: 1, month: 1, mentorId: 1 }, { unique: true });

module.exports = mongoose.model("MonthlyMentorCard", monthlyMentorCardSchema);
const mongoose = require("mongoose");

const mentorCardSchema = new mongoose.Schema({
    internId: { type: mongoose.Schema.Types.ObjectId, ref: "Intern" },
    week: { type: Number },
    // subject: { type: mongoose.Schema.Types.ObjectId, ref: "Module" },
    subject: { type: String },
    // topic: { type: mongoose.Schema.Types.ObjectId, ref: "Topic" },
    startDate: { type: Date },
    endDate: { type: Date },
    topic: { type: String },
    test_name: { type: String },
    test_marks: { type: Number },
    test_total: { type: Number },
    isTest: { type: Boolean },
    project_name: { type: String },
    project_marks: { type: Number },
    project_total: { type: Number },
    isProject: { type: Boolean },
    isSoftSkill: { type: Boolean },
    totalDays: { type: Number },
    attend: { type: String },
    // total: { type: Number },
    // band: { type: String },
    note: { type: String },
    mentorId: { type: mongoose.Schema.Types.ObjectId, ref: "Staff" },
}, { timestamps: true });

mentorCardSchema.index({ internId: 1, week: 1, mentorId: 1 }, { unique: true });

module.exports = mongoose.model("MentorCard", mentorCardSchema);
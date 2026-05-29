// models/batchModel.js
const mongoose = require("mongoose");

const weeklySchedulelSchema = new mongoose.Schema({

            startDate: { type: Date, required: true },
            endDate: { type: Date, required: true },
            mentor: { type: mongoose.Schema.Types.ObjectId, ref: "Staff", required: true },
            schedule: 
                {
                    time: { type: mongoose.Schema.Types.ObjectId, ref: "Timing" },
                    sub_details: {
                        day: {type: mongoose.Schema.Types.ObjectId,ref: "DayCombination"},
                        subject: { type: mongoose.Schema.Types.ObjectId, ref: "Module" },
                        branch: { type: mongoose.Schema.Types.ObjectId, ref: "Branch" },
                        batch: [{ type: mongoose.Schema.Types.ObjectId, ref: "Batch" }],
                        note: { type: String, trim: true }
                    }
                }
            


}, { timestamps: true });

module.exports = mongoose.model("WeeklySchedule", weeklySchedulelSchema);

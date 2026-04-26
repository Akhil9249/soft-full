// models/batchModel.js
const mongoose = require("mongoose");

const weeklySchedulelSchema = new mongoose.Schema({

            mentor: { type: mongoose.Schema.Types.ObjectId, ref: "Staff", required: true },
            schedule: 
                {
                    time: { type: mongoose.Schema.Types.ObjectId, ref: "Timing" },
                    sub_details: {
                        day: {type: mongoose.Schema.Types.ObjectId,ref: "DayCombination"},
                        subject: { type: String },
                        branch: { type: mongoose.Schema.Types.ObjectId, ref: "Branch" },
                        batch: [{ type: mongoose.Schema.Types.ObjectId, ref: "Batch" }]
                    }
                }
            


}, { timestamps: true });

// module.exports = mongoose.model("WeeklyScheduleTemp", weeklySchedulelSchema);

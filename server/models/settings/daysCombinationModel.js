// models/settings/branchModel.js
const mongoose = require("mongoose");

const dayCombinationSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    // enum: ["MWF","TTS","S"],
    trim: true,
  },
  // day: {
  //   type: String,
  //   required: true,
  //   enum: ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"],
  //   trim: true,
  //   unique: true
  // },
  //  combinationType:{
  //   type: String,
  //   required: true,
  //   enum: ["Morning", "Evening","Alternate","Weekend","Custom","Regular","Special"]
  // },
  dayCombination: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: "Day",
    required: true
  }],
  description: {
    type: String,
    required: true,
    trim: true
  },
  isActive: {
    type: Boolean,
    default: true
  },

}, { timestamps: true });

module.exports = mongoose.model("DayCombination", dayCombinationSchema);

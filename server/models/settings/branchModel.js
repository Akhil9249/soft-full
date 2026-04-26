// models/settings/branchModel.js
const mongoose = require("mongoose");

const branchSchema = new mongoose.Schema({
  branchName: { 
    type: String, 
    required: true, 
    trim: true, 
    unique: true 
  },
  batchType: {
    type: String,
    required: true,
    enum: ["Morning", "Evening","Alternate","Weekend","Custom","Regular","Special"]
  },
  days: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: "DayCombination",
    default: []
  }],
  time:[{
    type: mongoose.Schema.Types.ObjectId,
    ref: "Timing",
    default: []
  }],
  // combination:{
  //   type: String,
  //   required: true,
  //   enum: ["Morning", "Evening","Alternate","Weekend","Custom","Regular","Special"]
  // },
  location: { 
    type: String, 
    required: true, 
    trim: true 
  },
  isActive: { 
    type: Boolean, 
    default: true 
  },

}, { timestamps: true });

module.exports = mongoose.model("Branch", branchSchema);

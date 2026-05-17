// models/settings/branchModel.js
const mongoose = require("mongoose");

const daySchema = new mongoose.Schema({
  name:{
    type: String,
    required: true,
    enum: ["S","M","T","W","F"],
    trim: true,
  },
  day:{ 
    type: String, 
    required: true,
    enum: ["Sunday","Monday", "Tuesday", "Wednesday","Thursday","Friday","Saturday"], 
    trim: true,
    unique: true 
  },
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

module.exports = mongoose.model("Day", daySchema);

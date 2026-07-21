// models/topicModel.js
const mongoose = require("mongoose");

const topicSchema = new mongoose.Schema({
  topicName: { type: String, required: true, trim: true },
  module: { type: mongoose.Schema.Types.ObjectId, ref: "Module", required: true },
  isActive: { 
    type: Boolean, 
    default: true 
  },
    isDeleted: {
    type: Boolean,
    default: false,
  },

  deletedAt: {
    type: Date,
    default: null,
  }   
}, { timestamps: true });

module.exports = mongoose.model("Topic", topicSchema);

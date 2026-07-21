// models/pageModel.js
const mongoose = require("mongoose");

const pageSchema = new mongoose.Schema({
  menuName: { type: String, required: true, trim: true },
  pageTitle: { type: String, required: true, trim: true },
  pageSlug: { type: String, required: true, unique: true, lowercase: true, trim: true },
  pageContent: { type: String, required: true },
  metaKeyword: { type: String, trim: true },
  isActive: { type: Boolean, default: true },
  isDeleted: {
    type: Boolean,
    default: false,
  },

  deletedAt: {
    type: Date,
    default: null,
  }     
}, { timestamps: true });

module.exports = mongoose.model("Page", pageSchema);

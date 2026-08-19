const mongoose = require("mongoose");

const fcmTokenSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      refPath: "userModel"
    },
    userModel: {
      type: String,
      required: true,
      enum: ["User", "Staff", "Intern"]
    },
    token: {
      type: String,
      required: true,
      unique: true,
      trim: true
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model("FCMToken", fcmTokenSchema);

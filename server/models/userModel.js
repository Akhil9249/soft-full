const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Name is required"],
      trim: true,
      minlength: [3, "Name must be at least 3 characters long"],
      maxlength: [50, "Name cannot exceed 50 characters"],
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      trim: true,
      lowercase: true,
      match: [/^\S+@\S+\.\S+$/, "Please enter a valid email address"],
    },
    mobile: {
      type: String,
      required: [true, "Mobile number is required"],
      match: [/^\d{10}$/, "Mobile number must be exactly 10 digits"], 
      unique: true,
      trim: true
    },
    description: {
      type: String,
      // required: [true, "Mobile number is required"],
      match: [/^\d{10}$/, "Mobile number must be exactly 10 digits"],
    },
    password: {
      type: String,
      // required: [true, "Password is required"],
      minlength: [6, "Password must be at least 6 characters long"],
    },
    loginMethod: {
      type: String,
      enum: ["local", "google"],
      default: "local",
    },
    isActive: { type: Boolean, default: true },
    role: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Role"
    }
  },
  { timestamps: true }
);

// Create the model
const User = mongoose.model("User", userSchema);

// Drop the old username index if it exists (to fix the duplicate key error)
// This function will be called after database connection is established
const dropUsernameIndex = async () => {
  try {
    // Check if collection exists
    const collections = await mongoose.connection.db.listCollections().toArray();
    const userCollectionExists = collections.some(col => col.name === 'users');
    
    if (userCollectionExists) {
      // Get existing indexes
      const indexes = await User.collection.indexes();
      const usernameIndex = indexes.find(idx => idx.name === 'username_1' || (idx.key && idx.key.username));
      
      if (usernameIndex) {
        await User.collection.dropIndex("username_1");
        console.log("✅ Successfully dropped old username index");
      }
    }
  } catch (error) {
    if (error.code === 27 || error.codeName === 'IndexNotFound') {
      // Index doesn't exist, which is fine
      console.log("ℹ️  Username index not found (already removed or never existed)");
    } else {
      console.error("⚠️  Error dropping username index:", error.message);
      // Don't throw - allow app to continue
    }
  }
};

// Call the function when mongoose connection is ready
if (mongoose.connection.readyState === 1) {
  // Already connected
  dropUsernameIndex();
} else {
  // Wait for connection
  mongoose.connection.once('connected', () => {
    dropUsernameIndex();
  });
}

module.exports = {
  User,
  dropUsernameIndex, // Export for manual execution if needed
};


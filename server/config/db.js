const mongoose = require("mongoose");

let isConnected = false;

const connectDb = async () => {
  if (isConnected || mongoose.connection.readyState === 1) {
    console.log("=> Using cached database connection");
    isConnected = true;
    return;
  }

  try {
    console.log("=> Creating new database connection...");
    await mongoose.connect(process.env.MONGO_URI, {
      serverSelectionTimeoutMS: 30000,
      socketTimeoutMS: 45000,
      maxPoolSize: 10,
      minPoolSize: 2,
    });

    isConnected = true;
    console.log("✅ Database Connected");

    // Run database index cleanup asynchronously to not block request startup in serverless
    runIndexCleanup().catch(err => {
      console.error("⚠️ Async Index Cleanup error:", err);
    });

    // MongoDB connection events (registered only once)
    if (!mongoose.connection._events || !mongoose.connection._events.error) {
      mongoose.connection.on("connected", () => {
        console.log("🟢 MongoDB connected");
      }); 

      mongoose.connection.on("error", (err) => {
        console.log("🔴 MongoDB error:", err);
      });

      mongoose.connection.on("disconnected", () => {
        console.log("🟡 MongoDB disconnected");
        isConnected = false;
      });
    }

  } catch (error) {
    console.error("❌ MongoDB Connection Error:", error);
    // Stop server if DB connection fails in local, but return error in serverless
    if (process.env.NODE_ENV !== 'production') {
      process.exit(1);
    }
    throw error;
  }
};

// Async helper for index cleanup
const runIndexCleanup = async () => {
  const db = mongoose.connection.db;
  const collections = await db.listCollections().toArray();
  const userCollectionExists = collections.some(col => col.name === "users");

  if (userCollectionExists) {
    const usersCollection = db.collection("users");
    const indexes = await usersCollection.indexes();
    const usernameIndex = indexes.find(
      (idx) => idx.name === "username_1" || (idx.key && idx.key.username)
    );

    if (usernameIndex) {
      await usersCollection.dropIndex("username_1");
      console.log("✅ Successfully dropped old username index");
    }
  }
};

module.exports = connectDb;
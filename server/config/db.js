const mongoose = require("mongoose");

const connectDb = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI, {
      serverSelectionTimeoutMS: 30000,
      socketTimeoutMS: 45000,
      maxPoolSize: 10,
      minPoolSize: 2,
    });

    console.log("✅ Database Connected");

    // Drop old username index if exists
    try {
      const db = mongoose.connection.db;

      const collections = await db.listCollections().toArray();

      const userCollectionExists = collections.some(
        (col) => col.name === "users"
      );

      if (userCollectionExists) {
        const usersCollection = db.collection("users");

        const indexes = await usersCollection.indexes();

        const usernameIndex = indexes.find(
          (idx) =>
            idx.name === "username_1" ||
            (idx.key && idx.key.username)
        );

        if (usernameIndex) {
          await usersCollection.dropIndex("username_1");

          console.log(
            "✅ Successfully dropped old username index"
          );
        }
      }
    } catch (indexError) {
      if (
        indexError.code === 27 ||
        indexError.codeName === "IndexNotFound"
      ) {
        console.log(
          "ℹ️ Username index not found"
        );
      } else {
        console.error(
          "⚠️ Error dropping username index:",
          indexError.message
        );
      }
    }

    // MongoDB connection events
    mongoose.connection.on("connected", () => {
      console.log("🟢 MongoDB connected");
    }); 

    mongoose.connection.on("error", (err) => {
      console.log("🔴 MongoDB error:", err);
    });

    mongoose.connection.on("disconnected", () => {
      console.log("🟡 MongoDB disconnected");
    });

  } catch (error) {
    console.error("❌ MongoDB Connection Error:", error);

    // Stop server if DB connection fails
    process.exit(1);
  }
};

module.exports = connectDb;
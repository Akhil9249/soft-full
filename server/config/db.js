const mongoose = require("mongoose");

const connectDb = async () => {
  try {
    const connection = await mongoose.connect(process.env.MONGO_URI);
    console.log("Database Connected: ");
    
    // Drop old username index from users collection if it exists
    try {
      const db = mongoose.connection.db;
      const collections = await db.listCollections().toArray();
      const userCollectionExists = collections.some(col => col.name === 'users');
      
      if (userCollectionExists) {
        const usersCollection = db.collection('users');
        const indexes = await usersCollection.indexes();
        const usernameIndex = indexes.find(idx => idx.name === 'username_1' || (idx.key && idx.key.username));
        
        if (usernameIndex) {
          await usersCollection.dropIndex("username_1");
          console.log("✅ Successfully dropped old username index from users collection");
        }
      }
    } catch (indexError) {
      if (indexError.code === 27 || indexError.codeName === 'IndexNotFound') {
        console.log("ℹ️  Username index not found (already removed or never existed)");
      } else {
        console.error("⚠️  Error dropping username index:", indexError.message);
      }
    }
  } catch (error) {
    console.log(error);
  }
};

module.exports = connectDb;
const mongoose = require('mongoose');
const uri = "mongodb+srv://lms:ZPr5PnpUlfE8NaEU@lms.u3bhowv.mongodb.net/LMS?retryWrites=true&w=majority";

async function checkMentorCardIndexes() {
  try {
    await mongoose.connect(uri, { serverSelectionTimeoutMS: 5000 });
    const db = mongoose.connection.db;
    
    // The collection name is likely 'mentorcards' (Mongoose pluralizes and lowercases)
    // But let's check what collections exist first to be sure
    const collections = await db.listCollections().toArray();
    console.log("Collections:", collections.map(c => c.name));
    
    const collection = db.collection('mentorcards');
    
    if (collection) {
      const indexes = await collection.indexes();
      console.log("MentorCard Indexes:", JSON.stringify(indexes, null, 2));
    } else {
      console.log("Collection 'mentorcards' not found.");
    }
    process.exit(0);
  } catch (err) {
    console.error("Error:", err);
    process.exit(1);
  }
}
checkMentorCardIndexes();

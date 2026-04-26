const mongoose = require('mongoose');
const uri = "mongodb+srv://lms:ZPr5PnpUlfE8NaEU@lms.u3bhowv.mongodb.net/LMS?retryWrites=true&w=majority";

async function checkIndexes() {
  try {
    await mongoose.connect(uri, { serverSelectionTimeoutMS: 5000 });
    const db = mongoose.connection.db;
    const collection = db.collection('internsattendances');
    
    if (collection) {
      const indexes = await collection.indexes();
      console.log("Indexes currently in DB:", JSON.stringify(indexes, null, 2));
    }
    process.exit(0);
  } catch (err) {
    console.error("Error:", err);
    process.exit(1);
  }
}
checkIndexes();

const mongoose = require('mongoose');
const uri = "mongodb+srv://lms:ZPr5PnpUlfE8NaEU@lms.u3bhowv.mongodb.net/LMS?retryWrites=true&w=majority";

async function dropIndex() {
  try {
    await mongoose.connect(uri, { serverSelectionTimeoutMS: 5000 });
    const db = mongoose.connection.db;
    const collection = db.collection('internsattendances');
    
    if (collection) {
      try {
        await collection.dropIndex("intern_1_date_1_mentor_1");
        console.log("Dropped intern_1_date_1_mentor_1 index.");
      } catch (e) {
        console.log("Could not drop intern_1_date_1_mentor_1:", e.message);
      }
    }
    process.exit(0);
  } catch (err) {
    console.error("Error connecting to DB:", err);
    process.exit(1);
  }
}
dropIndex();

require("dotenv").config();
const connectDb = require("../config/db");
const Role = require("../models/administration/roleModel");
const mongoose = require("mongoose");

const run = async () => {
  try {
    await connectDb();
    console.log("DB connected successfully");

    const role = await Role.findOne({ role: /course coordinator/i });
    if (!role) {
      console.log("Course coordinator role not found!");
      const allRoles = await Role.find({});
      console.log("Available roles:", allRoles.map(r => r.role));
    } else {
      console.log("Found Role:", role.role);
      console.log("Role permissions:", JSON.stringify(role.permissions, null, 2));
    }
    
    await mongoose.connection.close();
    console.log("Connection closed.");
  } catch (error) {
    console.error("Error running script:", error);
    process.exit(1);
  }
};

run();

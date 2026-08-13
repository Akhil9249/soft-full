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
    } else {
      console.log("Found Role:", role.role);
      
      // Update all permissions to true
      const updatedPermissions = {};
      
      // Get all fields from the schema definition in Role
      const schemaPaths = Role.schema.paths;
      for (const path in schemaPaths) {
        if (path.startsWith("permissions.")) {
          // It's a permission path, e.g. permissions.studentManagement.addStudent
          const partOfPermission = path.replace("permissions.", "");
          const [category, action] = partOfPermission.split(".");
          if (category && action) {
            if (!updatedPermissions[category]) {
              updatedPermissions[category] = {};
            }
            updatedPermissions[category][action] = true;
          }
        }
      }
      
      role.permissions = updatedPermissions;
      await role.save();
      console.log("Updated Role permissions successfully!");
    }
    
    await mongoose.connection.close();
    console.log("Connection closed.");
  } catch (error) {
    console.error("Error running script:", error);
    process.exit(1);
  }
};

run();

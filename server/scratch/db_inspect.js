const mongoose = require("mongoose");
require("dotenv").config();
const connectDb = require("../config/db");
const { Staff } = require("../models/administration/staffModel");
const { User } = require("../models/administration/userModel");
const Role = require("../models/administration/roleModel");
const Branch = require("../models/settings/branchModel");

const run = async () => {
  try {
    await connectDb();
    console.log("---------------- ROLES ----------------");
    const roles = await Role.find({});
    roles.forEach(r => console.log(`ID: ${r._id}, Name: ${r.role}`));

    console.log("---------------- BRANCHES ----------------");
    const branches = await Branch.find({});
    branches.forEach(b => console.log(`ID: ${b._id}, Name: ${b.branchName}, isActive: ${b.isActive}`));

    console.log("---------------- STAFF MEMBERS ----------------");
    const staff = await Staff.find({}).populate('role').populate('branch');
    staff.forEach(s => {
      console.log(`ID: ${s._id}, Name: ${s.fullName}, Branch: ${s.branch ? s.branch.branchName : 'None'} (${s.branch ? s.branch._id : ''}), Role: ${s.role ? s.role.role : 'None'}, Active: ${s.isActive}, Status: ${s.employmentStatus}`);
    });

    console.log("---------------- USERS ----------------");
    const users = await User.find({}).populate('role');
    users.forEach(u => {
      console.log(`ID: ${u._id}, Name: ${u.name}, Role: ${u.role ? u.role.role : 'None'}`);
    });

    mongoose.connection.close();
  } catch (error) {
    console.error("Error inspecting database:", error);
    process.exit(1);
  }
};

run();

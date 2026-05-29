// models/roleModel.js
const mongoose = require("mongoose");

const roleSchema = new mongoose.Schema({
  role: {
    type: String,
    required: true,
    trim: true,
    unique: true
  },
  description: { 
    type: String, 
    required: true,
    // trim: true 
  },
  permissions: {
    studentManagement: {
      addStudent: { type: Boolean, default: false },
      viewStudent: { type: Boolean, default: false },
      editStudent: { type: Boolean, default: false },
      deleteStudent: { type: Boolean, default: false }
    },
    mentorManagement: {
      addMentor: { type: Boolean, default: false },
      viewMentor: { type: Boolean, default: false },
      editMentor: { type: Boolean, default: false },
      deleteMentor: { type: Boolean, default: false }
    },
    mentorCard: {
      addMentorCard: { type: Boolean, default: false },
      viewMentorCard: { type: Boolean, default: false },
      editMentorCard: { type: Boolean, default: false },
      deleteMentorCard: { type: Boolean, default: false }
    },
    courseManagement: {
      addCourse: { type: Boolean, default: false },
      viewCourse: { type: Boolean, default: false },
      editCourse: { type: Boolean, default: false },
      deleteCourse: { type: Boolean, default: false }
    },
    categoryManagement: {
      addCategory: { type: Boolean, default: false },
      viewCategory: { type: Boolean, default: false },
      editCategory: { type: Boolean, default: false },
      deleteCategory: { type: Boolean, default: false }
    },
    moduleManagement: {
      addModule: { type: Boolean, default: false },
      viewModule: { type: Boolean, default: false },
      editModule: { type: Boolean, default: false },
      deleteModule: { type: Boolean, default: false }
    },
    topicManagement: {
      addTopic: { type: Boolean, default: false },
      viewTopic: { type: Boolean, default: false },
      editTopic: { type: Boolean, default: false },
      deleteTopic: { type: Boolean, default: false }
    },
    taskManagement: {
      addTask: { type: Boolean, default: false },
      viewTask: { type: Boolean, default: false },
      editTask: { type: Boolean, default: false },
      deleteTask: { type: Boolean, default: false },
      downloadTask: { type: Boolean, default: false }
    },
    materialManagement: {
      addMaterial: { type: Boolean, default: false },
      viewMaterial: { type: Boolean, default: false },
      editMaterial: { type: Boolean, default: false },
      deleteMaterial: { type: Boolean, default: false }
    },
    weeklySchedule: {
      addSchedule: { type: Boolean, default: false },
      viewSchedule: { type: Boolean, default: false },
      editSchedule: { type: Boolean, default: false },
      deleteSchedule: { type: Boolean, default: false }
    },
    scheduleTiming: {
      addTiming: { type: Boolean, default: false },
      viewTiming: { type: Boolean, default: false },
      editTiming: { type: Boolean, default: false },
      deleteTiming: { type: Boolean, default: false }
    },
    staticPage: {
      addPage: { type: Boolean, default: false },
      viewPage: { type: Boolean, default: false },
      editPage: { type: Boolean, default: false },
      deletePage: { type: Boolean, default: false }
    },
    roleManagement: {
      addRole: { type: Boolean, default: false },
      viewRole: { type: Boolean, default: false },
      editRole: { type: Boolean, default: false },
      deleteRole: { type: Boolean, default: false }
    },
    userManagement: {
      addUser: { type: Boolean, default: false },
      viewUser: { type: Boolean, default: false },
      editUser: { type: Boolean, default: false },
      deleteUser: { type: Boolean, default: false }
    },
    notificationManagement: {
      addNotification: { type: Boolean, default: false },
      viewNotification: { type: Boolean, default: false },
      editNotification: { type: Boolean, default: false },
      deleteNotification: { type: Boolean, default: false }
    },
    reportManagement: {
      addReport: { type: Boolean, default: false },
      viewReport: { type: Boolean, default: false },
      editReport: { type: Boolean, default: false },
      deleteReport: { type: Boolean, default: false }
    },
    // timingManagement: {
    //   addTiming: { type: Boolean, default: false },
    //   viewTiming: { type: Boolean, default: false },
    //   editTiming: { type: Boolean, default: false },
    //   deleteTiming: { type: Boolean, default: false }
    // },
    attendanceManagement: {
      addAttendance: { type: Boolean, default: false },
      viewAttendance: { type: Boolean, default: false },
      editAttendance: { type: Boolean, default: false },
      deleteAttendance: { type: Boolean, default: false }
    },
    leaveRequestManagement: {
      addLeaveRequest: { type: Boolean, default: false },
      viewLeaveRequest: { type: Boolean, default: false },
      editLeaveRequest: { type: Boolean, default: false },
      deleteLeaveRequest: { type: Boolean, default: false }
    },
    batchManagement: {
      addBatch: { type: Boolean, default: false },
      viewBatch: { type: Boolean, default: false },
      editBatch: { type: Boolean, default: false },
      deleteBatch: { type: Boolean, default: false }
  },
  accountantManagement: {
    addAccountant: { type: Boolean, default: false },
    viewAccountant: { type: Boolean, default: false },
    editAccountant: { type: Boolean, default: false },
    deleteAccountant: { type: Boolean, default: false }
  },
                                                                                                                                                                                                                                                                                                            
},
isActive: { type: Boolean, default: true },

  // role: {
  //   type: mongoose.Schema.Types.ObjectId,
  //   ref: "Role",
  //   required: true
  // },

  // privilegeName: { 
  //   type: String, 
  //   required: true, 
  //   trim: true,
  //   unique: true,
  //   enum: ["Student Management", "Mentor Management", "Course Management", "Category Management", "Module Management", "Topic Management", "Task Management", "Weekly Schedule", "Schedule Timing", "Static Page"]
  // },

  // createdBy: { 
  //   type: mongoose.Schema.Types.ObjectId, 
  //   ref: "User",
  //   required: true 
  // },
  // updatedBy: { 
  //   type: mongoose.Schema.Types.ObjectId, 
  //   ref: "User" 
  // }
}, { timestamps: true });

// Pre-save middleware to set updatedBy
roleSchema.pre('save', function(next) {
  if (this.isModified() && !this.isNew) {
    this.updatedBy = this.createdBy; // You can modify this logic as needed
  }
  next();
});

module.exports = mongoose.model("Role", roleSchema);

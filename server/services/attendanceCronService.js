// services/attendanceCronService.js
const Intern = require("../models/administration/internModel");
const InternsAttendance = require("../models/attendance/internsAttendanceModel");
const { Staff } = require("../models/administration/staffModel");
const Role = require("../models/administration/roleModel");

// Function to create daily attendance records for all ongoing interns
const createDailyAttendanceRecords = async (allowedInternIds = null, mentorId = null, dateStr = null) => {
  try {
    console.log(`Starting daily attendance creation process for ${dateStr || 'today'}...`);
    
    // Get current date formatted as YYYY-MM-DD string
    let formattedToday;
    if (dateStr) {
      const d = new Date(dateStr);
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      formattedToday = `${year}-${month}-${day}`;
    } else {
      const today = new Date();
      const year = today.getFullYear();
      const month = String(today.getMonth() + 1).padStart(2, '0');
      const day = String(today.getDate()).padStart(2, '0');
      formattedToday = `${year}-${month}-${day}`;
    }
    
    // Build query for ongoing interns
    const query = { 
      courseStatus: "Ongoing"
    };
    
    // If specific intern IDs are provided (for mentors), filter by them
    if (allowedInternIds && allowedInternIds.length > 0) {
      query._id = { $in: allowedInternIds };
    }
    
    // Get all interns with "Ongoing" course status
    const ongoingInterns = await Intern.find(query);
    console.log("ongoingInterns",ongoingInterns);
    
    console.log(`Found ${ongoingInterns.length} ongoing interns`);
    
    if (ongoingInterns.length === 0) {
      console.log('No ongoing interns found. Skipping attendance creation.');
      return;
    }
    
    let resolvedMentorId = mentorId;
    if (!resolvedMentorId) {
      // Get a default admin user to mark attendance if not provided manually
      const mentorRole = await Role.findOne({ role: "mentor" });
      if (!mentorRole) {
        console.error('Mentor role not found');
        return;
      }
      
      const defaultAdmin = await Staff.findOne({ 
        role: mentorRole._id, 
        isActive: true 
      });
      
      if (!defaultAdmin) {
        console.error('No admin user found to mark attendance');
        return;
      }
      resolvedMentorId = defaultAdmin._id;
    }
    
    const attendanceRecords = [];
    const errors = [];
    
    // Create attendance records for each intern
    for (const intern of ongoingInterns) {
      try {
        // Check if attendance already exists for this intern on this date by this mentor
        const existingAttendance = await InternsAttendance.findOne({
          intern: intern._id,
          date: formattedToday,
          mentor: resolvedMentorId
        });
        
        if (existingAttendance) {
          console.log(`Attendance already exists for intern ${intern.fullName} on ${formattedToday}`);
          continue;
        }
        
        // Create new attendance record
        const attendanceRecord = {
          intern: intern._id,
          date: formattedToday,
          status: false, // Default to absent (will be updated when they actually attend)
          mentor: resolvedMentorId,
          markedBy: resolvedMentorId,
          remarks: "Auto-generated daily attendance record"
        };
        
        attendanceRecords.push(attendanceRecord);
        
      } catch (error) {
        console.error(`Error creating attendance for intern ${intern.fullName}:`, error.message);
        errors.push({
          intern: intern.fullName,
          error: error.message
        });
      }
    }
    
    // Bulk insert attendance records
    if (attendanceRecords.length > 0) {
      const createdRecords = await InternsAttendance.insertMany(attendanceRecords);
      console.log(`Successfully created ${createdRecords.length} attendance records`);
    }
    
    // Log any errors
    if (errors.length > 0) {
      console.error('Errors during attendance creation:', errors);
    }
    
    console.log('Daily attendance creation process completed');
    
  } catch (error) {
    console.error('Error in createDailyAttendanceRecords:', error);
  }
};

// Function to update attendance for a specific intern on a specific date (and optional batch)
const updateInternAttendance = async (internId, date, status, markedBy, remarks = '', batch = null) => {
  try {
    // Format date to YYYY-MM-DD string format
    const dateObj = new Date(date);
    const year = dateObj.getFullYear();
    const month = String(dateObj.getMonth() + 1).padStart(2, '0');
    const day = String(dateObj.getDate()).padStart(2, '0');
    const formattedDate = `${year}-${month}-${day}`;
    
    // Find or create attendance record
    const searchParams = {
      intern: internId,
      date: formattedDate,
      mentor: markedBy
    };
    if (batch) {
      searchParams.batch = batch;
    }
    
    let attendance = await InternsAttendance.findOne(searchParams);
    
    if (!attendance) {
      // Create new attendance record
      attendance = await InternsAttendance.create({
        intern: internId,
        date: formattedDate,
        status: status,
        mentor: markedBy,
        markedBy: markedBy,
        batch: batch,
        remarks: remarks || 'Updated via API'
      });
    } else {
      // Update existing record
      attendance.status = status;
      attendance.markedBy = markedBy;
      attendance.remarks = remarks || attendance.remarks;
      await attendance.save();
    }
    
    return attendance;
  } catch (error) {
    console.error('Error updating intern attendance:', error);
    throw error;
  }
};

// Function to get attendance summary for a date range
const getAttendanceSummary = async (startDate, endDate, allowedInternIds = null, mentorId = null) => {
  try {
    const start = new Date(startDate);
    const end = new Date(endDate);
    start.setHours(0, 0, 0, 0);
    end.setHours(23, 59, 59, 999);
    
    // Build match criteria
    const matchCriteria = {
      date: { $gte: start, $lte: end },
      isActive: true
    };
    
    // If specific intern IDs are provided (for mentors), filter by them
    if (allowedInternIds && allowedInternIds.length > 0) {
      matchCriteria.intern = { $in: allowedInternIds };
    }
    
    // If mentorId is provided, only include records created by that mentor
    if (mentorId) {
      matchCriteria.mentor = mentorId;
    }
    
    const summary = await InternsAttendance.aggregate([
      {
        $match: matchCriteria
      },
      {
        $lookup: {
          from: 'interns',
          localField: 'intern',
          foreignField: '_id',
          as: 'internDetails'
        }
      },
      {
        $unwind: '$internDetails'
      },
      {
        $group: {
          _id: {
            date: { $dateToString: { format: "%Y-%m-%d", date: "$date" } },
            status: { $cond: [{ $eq: ["$status", true] }, "Present", "Absent"] }
          },
          count: { $sum: 1 },
          interns: { $push: "$internDetails.fullName" }
        }
      },
      {
        $group: {
          _id: "$_id.date",
          attendance: {
            $push: {
              status: "$_id.status",
              count: "$count",
              interns: "$interns"
            }
          }
        }
      },
      {
        $sort: { _id: 1 }
      }
    ]);
    
    return summary;
  } catch (error) {
    console.error('Error getting attendance summary:', error);
    throw error;
  }
};

module.exports = {
  createDailyAttendanceRecords,
  updateInternAttendance,
  getAttendanceSummary
};

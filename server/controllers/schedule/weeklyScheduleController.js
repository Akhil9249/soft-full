// controllers/schedule/weeklyScheduleController.js
const WeeklySchedule = require("../../models/schedule/weeklyScheduleModel");

const createWeeklySchedule = async (req, res) => {
  try {
    const { startDate, endDate, mentor, schedule } = req.body;
    console.log('Creating weekly schedule:', { startDate, endDate, mentor, schedule });

    if (!startDate || !endDate) {
      return res.status(400).json({ message: "Start date and End date are required" });
    }

    if (!mentor) {
      return res.status(400).json({ message: "Mentor is required" });
    }

    if (!schedule) {
      return res.status(400).json({ message: "Schedule object is required" });
    }

    const newWeeklySchedule = await WeeklySchedule.create({ startDate, endDate, mentor, schedule });
    console.log('Weekly schedule created successfully:', newWeeklySchedule);
    res.status(201).json({ message: "Weekly schedule created successfully", data: newWeeklySchedule });
  } catch (error) {
    console.error('Error creating weekly schedule:', error);
    res.status(500).json({ message: error.message });
  }
};

// Get All Weekly Schedules
const getWeeklySchedules = async (req, res) => {
  try {
    console.log('Fetching weekly schedules...');
    const { startDate, endDate, branch } = req.query;

    let filter = {};
    if (startDate && endDate) {
      filter.startDate = { $gte: new Date(startDate) };
      filter.endDate = { $lte: new Date(endDate) };
    }
    if (branch) {
      filter['schedule.sub_details.branch'] = branch;
    }

    const weeklySchedules = await WeeklySchedule.find(filter)
      .populate({
        path: 'mentor',
        select: 'fullName email'
      })
      .populate({
        path: 'schedule.time',
      })
      .populate({
        path: 'schedule.sub_details.day',
      })
      .populate({
        path: 'schedule.sub_details.branch',
      })
      .populate({
        path: 'schedule.sub_details.subject',
      })
      .populate({
        path: 'schedule.sub_details.batch',
        select: 'batchName branchName'
      });
    console.log('Found weekly schedules:', weeklySchedules.length);
    res.status(200).json({ message: "Weekly schedules retrieved successfully", data: weeklySchedules });
  } catch (error) {
    console.error('Error fetching weekly schedules:', error);
    res.status(500).json({ message: error.message });
  }
};

// Get Single Weekly Schedule
const getWeeklyScheduleById = async (req, res) => {
  try {
    const weeklySchedule = await WeeklySchedule.findById(req.params.id)
      .populate({
        path: 'mentor',
        select: 'fullName email'
      })
      .populate({
        path: 'schedule.time',
      })
      .populate({
        path: 'schedule.sub_details.day',
      })
      .populate({
        path: 'schedule.sub_details.branch',
      })
      .populate({
        path: 'schedule.sub_details.subject',
      })
      .populate({
        path: 'schedule.sub_details.batch',
        select: 'batchName branchName'
      });

    if (!weeklySchedule) return res.status(404).json({ message: "Weekly schedule not found" });
    res.status(200).json({ message: "Weekly schedule retrieved successfully", data: weeklySchedule });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Update Weekly Schedule
const updateWeeklySchedule = async (req, res) => {
  try {
    const { startDate, endDate, mentor, schedule } = req.body;

    if (!mentor) {
      return res.status(400).json({ message: "Mentor is required" });
    }

    if (!schedule) {
      return res.status(400).json({ message: "Schedule object is required" });
    }

    const updateFields = { mentor, schedule };
    if (startDate) updateFields.startDate = startDate;
    if (endDate) updateFields.endDate = endDate;

    const updated = await WeeklySchedule.findByIdAndUpdate(req.params.id, updateFields, {
      new: true,
      runValidators: true,
    })
      .populate({
        path: 'mentor',
        select: 'fullName email'
      })
      .populate({
        path: 'schedule.time',
      })
      .populate({
        path: 'schedule.sub_details.day',
      })
      .populate({
        path: 'schedule.sub_details.branch',
      })
      .populate({
        path: 'schedule.sub_details.subject',
      })
      .populate({
        path: 'schedule.sub_details.batch',
        select: 'batchName branchName'
      });

    if (!updated) return res.status(404).json({ message: "Weekly schedule not found" });
    res.status(200).json({ message: "Weekly schedule updated successfully", data: updated });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Delete Weekly Schedule
const deleteWeeklySchedule = async (req, res) => {
  try {
    const deleted = await WeeklySchedule.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ message: "Weekly schedule not found" });
    res.status(200).json({ message: "Weekly schedule deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Add Batch to Sub Details
const addBatchToSubDetails = async (req, res) => {
  try {
    const { batchId } = req.body;
    const { id } = req.params; // weekly schedule id

    console.log('Adding batch to sub details:', { batchId });

    if (!batchId) {
      return res.status(400).json({ message: "Batch ID is required" });
    }

    const weeklySchedule = await WeeklySchedule.findById(id);
    if (!weeklySchedule) {
      return res.status(404).json({ message: "Weekly schedule not found" });
    }

    if (!weeklySchedule.schedule || !weeklySchedule.schedule.sub_details) {
      return res.status(404).json({ message: "Specified schedule path not found" });
    }

    weeklySchedule.schedule.sub_details.batch.push(batchId);
    await weeklySchedule.save();

    const updatedSchedule = await WeeklySchedule.findById(id)
      .populate({
        path: 'mentor',
        select: 'fullName email'
      })
      .populate({
        path: 'schedule.time',
      })
      .populate({
        path: 'schedule.sub_details.day',
      })
      .populate({
        path: 'schedule.sub_details.branch',
      })
      .populate({
        path: 'schedule.sub_details.subject',
      })
      .populate({
        path: 'schedule.sub_details.batch',
        select: 'batchName branchName'
      });

    res.status(200).json({ message: "Batch added to sub details successfully", data: updatedSchedule });
  } catch (error) {
    console.error('Error adding batch to sub details:', error);
    res.status(500).json({ message: error.message });
  }
};

// Remove Batch from Sub Details
const removeBatchFromSubDetails = async (req, res) => {
  try {
    const { batchId } = req.body;
    const { id } = req.params; // weekly schedule id

    console.log('Removing batch from sub details:', { batchId });

    if (!batchId) {
      return res.status(400).json({ message: "Batch ID is required" });
    }

    const weeklySchedule = await WeeklySchedule.findById(id);
    if (!weeklySchedule) {
      return res.status(404).json({ message: "Weekly schedule not found" });
    }

    if (!weeklySchedule.schedule || !weeklySchedule.schedule.sub_details) {
      return res.status(404).json({ message: "Specified schedule path not found" });
    }

    const batchArray = weeklySchedule.schedule.sub_details.batch;
    const batchIndex = batchArray.findIndex(batch => batch.toString() === batchId);

    if (batchIndex === -1) {
      return res.status(404).json({ message: "Batch not found in sub details" });
    }

    batchArray.splice(batchIndex, 1);

    const isNoteEmpty = !weeklySchedule.schedule.sub_details.note || weeklySchedule.schedule.sub_details.note.trim() === '';
    const isBatchesEmpty = batchArray.length === 0;

    if (isNoteEmpty && isBatchesEmpty) {
      await WeeklySchedule.findByIdAndDelete(id);
      return res.status(200).json({ message: "Schedule automatically deleted as it has no assigned batches or notes", deleted: true });
    }

    await weeklySchedule.save();

    const updatedSchedule = await WeeklySchedule.findById(id)
      .populate({
        path: 'mentor',
        select: 'fullName email'
      })
      .populate({
        path: 'schedule.time',
      })
      .populate({
        path: 'schedule.sub_details.day',
      })
      .populate({
        path: 'schedule.sub_details.branch',
      })
      .populate({
        path: 'schedule.sub_details.subject',
      })
      .populate({
        path: 'schedule.sub_details.batch',
        select: 'batchName branchName'
      });

    res.status(200).json({ message: "Batch removed from sub details successfully", data: updatedSchedule });
  } catch (error) {
    console.error('Error removing batch from sub details:', error);
    res.status(500).json({ message: error.message });
  }
};

// Update Subject in Sub Details
const updateSubjectInSubDetails = async (req, res) => {
  try {
    const { subject } = req.body;
    const { id } = req.params; // weekly schedule id

    console.log('Updating subject in sub details:', { subject });

    const weeklySchedule = await WeeklySchedule.findById(id);
    if (!weeklySchedule) {
      return res.status(404).json({ message: "Weekly schedule not found" });
    }

    if (!weeklySchedule.schedule || !weeklySchedule.schedule.sub_details) {
      return res.status(404).json({ message: "Specified schedule path not found" });
    }

    // Update the subject
    weeklySchedule.schedule.sub_details.subject = subject || '';

    await weeklySchedule.save();

    const updatedSchedule = await WeeklySchedule.findById(id)
      .populate({
        path: 'mentor',
        select: 'fullName email'
      })
      .populate({
        path: 'schedule.time',
      })
      .populate({
        path: 'schedule.sub_details.day',
      })
      .populate({
        path: 'schedule.sub_details.branch',
      })
      .populate({
        path: 'schedule.sub_details.subject',
      })
      .populate({
        path: 'schedule.sub_details.batch',
        select: 'batchName branchName'
      });

    res.status(200).json({ message: "Subject updated successfully", data: updatedSchedule });
  } catch (error) {
    console.error('Error updating subject in sub details:', error);
    res.status(500).json({ message: error.message });
  }
};

// Update Note in Sub Details
const updateNoteInSubDetails = async (req, res) => {
  try {
    const { note } = req.body;
    const { id } = req.params; // weekly schedule id

    console.log('Updating note in sub details:', { note });

    const weeklySchedule = await WeeklySchedule.findById(id);
    if (!weeklySchedule) {
      return res.status(404).json({ message: "Weekly schedule not found" });
    }

    if (!weeklySchedule.schedule || !weeklySchedule.schedule.sub_details) {
      return res.status(404).json({ message: "Specified schedule path not found" });
    }

    // Check if we should automatically delete the schedule
    const isNoteEmpty = !note || note.trim() === '';
    const isBatchesEmpty = !weeklySchedule.schedule.sub_details.batch || weeklySchedule.schedule.sub_details.batch.length === 0;

    if (isNoteEmpty && isBatchesEmpty) {
      await WeeklySchedule.findByIdAndDelete(id);
      return res.status(200).json({ message: "Schedule automatically deleted because it has no note and no assigned batches", deleted: true });
    }

    // Update the note
    weeklySchedule.schedule.sub_details.note = note || '';

    await weeklySchedule.save();

    const updatedSchedule = await WeeklySchedule.findById(id)
      .populate({
        path: 'mentor',
        select: 'fullName email'
      })
      .populate({
        path: 'schedule.time',
      })
      .populate({
        path: 'schedule.sub_details.day',
      })
      .populate({
        path: 'schedule.sub_details.branch',
      })
      .populate({
        path: 'schedule.sub_details.subject',
      })
      .populate({
        path: 'schedule.sub_details.batch',
        select: 'batchName branchName'
      });

    res.status(200).json({ message: "Note updated successfully", data: updatedSchedule });
  } catch (error) {
    console.error('Error updating note in sub details:', error);
    res.status(500).json({ message: error.message });
  }
};

// Get All Mentors with Their Assigned Batches
const getAllMentorsWithBatches = async (req, res) => {
  try {
    console.log('Fetching all mentors with their assigned batches...');
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 5;
    const branch = req.query.branch;
    const { startDate, endDate } = req.query;

    let filter = {};
    if (branch) {
      filter['schedule.sub_details.branch'] = branch;
    }
    if (startDate && endDate) {
      filter.startDate = { $gte: new Date(startDate) };
      filter.endDate = { $lte: new Date(endDate) };
    }

    // Get all weekly schedules with populated data
    const weeklySchedules = await WeeklySchedule.find(filter)
      .populate({
        path: 'mentor',
        select: 'fullName email role branch',
        populate: {
          path: 'role',
          select: 'role'
        }
      })
      .populate({
        path: 'schedule.time',
      })
      .populate({
        path: 'schedule.sub_details.day',
      })
      .populate({
        path: 'schedule.sub_details.branch',
      })
      .populate({
        path: 'schedule.sub_details.subject',
      })
      .populate({
        path: 'schedule.sub_details.batch',
        select: 'batchName branch',
        populate: [
          {
            path: 'branch',
            select: 'branchName'
          },
          {
            path: 'interns',
            select: 'course fullName',
            populate: {
              path: 'course',
              select: 'courseName'
            }
          }
        ]
      });

    // Process the data to create a structured list of mentors with their batches
    const mentorsWithBatches = [];
    const mentorMap = new Map();

    weeklySchedules.forEach(scheduleDoc => {
      const mentor = scheduleDoc.mentor;
      if (!mentor) return;

      const mentorId = mentor._id.toString();

      // Initialize mentor if not exists
      if (!mentorMap.has(mentorId)) {
        mentorMap.set(mentorId, {
          _id: mentor._id,
          fullName: mentor.fullName,
          email: mentor.email,
          role: mentor.role?.role || 'mentor',
          batches: new Set(),
          scheduleDetails: []
        });
      }

      const mentorData = mentorMap.get(mentorId);

      // Process schedule details
      if (scheduleDoc.schedule) {
        const timeSlot = scheduleDoc.schedule;
        const subDetail = timeSlot.sub_details;

        if (timeSlot && subDetail) {
          const timeSlotData = {
            timeSlot: timeSlot.time?.timeSlot || 'N/A',
            subDetails: []
          };

          const subDetailData = {
            day: subDetail.day,
            branch: subDetail.branch,
            subject: subDetail.subject?.moduleName || 'N/A',
            note: subDetail.note || "",
            batches: []
          };

          if (subDetail.batch) {
            subDetail.batch.forEach(batch => {
              if (batch) {
                mentorData.batches.add(batch._id.toString());

                const courses = new Set();
                const internsList = [];
                if (batch.interns && batch.interns.length > 0) {
                  batch.interns.forEach(intern => {
                    if (intern) {
                      if (intern.course && intern.course.courseName) {
                        courses.add(intern.course.courseName);
                      }
                      internsList.push({
                        _id: intern._id,
                        fullName: intern.fullName,
                        courseName: intern.course?.courseName
                      });
                    }
                  });
                }
                const courseNames = Array.from(courses).join(', ') || 'N/A';

                subDetailData.batches.push({
                  _id: batch._id,
                  batchName: batch.batchName,
                  branchName: batch.branch?.branchName || 'N/A',
                  courseName: courseNames,
                  interns: internsList
                });
              }
            });
          }

          timeSlotData.subDetails.push(subDetailData);
          mentorData.scheduleDetails.push(timeSlotData);
        }
      }
    });

    mentorsWithBatches.push(...Array.from(mentorMap.values()).map(mentor => ({
      ...mentor,
      batches: Array.from(mentor.batches).map(batchId => {
        const batchDays = new Set();
        let finalBatch = null;

        for (const scheduleDoc of weeklySchedules) {
          if (scheduleDoc.mentor && scheduleDoc.mentor._id && scheduleDoc.mentor._id.toString() === mentor._id.toString() && scheduleDoc.schedule && scheduleDoc.schedule.sub_details && scheduleDoc.schedule.sub_details.batch) {
            for (const batch of scheduleDoc.schedule.sub_details.batch) {
              if (batch && batch._id.toString() === batchId) {
                if (scheduleDoc.schedule.sub_details.day?.name) {
                  batchDays.add(scheduleDoc.schedule.sub_details.day.name);
                }

                if (!finalBatch) {
                  const courses = new Set();
                  const internsList = [];
                  if (batch.interns && batch.interns.length > 0) {
                    batch.interns.forEach(intern => {
                      if (intern) {
                        if (intern.course && intern.course.courseName) {
                          courses.add(intern.course.courseName);
                        }
                        internsList.push({
                          _id: intern._id,
                          fullName: intern.fullName,
                          courseName: intern.course?.courseName
                        });
                      }
                    });
                  }
                  const courseNames = Array.from(courses).join(', ') || 'N/A';

                  finalBatch = {
                    _id: batch._id,
                    batchName: batch.batchName,
                    branchName: batch.branch?.branchName || 'N/A',
                    courseName: courseNames,
                    interns: internsList
                  };
                }
              }
            }
          }
        }
        
        if (finalBatch) {
          finalBatch.dayCombination = Array.from(batchDays).join(', ') || 'N/A';
        }
        return finalBatch;
      }).filter(batch => batch !== null)
    })));

    console.log(`Found ${mentorsWithBatches.length} mentors with assigned batches`);

    const totalCount = mentorsWithBatches.length;
    const totalPages = Math.max(1, Math.ceil(totalCount / limit));
    const currentPage = Math.min(Math.max(page, 1), totalPages);
    const skip = (currentPage - 1) * limit;
    const pagedMentors = mentorsWithBatches.slice(skip, skip + limit);

    const hasNextPage = currentPage < totalPages;
    const hasPrevPage = currentPage > 1;
    const startIndex = totalCount === 0 ? 0 : skip + 1;
    const endIndex = Math.min(skip + limit, totalCount);

    const getPageNumbers = (cp, tp) => {
      const maxVisible = 5;
      let startPage, endPage;
      if (tp <= maxVisible) {
        startPage = 1; endPage = tp;
      } else if (cp <= 3) {
        startPage = 1; endPage = maxVisible;
      } else if (cp >= tp - 2) {
        startPage = tp - maxVisible + 1; endPage = tp;
      } else {
        startPage = cp - 2; endPage = cp + 2;
      }
      return Array.from({ length: endPage - startPage + 1 }, (_, i) => startPage + i);
    };

    res.status(200).json({
      message: "Mentors with assigned batches retrieved successfully",
      data: pagedMentors,
      pagination: {
        currentPage,
        totalPages,
        totalCount,
        limit,
        skip,
        hasNextPage,
        hasPrevPage,
        startIndex,
        endIndex,
        pageNumbers: getPageNumbers(currentPage, totalPages),
        displayInfo: {
          showing: `${startIndex} to ${endIndex}`,
          total: totalCount,
          pageInfo: `Page ${currentPage} of ${totalPages}`
        }
      }
    });
  } catch (error) {
    console.error('Error fetching mentors with batches:', error);
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  createWeeklySchedule,
  getWeeklySchedules,
  getWeeklyScheduleById,
  updateWeeklySchedule,
  deleteWeeklySchedule,
  addBatchToSubDetails,
  removeBatchFromSubDetails,
  updateSubjectInSubDetails,
  updateNoteInSubDetails,
  getAllMentorsWithBatches,
};

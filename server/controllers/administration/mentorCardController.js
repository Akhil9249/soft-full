const MentorCard = require("../../models/administration/mentorCardModal");

// Create a new Mentor Card entry
const createMentorCard = async (req, res) => {
    try {
        const { internId, week, subject, topic, startDate, endDate, test_name, test_marks, test_total, isTest, project_name, project_marks, project_total, isProject, isSoftSkill, totalDays, attend, note } = req.body;
        const mentorId = req.userId; // Taken from checkAuth middleware

        const weekNum = Number(week);

        // Validation (basic)
        if (!internId || isNaN(weekNum) || !mentorId) {
            return res.status(400).json({ message: "internId, valid week number, and mentorId are required" });
        }

        const newEntry = new MentorCard({
            internId,
            week: weekNum,
            subject,
            topic,
            startDate,
            endDate,
            test_name,
            test_marks,
            test_total,
            isTest,
            project_name,
            project_marks,
            project_total,
            isProject,
            isSoftSkill,
            totalDays,
            attend,
            note,
            mentorId
        });

        await newEntry.save();
        res.status(201).json({ message: "Mentor card entry created successfully", data: newEntry });
    } catch (error) {
        if (error.code === 11000) {
            return res.status(400).json({ message: "You have already submitted data for this intern in this week" });
        }
        res.status(500).json({ message: "Server error", error: error.message });
    }
};

// Get all Mentor Card entries for a specific intern
const getMentorCardsByIntern = async (req, res) => {
    try {
        const { internId } = req.params;
        const entries = await MentorCard.find({ internId })
            .populate("mentorId", "fullName email") // Optionally populate mentor details
            .sort({ createdAt: -1 });

        res.status(200).json(entries);
    } catch (error) {
        res.status(500).json({ message: "Server error", error: error.message });
    }
};

// Update an existing Mentor Card entry
const updateMentorCard = async (req, res) => {
    try {
        const { id } = req.params;
        const { week, subject, topic, startDate, endDate, test_name, test_marks, test_total, isTest, project_name, project_marks, project_total, isProject, isSoftSkill, totalDays, attend, note } = req.body;
        const mentorId = req.userId;

        const weekNum = week !== undefined ? Number(week) : undefined;

        // Find the card and ensure the mentor owns it
        const card = await MentorCard.findById(id);
        if (!card) {
            return res.status(404).json({ message: "Mentor card not found" });
        }

        if (card.mentorId.toString() !== mentorId.toString()) {
            return res.status(403).json({ message: "You are not authorized to edit this card" });
        }

        const updatedCard = await MentorCard.findByIdAndUpdate(
            id,
            { week: weekNum, subject, topic, startDate, endDate, test_name, test_marks, test_total, isTest, project_name, project_marks, project_total, isProject, isSoftSkill, totalDays, attend, note },
            { new: true }
        );

        res.status(200).json({ message: "Mentor card updated successfully", data: updatedCard });
    } catch (error) {
        res.status(500).json({ message: "Server error", error: error.message });
    }
};

module.exports = {
    createMentorCard,
    getMentorCardsByIntern,
    updateMentorCard
};

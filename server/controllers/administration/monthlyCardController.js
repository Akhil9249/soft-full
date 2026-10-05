const MonthlyMentorCard = require("../../models/administration/MonthlyCardModal");
const Intern = require("../../models/administration/internModel");

// Create a new Monthly Mentor Card entry
const createMonthlyCard = async (req, res) => {
    try {
        const {
            internId,
            month,
            aptitude,
            aptitude_marks,
            aptitude_total,
            isAptitude,
            logical,
            logical_marks,
            logical_total,
            isLogical,
            technical,
            technical_marks,
            technical_total,
            isTechnical,
            communication,
            communication_marks,
            communication_total,
            isCommunication,
            totalDays,
            attend,
            note
        } = req.body;

        const mentorId = req.userId; // Taken from checkAuth middleware
        const monthNum = Number(month);

        // Basic validation
        if (!internId || isNaN(monthNum) || !mentorId) {
            return res.status(400).json({ message: "internId, valid month number, and mentorId are required" });
        }

        const newEntry = new MonthlyMentorCard({
            internId,
            month: monthNum,
            aptitude,
            aptitude_marks,
            aptitude_total,
            isAptitude,
            logical,
            logical_marks,
            logical_total,
            isLogical,
            technical,
            technical_marks,
            technical_total,
            isTechnical,
            communication,
            communication_marks,
            communication_total,
            isCommunication,
            totalDays,
            attend,
            note,
            mentorId
        });

        await newEntry.save();
        res.status(201).json({ message: "Monthly mentor card entry created successfully", data: newEntry });
    } catch (error) {
        if (error.code === 11000) {
            return res.status(400).json({ message: "You have already submitted monthly data for this intern for this month" });
        }
        res.status(500).json({ message: "Server error", error: error.message });
    }
};

// Get all Monthly Mentor Card entries for a specific intern (by internId or req.userId)
const getMonthlyCardsByIntern = async (req, res) => {
    try {
        const internId = req.params.internId || req.userId;

        if (!internId) {
            return res.status(400).json({ message: "Intern ID is required" });
        }

        // Fetch Intern details
        const intern = await Intern.findById(internId)
            .populate("course", "courseName")
            .populate("branch", "branchName");

        const entries = await MonthlyMentorCard.find({ internId, isDeleted: false })
            .populate("mentorId", "fullName email")
            .sort({ month: 1, createdAt: -1 });

        res.status(200).json({
            message: "Monthly mentor card entries retrieved successfully",
            data: {
                cards: entries,
                intern: intern
            }
        });
    } catch (error) {
        res.status(500).json({ message: "Server error", error: error.message });
    }
};

// Get a single Monthly Mentor Card by ID
const getMonthlyCardById = async (req, res) => {
    try {
        const { id } = req.params;
        const card = await MonthlyMentorCard.findOne({ _id: id, isDeleted: false })
            .populate("internId", "fullName email regNo")
            .populate("mentorId", "fullName email");

        if (!card) {
            return res.status(404).json({ message: "Monthly mentor card not found" });
        }

        res.status(200).json({ message: "Monthly mentor card retrieved successfully", data: card });
    } catch (error) {
        res.status(500).json({ message: "Server error", error: error.message });
    }
};

// Update an existing Monthly Mentor Card entry
const updateMonthlyCard = async (req, res) => {
    try {
        const { id } = req.params;
        const {
            month,
            aptitude,
            aptitude_marks,
            aptitude_total,
            isAptitude,
            logical,
            logical_marks,
            logical_total,
            isLogical,
            technical,
            technical_marks,
            technical_total,
            isTechnical,
            communication,
            communication_marks,
            communication_total,
            isCommunication,
            totalDays,
            attend,
            note
        } = req.body;

        const mentorId = req.userId;
        const monthNum = month !== undefined ? Number(month) : undefined;

        // Find the card and ensure it exists and mentor owns it
        const card = await MonthlyMentorCard.findOne({ _id: id, isDeleted: false });
        if (!card) {
            return res.status(404).json({ message: "Monthly mentor card not found" });
        }

        if (card.mentorId.toString() !== mentorId.toString()) {
            return res.status(403).json({ message: "You are not authorized to edit this card" });
        }

        const updateData = {
            aptitude,
            aptitude_marks,
            aptitude_total,
            isAptitude,
            logical,
            logical_marks,
            logical_total,
            isLogical,
            technical,
            technical_marks,
            technical_total,
            isTechnical,
            communication,
            communication_marks,
            communication_total,
            isCommunication,
            totalDays,
            attend,
            note
        };

        if (monthNum !== undefined && !isNaN(monthNum)) {
            updateData.month = monthNum;
        }

        const updatedCard = await MonthlyMentorCard.findByIdAndUpdate(
            id,
            updateData,
            { new: true }
        );

        res.status(200).json({ message: "Monthly mentor card updated successfully", data: updatedCard });
    } catch (error) {
        res.status(500).json({ message: "Server error", error: error.message });
    }
};

// Soft delete a Monthly Mentor Card entry
const deleteMonthlyCard = async (req, res) => {
    try {
        const { id } = req.params;
        const mentorId = req.userId;

        const card = await MonthlyMentorCard.findOne({ _id: id, isDeleted: false });
        if (!card) {
            return res.status(404).json({ message: "Monthly mentor card not found" });
        }

        if (card.mentorId.toString() !== mentorId.toString()) {
            return res.status(403).json({ message: "You are not authorized to delete this card" });
        }

        card.isDeleted = true;
        card.deletedAt = new Date();
        await card.save();

        res.status(200).json({ message: "Monthly mentor card deleted successfully" });
    } catch (error) {
        res.status(500).json({ message: "Server error", error: error.message });
    }
};

module.exports = {
    createMonthlyCard,
    getMonthlyCardsByIntern,
    getMonthlyCardById,
    updateMonthlyCard,
    deleteMonthlyCard
};

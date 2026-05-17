// controllers/settings/daysController.js
const Day = require("../../models/settings/daysModel");

// Create new day
const createDay = async (req, res) => {
    try {
        const { name, day, description } = req.body;

        if (!name || !day || !description) {
            return res.status(400).json({
                message: "Name, day and description are required"
            });
        }

        // Check if day already exists
        const existingDay = await Day.findOne({ day });
        if (existingDay) {
            return res.status(400).json({
                message: "This day already exists"
            });
        }

        const newDay = await Day.create({
            name,
            day,
            description
        });

        res.status(201).json({
            message: "Day created successfully",
            data: newDay
        });
    } catch (error) {
        console.log("Error creating day:", error);
        res.status(500).json({ message: error.message });
    }
};

// Get all days
const getDays = async (req, res) => {
    try {
        const days = await Day.find().sort({ createdAt: -1 });
        res.status(200).json({ message: "Days retrieved successfully", data: days });
    } catch (error) {
        console.log("Error getting days:", error);
        res.status(500).json({ message: error.message });
    }
};

// Get single day
const getDayById = async (req, res) => {
    try {
        const dayItem = await Day.findById(req.params.id);
        if (!dayItem) {
            return res.status(404).json({ message: "Day not found" });
        }
        res.status(200).json({ message: "Day retrieved successfully", data: dayItem });
    } catch (error) {
        console.log("Error getting day:", error);
        res.status(500).json({ message: error.message });
    }
};

// Update day
const updateDay = async (req, res) => {
    try {
        const { name, day, description, isActive } = req.body;

        // Check if day is being updated and if it already exists
        if (day) {
            const existingDay = await Day.findOne({
                day,
                _id: { $ne: req.params.id }
            });
            if (existingDay) {
                return res.status(400).json({
                    message: "This day already exists"
                });
            }
        }

        const updated = await Day.findByIdAndUpdate(
            req.params.id,
            { name, day, description, isActive },
            { new: true, runValidators: true }
        );

        if (!updated) {
            return res.status(404).json({ message: "Day not found" });
        }

        res.status(200).json({
            message: "Day updated successfully",
            data: updated
        });
    } catch (error) {
        console.log("Error updating day:", error);
        res.status(400).json({ message: error.message });
    }
};

// Delete day
const deleteDay = async (req, res) => {
    try {
        const deleted = await Day.findByIdAndDelete(req.params.id);
        if (!deleted) {
            return res.status(404).json({ message: "Day not found" });
        }
        res.status(200).json({ message: "Day deleted successfully" });
    } catch (error) {
        console.log("Error deleting day:", error);
        res.status(500).json({ message: error.message });
    }
};

// Toggle day status (active/inactive)
const toggleDayStatus = async (req, res) => {
    try {
        const dayItem = await Day.findById(req.params.id);
        if (!dayItem) {
            return res.status(404).json({ message: "Day not found" });
        }

        dayItem.isActive = !dayItem.isActive;
        await dayItem.save();

        res.status(200).json({
            message: `Day ${dayItem.isActive ? 'activated' : 'deactivated'} successfully`,
            data: dayItem
        });
    } catch (error) {
        console.log("Error toggling day status:", error);
        res.status(500).json({ message: error.message });
    }
};

module.exports = {
    createDay,
    getDays,
    getDayById,
    updateDay,
    deleteDay,
    toggleDayStatus,
};

// controllers/settings/daysCombinationController.js
const DayCombination = require("../../models/settings/daysCombinationModel");

// Create new day combination
const createDayCombination = async (req, res) => {
    try {
        const { name, dayCombination, description } = req.body;

        if (!name || !dayCombination || !description) {
            return res.status(400).json({
                message: "Name, dayCombination and description are required"
            });
        }

        const existingCombo = await DayCombination.findOne({ name });
        if (existingCombo) {
            return res.status(400).json({
                message: "This day combination already exists"
            });
        }

        const newCombo = await DayCombination.create({
            name,
            dayCombination,
            description
        });

        res.status(201).json({
            message: "Day combination created successfully",
            data: newCombo
        });
    } catch (error) {
        console.log("Error creating day combination:", error);
        res.status(500).json({ message: error.message });
    }
};

// Get all day combinations
const getDayCombinations = async (req, res) => {
    try {
        const combinations = await DayCombination.find().populate("dayCombination").sort({ createdAt: -1 });
        res.status(200).json({ message: "Day combinations retrieved successfully", data: combinations });
    } catch (error) {
        console.log("Error getting day combinations:", error);
        res.status(500).json({ message: error.message });
    }
};

// Get single day combination
const getDayCombinationById = async (req, res) => {
    try {
        const combo = await DayCombination.findById(req.params.id).populate("dayCombination");
        if (!combo) {
            return res.status(404).json({ message: "Day combination not found" });
        }
        res.status(200).json({ message: "Day combination retrieved successfully", data: combo });
    } catch (error) {
        console.log("Error getting day combination:", error);
        res.status(500).json({ message: error.message });
    }
};

// Update day combination
const updateDayCombination = async (req, res) => {
    try {
        const { name, dayCombination, description, isActive } = req.body;

        if (name) {
            const existingCombo = await DayCombination.findOne({
                name,
                _id: { $ne: req.params.id }
            });
            if (existingCombo) {
                return res.status(400).json({
                    message: "This day combination already exists"
                });
            }
        }

        const updated = await DayCombination.findByIdAndUpdate(
            req.params.id,
            { name, dayCombination, description, isActive },
            { new: true, runValidators: true }
        ).populate("dayCombination");

        if (!updated) {
            return res.status(404).json({ message: "Day combination not found" });
        }

        res.status(200).json({
            message: "Day combination updated successfully",
            data: updated
        });
    } catch (error) {
        console.log("Error updating day combination:", error);
        res.status(400).json({ message: error.message });
    }
};

// Delete day combination
const deleteDayCombination = async (req, res) => {
    try {
        const deleted = await DayCombination.findByIdAndDelete(req.params.id);
        if (!deleted) {
            return res.status(404).json({ message: "Day combination not found" });
        }
        res.status(200).json({ message: "Day combination deleted successfully" });
    } catch (error) {
        console.log("Error deleting day combination:", error);
        res.status(500).json({ message: error.message });
    }
};

// Toggle status
const toggleDayCombinationStatus = async (req, res) => {
    try {
        const combo = await DayCombination.findById(req.params.id);
        if (!combo) {
            return res.status(404).json({ message: "Day combination not found" });
        }

        combo.isActive = !combo.isActive;
        await combo.save();

        res.status(200).json({
            message: `Day combination ${combo.isActive ? 'activated' : 'deactivated'} successfully`,
            data: combo
        });
    } catch (error) {
        console.log("Error toggling day combination status:", error);
        res.status(500).json({ message: error.message });
    }
};

module.exports = {
    createDayCombination,
    getDayCombinations,
    getDayCombinationById,
    updateDayCombination,
    deleteDayCombination,
    toggleDayCombinationStatus,
};

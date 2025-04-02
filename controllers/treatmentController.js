const Treatment = require("../models/Treatment");

// ✅ Get all treatments
exports.getAllTreatments = async (req, res) => {
    try {
        const treatments = await Treatment.find();
        res.json(treatments);
    } catch (error) {
        res.status(500).json({ error: "Failed to fetch treatments" });
    }
};

// ✅ Add a new treatment
exports.addTreatment = async (req, res) => {
    const { name, price } = req.body;

    if (!name || price === undefined) {
        return res.status(400).json({ error: "Treatment name and price are required" });
    }

    try {
        const newTreatment = new Treatment({ name, price });
        await newTreatment.save();
        res.json({ message: "Treatment added successfully", treatment: newTreatment });
    } catch (error) {
        res.status(500).json({ error: "Failed to add treatment" });
    }
};

// ✅ Update treatment
exports.updateTreatment = async (req, res) => {
    const { name, price } = req.body;

    try {
        const updatedTreatment = await Treatment.findByIdAndUpdate(
            req.params.id,
            { name, price },
            { new: true, runValidators: true }
        );

        if (!updatedTreatment) {
            return res.status(404).json({ error: "Treatment not found" });
        }

        res.json({ message: "Treatment updated successfully", treatment: updatedTreatment });
    } catch (error) {
        res.status(500).json({ error: "Failed to update treatment" });
    }
};

// ✅ Delete a treatment
exports.deleteTreatment = async (req, res) => {
    try {
        await Treatment.findByIdAndDelete(req.params.id);
        res.json({ message: "Treatment deleted successfully" });
    } catch (error) {
        res.status(500).json({ error: "Failed to delete treatment" });
    }
};
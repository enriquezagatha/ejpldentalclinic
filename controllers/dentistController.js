const Dentist = require("../models/Dentist");

// Get all dentists
exports.getDentists = async (req, res) => {
    try {
        const dentists = await Dentist.find();
        res.json(dentists);
    } catch (error) {
        res.status(500).json({ error: "Failed to fetch dentists" });
    }
};

// Add a dentist
exports.addDentist = async (req, res) => {
    try {
        const { name, contact } = req.body;
        const image = req.file ? `/uploads/${req.file.filename}` : null; // Store image path

        const newDentist = new Dentist({ name, contact, image });
        await newDentist.save();
        res.status(201).json(newDentist);
    } catch (error) {
        res.status(500).json({ error: "Failed to add dentist" });
    }
};

// Update a dentist
exports.updateDentist = async (req, res) => {
    try {
        const { name, contact } = req.body;
        const image = req.file ? `/uploads/${req.file.filename}` : req.body.image; // Keep old image if not updated

        const updatedDentist = await Dentist.findByIdAndUpdate(
            req.params.id,
            { name, contact, image },
            { new: true }
        );

        if (!updatedDentist) return res.status(404).json({ error: "Dentist not found" });

        res.json(updatedDentist);
    } catch (error) {
        res.status(500).json({ error: "Failed to update dentist" });
    }
};

// Delete a dentist
exports.deleteDentist = async (req, res) => {
    try {
        const deletedDentist = await Dentist.findByIdAndDelete(req.params.id);
        if (!deletedDentist) return res.status(404).json({ error: "Dentist not found" });

        res.json({ message: "Dentist deleted successfully" });
    } catch (error) {
        res.status(500).json({ error: "Failed to delete dentist" });
    }
};
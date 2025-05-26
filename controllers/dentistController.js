const Dentist = require("../models/Dentist");

// Get all dentists
exports.getDentists = async (req, res) => {
    try {
        const dentists = await Dentist.find();
        res.json(dentists); // This will include the gender field as well
    } catch (error) {
        res.status(500).json({ error: "Failed to fetch dentists" });
    }
};

// Add a dentist
exports.addDentist = async (req, res) => {
    try {
        const { firstName, lastName, gender } = req.body;
        const image = req.file ? `/uploads/${req.file.filename}` : null; // Store image path
        let schedule = {};
        if (req.body.schedule) {
            try {
                schedule = JSON.parse(req.body.schedule);
            } catch (e) {
                schedule = {};
            }
        }

        // Create new dentist with firstName, lastName, gender, schedule
        const newDentist = new Dentist({
            firstName,
            lastName,
            gender, // Saving the gender
            image,
            schedule,
        });

        await newDentist.save();
        res.status(201).json(newDentist);
    } catch (error) {
        res.status(500).json({ error: "Failed to add dentist" });
    }
};

// Update a dentist
exports.updateDentist = async (req, res) => {
    try {
        const { firstName, lastName, gender } = req.body;
        const image = req.file ? `/uploads/${req.file.filename}` : req.body.image; // Keep old image if not updated
        let schedule = {};
        if (req.body.schedule) {
            try {
                schedule = JSON.parse(req.body.schedule);
            } catch (e) {
                schedule = {};
            }
        }

        const updatedDentist = await Dentist.findByIdAndUpdate(
            req.params.id,
            { firstName, lastName, gender, image, schedule },
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
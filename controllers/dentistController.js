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
        const { firstName, secondName, middleName, lastName, contact, gender } = req.body;
        const image = req.file ? `/uploads/${req.file.filename}` : null; // Store image path

        // Create new dentist with firstName, secondName, middleName, lastName, gender
        const newDentist = new Dentist({
            firstName,
            secondName,
            middleName,
            lastName,
            contact,
            gender, // Saving the gender
            image,
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
        const { firstName, secondName, middleName, lastName, contact, gender } = req.body;
        const image = req.file ? `/uploads/${req.file.filename}` : req.body.image; // Keep old image if not updated

        const updatedDentist = await Dentist.findByIdAndUpdate(
            req.params.id,
            { firstName, secondName, middleName, lastName, contact, gender, image },
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
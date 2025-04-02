const Discount = require("../models/Discount");

// Get all discounts
exports.getDiscounts = async (req, res) => {
    try {
        const discounts = await Discount.find();
        res.json(discounts);
    } catch (error) {
        res.status(500).json({ error: "Error fetching discounts" });
    }
};

// Create a new discount
exports.createDiscount = async (req, res) => {
    try {
        const { name, percentage } = req.body;
        const newDiscount = new Discount({ name, percentage });
        await newDiscount.save();
        res.status(201).json(newDiscount);
    } catch (error) {
        res.status(400).json({ error: "Invalid discount data" });
    }
};

// Update an existing discount
exports.updateDiscount = async (req, res) => {
    try {
        const { name, percentage } = req.body;
        const updatedDiscount = await Discount.findByIdAndUpdate(req.params.id, { name, percentage }, { new: true });
        if (!updatedDiscount) return res.status(404).json({ error: "Discount not found" });
        res.json(updatedDiscount);
    } catch (error) {
        res.status(400).json({ error: "Invalid update request" });
    }
};

// Delete a discount
exports.deleteDiscount = async (req, res) => {
    try {
        const deletedDiscount = await Discount.findByIdAndDelete(req.params.id);
        if (!deletedDiscount) return res.status(404).json({ error: "Discount not found" });
        res.json({ message: "Discount deleted" });
    } catch (error) {
        res.status(500).json({ error: "Error deleting discount" });
    }
};
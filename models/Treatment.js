const mongoose = require("mongoose");

const TreatmentSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        unique: true, // No duplicate treatments
        trim: true
    },
    price: {
        type: String, // Allow price to be a string for backward compatibility
        default: null // Default to null if not provided
    },
    minPrice: {
        type: Number,
        min: 0, // Minimum price for range (optional)
        default: null // Default to null if not provided
    },
    maxPrice: {
        type: Number,
        min: 0, // Maximum price for range (optional)
        default: null // Default to null if not provided
    }
});

module.exports = mongoose.model("Treatment", TreatmentSchema);
const mongoose = require("mongoose");

const TreatmentSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        unique: true, // No duplicate treatments
        trim: true
    },
    price: {
        type: String,
        required: true,
        min: 0 // Ensure price is not negative
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model("Treatment", TreatmentSchema);
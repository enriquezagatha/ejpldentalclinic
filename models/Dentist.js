const mongoose = require("mongoose");

const dentistSchema = new mongoose.Schema({
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    gender: { type: String, enum: ['male', 'female', 'other'], required: true }, // Gender field added
    image: { type: String },
    schedule: {
        useClinicHours: { type: Boolean, default: false },
        days: [
            {
                day: { type: String },
                start: { type: String }, // "HH:mm"
                end: { type: String },   // "HH:mm"
            }
        ]
    }
});

module.exports = mongoose.model("Dentist", dentistSchema);
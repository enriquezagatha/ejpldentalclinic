const mongoose = require("mongoose");

const dentistSchema = new mongoose.Schema({
    firstName: { type: String, required: true },
    secondName: { type: String }, // Optional second name
    middleName: { type: String }, // Optional middle name
    lastName: { type: String, required: true },
    gender: { type: String, enum: ['male', 'female', 'other'], required: true }, // Gender field added
    contact: { type: String, required: true },
    image: { type: String },
});

module.exports = mongoose.model("Dentist", dentistSchema);
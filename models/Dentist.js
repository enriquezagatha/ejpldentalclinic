const mongoose = require("mongoose");

const doctorSchema = new mongoose.Schema({
    name: { type: String },
    contact: { type: String },
    image: { type: String },
});

module.exports = mongoose.model("Dentist", doctorSchema);
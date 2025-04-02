const mongoose = require('mongoose');

// Patient Schema
const patientSchema = new mongoose.Schema({
    firstName: String,
    lastName: String,
    birthday: String,
    email: { type: String,},
    password: String,
    profilePicture: String,
});

const Patient = mongoose.model('Patient', patientSchema);

module.exports = Patient;
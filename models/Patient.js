const mongoose = require('mongoose');

// Patient Schema
const patientSchema = new mongoose.Schema({
    firstName: String,
    lastName: String,
    birthday: String,
    email: { type: String,},
    password: String,
    profilePicture: String,
    isFirstLogin: {type: Boolean, default: true},
    resetToken: String,
    resetTokenExpiration: Date,
    otp: { type: Number },
    otpExpiration: { type: Date },
    isVerified: { type: Boolean, default: false },
});

const Patient = mongoose.model('Patient', patientSchema);

module.exports = Patient;
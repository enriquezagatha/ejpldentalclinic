const mongoose = require('mongoose');

const medicalPersonnelSchema = new mongoose.Schema({
    firstName: { type: String, required: true },
    middleName: { type: String },
    lastName: { type: String, required: true },
    birthday: String,
    email: { type: String, unique: true, required: true },
    password: { type: String, required: true },
    isGeneratedPassword: { type: Boolean, default: false },
    profilePicture: { type: String },
    isAuthorizedPersonnel: { type: Boolean, default: false }, // 👈 Add this
});

const MedicalPersonnel = mongoose.model('MedicalPersonnel', medicalPersonnelSchema);

module.exports = MedicalPersonnel;
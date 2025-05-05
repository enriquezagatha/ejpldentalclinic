const mongoose = require("mongoose");

// Patient Record Schema
const patientRecordSchema = new mongoose.Schema(
  {
    patientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Patient",
      required: true,
    }, // Link to Patient model
    firstName: String,
    lastName: String,
    emailAddress: String, // This can be different from the login email
    age: String,
    birthDay: Date,
    gender: String,
    address: String,
    selectedHistory: String,
    contactNumber: String,
    emergencyContact: String,
    emergencyContactNumber: String,
    emergencyContactRelationship: String,

    treatments: [
      {
        treatmentType: String,
        treatmentDate: Date,
        prescriptionDate: String,
        medicineType: String,
        procedure: String,
        treatmentNotes: String,
        assignedDentist: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Dentist",
        }, // Link to Dentist model
      },
    ],
    uploadedFiles: [
      {
        filename: String,
        path: String,
        originalname: String,
        uploadDate: { type: Date, default: Date.now },
      },
    ],
  },
  { timestamps: true }
);

const PatientRecord = mongoose.model("PatientRecord", patientRecordSchema);

module.exports = PatientRecord;

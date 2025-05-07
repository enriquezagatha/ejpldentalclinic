const mongoose = require('mongoose');

const appointmentSchema = new mongoose.Schema({
    patient: { type: mongoose.Schema.Types.ObjectId, ref: 'Patient', default: null }, // Null for new patients
    status: { type: String, default: 'pending' }, // No enum restriction
    referenceNumber: { type: String, unique: true, required: true },
    
    // New patient details (only required if no patient reference exists)
    firstName: { type: String },
    lastName: { type: String },
    age: { type: Number },
    gender: { type: String }, // No enum restriction
    birthDay: { type: Date },
    address: { type: String },
    contactNumber: { type: String, required: true },
    emailAddress: { type: String},
    selectedHistory: { type: String }, // Medical history

    // Emergency contact
    emergencyContact: { type: String },
    emergencyContactNumber: { type: String },
    emergencyContactRelationship: { type: String },

    // Appointment details
    preferredDate: { type: Date, required: true }, 
    preferredTime: { type: String, required: true }, // Kept as String if storing time separately
    treatmentType: { type: String, required: true },
    treatmentPrice: { type: String, required: true },

    treatment: { type: mongoose.Schema.Types.ObjectId, ref: 'Treatment', default: null },

    // Link to patient record (if applicable)
    patientRecord: { type: mongoose.Schema.Types.ObjectId, ref: 'PatientRecord', default: null },

    //Assigned dentist
    assignedDentist: { type: mongoose.Schema.Types.ObjectId, ref: 'Dentist', default: null },

    // Payment details
    payment: {
        amount: { type: Number, default: 0 },
        status: { type: String, default: 'unpaid' }, // No enum restriction
        paymentLink: { type: String },
        paymentId: { type: String } // PayMongo payment ID
    },

    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
}, { timestamps: true }); // Add timestamps for createdAt and updatedAt

const Appointment = mongoose.model('Appointment', appointmentSchema);

module.exports = Appointment;
const Appointment = require('../models/Appointment');
const { generateReferenceNumber } = require('../services/appointmentService');
const PatientRecord = require('../models/PatientRecord');
const fs = require('fs');

exports.createAppointment = async (req, res) => {
    if (!req.session.user) {
        return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const {
        firstName,
        lastName,
        gender,
        contactNumber,
        preferredDate,
        preferredTime,
        treatmentType,
        age,
        address,
        emergencyContact,
        emergencyContactNumber,
        emergencyContactRelationship,
        selectedHistory,
    } = req.body;

    const referenceNumber = generateReferenceNumber();

    const existingAppointments = await Appointment.find({ preferredDate, preferredTime });

    if (existingAppointments.length >= 2) {
        return res.status(400).json({ success: false, message: "Appointment slots full for this time." });
    }

    // Create appointment WITHOUT adding to PatientRecord yet
    const appointmentData = {
        patient: req.session.user.id,
        referenceNumber,
        firstName,
        lastName,
        contactNumber,
        preferredDate: new Date(preferredDate).toISOString().split("T")[0],
        preferredTime,
        treatmentType,
        age,
        gender,
        address,
        emergencyContact,
        emergencyContactNumber,
        emergencyContactRelationship,
        selectedHistory,
        status: "Pending", // Always start as "Pending"
    };

    await new Appointment(appointmentData).save();

    return res.status(201).json({
        success: true,
        message: "Appointment created successfully.",
        referenceNumber
    });
};

exports.getAppointmentsByPatient = async (req, res) => {
    if (!req.session.user) {
        return res.status(401).json({ message: 'Unauthorized' });
    }

    const appointments = await Appointment.find({ patient: req.session.user.id }); // Fetch appointments using patient ID
    if (!appointments) {
        return res.status(404).json({ message: 'No appointments found' });
    }

    res.json(appointments);
};

exports.getAllAppointments = async (req, res) => {
    if (!req.session.user || req.session.user.role !== 'medical-personnel') {
        return res.status(401).json({ message: 'Unauthorized' });
    }

    const appointments = await Appointment.find();
    return res.json(appointments);
};

exports.getAppointmentDetails = async (req, res) => {
    const appointmentId = req.query.appointmentId;

    if (!appointmentId) {
        return res.status(400).json({ message: 'Appointment ID is required to fetch details.' });
    }

    const appointment = await Appointment.findById(appointmentId);

    if (!appointment) {
        return res.status(404).json({ message: 'Appointment not found.' });
    }

    const patientRecord = await PatientRecord.findById(appointment.patientRecord);

    if (!patientRecord) {
        return res.status(404).json({ message: 'Patient record not found.' });
    }

    res.json({
        firstName: appointment.firstName,
        lastName: appointment.lastName,
        age: appointment.age,
        gender: appointment.gender,
        address: appointment.address,
        contactNumber: appointment.contactNumber,
        emailAddress: appointment.emailAddress || '',
        selectedHistory: appointment.selectedHistory,
        emergencyContact: appointment.emergencyContact,
        emergencyContactNumber: appointment.emergencyContactNumber,
        emergencyContactRelationship: appointment.emergencyContactRelationship,
        treatments: patientRecord.treatments || [],
        uploadedFiles: patientRecord.uploadedFiles || []
    });
};


exports.updateAppointmentStatus = async (req, res) => {    
    if (!req.session.user || req.session.user.role !== 'medical-personnel') {
        return res.status(401).json({ message: 'Unauthorized' });
    }

    const { id } = req.params;
    const { status } = req.body;

    let updateFields = { status };
    
    // ✅ If appointment is completed, set the treatmentDate
    if (status === "Completed") {
        updateFields.preferredDate = new Date(); // Store current date as treatment date
    }

    const updatedAppointment = await Appointment.findByIdAndUpdate(
        id,
        updateFields,
        { new: true }
    );

    if (!updatedAppointment) {
        return res.status(404).json({ message: 'Appointment not found' });
    }

    // If status is "Completed", move patient data to PatientRecord
    if (status === "Completed") {
        let patientRecord = await PatientRecord.findOne({ patient: updatedAppointment.patient });

        if (!patientRecord) {
            patientRecord = new PatientRecord({
                patient: updatedAppointment.patient,  
                firstName: updatedAppointment.firstName,
                lastName: updatedAppointment.lastName,
                contactNumber: updatedAppointment.contactNumber,
                gender: updatedAppointment.gender,
                age: updatedAppointment.age,
                address: updatedAppointment.address,
                emergencyContact: updatedAppointment.emergencyContact,
                emergencyContactNumber: updatedAppointment.emergencyContactNumber,
                emergencyContactRelationship: updatedAppointment.emergencyContactRelationship,
                selectedHistory: updatedAppointment.selectedHistory,
                treatments: [],
            });

            await patientRecord.save();

            updatedAppointment.patientRecord = patientRecord._id;
            await updatedAppointment.save();
        }

        // ✅ Debugging log
        console.log("Updated Appointment Treatment Date:", updatedAppointment.preferredDate);

        const treatmentDate = updatedAppointment.preferredDate || new Date();

        patientRecord.treatments.push({
            treatmentType: updatedAppointment.treatmentType,
            preferredDate: treatmentDate, 
            prescriptionDate: "N/A",
            medicineType: "N/A", 
            procedure: "N/A",
            treatmentNotes: "N/A",
        });

        await patientRecord.save();
    }

    res.json({ message: 'Appointment status updated successfully', appointment: updatedAppointment });
};

exports.updateAppointment = async (req, res) => {
    const {
        firstName,
        lastName,
        treatmentType,
        preferredDate,
        prescriptionDate,
        medicineType,
        procedure,
        treatmentNotes
    } = req.body;

    // Fetch the appointment details first
    const appointment = await Appointment.findOne({ firstName, lastName });

    if (!appointment) {
        return res.status(404).json({ message: 'No appointment found for updating.' });
    }

    // Handle uploaded files
    const files = req.files ? req.files.map(file => ({
        filename: file.filename,
        originalname: file.originalname,
        path: file.path,
        uploadDate: new Date()
    })) : [];

    // Check for existing patient record
    const existingRecord = await PatientRecord.findOne({ firstName, lastName });

    if (existingRecord) {
        // Update the existing record with relevant fields
        existingRecord.age = appointment.age;
        existingRecord.gender = appointment.gender;
        existingRecord.address = appointment.address;
        existingRecord.contactNumber = appointment.contactNumber;
        existingRecord.emergencyContact = appointment.emergencyContact;
        existingRecord.selectedHistory = appointment.selectedHistory;
        existingRecord.treatmentType = treatmentType;
        existingRecord.preferredDate = preferredDate;
        existingRecord.prescriptionDate = prescriptionDate;
        existingRecord.medicineType = medicineType;
        existingRecord.procedure = procedure;
        existingRecord.treatmentNotes = treatmentNotes;
        
        // Append new files to existing uploadedFiles
        existingRecord.uploadedFiles = [...existingRecord.uploadedFiles, ...files];
        
        await existingRecord.save();

        // Send the full updated list of uploaded files in the response
        return res.status(200).json({ message: 'Patient details updated successfully.', files: existingRecord.uploadedFiles });
    } else {
        // Create a new record if none exists, including all fields and files
        const newPatientRecord = new PatientRecord({
            firstName,
            lastName,
            age: appointment.age,
            gender: appointment.gender,
            address: appointment.address,
            contactNumber: appointment.contactNumber,
            emergencyContact: appointment.emergencyContact,
            emailAddress: appointment.emailAddress,
            selectedHistory: appointment.selectedHistory,
            treatmentType,
            preferredDate,
            prescriptionDate,
            medicineType,
            procedure,
            treatmentNotes,
            uploadedFiles: files
        });
        await newPatientRecord.save();

        // Send the full list of uploaded files in the response
        return res.status(200).json({ message: 'Patient details updated successfully.', files: newPatientRecord.uploadedFiles });
    }
};

// Upload files to patient record
exports.uploadFiles = async (req, res) => {
    const { firstName, lastName } = req.body;

    // Ensure firstName and lastName are provided
    if (!firstName || !lastName) {
        return res.status(400).json({ message: 'First name and last name are required for file upload.' });
    }

    // Find the patient record
    let patientRecord = await PatientRecord.findOne({ firstName, lastName });

    if (!patientRecord) {
        return res.status(404).json({ message: 'Patient record not found.' });
    }

    // Map uploaded files
    const files = req.files ? req.files.map(file => ({
        filename: file.filename,
        originalname: file.originalname,
        path: file.path
    })) : [];

    // Append new files to the uploadedFiles array in the existing patient record
    patientRecord.uploadedFiles = [...patientRecord.uploadedFiles, ...files];
    await patientRecord.save();

    // Respond with the updated list of uploaded files
    res.status(200).json({ message: 'Files uploaded successfully.', files: patientRecord.uploadedFiles });
};

// Delete a file from patient record
exports.deleteFile = async (req, res) => {
    const { filename, firstName, lastName } = req.body;

    // Ensure all required parameters are present
    if (!filename || !firstName || !lastName) {
        return res.status(400).json({ message: 'Missing required information.' });
    }

    // Find the patient record
    const patientRecord = await PatientRecord.findOne({ firstName, lastName });
    if (!patientRecord) {
        return res.status(404).json({ message: 'Patient record not found.' });
    }

    // Filter out the file to delete
    const fileIndex = patientRecord.uploadedFiles.findIndex(file => file.filename === filename);
    if (fileIndex === -1) {
        return res.status(404).json({ message: 'File not found in patient record.' });
    }

    // Remove file from database array
    const filePath = patientRecord.uploadedFiles[fileIndex].path; // Full path to file on disk
    patientRecord.uploadedFiles.splice(fileIndex, 1);

    // Save the updated patient record
    await patientRecord.save();

    // Delete the file from the filesystem
    fs.unlink(filePath, err => {
        if (err) {
            console.error('Error deleting file from filesystem:', err);
            return res.status(500).json({ message: 'Failed to delete file from filesystem.' });
        }
        res.status(200).json({ message: 'File deleted successfully.', files: patientRecord.uploadedFiles });
    });
};

exports.getAppointmentsWithPayments = async (req, res) => {
    let filter = {};
    
    if (req.query.status) {
        filter["payment.status"] = req.query.status; // Filter by paid/unpaid status
    }

    const appointments = await Appointment.find(filter);

    if (appointments) {
        res.json(appointments);
    } else {
        console.error("Error fetching appointments");
        res.status(500).json({ error: "Server error" });
    }
};

// Format the date to yyyy-MM-dd before saving
function formatDateToYYYYMMDD(date) {
    const d = new Date(date);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0'); // Ensure 2 digits for month
    const day = String(d.getDate()).padStart(2, '0'); // Ensure 2 digits for day
    return `${year}-${month}-${day}`;
}

exports.updateTreatment = async (req, res) => {
    console.log("Received update request:", req.body);

    let { appointmentId, treatmentIndex, updatedTreatment } = req.body;
    treatmentIndex = parseInt(treatmentIndex, 10);

    if (!appointmentId || isNaN(treatmentIndex) || !updatedTreatment) {
        return res.status(400).json({ message: 'Invalid request parameters' });
    }

    // Find the appointment by ID
    const appointment = await Appointment.findById(appointmentId);

    if (!appointment) {
        console.log("Appointment not found with ID:", appointmentId);
        return res.status(404).json({ message: 'Appointment not found' });
    }

    console.log("Appointment found:", appointment);

    if (!appointment.patientRecord) {
        console.log("No patient record linked to this appointment.");
        return res.status(404).json({ message: 'No patient record linked to appointment' });
    }

    console.log("Looking for patient record with ID:", appointment.patientRecord);

    // Find the patient record
    const patientRecord = await PatientRecord.findById(appointment.patientRecord);

    if (!patientRecord) {
        console.log("Patient record not found with ID:", appointment.patientRecord);
        return res.status(404).json({ message: 'Patient record not found' });
    }

    console.log("Patient record found:", patientRecord);

    if (!Array.isArray(patientRecord.treatments)) {
        console.log("No treatments array found, creating one.");
        patientRecord.treatments = [];
    }

    if (patientRecord.treatments.length <= treatmentIndex) {
        console.log("Invalid treatment index:", treatmentIndex);
        return res.status(400).json({ message: 'Invalid treatment index' });
    }

    console.log("Before update:", patientRecord.treatments[treatmentIndex]);

    // Format treatmentDate to yyyy-MM-dd before updating
    if (updatedTreatment.preferredDate) {
        updatedTreatment.preferredDate = formatDateToYYYYMMDD(updatedTreatment.preferredDate);
    }

    // Update treatment
    patientRecord.treatments[treatmentIndex] = updatedTreatment;

    // Save updated record
    await patientRecord.save();
    console.log("After update:", patientRecord.treatments[treatmentIndex]);

    res.json({ message: 'Treatment updated successfully', patientRecord });
};

//Export the controller functions
module.exports = exports;
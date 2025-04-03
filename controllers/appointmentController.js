const Appointment = require('../models/Appointment');
const { generateReferenceNumber } = require('../services/appointmentService');
const PatientRecord = require('../models/PatientRecord');
const fs = require('fs');
const Notification = require('../models/Notification');
const { startOfDay, endOfDay, startOfWeek, endOfWeek, startOfMonth, endOfMonth } = require("date-fns");
const Dentist = require('../models/Dentist');

// Function to send a notification to the patient
const sendNotification = async (patientId, message) => {
    try {
        const notification = new Notification({
            patientId,
            message,
            isRead: false, // By default, new notifications are unread
        });
        await notification.save();
    } catch (error) {
        console.error('Error sending notification:', error);
    }
};

exports.createAppointment = async (req, res) => {
    if (!req.session.user) {
        return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const {
        firstName,
        lastName,
        gender,
        contactNumber,
        emailAddress,
        preferredDate,
        preferredTime,
        treatmentType,
        treatmentPrice,
        age,
        birthDay,
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
        emailAddress,
        preferredDate: new Date(preferredDate).toISOString().split("T")[0],
        preferredTime,
        treatmentType,
        treatmentPrice: String(treatmentPrice),
        age,
        birthDay,
        gender,
        address,
        emergencyContact,
        emergencyContactNumber,
        emergencyContactRelationship,
        selectedHistory,
        status: "Pending", // Always start as "Pending"
    };

    const newAppointment = await new Appointment(appointmentData).save();

    // Send notification to the patient after creating the appointment
    await sendNotification(req.session.user.id, `Your appointment with reference number ${referenceNumber} has been successfully created.`);

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

    try {
        // Fetch appointments and populate treatment details
        const appointments = await Appointment.find({ patient: req.session.user.id })
            .populate('treatment');

        if (!appointments || appointments.length === 0) {
            return res.status(404).json({ message: 'No appointments found' });
        }

        // Ensure `treatmentId` is null if no treatment exists
        const sanitizedAppointments = appointments.map(appointment => ({
            ...appointment.toObject(), // Convert Mongoose object to plain JSON
            treatmentId: appointment.treatmentId || null // Set null if no treatment exists
        }));

        res.json(sanitizedAppointments);
    } catch (error) {
        console.error('Error fetching appointments:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

exports.getAllAppointments = async (req, res) => {
    if (!req.session.user || req.session.user.role !== 'medical-personnel') {
        return res.status(401).json({ message: 'Unauthorized' });
    }

    const appointments = await Appointment.find();
    return res.json(appointments);
};

exports.getAppointmentDetails = async (req, res) => {
    const { appointmentId } = req.query;

    if (!appointmentId) {
        return res.status(400).json({ message: 'Appointment ID is required to fetch details.' });
    }

    try {
        const appointment = await Appointment.findById(appointmentId);
        if (!appointment) {
            return res.status(404).json({ message: 'Appointment not found.' });
        }

        let patientRecord = null;
        if (appointment.patientRecord) {
            patientRecord = await PatientRecord.findById(appointment.patientRecord);
        }

        res.json({
            firstName: appointment.firstName,
            lastName: appointment.lastName,
            age: appointment.age,
            gender: appointment.gender,
            address: appointment.address,
            birthDay: appointment.birthDay,
            contactNumber: appointment.contactNumber,
            emailAddress: appointment.emailAddress || '',
            selectedHistory: appointment.selectedHistory,
            emergencyContact: appointment.emergencyContact,
            emergencyContactNumber: appointment.emergencyContactNumber,
            emergencyContactRelationship: appointment.emergencyContactRelationship,
            treatments: patientRecord ? patientRecord.treatments : [], // ✅ Ensure treatments is always an array
            uploadedFiles: patientRecord ? patientRecord.uploadedFiles : [] // ✅ Ensure uploadedFiles is always an array
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error retrieving appointment details.' });
    }
};

exports.updateAppointmentStatus = async (req, res) => {    
    if (!req.session.user || req.session.user.role !== 'medical-personnel') {
        return res.status(401).json({ message: 'Unauthorized' });
    }

    const { id } = req.params;
    const { status } = req.body;

    let updateFields = { status };

    const updatedAppointment = await Appointment.findByIdAndUpdate(
        id,
        updateFields,
        { new: true }
    );

    if (!updatedAppointment) {
        return res.status(404).json({ message: 'Appointment not found' });
    }

    // ✅ If status is "Completed", update PatientRecord
    if (status === "Completed") {
        let patientRecord = await PatientRecord.findOne({
            firstName: updatedAppointment.firstName,
            lastName: updatedAppointment.lastName,
            contactNumber: updatedAppointment.contactNumber
        });

        if (!patientRecord) {
            // ✅ Create a new PatientRecord if none exists
            patientRecord = new PatientRecord({
                patientId: updatedAppointment.patient || new mongoose.Types.ObjectId(), // Link to patient
                patient: updatedAppointment.patient,  
                firstName: updatedAppointment.firstName,
                lastName: updatedAppointment.lastName,
                contactNumber: updatedAppointment.contactNumber,
                gender: updatedAppointment.gender,
                age: updatedAppointment.age,
                birthDay: updatedAppointment.birthDay,
                address: updatedAppointment.address,
                emergencyContact: updatedAppointment.emergencyContact,
                emergencyContactNumber: updatedAppointment.emergencyContactNumber,
                emergencyContactRelationship: updatedAppointment.emergencyContactRelationship,
                selectedHistory: updatedAppointment.selectedHistory,
                treatments: [], // Initialize treatments array
            });

            await patientRecord.save();
            updatedAppointment.patientRecord = patientRecord._id;
            await updatedAppointment.save();
        }

        // ✅ Ensure only NEW treatments are added, keeping OLD ones
        const isDuplicateTreatment = patientRecord.treatments.some(treatment =>
            treatment.treatmentType === updatedAppointment.treatmentType &&
            new Date(treatment.treatmentDate).toISOString().slice(0, 10) === 
            new Date(updatedAppointment.preferredDate).toISOString().slice(0, 10)
        );

        if (!isDuplicateTreatment) {
            // ✅ Add only the latest completed treatment
            const newTreatment = {
                treatmentType: updatedAppointment.treatmentType,
                treatmentDate: updatedAppointment.preferredDate, // Use appointment's date
                prescriptionDate: "", // Doctor fills later
                medicineType: "", // Doctor fills later
                procedure: "", // Doctor fills later
                treatmentNotes: "", // Doctor fills later
            };

            patientRecord.treatments.push(newTreatment);
        }

        await patientRecord.save(); // ✅ Save the updated record

        // Notify the patient about the completed status
        await sendNotification(updatedAppointment.patient, `Your appointment with reference number ${updatedAppointment.referenceNumber} has been marked as completed.`);
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
        // ✅ Sync changes with PatientRecord
        existingRecord.age = appointment.age;
        existingRecord.gender = appointment.gender;
        existingRecord.birthDay = appointment.birthDay;
        existingRecord.address = appointment.address;
        existingRecord.contactNumber = appointment.contactNumber;
        existingRecord.emergencyContact = appointment.emergencyContact;
        existingRecord.selectedHistory = appointment.selectedHistory;
        
        // ✅ Ensure only latest treatment is updated
        existingRecord.treatments.push({
            treatmentType,
            preferredDate,
            prescriptionDate,
            medicineType,
            procedure,
            treatmentNotes
        });

        // Append new files to existing uploadedFiles
        existingRecord.uploadedFiles = [...existingRecord.uploadedFiles, ...files];

        await existingRecord.save();

        await sendNotification(appointment.patient, `Your appointment details have been updated.`);

        return res.status(200).json({ message: 'Patient details updated successfully.', files: existingRecord.uploadedFiles });
    } else {
        // ✅ Create a new PatientRecord if it doesn't exist
        const newPatientRecord = new PatientRecord({
            firstName,
            lastName,
            age: appointment.age,
            gender: appointment.gender,
            birthDay: appointment.birthDay,
            address: appointment.address,
            contactNumber: appointment.contactNumber,
            emergencyContact: appointment.emergencyContact,
            selectedHistory: appointment.selectedHistory,
            treatments: [{
                treatmentType,
                preferredDate,
                prescriptionDate,
                medicineType,
                procedure,
                treatmentNotes
            }],
            uploadedFiles: files
        });

        await newPatientRecord.save();

        // Notify the patient about the completed status
        await sendNotification(appointment.patient, `Your appointment details have been successfully updated and saved.`);        
        
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

exports.updateTreatment = async (req, res) => {
    console.log("🛠️ Received update request:", req.body);

    let { appointmentId, treatmentIndex, updatedTreatment } = req.body;
    treatmentIndex = parseInt(treatmentIndex, 10);

    if (!appointmentId || isNaN(treatmentIndex) || !updatedTreatment) {
        return res.status(400).json({ message: 'Invalid request parameters' });
    }

    try {
        // Find the appointment
        const appointment = await Appointment.findById(appointmentId);
        if (!appointment) {
            console.log("❌ Appointment not found with ID:", appointmentId);
            return res.status(404).json({ message: 'Appointment not found' });
        }

        if (!appointment.patientRecord) {
            console.log("❌ No patient record linked to this appointment.");
            return res.status(404).json({ message: 'No patient record linked to appointment' });
        }

        // Find the patient record
        const patientRecord = await PatientRecord.findById(appointment.patientRecord);
        if (!patientRecord) {
            console.log("❌ Patient record not found with ID:", appointment.patientRecord);
            return res.status(404).json({ message: 'Patient record not found' });
        }

        if (!Array.isArray(patientRecord.treatments)) {
            patientRecord.treatments = [];
        }

        if (patientRecord.treatments.length <= treatmentIndex) {
            console.log("❌ Invalid treatment index:", treatmentIndex);
            return res.status(400).json({ message: 'Invalid treatment index' });
        }

        console.log("✅ Before update:", patientRecord.treatments[treatmentIndex]);

        // Ensure date formatting is correct
        updatedTreatment.treatmentDate = formatDateToYYYYMMDD(updatedTreatment.treatmentDate);
        updatedTreatment.prescriptionDate = formatDateToYYYYMMDD(updatedTreatment.prescriptionDate);

        // Get the existing treatment
        const existingTreatment = patientRecord.treatments[treatmentIndex];

        // Merge new values with existing treatment
        patientRecord.treatments[treatmentIndex] = {
            ...existingTreatment, // Preserve existing values
            ...updatedTreatment, // Apply new values
        };

        // 🔥 Debugging logs before saving
        console.log("🛠️ Merged updated treatment:", patientRecord.treatments[treatmentIndex]);

        // 🔥 Use findOneAndUpdate instead of markModified + save()
        const updatedPatient = await PatientRecord.findOneAndUpdate(
            { _id: patientRecord._id, [`treatments._id`]: existingTreatment._id },
            { $set: { [`treatments.$`]: patientRecord.treatments[treatmentIndex] } },
            { new: true }
        );

        // Fetch the latest record from the database
        const refreshedPatientRecord = await PatientRecord.findById(patientRecord._id);

        console.log("✅ After update (DB fetch):", refreshedPatientRecord.treatments[treatmentIndex]);

        res.json({ message: '✅ Treatment updated successfully', updatedTreatment: refreshedPatientRecord.treatments[treatmentIndex] });

    } catch (error) {
        console.error("❌ Error updating treatment:", error);
        res.status(500).json({ message: "Internal server error", error });
    }
};

// ✅ Helper function to format date to YYYY-MM-DD
function formatDateToYYYYMMDD(dateStr) {
    if (!dateStr) return "";
    const parts = dateStr.split('-'); // Convert "03-10-2025" → ["03", "10", "2025"]
    return `${parts[2]}-${parts[0]}-${parts[1]}`; // Convert to "2025-03-10"
}

// Fetch appointment report by date range (only counting "Completed" status)
exports.getAppointmentReport = async (req, res) => {
    try {
        const { startDate, endDate } = req.query;

        if (!startDate || !endDate) {
            return res.status(400).json({ message: "Start date and end date are required." });
        }

        console.log("Start Date:", startDate);
        console.log("End Date:", endDate);

        // Fetch only completed appointments within the date range
        const appointments = await Appointment.find({
            status: "Completed",
            preferredDate: { $gte: startDate, $lte: endDate } // Compare as string (YYYY-MM-DD)
        })
            .sort({ preferredDate: -1 })
            .select("firstName lastName contactNumber preferredDate"); // Use firstName & lastName

        console.log("Appointments found:", appointments.length); // ✅ Debugging output

        res.status(200).json({
            appointments: appointments.map(app => ({
                patientName: `${app.firstName} ${app.lastName}`,
                contactNumber: app.contactNumber,
                preferredDate: app.preferredDate
            }))
        });

    } catch (error) {
        console.error("Error in getAppointmentReport:", error);
        res.status(500).json({ message: "Server error" });
    }
};

exports.assignDentist = async (req, res) => {
    try {
        const { assignedDentist } = req.body;
        const dentist = await Dentist.findById(assignedDentist);
        if (!dentist) return res.status(404).json({ error: "Dentist not found" });

        const appointment = await Appointment.findByIdAndUpdate(
            req.params.id,
            { assignedDentist },
            { new: true }
        ).populate("assignedDentist");

        if (!appointment) return res.status(404).json({ error: "Appointment not found" });

        res.json({ message: "Dentist assigned successfully", appointment });
    } catch (error) {
        res.status(500).json({ error: "Failed to assign dentist" });
    }
};

//Export the controller functions
module.exports = exports;
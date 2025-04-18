const Patient = require('../models/Patient');
const { updateUser } = require('../services/userService');
const { formatDate, monthNames } = require('../utils/dateUtils');
const { findUserByEmail } = require('../utils/dbUtils');
const bcrypt = require('bcrypt');
const Appointment = require('../models/Appointment');
const PatientRecord = require('../models/PatientRecord');
const fs = require('fs');
const path = require('path');
const Notification = require('../models/Notification');

// Create a new patient account
exports.createPatient = async (req, res) => {
    const { firstName, lastName, birthday, email, password } = req.body;

    if (!firstName || !lastName || !birthday || !email || !password) {
        return res.status(400).json({ message: 'Please fill in all fields.' });
    }

    const formattedBirthday = formatDate(birthday);

    const existingPatient = await Patient.findOne({ email });
    if (existingPatient) {
        return res.status(400).json({ message: 'Email already registered.' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const newPatient = new Patient({ firstName, lastName, birthday: formattedBirthday, email, password: hashedPassword });

    const saveResult = await newPatient.save();
    if (saveResult) {
        return res.status(201).json({ message: 'Account created successfully.' });
    } else {
        return res.status(500).json({ message: 'An error occurred while creating the account.' });
    }
};

// Handle patient login
exports.loginPatient = async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ message: 'Please provide email and password.' });
    }

    const patient = await Patient.findOne({ email });
    if (patient) {
        const isMatch = await bcrypt.compare(password, patient.password);
        if (isMatch) {
            req.session.user = { id: patient._id, email: patient.email, role: 'patient' };

            // Check if it's the patient's first login
            if (patient.isFirstLogin) {
                // Create a "Welcome" notification
                const notification = new Notification({
                    user: patient._id,
                    userModel: 'Patient',
                    title: 'Welcome to Our Health Platform!',
                    message: 'Welcome to EJPL Dental Clinic! Explore our dental services and keep your smile healthy and bright.',
                    type: 'Welcome'
                });
                await notification.save();

                // Update isFirstLogin to false after the first login
                patient.isFirstLogin = false;
                await patient.save();
            }

            return res.status(200).json({ message: 'Login successful.' });
        } else {
            return res.status(400).json({ message: 'Incorrect password.' });
        }
    } else {
        return res.status(400).json({ message: 'Email address is not registered.' });
    }
};

// Handle patient logout
exports.logoutPatient = (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            return res.status(500).json({ message: 'An error occurred while logging out.' });
        }
        return res.status(200).json({ message: 'Logout successful.' });
    });
};

// Get patient profile
exports.getPatientProfile = async (req, res) => {
    if (!req.session.user) {
        return res.status(401).json({ message: 'Unauthorized' });
    }

    const patient = await findUserByEmail(Patient, req.session.user.email);
    if (!patient) {
        return res.status(404).json({ message: 'Patient not found' });
    }

    res.json({
        firstName: patient.firstName,
        lastName: patient.lastName,
        birthday: patient.birthday,
        email: patient.email,
        profilePicture: patient.profilePicture || null
    });
};

// Update patient profile
exports.updatePatientProfile = async (req, res) => {
    if (!req.session.user) {
        return res.status(401).json({ message: 'Unauthorized' });
    }

    const { email, newPassword } = req.body;
    const patient = await findUserByEmail(Patient, req.session.user.email);
    if (!patient) {
        return res.status(404).json({ message: 'Patient not found' });
    }

    let emailUpdated = false;
    let passwordUpdated = false;

    if (email && email !== patient.email) {
        patient.email = email;
        emailUpdated = true;
    }

    if (newPassword) {
        patient.password = await bcrypt.hash(newPassword, 10);
        passwordUpdated = true;
    }

    const saveResult = await patient.save();
    if (!saveResult) {
        return res.status(500).json({ message: 'Error updating profile.' });
    }

    req.session.user.email = email; // Update session email if changed

    // Create notification
    const updateMessage = emailUpdated && passwordUpdated
        ? 'Your email and password have been successfully updated.'
        : emailUpdated
            ? 'Your email has been successfully updated.'
            : passwordUpdated
                ? 'Your password has been successfully updated.'
                : null;

    if (updateMessage) {
        await Notification.create({
            user: patient._id,
            title: 'Profile Updated',
            message: updateMessage,
            type: 'Profile'
        });
    }

    res.json({ message: 'Profile updated successfully', emailUpdated, passwordUpdated });
};

// Upload profile picture
exports.uploadProfilePicture = async (req, res) => {
    if (!req.session.user) {
        return res.status(401).json({ message: 'Unauthorized' });
    }

    const patient = await Patient.findOne({ email: req.session.user.email });
    if (!patient) {
        return res.status(404).json({ message: 'Patient not found' });
    }

    patient.profilePicture = req.file.filename;
    await patient.save();

    res.json({ message: 'Profile picture uploaded successfully.', filename: req.file.filename });
};

// Delete profile picture
exports.deleteProfilePicture = async (req, res) => {
    if (!req.session.user || req.session.user.role !== 'patient') {
        return res.status(401).json({ message: 'Unauthorized' });
    }

    const patient = await findUserByEmail(Patient, req.session.user.email).catch(() => null);

    if (!patient) {
        return res.status(404).json({ message: 'Patient not found.' });
    }

    // Get the current profile picture path
    patient.profilePicture = null;
    await patient.save();

    return res.status(200).json({ message: 'Profile picture deleted successfully.' });

    // Delete the file if it exists
    if (profilePicturePath && fs.existsSync(profilePicturePath)) {
        try {
            fs.unlinkSync(profilePicturePath);
        } catch (error) {
            console.error('Error deleting profile picture:', error);
            return res.status(500).json({ message: 'Failed to delete profile picture file.' });
        }
    }

    // Set the profilePicture field to null in the database
    patient.profilePicture = null;
    const saveResult = await patient.save().catch(() => null);

    if (!saveResult) {
        return res.status(500).json({ message: 'Failed to delete profile picture.' });
    } else {
        return res.status(200).json({ message: 'Profile picture deleted successfully.' });
    }
};

// Example function to get the full month name from the month index
function getMonthName(monthIndex) {
    return monthNames[monthIndex];  // Access the month name by index
}

// Example function: Format a patient's birthdate or other date fields
function formatPatientBirthday(birthday) {
    return formatDate(birthday); // Use the formatDate function from utils/dateUtils.js
}

// Example usage of monthNames and getMonthName
console.log(getMonthName(0));

// Controller to get patient by email
async function getPatientByEmail(req, res) {
    const email = req.params.email; // Get email from the route params
    const Patient = await findUserByEmail(Patient, email); // Fetch the patient by email using the utility function

    if (Patient) {
        res.json(Patient); // Return the patient if found
    } else {
        res.status(404).json({ message: 'Patient not found' });
    }
}

exports.getPatientRecords = async (req, res) => {
    if (!req.session.user) {
        return res.status(401).json({ message: 'Unauthorized' });
    }

    try {
        // Find the patient using the session user ID
        const patient = await Patient.findById(req.session.user.id);
        if (!patient) {
            return res.status(404).json({ message: 'Patient not found.' });
        }

        // Find the patient's record using patientId
        const patientRecord = await PatientRecord.findOne({ patientId: patient._id });

        if (!patientRecord) {
            return res.status(404).json({ message: 'Patient record not found.' });
        }

        res.json(patientRecord);
    } catch (error) {
        console.error('Error fetching patient records:', error);
        res.status(500).json({ message: 'Server error while fetching records.' });
    }
};

// Controller to get patient by ID
exports.getPatientById = async (req, res) => {
    try {
        const patient = await PatientRecord.findById(req.params.id);
        if (!patient) {
            return res.status(404).json({ message: "Patient not found" });
        }
        res.json(patient);
    } catch (error) {
        res.status(500).json({ message: "Server error" });
    }
};

// Export the controller functions
module.exports = exports;
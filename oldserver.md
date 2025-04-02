const express = require('express');
const path = require('path');
const mongoose = require('mongoose');
//const bodyParser = require('body-parser');
const bcrypt = require('bcrypt');
const cors = require('cors');
const session = require('express-session'); // Import express-session
//const multer = require('multer');
const fs = require('fs');

const app = express();

// MongoDB connection
mongoose.connect('mongodb://localhost:27017/EJPLDentalClinicDB', {
    useNewUrlParser: true,
    useUnifiedTopology: true
});

// Patient Schema
const patientSchema = new mongoose.Schema({
    firstName: String,
    lastName: String,
    birthday: String,
    email: { type: String, unique: true },
    password: String,
    profilePicture: String
});

const Patient = mongoose.model('Patient', patientSchema);

const medicalPersonnelSchema = new mongoose.Schema({
    firstName: { type: String, required: true },
    middleName: { type: String},
    lastName: { type: String, required: true },
    birthday: String,
    email: { type: String, unique: true, required: true },
    password: { type: String, required: true },
    isGeneratedPassword: { type: Boolean, default: false },
    profilePicture: { type: String },
});

const MedicalPersonnel = mongoose.model('MedicalPersonnel', medicalPersonnelSchema);

const appointmentSchema = new mongoose.Schema({
    patient: { type: mongoose.Schema.Types.ObjectId, ref: 'Patient' },
    status: String,
    referenceNumber: String,
    firstName: String,
    lastName: String,
    age: String,
    gender: String,
    address: String,
    contactNumber: String,
    emailAddress: String,
    selectedHistory: String,
    emergencyContact: String,
    emergencyContactNumber: String,
    emergencyContactRelationship: String,
    preferredDate: String,
    preferredTime: String,
    treatmentType: String
});
const Appointment = mongoose.model('Appointment', appointmentSchema);

// Patient Record Schema
const patientRecordSchema = new mongoose.Schema({
    firstName: String,
    lastName: String,
    emailAddress: String,
    age: String,
    gender: String,
    address: String,
    selectedHistory: String,
    contactNumber: String,
    emailAddress: String,
    emergencyContact: String,
    treatmentType: String,
    treatmentDate: String,
    prescriptionDate: String,
    medicineType: String,
    procedure: String,
    treatmentNotes: String,
    uploadedFiles:[
        {
            filename: String,
            path: String,
            originalname: String,
            uploadDate:{ type: Date, default: Date.now}
        }
    ]
});

const PatientRecord = mongoose.model('PatientRecord', patientRecordSchema);

// Middleware
app.use(bodyParser.json());

// Configure session middleware
app.use(cors());
app.use(
    session({
        secret: "your-secret-key", // Replace with a strong secret
        resave: false,
        saveUninitialized: false,
        cookie: { secure: false }, // Set to true if using HTTPS
    })
);

// Define month names
const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
];

// Helper function to format the date
function formatDate(dateString) {
    const [year, month, day] = dateString.split('-');
    const monthName = monthNames[parseInt(month, 10) - 1]; // Month is 0-indexed in arrays
    return `${monthName} ${day}, ${year}`; // Format: Month Name Day, Year
}

// Helper function to find a user by email
async function findUserByEmail(Model, email) {
    return await Model.findOne({ email });
}

// Helper function to update user email and/or password
async function updateUser(user, newEmail, newPassword) {
    let emailUpdated = false;
    let passwordUpdated = false;

    // Update email if changed
    if (user.email !== newEmail) {
        user.email = newEmail;
        emailUpdated = true;
    }

    // Update password if provided
    if (newPassword) {
        user.password = await bcrypt.hash(newPassword, 10);
        passwordUpdated = true;
    }

    await user.save();
    return { emailUpdated, passwordUpdated };
}

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads'); // Ensure files are saved in the 'uploads' directory
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + '-' + file.originalname); // Set a unique filename
    }
});

const upload = multer({
    storage: storage,
    limits:{
        fileSize: 200 * 1024 * 1024 // 200 MB file size limit
    },
    fileFilter: (req, file, cb) => {
        const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf'];

        if (allowedTypes.includes(file.mimetype)){
            cb(null, true);
        }else{
            cb(new Error('Incorrect file type. Only JPEG, PNG, JPG, and PDF files are allowed.'));
        }
    }
}); -END: Jan.29, 2025 at 2:23AM-

// Route to create a patient account
app.post('/patient/create', async (req, res) => {
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
});

// Route to handle patient login
app.post('/patient/login', async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ message: 'Please provide email and password.' });
    }

    const patient = await Patient.findOne({ email });
    if (patient) {
        const isMatch = await bcrypt.compare(password, patient.password);
        if (isMatch) {
            req.session.user = { id: patient._id, email: patient.email, role: 'patient' }; // Store patient ID
            return res.status(200).json({ message: 'Login successful.' });
        } else {
            return res.status(400).json({ message: 'Incorrect password.' });
        }
    } else {
        return res.status(400).json({ message: 'Email address is not registered.' });
    }
});

app.get('/patient/profile', async (req, res) => {
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
});

app.post('/patient/update', async (req, res) => {
    if (!req.session.user) {
        return res.status(401).json({ message: 'Unauthorized' });
    }

    const { email, newPassword } = req.body;
    const patient = await findUserByEmail(Patient, req.session.user.email);
    if (!patient) {
        return res.status(404).json({ message: 'Patient not found' });
    }

    const { emailUpdated, passwordUpdated } = await updateUser(patient, email, newPassword);

    req.session.user.email = email; // Update session email if changed
    res.json({ message: 'Profile updated successfully', emailUpdated, passwordUpdated });
});

// Helper function to generate a reference number
function generateReferenceNumber() {
    const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const numbers = '0123456789';
    let randomString = 'EJPL-';

    for (let i = 0; i < 9; i++) {
        if (Math.random() < 0.5) {
            randomString += letters.charAt(Math.floor(Math.random() * letters.length));
        } else {
            randomString += numbers.charAt(Math.floor(Math.random() * numbers.length));
        }
    }

    return randomString;
}

// Route for Appointment creation
// Assuming this is part of your appointment creation logic
app.post('/patient/appointments', async (req, res) => {
    if (!req.session.user) {
        return res.status(401).json({ message: 'Unauthorized' });
    }

    const { preferredDate, preferredTime } = req.body;

    const existingAppointments = await Appointment.find({ preferredDate, preferredTime });
    if (existingAppointments.length >= 2) {
        return res.status(400).json({ message: 'Appointment slots full for this time.' });
    }

    const referenceNumber = generateReferenceNumber();
    const newAppointment = new Appointment({
        ...req.body,
        patient: req.session.user.id, // Store patient ID
        referenceNumber,
        status: 'Pending',
    });

    await newAppointment.save();
    return res.status(201).json({ success: true, message: 'Appointment created successfully.', referenceNumber });
});

// Route to get appointments by patient
app.get('/patient/appointments', async (req, res) => {
    if (!req.session.user) {
        return res.status(401).json({ message: 'Unauthorized' });
    }

    const appointments = await Appointment.find({ patient: req.session.user.id }); // Fetch appointments using patient ID
    if (!appointments) {
        return res.status(404).json({ message: 'No appointments found' });
    }

    res.json(appointments);
});

// Route to handle patient logout
app.post('/patient/logout', (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            return res.status(500).json({ message: 'An error occurred while logging out.' });
        }
        return res.status(200).json({ message: 'Logout successful.' });
    });
});

app.post('/patient/upload-profile-picture', upload.single('profilePicture'), async (req, res) => {
    if (!req.session.user) {
        return res.status(401).json({ message: 'Unauthorized' });
    }

    const patient = await Patient.findOne({ email: req.session.user.email });
    if (!patient) {
        return res.status(404).json({ message: 'Patient not found' });
    }

    // Save the profile picture filename in the database
    patient.profilePicture = req.file.filename;
    await patient.save();

    res.json({ message: 'Profile picture uploaded successfully.', filename: req.file.filename });
});

app.delete('/patient/delete-profile-picture', async (req, res) => {
    if (!req.session.user || req.session.user.role !== 'patient') {
        res.status(401).json({ message: 'Unauthorized' });
    } else {
        const patient = await findUserByEmail(Patient, req.session.user.email).catch(() => null);

        if (!patient) {
            res.status(404).json({ message: 'Patient not found.' });
        } else {
            patient.profilePicture = null;
            const saveResult = await patient.save().catch(() => null);

            if (!saveResult) {
                res.status(500).json({ message: 'Failed to delete profile picture.' });
            } else {
                res.status(200).json({ message: 'Profile picture deleted successfully.' });
            }
        }
    }
}); -END: 30, 2025 AT 1:07AM-

// Route to handle medical personnel login
app.post('/medical-personnel/login', async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ message: 'Please provide email and password.' });
    }

    const personnel = await MedicalPersonnel.findOne({ email: email.toLowerCase().trim() });

    if (!personnel) {
        return res.status(400).json({ message: 'Email address is not registered.' });
    }

    // Log the hashed password stored in the DB and the plain password entered by the user for debugging
    console.log('Stored hashed password:', personnel.password);
    console.log('Entered password:', password);

    const isMatch = await bcrypt.compare(password, personnel.password);

    if (!isMatch) {
        return res.status(400).json({ message: 'Incorrect password.' });
    }

    req.session.user = { email: personnel.email, role: 'medical-personnel' };
    return res.status(200).json({
        message: 'Login successful.',
        isGeneratedPassword: personnel.isGeneratedPassword // Pass it to the client
    });
});

app.post('/medical-personnel/change-password', async (req, res) => {
    const { email, newPassword } = req.body;

    if (!email || !newPassword) {
        return res.status(400).json({ message: 'Email and new password are required.' });
    }

    const personnel = await MedicalPersonnel.findOne({ email: email.toLowerCase().trim() });

    if (!personnel) {
        return res.status(400).json({ message: 'Email not found.' });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    personnel.password = hashedPassword;
    personnel.isGeneratedPassword = false; // Mark the password as no longer generated

    await personnel.save();

    res.status(200).json({ message: 'Password changed successfully.' });
});

app.post('/medical-personnel/forgot-password', async (req, res) => {
    const { email } = req.body;
    const user = await findUserByEmail(email);

    if (!user) {
        return res.status(400).json({ message: 'Email not found' });
    }

    // Generate reset token (e.g., JWT or a random string)
    const resetToken = generateResetToken();
    const resetUrl = `http://example.com/reset-password?token=${resetToken}`;

    // Send email with reset link (using nodemailer or similar)
    sendPasswordResetEmail(user.email, resetUrl);

    res.status(200).json({ message: 'Password reset email sent' });
});

// Route to handle medical personnel logout
app.post('/medical-personnel/logout', (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            return res.status(500).json({ message: 'An error occurred while logging out.' });
        }
        return res.status(200).json({ message: 'Logout successful.' });
    });
});

// Route to fetch the profile of medical personnel
app.get('/medical-personnel/profile', async (req, res) => {
    if (!req.session.user || req.session.user.role !== 'medical-personnel') {
        return res.status(401).json({ message: 'Unauthorized' });
    }

    const personnel = await findUserByEmail(MedicalPersonnel, req.session.user.email);
    if (!personnel) {
        return res.status(404).json({ message: 'Medical personnel not found' });
    }

    res.json({
        firstName: personnel.firstName,
        lastName: personnel.lastName,
        birthday: personnel.birthday,
        email: personnel.email,
        profilePicture: personnel.profilePicture || null
    });
});

app.post('/medical-personnel/update', async (req, res) => {
    if (!req.session.user) {
        return res.status(401).json({ message: 'Unauthorized' });
    }

    const { email, newPassword } = req.body;
    const personnel = await findUserByEmail(MedicalPersonnel, req.session.user.email);
    if (!personnel) {
        return res.status(404).json({ message: 'Medical Personnel not found' });
    }

    // Check for email conflicts with other users
    const existingPersonnel = await MedicalPersonnel.findOne({ email });
    if (existingPersonnel && existingPersonnel.email !== req.session.user.email) {
        return res.status(400).json({ message: 'Email is already in use by another account.' });
    }

    const { emailUpdated, passwordUpdated } = await updateUser(personnel, email, newPassword);

    req.session.user.email = email; // Update session email if changed
    res.json({ message: 'Profile updated successfully', emailUpdated, passwordUpdated });
});

app.post('/medical-personnel/upload-profile-picture', upload.single('profilePicture'), async (req, res) => {
    if (!req.session.user) {
        return res.status(401).json({ message: 'Unauthorized' });
    }

    const personnel = await MedicalPersonnel.findOne({ email: req.session.user.email });
    if (!personnel) {
        return res.status(404).json({ message: 'Medical personnel not found' });
    }

    // Save the profile picture filename in the database
    personnel.profilePicture = req.file.filename;
    await personnel.save();

    res.json({ message: 'Profile picture uploaded successfully.', filename: req.file.filename });
});

app.delete('/medical-personnel/delete-profile-picture', async (req, res) => {
    if (!req.session.user || req.session.user.role !== 'medical-personnel') {
        res.status(401).json({ message: 'Unauthorized' });
    } else {
        const personnel = await findUserByEmail(MedicalPersonnel, req.session.user.email).catch(() => null);

        if (!personnel) {
            res.status(404).json({ message: 'Medical personnel not found.' });
        } else {
            personnel.profilePicture = null;
            const saveResult = await personnel.save().catch(() => null);

            if (!saveResult) {
                res.status(500).json({ message: 'Failed to delete profile picture.' });
            } else {
                res.status(200).json({ message: 'Profile picture deleted successfully.' });
            }
        }
    }
});

// Route to check if the logged-in user is authorized
app.get('/auth/status', (req, res) => {
    const loggedInUser = req.session?.user;

    if (!loggedInUser) {
        return res.status(401).json({ authorized: false });
    }

    // Check if the user is authorized (replace email with your criteria)
    const isAuthorized = loggedInUser.email === 'staff@ejpl.dentalclinic.com';
    res.status(200).json({ authorized: isAuthorized });
});

function authorizeAdmin(req, res, next) {
    const loggedInUser = req.session?.user;

    if (!loggedInUser || loggedInUser.email !== 'staff@ejpl.dentalclinic.com') {
        return res.status(403).json({ message: 'Unauthorized action.' });
    }

    next(); // User is authorized, proceed
}

// Protect add staff route
app.post('/medical-personnel/add', authorizeAdmin, async (req, res) => {
    const { firstName, middleName, lastName, birthday, email } = req.body;

    // Validate required fields
    if (!firstName || !lastName || !birthday || !email) {
        return res.status(400).json({ message: 'First Name, Last Name, Birthday, and Email are required' });
    }

    const plainPassword = generatePassword();
    const hashedPassword = await bcrypt.hash(plainPassword, 10);

    const normalizedEmail = email.toLowerCase().trim();

    // Check if the email already exists
    const existingStaff = await MedicalPersonnel.findOne({ email: normalizedEmail });

    if (existingStaff) {
        return res.status(400).json({ message: 'Email already exists.' });
    }

    // Format the email using only the first letter of the last name, first name, month, and day
    const [year, month, day] = birthday.split('-');  // Extract the month and day

    const formattedEmail = middleName
        ? `${lastName[0].toLowerCase()}${firstName[0].toLowerCase()}${middleName[0].toLowerCase()}${month}${day}@ejpl.dentalclinic.com`
        : `${lastName[0].toLowerCase()}${firstName[0].toLowerCase()}${month}${day}@ejpl.dentalclinic.com`;

    // Store the birthday in the original YYYY-MM-DD format
    const formattedBirthday = birthday; // Keep as is (already in YYYY-MM-DD)

    // Create the new staff member
    const newStaff = new MedicalPersonnel({
        firstName,
        middleName: middleName || null,
        lastName,
        birthday: formattedBirthday, // Store birthday as YYYY-MM-DD
        email: formattedEmail,  // Use the email generated with MMDD format
        password: hashedPassword,
        isGeneratedPassword: true,
    });

    await newStaff.save();

    // Send the correctly formatted email to the frontend
    res.status(201).json({
        message: 'Staff added successfully!',
        email: formattedEmail,  // Send the correct email to the frontend
        password: plainPassword,
    });
});

// Function to generate a random password (8-12 characters)
function generatePassword() {
    const length = 8; // Ensure this matches the intended range
    const charset = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    let password = "";
    for (let i = 0; i < length; i++) {
        password += charset.charAt(Math.floor(Math.random() * charset.length));
    }
    return password;
}

// Protect remove staff route
app.delete('/medical-personnel/remove', authorizeAdmin, async (req, res) => {
    const { email } = req.body;

    if (!email) {
        return res.status(400).json({ message: 'Email is required.' });
    }

    const staff = await MedicalPersonnel.findOneAndDelete({ email });
    if (!staff) {
        return res.status(404).json({ message: 'Staff not found.' });
    }

    res.status(200).json({ message: 'Staff removed successfully.' });
});

// Route to fetch all appointments
app.get('/appointments', async (req, res) => {
    if (!req.session.user || req.session.user.role !== 'medical-personnel') {
        return res.status(401).json({ message: 'Unauthorized' });
    }

    const appointments = await Appointment.find();
    return res.json(appointments);
});

app.get('/appointments/details', async (req, res) => {
    const firstName = req.query.firstName;

    if (!firstName) {
        return res.status(400).json({ message: 'First name is required to fetch appointment details.' });
    }

    const appointment = await Appointment.findOne({ firstName });
    const patientRecord = await PatientRecord.findOne({ firstName });

    if (appointment && patientRecord) {
        res.json({
            firstName: appointment.firstName,
            lastName: appointment.lastName,
            age: appointment.age,
            gender: appointment.gender,
            address: appointment.address,
            contactNumber: appointment.contactNumber,
            email: appointment.emailAddress,
            selectedHistory: appointment.selectedHistory,
            emergencyContact: appointment.emergencyContact,
            treatmentType: appointment.treatmentType,
            uploadedFiles: patientRecord.uploadedFiles || []
        });
    } else {
        res.status(404).json({ message: 'No appointment or patient record found.' });
    }
});

app.put('/appointments/:id/status', async (req, res) => {
    if (!req.session.user || req.session.user.role !== 'medical-personnel') {
        return res.status(401).json({ message: 'Unauthorized' });
    }

    const { id } = req.params;
    const { status } = req.body;

    const updatedAppointment = await Appointment.findByIdAndUpdate(
        id,
        { status },
        { new: true }
    );

    if (updatedAppointment) {
        res.json({ message: 'Appointment status updated successfully', appointment: updatedAppointment });
    } else if (!updatedAppointment) {
        res.status(404).json({ message: 'Appointment not found' });
    } else {
        res.status(500).json({ message: 'Failed to update appointment status' });
    }
});

app.post('/appointments/update', upload.array('files'), async (req, res) => {
    const {
        firstName,
        lastName,
        treatmentType,
        treatmentDate,
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
        existingRecord.treatmentDate = treatmentDate;
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
            treatmentDate,
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
});

app.post('/appointments/upload-files', upload.array('files'), async (req, res) => {
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
});

app.post('/appointments/delete-file', async (req, res) => {
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
});

//Error handling middleware
app.use((err, req, res, next) => {
    if (err){
        res.status(err.statusCode || 500).json({ message: err.message || 'An error occurred during file upload.' });
    }else{
        next();
    }
});

app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Serve static files from the "public" directory
app.use(express.static(path.join(__dirname, 'public')));

// Serve pages
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'main page', 'home.html'));
});

// Routes for Medical Personnel pages
app.get('/medical-personnel/create', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'Medical Personnel', 'create.personnel.html'));
});

app.get('/medical-personnel/login', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'Medical Personnel', 'login-medicalpersonnel.html'));
});

app.get('/medical-personnel/home', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'Medical Personnel', 'personnel-home.html'));
});

// Routes for Patient pages
app.get('/patient/create', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'Patient', 'create.patient.html'));
});

app.get('/patient/login', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'Patient', 'login-patient.html'));
});

app.get('/patient/home', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'Patient', 'patient-home.html'));
});

// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
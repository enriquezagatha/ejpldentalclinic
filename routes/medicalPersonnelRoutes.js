const express = require('express');
const router = express.Router();
const upload = require('../middleware/fileUploadMiddleware');
const { authorizeAdmin } = require('../routes/authRoutes');
const bcrypt = require('bcrypt');
const MedicalPersonnel = require('../models/MedicalPersonnel');
const medicalPersonnelController = require('../controllers/medicalPersonnelController');

// Route to medical personnel login
router.post('/login', medicalPersonnelController.loginPersonnel);

// Change Password
router.post('/change-password', medicalPersonnelController.changePassword);

// Route to medical personnel logout
router.post('/logout', medicalPersonnelController.logoutPersonnel);

// Route to get medical personnel profile
router.get('/profile', medicalPersonnelController.getPersonnelProfile);

// Route to update medical personnel profile
router.post('/profile', medicalPersonnelController.updatePersonnelProfile);

// Route to upload profile picture
router.post('/upload-profile-picture',upload.single('profilePicture'), medicalPersonnelController.uploadProfilePicture);

// Route to delete profile picture
router.delete('/delete-profile-picture', medicalPersonnelController.deleteProfilePicture);

// Route to add a new staff member (protected by authorizeAdmin middleware)
router.post('/add', authorizeAdmin, async (req, res) => {
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

    // Store the birthday in the original YYYY-MM-DD format
    const formattedBirthday = birthday; // Keep as is (already in YYYY-MM-DD)

    // Create the new staff member
    const newStaff = new MedicalPersonnel({
        firstName,
        middleName: middleName || null,
        lastName,
        birthday: formattedBirthday, // Store birthday as YYYY-MM-DD
        email: normalizedEmail,  // Use the user-provided email
        password: hashedPassword,
        isGeneratedPassword: true,
    });

    await newStaff.save();

    // Send the correctly formatted email to the frontend
    res.status(201).json({
        message: 'Staff added successfully!',
        email: normalizedEmail,  // Send the user-provided email to the frontend
        password: plainPassword,
    });
});

// Function to generate a random password (8-12 characters)
function generatePassword() {
    const length = 12; // Increased password length for better security
    const charset = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    let password = "";
    for (let i = 0; i < length; i++) {
        password += charset.charAt(Math.floor(Math.random() * charset.length));
    }
    return password;
}

// Route to delete staff member (protected by authorizeAdmin middleware)
router.delete('/remove', authorizeAdmin, async (req, res) => {
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

//Route to get all medical personnel (protected by authorizeAdmin middleware)
router.get('/list', authorizeAdmin, medicalPersonnelController.getAllMedicalPersonnel);

// Export the routes
module.exports = router;
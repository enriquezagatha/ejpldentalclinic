const express = require("express");
const router = express.Router();
const upload = require("../middleware/fileUploadMiddleware");
const { authorizeAdmin } = require("../routes/authRoutes");
const bcrypt = require("bcryptjs");
const MedicalPersonnel = require("../models/MedicalPersonnel");
const medicalPersonnelController = require("../controllers/medicalPersonnelController");

// Route to medical personnel login
router.post("/login", medicalPersonnelController.loginPersonnel);

// Change Password
router.post("/change-password", medicalPersonnelController.changePassword);

// Route to medical personnel logout
router.post("/logout", medicalPersonnelController.logoutPersonnel);

// Route to get medical personnel profile
router.get("/profile", medicalPersonnelController.getPersonnelProfile);

// Route to update medical personnel profile
router.post("/profile", medicalPersonnelController.updatePersonnelProfile);

// Route to upload profile picture
router.post(
  "/upload-profile-picture",
  upload.single("profilePicture"),
  medicalPersonnelController.uploadProfilePicture
);

// Route to delete profile picture
router.delete(
  "/delete-profile-picture",
  medicalPersonnelController.deleteProfilePicture
);

// Route to add a new staff member (protected by authorizeAdmin middleware)
router.post("/add", authorizeAdmin, async (req, res) => {
  const {
    firstName,
    middleName,
    lastName,
    birthday,
    email,
    isAuthorizedPersonnel,
  } = req.body;

  // Validate required fields
  if (!firstName || !lastName || !birthday || !email) {
    return res
      .status(400)
      .json({
        message: "First Name, Last Name, Birthday, and Email are required",
      });
  }

  const authorized = isAuthorizedPersonnel ?? false;

  const plainPassword = generatePassword();
  const hashedPassword = await bcrypt.hash(plainPassword, 10);

  const normalizedEmail = email.toLowerCase().trim();

  // Check if the email already exists
  const existingStaff = await MedicalPersonnel.findOne({
    email: normalizedEmail,
  });

  if (existingStaff) {
    return res.status(400).json({ message: "Email already exists." });
  }

  // Store the birthday in the original YYYY-MM-DD format
  const formattedBirthday = birthday; // Keep as is (already in YYYY-MM-DD)

  // Create the new staff member
  const newStaff = new MedicalPersonnel({
    firstName,
    middleName: middleName || null,
    lastName,
    birthday: formattedBirthday, // Store birthday as YYYY-MM-DD
    email: normalizedEmail, // Use the user-provided email
    password: hashedPassword,
    isGeneratedPassword: true,
    isAuthorizedPersonnel: authorized,
  });

  await newStaff.save();

  // Send the correctly formatted email to the frontend
  res.status(201).json({
    message: "Staff added successfully!",
    email: normalizedEmail, // Send the user-provided email to the frontend
    password: plainPassword,
  });
});

// Toggle medical personnel authorization (protected)
router.patch("/authorize", authorizeAdmin, async (req, res) => {
  const { email, isAuthorized } = req.body;

  if (!email || typeof isAuthorized !== "boolean") {
    return res
      .status(400)
      .json({ message: "Email and isAuthorized (boolean) are required." });
  }

  const updatedPersonnel = await MedicalPersonnel.findOneAndUpdate(
    { email },
    { isAuthorizedPersonnel: isAuthorized },
    { new: true }
  );

  if (!updatedPersonnel) {
    return res.status(404).json({ message: "Personnel not found." });
  }

  res.status(200).json({
    message: `Personnel ${
      isAuthorized ? "authorized" : "unauthorized"
    } successfully.`,
    personnel: updatedPersonnel,
  });
});

// Function to generate a random password (8-12 characters)
function generatePassword() {
  const length = 12; // Increased password length for better security
  const charset =
    "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let password = "";
  for (let i = 0; i < length; i++) {
    password += charset.charAt(Math.floor(Math.random() * charset.length));
  }
  return password;
}

// Route to delete staff member (protected by authorizeAdmin middleware)
router.delete("/remove", authorizeAdmin, async (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ message: "Email is required." });
  }

  const staff = await MedicalPersonnel.findOneAndDelete({ email });
  if (!staff) {
    return res.status(404).json({ message: "Staff not found." });
  }

  res.status(200).json({ message: "Staff removed successfully." });
});

//Route to get all medical personnel (protected by authorizeAdmin middleware)
router.get(
  "/list",
  authorizeAdmin,
  medicalPersonnelController.getAllMedicalPersonnel
);

// Route to get medical personnel by email for editing
router.get("/get/:email", async (req, res) => {
  const { email } = req.params;
  const medicalPersonnel = await MedicalPersonnel.findOne({ email });

  if (medicalPersonnel) {
    res.json(medicalPersonnel);
  } else {
    res.status(404).json({ message: "Medical personnel not found" });
  }
});

// Route to update medical personnel details (add validation as necessary)
router.post("/update", async (req, res) => {
  const {
    firstName,
    middleName,
    lastName,
    birthday,
    email,
    isAuthorizedPersonnel,
  } = req.body;

  const personnel = await MedicalPersonnel.findOne({ email });

  if (!personnel) {
    return res.status(404).json({ message: "Medical personnel not found" });
  }

  // Update the personnel fields
  personnel.firstName = firstName;
  personnel.middleName = middleName;
  personnel.lastName = lastName;
  personnel.birthday = birthday;

  // Update the authorization status
  if (typeof isAuthorizedPersonnel !== "undefined") {
    personnel.isAuthorizedPersonnel = isAuthorizedPersonnel;
  }

  try {
    await personnel.save();
    res.status(200).json({ message: "Personnel updated successfully" });
  } catch (error) {
    res.status(500).json({ message: "Failed to update personnel" });
  }
});

// Route to handle forgot password (send reset link)
router.post('/forgot-password', medicalPersonnelController.forgotPassword);

// Route to handle password reset (update password)
router.post('/reset-password', medicalPersonnelController.resetPassword);

// Export the routes
module.exports = router;

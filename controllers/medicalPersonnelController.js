const MedicalPersonnel = require("../models/MedicalPersonnel"); // Import the MedicalPersonnel model
const { formatDate, monthNames } = require("../utils/dateUtils"); // Import formatDate and monthNames
const { findUserByEmail } = require("../utils/dbUtils"); // Import the function from utils/dbUtils
const bcrypt = require("bcryptjs"); // Import bcrypt for password hashing
const { updateUser } = require("../services/userService"); // Import the updateUser function from services/userService

//Handle the login of medical personnel
exports.loginPersonnel = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res
      .status(400)
      .json({ message: "Please provide email and password." });
  }

  const personnel = await MedicalPersonnel.findOne({
    email: email.toLowerCase().trim(),
  });

  if (!personnel) {
    return res
      .status(400)
      .json({ message: "Email address is not registered." });
  }

  const isMatch = await bcrypt.compare(password, personnel.password);

  if (!isMatch) {
    return res.status(400).json({ message: "Incorrect password." });
  }

  // Log personnel data for verification
  console.log("Logged in personnel data:", personnel);

  req.session.user = {
    id: personnel._id,
    email: personnel.email,
    role: "medical-personnel",
    userModel: "MedicalPersonnel",
  };

  return res.status(200).json({
    message: "Login successful.",
    isGeneratedPassword: personnel.isGeneratedPassword,
    isAuthorizedPersonnel: personnel.isAuthorizedPersonnel, // Send the authorization status
  });
};

//Handle change password
exports.changePassword = async (req, res) => {
  const { email, newPassword } = req.body;

  if (!email || !newPassword) {
    return res
      .status(400)
      .json({ message: "Email and new password are required." });
  }

  const personnel = await MedicalPersonnel.findOne({
    email: email.toLowerCase().trim(),
  });

  if (!personnel) {
    return res.status(400).json({ message: "Email not found." });
  }

  const hashedPassword = await bcrypt.hash(newPassword, 10);
  personnel.password = hashedPassword;
  personnel.isGeneratedPassword = false; // Mark the password as no longer generated

  await personnel.save();

  res.status(200).json({ message: "Password changed successfully." });
};

//Handle logout
exports.logoutPersonnel = (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      return res
        .status(500)
        .json({ message: "An error occurred while logging out." });
    }
    return res.status(200).json({ message: "Logout successful." });
  });
};

//Handle personnel profile
// Handle personnel profile
exports.getPersonnelProfile = async (req, res) => {
  if (!req.session.user || req.session.user.role !== "medical-personnel") {
    return res.status(401).json({ message: "Unauthorized" });
  }

  const personnel = await findUserByEmail(
    MedicalPersonnel,
    req.session.user.email
  );
  if (!personnel) {
    return res.status(404).json({ message: "Medical personnel not found" });
  }

  res.json({
    firstName: personnel.firstName,
    lastName: personnel.lastName,
    birthday: personnel.birthday,
    email: personnel.email,
    profilePicture: personnel.profilePicture || null, // Ensure profile picture is included in response
  });
};

//Handle update personnel profile
exports.updatePersonnelProfile = async (req, res) => {
  if (!req.session.user) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  const { email, newPassword } = req.body;
  const personnel = await findUserByEmail(
    MedicalPersonnel,
    req.session.user.email
  );
  if (!personnel) {
    return res.status(404).json({ message: "Medical Personnel not found" });
  }

  // Check for email conflicts with other users
  const existingPersonnel = await MedicalPersonnel.findOne({ email });
  if (existingPersonnel && existingPersonnel.email !== req.session.user.email) {
    return res
      .status(400)
      .json({ message: "Email is already in use by another account." });
  }

  const { emailUpdated, passwordUpdated } = await updateUser(
    personnel,
    email,
    newPassword
  );

  req.session.user.email = email; // Update session email if changed
  res.json({
    message: "Profile updated successfully",
    emailUpdated,
    passwordUpdated,
  });
};

//Handle profile picture upload
// Handle profile picture upload
exports.uploadProfilePicture = async (req, res) => {
  if (!req.session.user) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  const personnel = await MedicalPersonnel.findOne({
    email: req.session.user.email,
  });

  if (!personnel) {
    return res.status(404).json({ message: "Medical personnel not found" });
  }

  if (!req.file) {
    return res.status(400).json({ message: "No file uploaded" });
  }

  // Update the profile picture field with the filename
  personnel.profilePicture = req.file.filename;

  try {
    await personnel.save(); // Save the updated personnel document with the new profile picture
    res.json({
      message: "Profile picture uploaded successfully.",
      filename: req.file.filename,
    });
  } catch (error) {
    console.error("Error saving profile picture:", error);
    return res.status(500).json({ message: "Failed to save profile picture" });
  }
};

//Handle profile picture deletion
exports.deleteProfilePicture = async (req, res) => {
  if (!req.session.user || req.session.user.role !== "medical-personnel") {
    res.status(401).json({ message: "Unauthorized" });
  } else {
    const personnel = await findUserByEmail(
      MedicalPersonnel,
      req.session.user.email
    ).catch(() => null);

    if (!personnel) {
      res.status(404).json({ message: "Medical personnel not found." });
    } else {
      personnel.profilePicture = null;
      const saveResult = await personnel.save().catch(() => null);

      if (!saveResult) {
        res.status(500).json({ message: "Failed to delete profile picture." });
      } else {
        res
          .status(200)
          .json({ message: "Profile picture deleted successfully." });
      }
    }
  }
};

// Example function to get the full month name from the month index
function getMonthName(monthIndex) {
  return monthNames[monthIndex]; // Access the month name by index
}

// Example function: Format a medical personnel's birthdate or other date fields
function formatMedicalPersonnelBirthday(birthday) {
  return formatDate(birthday); // Use the formatDate function from utils/dateUtils.js
}

// Example usage of monthNames and getMonthName
console.log(getMonthName(0));

// Controller to get medical personnel by email
async function getMedicalPersonnelByEmail(req, res) {
  const email = req.params.email; // Get email from the route params
  const medicalPersonnel = await findUserByEmail(MedicalPersonnel, email); // Fetch the medical personnel by email using the utility function

  if (medicalPersonnel) {
    res.json(medicalPersonnel); // Return the medical personnel if found
  } else {
    res.status(404).json({ message: "Medical personnel not found" });
  }
}

//controller to get all medical personnel
exports.getAllMedicalPersonnel = async (req, res) => {
  try {
    const personnelList = await MedicalPersonnel.find(
      {},
      "firstName middleName lastName birthday email isAuthorizedPersonnel"
    );
    res.status(200).json(personnelList);
  } catch (error) {
    console.error("Error fetching medical personnel list:", error);
    res.status(500).json({ message: "Error fetching medical personnel list." });
  }
};

// Export the controller functions
module.exports = exports;

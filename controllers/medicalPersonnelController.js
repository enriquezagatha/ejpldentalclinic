const MedicalPersonnel = require("../models/MedicalPersonnel"); // Import the MedicalPersonnel model
const { formatDate, monthNames } = require("../utils/dateUtils"); // Import formatDate and monthNames
const { findUserByEmail } = require("../utils/dbUtils"); // Import the function from utils/dbUtils
const bcrypt = require("bcryptjs"); // Import bcrypt for password hashing
const { updateUser } = require("../services/userService"); // Import the updateUser function from services/userService
const crypto = require("crypto");
const nodemailer = require("nodemailer");

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
    name: `${personnel.firstName} ${personnel.lastName}`, // Store full name
    position: personnel.position || "Medical Personnel", // Store position
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

// Send password reset link
exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res
        .status(400)
        .json({ message: "Please provide your email address." });
    }

    const personnel = await MedicalPersonnel.findOne({ email }); // Corrected model reference
    if (!personnel) {
      return res.status(400).json({ message: "Email address not found." });
    }

    // Generate a reset token (no expiration for token itself)
    const resetToken = crypto.randomBytes(32).toString("hex");

    // Set an expiration time for the link (1 hour)
    const resetTokenExpiration = Date.now() + 3600000; // 1 hour from now

    // Store reset token and expiration in the personnel's record
    personnel.resetToken = resetToken;
    personnel.resetTokenExpiration = resetTokenExpiration;
    await personnel.save();

    // Create the reset link that includes the token
    const resetLink = `${req.protocol}://${req.get(
      "host"
    )}/personnel/reset-password/${resetToken}`;

    // Send email with the reset link
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS, // Use app password here
      },
    });

    const mailOptions = {
      from: `EJPL Dental Clinic <${process.env.EMAIL_USER}>`,
      to: email,
      subject: "Reset your password securely",
      text: `Click this link to reset your password: ${resetLink}`,
      html: `
        <div style="font-family: sans-serif; color: #333;">
          <h2>Password Reset Request</h2>
          <p>Hello,</p>
          <p>We received a request to reset your password. Click the button below to reset it:</p>
          <a href="${resetLink}" style="padding: 10px 20px; background-color: #007bff; color: white; text-decoration: none; border-radius: 5px;">Reset Password</a>
          <p>If you didn’t request this, you can ignore this email.</p>
          <br>
          <p>– EJPL Dental Clinic</p>
        </div>
      `,
    };

    await transporter.sendMail(mailOptions);
    res
      .status(200)
      .json({ message: "Password reset link sent to your email." });
  } catch (error) {
    console.error("Forgot password error:", error);
    if (error.code === "EAUTH") {
      res.status(500).json({
        message: "Authentication error. Please check email credentials.",
      });
    } else {
      res.status(500).json({ message: "An error occurred." });
    }
  }
};

// Reset personnel password
exports.resetPassword = async (req, res) => {
  const { token, newPassword } = req.body;

  if (!token || !newPassword) {
    return res
      .status(400)
      .json({ message: "Please provide token and new password." });
  }

  // Find the personnel with the reset token and check expiration of the link
  const personnel = await MedicalPersonnel.findOne({
    resetToken: token,
    resetTokenExpiration: { $gt: Date.now() }, // Check if the link has expired
  });

  if (!personnel) {
    return res.status(400).json({ message: "Invalid or expired reset token." });
  }

  // Hash the new password and update the personnel's password
  const hashedPassword = await bcrypt.hash(newPassword, 10);
  personnel.password = hashedPassword;
  personnel.resetToken = undefined; // Clear the reset token after use
  personnel.resetTokenExpiration = undefined; // Clear the expiration after use

  await personnel.save();

  res.status(200).json({ message: "Password reset successfully." });
};

exports.sendPassword = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: "Email and password are required." });
  }

  try {
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    const mailOptions = {
      from: `EJPL Dental Clinic <${process.env.EMAIL_USER}>`,
      to: email,
      subject: "Your Account Credentials",
      text: `Your account has been created. Here is your password: ${password}`,
      html: `
        <div style="font-family: sans-serif; color: #333;">
          <h2>Welcome to EJPL Dental Clinic</h2>
          <p>Your account has been successfully created. Here are your login details:</p>
          <p><strong>Password:</strong> ${password}</p>
          <p>We recommend changing your password after logging in for security purposes.</p>
          <br>
          <p>– EJPL Dental Clinic Team</p>
        </div>
      `,
    };

    await transporter.sendMail(mailOptions);
    res.status(200).json({ message: "Password sent to email successfully." });
  } catch (error) {
    console.error("Error sending password email:", error);
    res.status(500).json({ message: "Failed to send password email." });
  }
};

// Export the controller functions
module.exports = exports;

const Patient = require("../models/Patient");
const { updateUser } = require("../services/userService");
const { formatDate, monthNames } = require("../utils/dateUtils");
const { findUserByEmail } = require("../utils/dbUtils");
const bcrypt = require("bcryptjs");
const Appointment = require("../models/Appointment");
const PatientRecord = require("../models/PatientRecord");
const fs = require("fs");
const path = require("path");
const Notification = require("../models/Notification");
const crypto = require("crypto");
const nodemailer = require("nodemailer");

// Create a new patient account
exports.createPatient = async (req, res) => {
  const { firstName, lastName, birthday, email, password } = req.body;

  if (!firstName || !lastName || !birthday || !email || !password) {
    return res.status(400).json({ message: "Please fill in all fields." });
  }

  // Check if the email is already registered
  const existingPatient = await Patient.findOne({ email });
  if (existingPatient) {
    return res.status(400).json({ message: "Email already existed." });
  }

  const formattedBirthday = formatDate(birthday);
  const hashedPassword = await bcrypt.hash(password, 10);

  const otp = crypto.randomInt(100000, 999999); // Generate a 6-digit OTP
  const otpExpiration = Date.now() + 300000; // OTP valid for 5 minutes

  const newPatient = new Patient({
    firstName,
    lastName,
    birthday: formattedBirthday,
    email,
    password: hashedPassword,
    otp,
    otpExpiration,
    isVerified: false,
  });

  await newPatient.save();

  // Send OTP to email
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
    subject: "Verify Your Email Address",
    text: `Your OTP is ${otp}. It is valid for 5 minutes.`,
  };

  try {
    await transporter.sendMail(mailOptions);
    res.status(201).json({
      message:
        "Account created. Verify your email with the OTP sent.",
    });
  } catch (error) {
    console.error("Error sending OTP email:", error);
    res.status(500).json({ message: "Failed to send OTP email." });
  }
};

// Verify OTP
exports.verifyOtp = async (req, res) => {
    const { otp } = req.body;

    if (!otp) {
        return res.status(400).json({ message: "OTP is required." });
    }

    const patient = await Patient.findOne({ otp: parseInt(otp) }); // Find patient by OTP
    if (!patient) {
        return res.status(404).json({ message: "Patient not found. Please check the OTP." });
    }

    if (patient.isVerified) {
        return res.status(400).json({ message: "Email is already verified." });
    }

    if (Date.now() > patient.otpExpiration) {
        return res.status(400).json({ message: "OTP has expired. Please request a new one." });
    }

    patient.isVerified = true;
    patient.otp = undefined;
    patient.otpExpiration = undefined;
    await patient.save();

    res.status(200).json({ message: "Email verified successfully." });
};

// Handle patient login
exports.loginPatient = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res
      .status(400)
      .json({ message: "Please provide email and password." });
  }

  const patient = await Patient.findOne({ email });
  if (patient) {
    const isMatch = await bcrypt.compare(password, patient.password);
    if (isMatch) {
      req.session.user = {
        id: patient._id,
        email: patient.email,
        role: "patient",
      };

      // Check if it's the patient's first login
      if (patient.isFirstLogin) {
        // Create a "Welcome" notification
        const notification = new Notification({
          user: patient._id,
          userModel: "Patient",
          title: "Welcome to Our Health Platform!",
          message:
            "Welcome to EJPL Dental Clinic! Explore our dental services and keep your smile healthy and bright.",
          type: "Welcome",
        });
        await notification.save();

        // Update isFirstLogin to false after the first login
        patient.isFirstLogin = false;
        await patient.save();
      }

      return res.status(200).json({ message: "Login successful." });
    } else {
      return res.status(400).json({ message: "Incorrect password." });
    }
  } else {
    return res
      .status(400)
      .json({ message: "Email address is not registered." });
  }
};

// Handle patient logout
exports.logoutPatient = (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      return res
        .status(500)
        .json({ message: "An error occurred while logging out." });
    }
    return res.status(200).json({ message: "Logout successful." });
  });
};

// Get patient profile
exports.getPatientProfile = async (req, res) => {
  if (!req.session.user) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  const patient = await findUserByEmail(Patient, req.session.user.email);
  if (!patient) {
    return res.status(404).json({ message: "Patient not found" });
  }

  res.json({
    firstName: patient.firstName,
    lastName: patient.lastName,
    birthday: patient.birthday,
    email: patient.email,
    profilePicture: patient.profilePicture || null,
  });
};

// Update patient profile
exports.updatePatientProfile = async (req, res) => {
  if (!req.session.user) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  const { email, currentPassword, newPassword } = req.body;

  // Validate input
  if (!currentPassword) {
    return res.status(400).json({ message: "Current password is required." });
  }

  if (!email && !newPassword) {
    return res.status(400).json({ message: "No updates provided." });
  }

  try {
    const patient = await findUserByEmail(Patient, req.session.user.email);
    if (!patient) {
      return res.status(404).json({ message: "Patient not found" });
    }

    // Validate current password
    const isPasswordValid = await bcrypt.compare(
      currentPassword,
      patient.password
    );
    if (!isPasswordValid) {
      return res.status(400).json({ message: "Incorrect current password." });
    }

    let emailUpdated = false;
    let passwordUpdated = false;

    // Update email if provided and different
    if (email && email !== patient.email) {
      patient.email = email;
      emailUpdated = true;
    }

    // Update password if provided
    if (newPassword) {
      patient.password = await bcrypt.hash(newPassword, 10);
      passwordUpdated = true;
    }

    // Save patient changes
    await patient.save();

    // Update session email if it was changed
    if (emailUpdated) {
      req.session.user.email = email;
    }

    // Create notification if updates were made
    const updateMessage =
      emailUpdated && passwordUpdated
        ? "Your email and password have been successfully updated."
        : emailUpdated
        ? "Your email has been successfully updated."
        : passwordUpdated
        ? "Your password has been successfully updated."
        : null;

    if (updateMessage) {
      try {
        await Notification.create({
          user: patient._id,
          title: "Profile Updated",
          message: updateMessage,
          type: "Profile",
        });
      } catch (notificationError) {
        console.error("Error creating notification:", notificationError);
        return res.status(500).json({
          message: "Profile updated, but failed to create notification.",
          successMessage: updateMessage,
          errorMessage: "Failed to create notification.",
        });
      }
    }

    res.json({
      message: "Profile updated successfully",
      successMessage: updateMessage,
      errorMessage: null,
      emailUpdated,
      passwordUpdated,
    });
  } catch (error) {
    console.error("Error updating patient profile:", error);
    res.status(500).json({
      message: "Error updating profile.",
      successMessage: null,
      errorMessage: "An error occurred while updating the profile.",
    });
  }
};

// Upload profile picture
exports.uploadProfilePicture = async (req, res) => {
  if (!req.session.user) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  const patient = await Patient.findOne({ email: req.session.user.email });
  if (!patient) {
    return res.status(404).json({ message: "Patient not found" });
  }

  patient.profilePicture = req.file.filename;
  await patient.save();

  res.json({
    message: "Profile picture uploaded successfully.",
    filename: req.file.filename,
  });
};

// Delete profile picture
exports.deleteProfilePicture = async (req, res) => {
  if (!req.session.user || req.session.user.role !== "patient") {
    return res.status(401).json({ message: "Unauthorized" });
  }

  const patient = await findUserByEmail(Patient, req.session.user.email).catch(
    () => null
  );

  if (!patient) {
    return res.status(404).json({ message: "Patient not found." });
  }

  // Get the current profile picture path
  patient.profilePicture = null;
  await patient.save();

  return res
    .status(200)
    .json({ message: "Profile picture deleted successfully." });

  // Delete the file if it exists
  if (profilePicturePath && fs.existsSync(profilePicturePath)) {
    try {
      fs.unlinkSync(profilePicturePath);
    } catch (error) {
      console.error("Error deleting profile picture:", error);
      return res
        .status(500)
        .json({ message: "Failed to delete profile picture file." });
    }
  }

  // Set the profilePicture field to null in the database
  patient.profilePicture = null;
  const saveResult = await patient.save().catch(() => null);

  if (!saveResult) {
    return res
      .status(500)
      .json({ message: "Failed to delete profile picture." });
  } else {
    return res
      .status(200)
      .json({ message: "Profile picture deleted successfully." });
  }
};

// Example function to get the full month name from the month index
function getMonthName(monthIndex) {
  return monthNames[monthIndex]; // Access the month name by index
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
    res.status(404).json({ message: "Patient not found" });
  }
}

exports.getPatientRecords = async (req, res) => {
  if (!req.session.user) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  try {
    // Find the patient using the session user ID
    const patient = await Patient.findById(req.session.user.id);
    if (!patient) {
      return res.status(404).json({ message: "Patient not found." });
    }

    // Find the patient's record using patientId
    const patientRecord = await PatientRecord.findOne({
      patientId: patient._id,
    });

    if (!patientRecord) {
      return res.status(404).json({ message: "Patient record not found." });
    }

    res.json(patientRecord);
  } catch (error) {
    console.error("Error fetching patient records:", error);
    res.status(500).json({ message: "Server error while fetching records." });
  }
};

// Controller to get patient by ID
exports.getPatientById = async (req, res) => {
  try {
    // Fetch the patient record by ID
    const patientRecord = await PatientRecord.findById(req.params.id);
    if (!patientRecord) {
      return res.status(404).json({ message: "Patient record not found" });
    }

    // Find the corresponding patient in the Patient database
    const patient = await Patient.findById(patientRecord.patientId);
    if (!patient) {
      return res.status(404).json({ message: "Patient not found" });
    }

    // Return the patient details with emailAddress
    res.json({
      ...patientRecord.toObject(),
      emailAddress: patient.email, // Add emailAddress from Patient
    });
  } catch (error) {
    console.error("Error fetching patient by ID:", error);
    res.status(500).json({ message: "Server error" });
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

    const patient = await Patient.findOne({ email });
    if (!patient) {
      return res.status(400).json({ message: "Email address not found." });
    }

    // Generate a reset token (no expiration for token itself)
    const resetToken = crypto.randomBytes(32).toString("hex");

    // Set an expiration time for the link (1 hour)
    const resetTokenExpiration = Date.now() + 3600000; // 1 hour from now

    // Store reset token and expiration in the patient's record
    patient.resetToken = resetToken;
    patient.resetTokenExpiration = resetTokenExpiration;
    await patient.save();

    // Create the reset link that includes the token
    const resetLink = `${req.protocol}://${req.get(
      "host"
    )}/patient/reset-password/${resetToken}`;

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
      res.status(500).json({
        message: "An error occurred.",
      });
    }
  }
};

// Reset patient password
exports.resetPassword = async (req, res) => {
  const { token, newPassword } = req.body;

  if (!token || !newPassword) {
    return res
      .status(400)
      .json({ message: "Please provide token and new password." });
  }

  // Find the patient with the reset token and check expiration of the link
  const patient = await Patient.findOne({
    resetToken: token,
    resetTokenExpiration: { $gt: Date.now() }, // Check if the link has expired
  });

  if (!patient) {
    return res.status(400).json({ message: "Invalid or expired reset token." });
  }

  // Hash the new password and update the patient's password
  const hashedPassword = await bcrypt.hash(newPassword, 10);
  patient.password = hashedPassword;
  patient.resetToken = undefined; // Clear the reset token after use
  patient.resetTokenExpiration = undefined; // Clear the expiration after use

  await patient.save();

  res.status(200).json({
    message: "Password reset successfully.",
    toastClass: "text-green-500",
  }); // Add this for success
};

exports.checkPatientRecord = async (req, res) => {
  if (!req.session.user) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  try {
    const patient = await Patient.findOne({ email: req.session.user.email });
    if (!patient) {
      return res.status(404).json({ message: "Patient not found" });
    }

    const patientRecord = await PatientRecord.findOne({ patientId: patient._id });
    res.json({ hasRecord: !!patientRecord });
  } catch (error) {
    console.error("Error checking patient record:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Check if an email address exists
exports.checkEmailExists = async (req, res) => {
  const { email } = req.query;

  if (!email) {
    return res.status(400).json({ message: "Email is required." });
  }

  try {
    const existingPatient = await Patient.findOne({ email });
    res.json({ exists: !!existingPatient });
  } catch (error) {
    console.error("Error checking email existence:", error);
    res.status(500).json({ message: "Server error while checking email." });
  }
};

// Resend OTP
exports.resendOtp = async (req, res) => {
    if (!req.session.user) {
        return res.status(401).json({ message: "Unauthorized" });
    }

    try {
        const patient = await Patient.findById(req.session.user.id);
        if (!patient) {
            return res.status(404).json({ message: "Patient not found." });
        }

        const otp = crypto.randomInt(100000, 999999); // Generate a new 6-digit OTP
        patient.otp = otp;
        patient.otpExpiration = Date.now() + 300000; // OTP valid for 5 minutes
        await patient.save();

        // Send OTP to email
        const transporter = nodemailer.createTransport({
            service: "gmail",
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS,
            },
        });

        const mailOptions = {
            from: `EJPL Dental Clinic <${process.env.EMAIL_USER}>`,
            to: patient.email,
            subject: "Your New OTP",
            text: `Your new OTP is ${otp}. It is valid for 5 minutes.`,
        };

        await transporter.sendMail(mailOptions);
        res.status(200).json({ message: "A new OTP has been sent to your email." });
    } catch (error) {
        console.error("Error resending OTP:", error);
        res.status(500).json({ message: "Failed to resend OTP." });
    }
};

// Export the controller functions
module.exports = exports;
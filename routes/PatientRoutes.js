const express = require("express");
const router = express.Router();
const patientController = require("../controllers/patientController");
const upload = require("../middleware/fileUploadMiddleware");
const { getPatientRecords } = require("../controllers/patientController");

// Route to create a new patient
router.post("/create", patientController.createPatient);

// Route to patient login
router.post("/login", patientController.loginPatient);

// Route to get patient profile
router.get("/profile", patientController.getPatientProfile);

// Route to update patient profile
router.put("/profile", patientController.updatePatientProfile); // Changed to PUT

// Route to patient logout
router.post("/logout", patientController.logoutPatient); // Changed to POST

// Route for uploading profile picture
router.post(
  "/upload-profile-picture",
  upload.single("profilePicture"),
  patientController.uploadProfilePicture
);

// Route for deleting profile picture
router.delete(
  "/delete-profile-picture",
  patientController.deleteProfilePicture
); // Changed to DELETE

//Route to get patient's own records
router.get("/records", patientController.getPatientRecords);

//Route to get patient's own record by ID
router.get("/records/:id", patientController.getPatientById);

// Route to handle forgot password (send reset link)
router.post("/forgot-password", patientController.forgotPassword);

// Route to handle password reset (update password)
router.post("/reset-password", patientController.resetPassword);

module.exports = router;

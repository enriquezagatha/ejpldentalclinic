const express = require("express");
const router = express.Router();
const appointmentController = require("../controllers/appointmentController");
const upload = require("../middleware/fileUploadMiddleware");
const { authorizeAdmin } = require("../routes/authRoutes"); // Unused, consider removing if not needed
const Appointment = require("../models/Appointment"); // Unused, consider removing if not needed
const PatientRecord = require("../models/PatientRecord"); // Unused, consider removing if not needed

// Create a new appointment for patient
router.post("/patient/appointments", appointmentController.createAppointment);

// Get appointments by patient
router.get(
  "/patient/appointments",
  appointmentController.getAppointmentsByPatient
);

// Get all appointments for medical personnel
router.get("/", appointmentController.getAllAppointments);

// Details of a specific appointment for a patient
router.get("/details", appointmentController.getAppointmentDetails);

// Update status of a specific appointment
router.patch("/:id/status", appointmentController.updateAppointmentStatus);

// Update patient appointment details (with file upload)
router.put(
  "/update",
  upload.array("files"),
  appointmentController.updateAppointment
);

// Upload files related to a specific patient's appointment
router.post(
  "/upload-files",
  upload.array("files"),
  appointmentController.uploadFiles
); // Fixed to uploadFiles

// Delete a specific file from a patient's appointment record
router.delete("/delete-file", appointmentController.deleteFile);

// Update payment status
router.get(
  "/appointments/payments",
  appointmentController.getAppointmentsWithPayments
);

//Update treatment details inside an appointment
router.post("/update-treatment", appointmentController.updateTreatment);

//Route for fetching completed appointment reports
router.get("/appointment-report", appointmentController.getAppointmentReport);

//Assign a dentist to an appointment
router.patch("/:id/assign-dentist", appointmentController.assignDentist);

// Route to get total status counts
router.get("/total-status-counts", appointmentController.getTotalStatusCounts);

// Route to fetch upcoming appointments
router.get("/upcoming", appointmentController.getUpcomingAppointments);

// Route to fetch all appointments for popular treatments
router.get(
  "/all",
  appointmentController.getAllAppointmentsForPopularTreatments
);

module.exports = router;

const express = require("express");
const router = express.Router();
const patientRecordController = require("../controllers/patientRecordController");
const multer = require("multer");
const upload = multer({ dest: "uploads/" });

// Route to fetch all patient records
router.get("/all-patient-records", patientRecordController.getAllPatientRecords);

// Route to fetch a specific patient record by ID
router.get(
  "/patient-records/:id",
  patientRecordController.getPatientRecordById
);

// Route to fetch patient records by daily, weekly, and monthly filters
router.get("/patient-report", patientRecordController.getPatientReport);

// Route to fetch patient treatment report
router.get("/treatment-report", patientRecordController.getTreatmentReport);

// Route to fetch monthly patient records for a specific year
router.get(
  "/monthly-patient-records",
  patientRecordController.getMonthlyPatientRecords
);

// Route to fetch distinct years from patient records
router.get("/years", patientRecordController.getPatientRecordYears);

// Route to handle file uploads
router.post(
  "/upload-files",
  upload.array("files"),
  patientRecordController.uploadFiles
);

module.exports = router;
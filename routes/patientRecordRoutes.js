const express = require('express');
const router = express.Router();
const patientRecordController = require('../controllers/patientRecordController');

// Route to fetch all patient records
router.get('/patient-records', patientRecordController.getPatientRecords);

// Route to fetch a specific patient record by ID
router.get('/patient-records/:id', patientRecordController.getPatientRecordById);

// Route to fetch patient records by daily, weekly, and monthly filters
router.get('/patient-report', patientRecordController.getPatientReport);

// Route to fetch patient treatment report
router.get("/treatment-report", patientRecordController.getTreatmentReport);

module.exports = router;
const PatientRecord = require('../models/PatientRecord'); // Import the PatientRecord model
const { startOfDay, endOfDay, startOfWeek, endOfWeek, startOfMonth, endOfMonth } = require("date-fns");

// Fetch all patient records
exports.getPatientRecords = async (req, res) => {
  try {
    const patientRecords = await PatientRecord.find(); // Fetch all patient records
    res.json(patientRecords); // Return the records as a response
  } catch (error) {
    res.status(500).json({ message: 'Error retrieving patient records', error });
  }
};

// Fetch a single patient record by ID (if needed)
exports.getPatientRecordById = async (req, res) => {
  try {
    const record = await PatientRecord.findById(req.params.id); // Find the record by ID
    if (!record) {
      return res.status(404).json({ message: 'Patient record not found' });
    }
    res.json(record); // Return the single record as a response
  } catch (error) {
    res.status(500).json({ message: 'Error retrieving patient record', error });
  }
};

// Fetch patient records by date range
exports.getPatientReport = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    if (!startDate || !endDate) {
      return res.status(400).json({ message: "Start date and end date are required." });
    }

    const start = new Date(startDate);
    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999); // Ensure full-day coverage

    console.log("Start Date:", start);
    console.log("End Date:", end);

    // Fetch patient records within the date range
    const patients = await PatientRecord.find({
      createdAt: { $gte: start, $lte: end }
    })
      .sort({ createdAt: -1 })
      .select("firstName lastName gender contactNumber createdAt treatments");

    if (patients.length === 0) {
      return res.status(200).json({ patients: [], mostPopularTreatment: "No Data" });
    }

    // Count treatments within the date range
    let treatmentCounts = {};

    patients.forEach((patient) => {
      patient.treatments.forEach((treatment) => {
        if (treatment.treatmentDate) {
          const treatmentType = treatment.treatmentType || "Unknown";
          treatmentCounts[treatmentType] = (treatmentCounts[treatmentType] || 0) + 1;
        }
      });
    });

    // Determine the most popular treatment
    const mostPopularTreatment = Object.entries(treatmentCounts)
      .sort((a, b) => b[1] - a[1])
      .map(([treatmentType]) => treatmentType)[0] || "No Data";

    res.status(200).json({
      patients,
      mostPopularTreatment
    });

  } catch (error) {
    console.error("Error in getPatientReport:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Fetch patient treatments with daily, weekly, and monthly popularity
exports.getTreatmentReport = async (req, res) => {
  try {
      let { startDate, endDate, treatment } = req.query;

      console.log("Received Query Params:", req.query); // 🔍 Debugging

      if (!startDate || !endDate) {
          return res.status(400).json({ message: "Start date and end date are required." });
      }

      const start = new Date(startDate);
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);

      console.log("Start Date:", start, "End Date:", end);
      console.log("Filtering by Treatment:", treatment || "All Treatments");

      const allPatients = await PatientRecord.find().select("firstName lastName treatments");

      let treatmentCount = {}; 
      const patients = allPatients
          .map((patient) => {
              // Filter treatments within the date range and, if provided, match the selected treatment
              const filteredTreatments = patient.treatments.filter((t) => {
                  if (!t.treatmentDate) return false;
                  const treatmentDate = new Date(t.treatmentDate);

                  const isWithinDateRange = treatmentDate >= start && treatmentDate <= end;
                  const matchesSelectedTreatment = !treatment || t.treatmentType === treatment;

                  return isWithinDateRange && matchesSelectedTreatment;
              });

              // Count occurrences of each treatment type
              filteredTreatments.forEach((t) => {
                  if (t.treatmentType) {
                      treatmentCount[t.treatmentType] = (treatmentCount[t.treatmentType] || 0) + 1;
                  }
              });

              // Only return patients who have treatments after filtering
              return filteredTreatments.length > 0 
                  ? { firstName: patient.firstName, lastName: patient.lastName, treatments: filteredTreatments } 
                  : null;
          })
          .filter(Boolean);

      console.log("Filtered Patients:", JSON.stringify(patients, null, 2));

      if (patients.length === 0) {
          return res.status(200).json({
              patients: [],
              mostPopularTreatment: "No Data",
          });
      }

      const mostPopularTreatment = Object.keys(treatmentCount).reduce((a, b) =>
          treatmentCount[a] > treatmentCount[b] ? a : b, 
          "No Data"
      );

      res.status(200).json({
          patients,
          mostPopularTreatment,
      });
  } catch (error) {
      console.error("Error in getTreatmentReport:", error);
      res.status(500).json({ message: "Server error" });
  }
};

// 🔹 Helper function to get the most popular treatment for each period
function getMostPopularTreatment(countObj) {
  let result = {};
  for (let period in countObj) {
      let treatments = Object.entries(countObj[period]);
      if (treatments.length > 0) {
          treatments.sort((a, b) => b[1] - a[1]); // Sort by count descending
          result[period] = treatments[0][0]; // Get most popular treatment
      }
  }
  return result;
}

// 🔹 Helper function to get week number
function getWeekNumber(date) {
  const firstDayOfYear = new Date(date.getFullYear(), 0, 1);
  const pastDays = Math.floor((date - firstDayOfYear) / (24 * 60 * 60 * 1000));
  return Math.ceil((pastDays + firstDayOfYear.getDay() + 1) / 7);
}
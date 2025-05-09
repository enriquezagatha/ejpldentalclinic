const Appointment = require("../models/Appointment");
const PatientRecord = require("../models/PatientRecord");
const { generateReferenceNumber } = require('../services/appointmentService');const fs = require("fs");
const {
  startOfDay,
  endOfDay,
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
} = require("date-fns");
const Dentist = require("../models/Dentist");
const Notification = require("../models/Notification");
const MedicalPersonnel = require("../models/MedicalPersonnel");

exports.createAppointment = async (req, res) => {
  if (!req.session.user) {
    return res.status(401).json({ success: false, message: "Unauthorized" });
  }

  const {
    firstName,
    lastName,
    gender,
    contactNumber,
    emailAddress,
    preferredDate,
    preferredTime,
    treatmentType,
    treatmentPrice,
    age,
    birthDay,
    address,
    emergencyContact,
    emergencyContactNumber,
    emergencyContactRelationship,
    selectedHistory,
    assignedDentist, // This is the dentist's ID (can be null)
  } = req.body;

  const referenceNumber = generateReferenceNumber();

  const existingAppointments = await Appointment.find({
    preferredDate,
    preferredTime,
  });

  if (existingAppointments.length >= 2) {
    return res.status(400).json({
      success: false,
      message: "Appointment slots full for this time.",
    });
  }

  // Format preferredDate as "Month Day, Year"
  const formattedPreferredDate = new Date(preferredDate)
    .toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    })
    .replace(/(\d+),/, "$1.");

  let assignedDentistName = null;

  // If assignedDentist exists, perform the lookup
  if (assignedDentist) {
    const dentist = await Dentist.findById(assignedDentist);
    if (dentist) {
      assignedDentistName = `${dentist.firstName} ${dentist.lastName}`;
    }
  }

  // Ensure contact numbers start with "0"
  const formattedContactNumber = contactNumber.startsWith("0")
    ? contactNumber
    : `0${contactNumber}`;
  const formattedEmergencyContactNumber = emergencyContactNumber
    ? emergencyContactNumber.startsWith("0")
      ? emergencyContactNumber
      : `0${emergencyContactNumber}`
    : "N/A"; // Default to "N/A" if undefined

  // Create appointment data
  const appointmentData = {
    patient: req.session.user.id,
    referenceNumber,
    firstName,
    lastName,
    contactNumber: formattedContactNumber,
    emailAddress,
    preferredDate: formattedPreferredDate,
    preferredTime,
    treatmentType,
    treatmentPrice: String(treatmentPrice),
    age,
    birthDay,
    gender,
    address,
    emergencyContact,
    emergencyContactNumber: formattedEmergencyContactNumber,
    emergencyContactRelationship,
    selectedHistory,
    assignedDentist: assignedDentist || null,
    status: "Pending",
  };

  const appointment = await new Appointment(appointmentData).save();

  // ✅ Notify Patient - Appointment Created
  const firstPatientNotification = new Notification({
    user: req.session.user.id,
    userModel: "Patient",
    title: "New Appointment Created",
    message: `Your appointment for ${treatmentType} on ${formattedPreferredDate} at ${preferredTime} has been created.`,
    referenceId: appointment._id,
    type: "Appointment",
    isRead: false,
    createdAt: new Date(),
  });

  await firstPatientNotification.save();

  // ✅ Notify Patient - Assigned Dentist
  if (assignedDentistName) {
    const secondPatientNotification = new Notification({
      user: req.session.user.id,
      userModel: "Patient",
      title: "Assigned Dentist for Your Appointment",
      message: `Your assigned dentist for your appointment on ${formattedPreferredDate} for ${treatmentType} is ${assignedDentistName}.`,
      referenceId: appointment._id,
      type: "Appointment",
      isRead: false,
      createdAt: new Date(),
    });

    await secondPatientNotification.save();
  }

  // ✅ Notify all Medical Personnel - New Appointment
  const personnel = await MedicalPersonnel.find({});
  const personnelNotificationsFirst = personnel.map((person) => ({
    user: person._id,
    userModel: "MedicalPersonnel",
    title: "New Appointment Submitted",
    message: `A new appointment has been scheduled by ${firstName} ${lastName} for ${treatmentType} on ${formattedPreferredDate} at ${preferredTime}.`,
    referenceId: appointment._id,
    type: "Appointment",
    isRead: false,
    createdAt: new Date(),
  }));

  await Notification.insertMany(personnelNotificationsFirst);

  // ✅ Notify Medical Personnel about Assigned Dentist (if any)
  if (assignedDentist) {
    const dentist = await Dentist.findById(assignedDentist);
    if (dentist) {
      const assignedDentistName = `${dentist.firstName} ${dentist.lastName}`;

      // Notify all medical personnel
      const personnelNotificationsForDentist = personnel.map((person) => ({
        user: person._id,
        userModel: "MedicalPersonnel",
        title: "Assigned Dentist for Appointment",
        message: `Dr. ${assignedDentistName} has been assigned to the appointment of ${firstName} ${lastName} for ${treatmentType} on ${formattedPreferredDate} at ${preferredTime}.`,
        referenceId: appointment._id,
        type: "Appointment",
        isRead: false,
        createdAt: new Date(),
      }));

      // Save notifications for medical personnel
      await Notification.insertMany(personnelNotificationsForDentist);
    }
  }

  return res.status(201).json({
    success: true,
    message: "Appointment created successfully.",
    referenceNumber,
  });
};

exports.getAppointmentsByPatient = async (req, res) => {
  if (!req.session.user) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  try {
    const appointments = await Appointment.find({
      patient: req.session.user.id,
    })
      .populate("treatment")
      .populate("assignedDentist"); // Ensure assignedDentist is populated

    if (!appointments || appointments.length === 0) {
      return res.status(404).json({ message: "No appointments found" });
    }

    const sanitizedAppointments = appointments.map((appointment) => {
      const apptObj = appointment.toObject();

      // Optional: Add a computed fullName field for display
      if (apptObj.assignedDentist) {
        const dentist = apptObj.assignedDentist;
        const prefix =
          dentist.gender === "Male"
            ? "Dr."
            : dentist.gender === "Female"
            ? "Dra."
            : "";
        apptObj.assignedDentist.fullName = `${prefix} ${dentist.firstName} ${dentist.lastName}`;
      }

      return {
        ...apptObj,
        treatmentId: appointment.treatmentId || null,
        createdAt: appointment.createdAt, // Include createdAt
        updatedAt: appointment.updatedAt, // Include updatedAt
      };
    });

    console.log(sanitizedAppointments); // Check the populated data here

    res.json(sanitizedAppointments);
  } catch (error) {
    console.error("Error fetching appointments:", error);
    res.status(500).json({ message: "Server error" });
  }
};

exports.getAllAppointments = async (req, res) => {
  if (!req.session.user || req.session.user.role !== "medical-personnel") {
    return res.status(401).json({ message: "Unauthorized" });
  }

  const appointments = await Appointment.find();
  return res.json(appointments);
};

exports.getAppointmentDetails = async (req, res) => {
  const { appointmentId } = req.query;

  if (!appointmentId) {
    return res
      .status(400)
      .json({ message: "Appointment ID is required to fetch details." });
  }

  try {
    const appointment = await Appointment.findById(appointmentId).populate(
      "assignedDentist"
    ); // Populate assignedDentist
    if (!appointment) {
      return res.status(404).json({ message: "Appointment not found." });
    }

    let patientRecord = null;
    if (appointment.patientRecord) {
      patientRecord = await PatientRecord.findById(appointment.patientRecord);
    }

    // Fetch dentist name if assignedDentist exists
    const dentistName = appointment.assignedDentist
      ? `${appointment.assignedDentist.firstName} ${appointment.assignedDentist.lastName}`
      : "N/A";

    res.json({
      firstName: appointment.firstName,
      lastName: appointment.lastName,
      age: appointment.age,
      gender: appointment.gender,
      address: appointment.address,
      birthDay: appointment.birthDay,
      contactNumber: appointment.contactNumber,
      emailAddress: appointment.emailAddress || "",
      selectedHistory: appointment.selectedHistory,
      emergencyContact: appointment.emergencyContact,
      emergencyContactNumber: appointment.emergencyContactNumber,
      emergencyContactRelationship: appointment.emergencyContactRelationship,
      treatments: patientRecord ? patientRecord.treatments : [], // ✅ Ensure treatments is always an array
      uploadedFiles: patientRecord ? patientRecord.uploadedFiles : [], // ✅ Ensure uploadedFiles is always an array
      assignedDentist: dentistName, // Include dentist name
      createdAt: appointment.createdAt, // Include createdAt
      updatedAt: appointment.updatedAt, // Include updatedAt
    });
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ message: "Server error retrieving appointment details." });
  }
};

exports.updateAppointmentStatus = async (req, res) => {
  if (!req.session.user || req.session.user.role !== "medical-personnel") {
    return res.status(401).json({ message: "Unauthorized" });
  }

  const { id } = req.params;
  const { status } = req.body;

  const updatedAppointment = await Appointment.findByIdAndUpdate(
    id,
    { status },
    { new: true }
  );

  if (!updatedAppointment) {
    return res.status(404).json({ message: "Appointment not found" });
  }

  // ✅ If status is "Completed", update PatientRecord
  if (status === "Completed") {
    let patientRecord = await PatientRecord.findOne({
      firstName: updatedAppointment.firstName,
      lastName: updatedAppointment.lastName,
      contactNumber: updatedAppointment.contactNumber,
    });

    if (!patientRecord) {
      patientRecord = new PatientRecord({
        patientId: updatedAppointment.patient || new mongoose.Types.ObjectId(),
        patient: updatedAppointment.patient,
        firstName: updatedAppointment.firstName,
        lastName: updatedAppointment.lastName,
        contactNumber: updatedAppointment.contactNumber.startsWith("0")
          ? updatedAppointment.contactNumber
          : `0${updatedAppointment.contactNumber}`,
        gender: updatedAppointment.gender,
        age: updatedAppointment.age,
        birthDay: updatedAppointment.birthDay,
        address: updatedAppointment.address,
        emergencyContact: updatedAppointment.emergencyContact,
        emergencyContactNumber: updatedAppointment.emergencyContactNumber.startsWith("0")
          ? updatedAppointment.emergencyContactNumber
          : `0${updatedAppointment.emergencyContactNumber}`,
        emergencyContactRelationship:
          updatedAppointment.emergencyContactRelationship,
        selectedHistory: updatedAppointment.selectedHistory,
        treatments: [],
      });

      await patientRecord.save();
      updatedAppointment.patientRecord = patientRecord._id;
      await updatedAppointment.save();
    }

    const isDuplicateTreatment = patientRecord.treatments.some(
      (treatment) =>
        treatment.treatmentType === updatedAppointment.treatmentType &&
        new Date(treatment.treatmentDate).toISOString().slice(0, 10) ===
          new Date(updatedAppointment.preferredDate).toISOString().slice(0, 10)
    );

    if (!isDuplicateTreatment) {
      patientRecord.treatments.push({
        treatmentType: updatedAppointment.treatmentType,
        treatmentDate: updatedAppointment.preferredDate,
        prescriptionDate: "",
        medicineType: "",
        procedure: "",
        treatmentNotes: "",
      });
    }

    await patientRecord.save();
  }

  // ✅ Format date
  const formattedDate = new Date(
    updatedAppointment.preferredDate
  ).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  // ✅ Notification for patient
  const patientNotification = new Notification({
    user: updatedAppointment.patient,
    userModel: "Patient",
    title: `Appointment ${status}`,
    message: `Your appointment for ${updatedAppointment.treatmentType} on ${formattedDate} at ${updatedAppointment.preferredTime} has been updated to ${status}.`,
    referenceId: updatedAppointment._id,
    type: "Appointment",
    isRead: false,
    createdAt: new Date(),
    logoUrl: "${window.location.origin}/media/logo/EJPL.png",
  });

  await patientNotification.save();

  // ✅ Notification for all medical personnel
  const personnel = await MedicalPersonnel.find({});
  const personnelNotifications = personnel.map((person) => ({
    user: person._id,
    userModel: "MedicalPersonnel",
    title: `Appointment ${status}`,
    message: `${updatedAppointment.firstName} ${updatedAppointment.lastName}'s appointment for ${updatedAppointment.treatmentType} on ${formattedDate} at ${updatedAppointment.preferredTime} has been marked as ${status}.`,
    referenceId: updatedAppointment._id,
    type: "Appointment",
    isRead: false,
    createdAt: new Date(),
    logoUrl: "${window.location.origin}/media/logo/EJPL.png",
  }));

  await Notification.insertMany(personnelNotifications);

  res.json({
    message: "Appointment status updated successfully",
    appointment: updatedAppointment,
  });
};

exports.updateAppointment = async (req, res) => {
  const {
    firstName,
    lastName,
    treatmentType,
    preferredDate,
    prescriptionDate,
    medicineType,
    procedure,
    treatmentNotes,
  } = req.body;

  // Fetch the appointment details first
  const appointment = await Appointment.findOne({ firstName, lastName });

  if (!appointment) {
    return res
      .status(404)
      .json({ message: "No appointment found for updating." });
  }

  // Handle uploaded files
  const files = req.files
    ? req.files.map((file) => ({
        filename: file.filename,
        originalname: file.originalname,
        path: file.path,
        uploadDate: new Date(),
      }))
    : [];

  // Check for existing patient record
  const existingRecord = await PatientRecord.findOne({ firstName, lastName });

  if (existingRecord) {
    // ✅ Sync changes with PatientRecord
    existingRecord.age = appointment.age;
    existingRecord.gender = appointment.gender;
    existingRecord.birthDay = appointment.birthDay;
    existingRecord.address = appointment.address;
    existingRecord.contactNumber = existingRecord.contactNumber.startsWith("0")
      ? existingRecord.contactNumber
      : `0${existingRecord.contactNumber}`;
    existingRecord.emergencyContact = appointment.emergencyContact;
    existingRecord.selectedHistory = appointment.selectedHistory;

    // ✅ Ensure only latest treatment is updated
    existingRecord.treatments.push({
      treatmentType,
      preferredDate,
      prescriptionDate,
      medicineType,
      procedure,
      treatmentNotes,
    });

    // Append new files to existing uploadedFiles
    existingRecord.uploadedFiles = [...existingRecord.uploadedFiles, ...files];

    await existingRecord.save();

    return res.status(200).json({
      message: "Patient details updated successfully.",
      files: existingRecord.uploadedFiles,
    });
  } else {
    // ✅ Create a new PatientRecord if it doesn't exist
    const newPatientRecord = new PatientRecord({
      firstName,
      lastName,
      age: appointment.age,
      gender: appointment.gender,
      birthDay: appointment.birthDay,
      address: appointment.address,
      contactNumber: appointment.contactNumber.startsWith("0")
        ? appointment.contactNumber
        : `0${appointment.contactNumber}`,
      emergencyContact: appointment.emergencyContact,
      selectedHistory: appointment.selectedHistory,
      treatments: [
        {
          treatmentType,
          preferredDate,
          prescriptionDate,
          medicineType,
          procedure,
          treatmentNotes,
        },
      ],
      uploadedFiles: files,
    });

    await newPatientRecord.save();
    return res.status(200).json({
      message: "Patient details updated successfully.",
      files: newPatientRecord.uploadedFiles,
    });
  }
};

// Upload files to patient record
exports.uploadFiles = async (req, res) => {
  const { firstName, lastName } = req.body;

  // Ensure firstName and lastName are provided
  if (!firstName || !lastName) {
    return res.status(400).json({
      message: "First name and last name are required for file upload.",
    });
  }

  // Find the patient record
  let patientRecord = await PatientRecord.findOne({ firstName, lastName });

  if (!patientRecord) {
    return res.status(404).json({ message: "Patient record not found." });
  }

  // Map uploaded files
  const files = req.files
    ? req.files.map((file) => ({
        filename: file.filename,
        originalname: file.originalname,
        path: file.path,
      }))
    : [];

  // Append new files to the uploadedFiles array in the existing patient record
  patientRecord.uploadedFiles = [...patientRecord.uploadedFiles, ...files];
  await patientRecord.save();

  // Respond with the updated list of uploaded files
  res.status(200).json({
    message: "Files uploaded successfully.",
    files: patientRecord.uploadedFiles,
  });
};

// Delete a file from patient record
exports.deleteFile = async (req, res) => {
  const { filename, firstName, lastName } = req.body;

  // Ensure all required parameters are present
  if (!filename || !firstName || !lastName) {
    return res.status(400).json({ message: "Missing required information." });
  }

  // Find the patient record
  const patientRecord = await PatientRecord.findOne({ firstName, lastName });
  if (!patientRecord) {
    return res.status(404).json({ message: "Patient record not found." });
  }

  // Filter out the file to delete
  const fileIndex = patientRecord.uploadedFiles.findIndex(
    (file) => file.filename === filename
  );
  if (fileIndex === -1) {
    return res
      .status(404)
      .json({ message: "File not found in patient record." });
  }

  // Remove file from database array
  const filePath = patientRecord.uploadedFiles[fileIndex].path; // Full path to file on disk
  patientRecord.uploadedFiles.splice(fileIndex, 1);

  // Save the updated patient record
  await patientRecord.save();

  // Delete the file from the filesystem
  fs.unlink(filePath, (err) => {
    if (err) {
      console.error("Error deleting file from filesystem:", err);
      return res
        .status(500)
        .json({ message: "Failed to delete file from filesystem." });
    }
    res.status(200).json({
      message: "File deleted successfully.",
      files: patientRecord.uploadedFiles,
    });
  });
};

exports.getAppointmentsWithPayments = async (req, res) => {
  let filter = {};

  if (req.query.status) {
    filter["payment.status"] = req.query.status; // Filter by paid/unpaid status
  }

  const appointments = await Appointment.find(filter);

  if (appointments) {
    res.json(appointments);
  } else {
    console.error("Error fetching appointments");
    res.status(500).json({ error: "Server error" });
  }
};

exports.updateTreatment = async (req, res) => {
  console.log("🛠️ Received update request:", req.body);

  let { appointmentId, treatmentIndex, updatedTreatment } = req.body;
  treatmentIndex = parseInt(treatmentIndex, 10);

  if (!appointmentId || isNaN(treatmentIndex) || !updatedTreatment) {
    return res.status(400).json({ message: "Invalid request parameters" });
  }

  try {
    // Find the appointment
    const appointment = await Appointment.findById(appointmentId);
    if (!appointment) {
      console.log("❌ Appointment not found with ID:", appointmentId);
      return res.status(404).json({ message: "Appointment not found" });
    }

    if (!appointment.patientRecord) {
      console.log("❌ No patient record linked to this appointment.");
      return res
        .status(404)
        .json({ message: "No patient record linked to appointment" });
    }

    // Find the patient record
    const patientRecord = await PatientRecord.findById(
      appointment.patientRecord
    );
    if (!patientRecord) {
      console.log(
        "❌ Patient record not found with ID:",
        appointment.patientRecord
      );
      return res.status(404).json({ message: "Patient record not found" });
    }

    if (!Array.isArray(patientRecord.treatments)) {
      patientRecord.treatments = [];
    }

    if (patientRecord.treatments.length <= treatmentIndex) {
      console.log("❌ Invalid treatment index:", treatmentIndex);
      return res.status(400).json({ message: "Invalid treatment index" });
    }

    console.log("✅ Before update:", patientRecord.treatments[treatmentIndex]);

    // Ensure date formatting is correct
    updatedTreatment.treatmentDate = formatDateToYYYYMMDD(
      updatedTreatment.treatmentDate
    );
    updatedTreatment.prescriptionDate = formatDateToYYYYMMDD(
      updatedTreatment.prescriptionDate
    );

    // Get the existing treatment
    const existingTreatment = patientRecord.treatments[treatmentIndex];

    // Merge new values with existing treatment
    patientRecord.treatments[treatmentIndex] = {
      ...existingTreatment, // Preserve existing values
      ...updatedTreatment, // Apply new values
    };

    // 🔥 Debugging logs before saving
    console.log(
      "🛠️ Merged updated treatment:",
      patientRecord.treatments[treatmentIndex]
    );

    // 🔥 Use findOneAndUpdate instead of markModified + save()
    const updatedPatient = await PatientRecord.findOneAndUpdate(
      { _id: patientRecord._id, [`treatments._id`]: existingTreatment._id },
      { $set: { [`treatments.$`]: patientRecord.treatments[treatmentIndex] } },
      { new: true }
    );

    // Fetch the latest record from the database
    const refreshedPatientRecord = await PatientRecord.findById(
      patientRecord._id
    );

    console.log(
      "✅ After update (DB fetch):",
      refreshedPatientRecord.treatments[treatmentIndex]
    );

    res.json({
      message: "✅ Treatment updated successfully",
      updatedTreatment: refreshedPatientRecord.treatments[treatmentIndex],
    });
  } catch (error) {
    console.error("❌ Error updating treatment:", error);
    res.status(500).json({ message: "Internal server error", error });
  }
};

// ✅ Helper function to format date to YYYY-MM-DD
function formatDateToYYYYMMDD(dateStr) {
  if (!dateStr) return "";
  const parts = dateStr.split("-"); // Convert "03-10-2025" → ["03", "10", "2025"]
  return `${parts[2]}-${parts[0]}-${parts[1]}`; // Convert to "2025-03-10"
}

// Fetch appointment report by date range (only counting "Completed" status)
exports.getAppointmentReport = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    if (!startDate || !endDate) {
      return res
        .status(400)
        .json({ message: "Start date and end date are required." });
    }

    console.log("Start Date:", startDate);
    console.log("End Date:", endDate);

    // Fetch only completed appointments within the date range
    const appointments = await Appointment.find({
      status: "Completed",
      preferredDate: { $gte: startDate, $lte: endDate }, // Compare as string (YYYY-MM-DD)
    })
      .sort({ preferredDate: -1 })
      .select("firstName lastName contactNumber preferredDate"); // Use firstName & lastName

    console.log("Appointments found:", appointments.length); // ✅ Debugging output

    res.status(200).json({
      appointments: appointments.map((app) => ({
        patientName: `${app.firstName} ${app.lastName}`,
        contactNumber: app.contactNumber,
        preferredDate: app.preferredDate,
      })),
    });
  } catch (error) {
    console.error("Error in getAppointmentReport:", error);
    res.status(500).json({ message: "Server error" });
  }
};

exports.assignDentist = async (req, res) => {
  try {
    const { assignedDentist } = req.body;
    const dentist = await Dentist.findById(assignedDentist);
    if (!dentist) {
      console.error('Dentist not found:', assignedDentist);
      return res.status(404).json({ error: "Dentist not found" });
    }

    const appointment = await Appointment.findByIdAndUpdate(
      req.params.id,
      { assignedDentist },
      { new: true }
    ).populate("assignedDentist");

    if (!appointment) {
      console.error('Appointment not found:', req.params.id);
      return res.status(404).json({ error: "Appointment not found" });
    }

    // Build the full name with a gender prefix
    const genderPrefix =
      dentist.gender === "male"
        ? "Dr."
        : dentist.gender === "female"
        ? "Dra."
        : "";
    const fullName = [
      genderPrefix,
      dentist.firstName,
      dentist.middleName,
      dentist.lastName,
    ]
      .filter(Boolean)
      .join(" ");

    appointment.assignedDentist = {
      ...appointment.assignedDentist.toObject(),
      fullName,
    };

    // Notify Patient
    const patientNotification = new Notification({
      user: appointment.patient,
      userModel: "Patient",
      title: "Assigned Dentist for Your Appointment",
      message: `Your assigned dentist for your appointment on ${appointment.preferredDate} at ${appointment.preferredTime} for ${appointment.treatmentType} is ${dentist.firstName} ${dentist.lastName}.`,
      referenceId: appointment._id,
      type: "Appointment",
      isRead: false,
      createdAt: new Date(),
    });

    await patientNotification.save();

    // Notify all Medical Personnel
    const personnel = await MedicalPersonnel.find({});
    const personnelNotifications = personnel.map((person) => ({
      user: person._id,
      userModel: "MedicalPersonnel",
      title: "Assigned Dentist for Appointment",
      message: `Dr. ${dentist.firstName} ${dentist.lastName} has been assigned to the appointment of ${appointment.firstName} ${appointment.lastName} for ${appointment.treatmentType} on ${appointment.preferredDate} at ${appointment.preferredTime}.`,
      referenceId: appointment._id,
      type: "Appointment",
      isRead: false,
      createdAt: new Date(),
    }));

    await Notification.insertMany(personnelNotifications);

    res.json({
      message: "Dentist assigned successfully",
      appointment,
    });
  } catch (error) {
    console.error('Error in assignDentist:', error);
    res.status(500).json({ error: "Failed to assign dentist", details: error.message });
  }
};

exports.getPatientDetails = async (req, res) => {
  if (!req.session.user) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  try {
    const patient = await PatientRecord.findOne({ patientId: req.session.user.id });
    if (!patient) {
      return res.status(404).json({ message: "Patient not found" });
    }

    res.json({
      firstName: patient.firstName,
      lastName: patient.lastName,
      emailAddress: patient.emailAddress,
    });
  } catch (error) {
    console.error("Error fetching patient details:", error);
    res.status(500).json({ message: "Server error" });
  }
};

exports.getTotalStatusCounts = async (req, res) => {
  try {
    const { filter, month, year } = req.query;

    let matchCondition = {};

    // Apply filter conditions based on preferredDate
    const today = new Date();
    switch (filter) {
      case "daily":
        matchCondition.preferredDate = {
          $gte: startOfDay(today),
          $lte: endOfDay(today),
        };
        break;
      case "weekly":
        matchCondition.preferredDate = {
          $gte: startOfWeek(today),
          $lte: endOfWeek(today),
        };
        break;
      case "monthly":
        if (month && year) {
          const start = startOfMonth(new Date(year, month - 1));
          const end = endOfMonth(new Date(year, month - 1));
          matchCondition.preferredDate = { $gte: start, $lte: end };
        }
        break;
      case "yearly":
        if (year) {
          const start = new Date(`${year}-01-01`);
          const end = new Date(`${year}-12-31`);
          matchCondition.preferredDate = { $gte: start, $lte: end };
        }
        break;
      default:
        // No filter, fetch all
        break;
    }

    const statusCounts = await Appointment.aggregate([
      { $match: matchCondition }, // Apply the match condition
      { $group: { _id: "$status", count: { $sum: 1 } } },
    ]);

    const totals = statusCounts.reduce((acc, item) => {
      const statusKey = item._id.toLowerCase(); // Normalize to lowercase
      acc[statusKey] = item.count;
      return acc;
    }, {});

    // Extract the current month in "MM" format
    const currentMonth = String(today.getMonth() + 1).padStart(2, "0");

    res.json({
      pending: totals.pending || 0,
      confirmed: totals.confirmed || 0,
      cancelled: totals.cancelled || 0,
      completed: totals.completed || 0,
      currentMonth, // Include the current month in "MM" format
    });
  } catch (error) {
    console.error("Error fetching total status counts:", error);
    res.status(500).json({ message: "Server error" });
  }
};

exports.getUpcomingAppointments = async (req, res) => {
  try {
    const today = new Date();
    const appointments = await Appointment.find({
      preferredDate: { $gte: today }, // Fetch appointments with future dates
    }).sort({ preferredDate: 1, preferredTime: 1 }); // Sort by date and then by time in ascending order

    const sanitizedAppointments = appointments.map((appointment) => ({
      patientName: `${appointment.firstName} ${appointment.lastName}`,
      preferredDate: new Date(appointment.preferredDate).toLocaleDateString(
        "en-US",
        {
          year: "numeric",
          month: "long",
          day: "numeric",
        }
      ),
      preferredTime: appointment.preferredTime,
    }));

    res.json(sanitizedAppointments);
  } catch (error) {
    console.error("Error fetching upcoming appointments:", error);
    res.status(500).json({ message: "Server error" });
  }
};

exports.getAllAppointmentsForPopularTreatments = async (req, res) => {
  try {
    const appointments = await Appointment.find({}, "treatmentType"); // Fetch only treatmentType field
    res.json(appointments);
  } catch (error) {
    console.error(
      "Error fetching all appointments for popular treatments:",
      error
    );
    res.status(500).json({ message: "Server error" });
  }
};

//Export the controller functions
module.exports = exports;

exports.getReferenceNumber = async (req, res) => {
    if (!req.session.user) {
        return res.status(401).json({ message: "Unauthorized" });
    }

    try {
        const appointment = await Appointment.findOne({ patient: req.session.user.id }).sort({ createdAt: -1 });
        if (!appointment) {
            return res.status(404).json({ message: "No appointment found" });
        }

        res.json({ referenceNumber: appointment.referenceNumber });
    } catch (error) {
        console.error("Error fetching reference number:", error);
        res.status(500).json({ message: "Server error" });
    }
};
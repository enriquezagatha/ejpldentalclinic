const express = require("express");
const path = require("path");
const mongoose = require("mongoose");
const bodyParser = require("./middleware/bodyParser");
const cors = require("cors");
const session = require("express-session");
const db = require("./config/db");
require("dotenv").config();
const paymentRoutes = require("./routes/paymentRoutes");
const cron = require("node-cron");
const { syncPayments } = require("./controllers/paymentController");

// ⏳ Run sync every 5 minutes
cron.schedule("*/5 * * * *", async () => {
  console.log("🔄 Running scheduled PayMongo sync...");
  await syncPayments({ body: {}, res: { status: () => ({ json: () => {} }) } });
});

db.connect();

// Import routes
const patientRoutes = require("./routes/PatientRoutes");
const medicalPersonnelRoutes = require("./routes/medicalPersonnelRoutes");
const appointmentRoutes = require("./routes/appointmentRoutes");
const patientRecordRoutes = require("./routes/patientRecordRoutes");
const authRoutes = require("./routes/authRoutes"); // Import auth routes
const serviceRoutes = require("./routes/serviceRoutes");
const treatmentRoutes = require("./routes/treatmentRoutes");
const contactRoutes = require("./routes/contactRoutes");
const dentistRoutes = require("./routes/dentistRoutes");
const discountRoutes = require("./routes/discountRoutes");
const notificationRoutes = require("./routes/notificationRoutes"); // Import notification routes

// Initialize Express app
const app = express();

// Middleware setup
app.use(bodyParser);
app.use(cors());

// Configure session middleware
app.use(
  session({
    secret: "your-secret-key", // Replace with a strong secret
    resave: false,
    saveUninitialized: false,
    cookie: { secure: false }, // Set to true if using HTTPS
  })
);

// Static file serving for uploads
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// Database connection (handled in db.js)
require("./config/db");

// Serve static files from the "public" directory
app.use(express.static(path.join(__dirname, "public")));

//Media
app.use("/media", express.static(path.join(__dirname, "public/media")));

// Serve pages
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "main page", "home.html"));
});

// Routes for Medical Personnel pages
app.get("/medical-personnel/create", (req, res) => {
  res.sendFile(
    path.join(__dirname, "public", "Medical Personnel", "create.personnel.html")
  );
});

app.get("/medical-personnel/login", (req, res) => {
  res.sendFile(
    path.join(
      __dirname,
      "public",
      "Medical Personnel",
      "login-medicalpersonnel.html"
    )
  );
});

app.get("/medical-personnel/home", (req, res) => {
  res.sendFile(
    path.join(__dirname, "public", "Medical Personnel", "personnel-home.html")
  );
});

app.get("/medical-personnel/edit-patient", (req, res) => {
  res.sendFile(
    path.join(
      __dirname,
      "public",
      "Medical Personnel",
      "personnel-editpatient.html"
    )
  );
});

//Reset Password page for Medical Personnel
app.get("/reset-password/:token", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "Medical Personnel", "personnel-resetpassword.html"));
});

// Routes for Patient pages
app.get("/patient/create", (req, res) => {
  res.sendFile(
    path.join(__dirname, "public", "Patient", "create.patient.html")
  );
});

app.get("/patient/login", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "Patient", "login-patient.html"));
});

app.get("/patient/home", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "Patient", "patient-home.html"));
});

// Serve reset password page
app.get("/reset-password/:token", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "Patient", "patient-resetpassword.html"));
});

// Routes setup for API with proper prefixes
app.use("/api/patient", patientRoutes);
app.use("/api/medicalPersonnel", medicalPersonnelRoutes);
app.use("/api/appointments", appointmentRoutes);
app.use("/api/patientRecords", patientRecordRoutes);
app.use("/api/auth", authRoutes.router); // Include auth routes
app.use("/api/payment", paymentRoutes);
app.use("/api/services", serviceRoutes);
app.use("/api/treatments", treatmentRoutes);
app.use("/api/contact", contactRoutes);
app.use("/api/dentists", dentistRoutes);
app.use("/api/discounts", discountRoutes);
app.use("/api/notifications", notificationRoutes); // Include notification routes

// Error handling middleware
app.use((err, req, res, next) => {
  res
    .status(err.statusCode || 500)
    .json({ message: err.message || "An error occurred during file upload." });
});

// Example of using authorizeAdmin middleware
app.get("/api/admin/protected-route", authRoutes.authorizeAdmin, (req, res) => {
  res.json({ message: "Welcome, admin!" });
});

// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, "0.0.0.0", () => {
  console.log(`Server is running on http://0.0.0.0:${PORT}`);
});

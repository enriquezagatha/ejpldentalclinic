const jwt = require("jsonwebtoken");
const Patient = require("../models/Patient");
const MedicalPersonnel = require("../models/MedicalPersonnel"); // Example additional model

module.exports = async (req, res, next) => {
    try {
        const token = req.headers.authorization?.split(" ")[1];
        if (!token) {
            return res.status(401).json({ message: "Unauthorized access" });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        // Check if the email exists in either Patient or MedicalPersonnel collections
        let user = await Patient.findOne({ email: decoded.email }) || await MedicalPersonnel.findOne({ email: decoded.email });

        if (!user) {
            return res.status(401).json({ message: "User not found" });
        }

        req.user = user;  // Store user data (Patient or MedicalPersonnel)
        next();
    } catch (error) {
        res.status(401).json({ message: "Invalid token" });
    }
};
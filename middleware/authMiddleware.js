const jwt = require("jsonwebtoken");
const Patient = require("../models/Patient");

module.exports = async (req, res, next) => {
    try {
        const token = req.headers.authorization?.split(" ")[1];

        if (!token) {
            return res.status(401).json({ message: "Unauthorized access" });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = await Patient.findById(decoded.id).select("-password"); // Use Patient model here

        if (!req.user) {
            return res.status(401).json({ message: "User not found" });
        }

        next();
    } catch (error) {
        res.status(401).json({ message: "Invalid token" });
    }
};
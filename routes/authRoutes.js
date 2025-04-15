const express = require('express');
const router = express.Router();
const MedicalPersonnel = require('../models/MedicalPersonnel'); // Add this line if not already imported

// Route to check authentication status
router.get('/status', async (req, res) => {
    const loggedInUser = req.session?.user;

    if (!loggedInUser) {
        return res.status(401).json({ authorized: false });
    }

    try {
        const personnel = await MedicalPersonnel.findOne({ email: loggedInUser.email });

        if (!personnel || !personnel.isAuthorizedPersonnel) {
            return res.status(403).json({ authorized: false });
        }

        res.status(200).json({ authorized: true, email: personnel.email });
    } catch (error) {
        res.status(500).json({ authorized: false, message: "Error checking authorization." });
    }
});

// Middleware to authorize admin users
async function authorizeAdmin(req, res, next) {
    const loggedInUser = req.session?.user;

    if (!loggedInUser) {
        return res.status(401).json({ message: 'User not logged in.' });
    }

    try {
        const personnel = await MedicalPersonnel.findOne({ email: loggedInUser.email });

        if (!personnel || !personnel.isAuthorizedPersonnel) {
            return res.status(403).json({ message: 'Unauthorized action.' });
        }

        next(); // ✅ Proceed
    } catch (error) {
        res.status(500).json({ message: 'Server error while authorizing.' });
    }
}

module.exports = { router, authorizeAdmin };
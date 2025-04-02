const express = require('express');
const router = express.Router();

// Route to check authentication status
router.get('/status', (req, res) => {
    const loggedInUser = req.session?.user;

    if (!loggedInUser) {
        return res.status(401).json({ authorized: false });
    }

    // Check if the user is authorized (modify condition as needed)
    const isAuthorized = loggedInUser.email === 'staff@gmail.com';
    res.status(200).json({ authorized: isAuthorized });
});

// Middleware function to authorize admin users
function authorizeAdmin(req, res, next) {
    const loggedInUser = req.session?.user;

    if (!loggedInUser || loggedInUser.email !== 'staff@gmail.com') {
        return res.status(403).json({ message: 'Unauthorized action.' });
    }

    next(); // User is authorized, proceed
}

module.exports = {router, authorizeAdmin};
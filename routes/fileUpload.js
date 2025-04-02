// routes/fileUpload.js
const express = require('express');
const router = express.Router();
const upload = require('../middleware/fileUploadMiddleware'); // Import the configured upload middleware

// Example route for handling file uploads
router.post('/upload', upload.single('file'), (req, res) => {
    // 'file' is the field name in the form, corresponding to req.file
    if (!req.file) {
        return res.status(400).json({ message: 'No file uploaded' });
    }

    // Additional check for file type (if needed)
    const allowedMimeTypes = ['image/jpeg', 'image/png', 'application/pdf']; // example mime types
    if (!allowedMimeTypes.includes(req.file.mimetype)) {
        return res.status(400).json({ message: 'Invalid file type' });
    }

    // Additional check for file size (if needed)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (req.file.size > maxSize) {
        return res.status(400).json({ message: 'File is too large' });
    }

    res.status(200).json({ message: 'File uploaded successfully', file: req.file });
});

module.exports = router;

const multer = require('multer');
const path = require('path');

// Configure storage settings for uploaded files
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/'); // Specify the 'uploads' folder as the destination for files
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9); // Generate unique filenames
        cb(null, `${uniqueSuffix}${path.extname(file.originalname)}`); // Ensure filenames are unique
    }
});

// Multer configuration with size limits and file type validation
const upload = multer({
    storage: storage, // Use the custom storage configuration
    limits: {
        fileSize: 5 * 1024 * 1024 // Set the file size limit to 5 MB
    },
    fileFilter: (req, file, cb) => {
        const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];

        if (allowedTypes.includes(file.mimetype)) {
            cb(null, true); // Allow the file if it's an accepted type
        } else {
            cb(new Error('Invalid file type. Only JPEG, PNG, and WEBP are allowed.'), false); // Reject if the type is invalid
        }
    }
});

module.exports = upload; // Export the Multer instance to be used in routes
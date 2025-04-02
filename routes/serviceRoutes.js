const express = require('express');
const router = express.Router();
const serviceController = require('../controllers/serviceController');
const Service = require('../models/Service');
const upload = require('../middleware/fileUploadMiddleware');

// Get all services
router.get('/', serviceController.getServices);

// Add new service (with image upload)
router.post('/', upload.single('image'), serviceController.addService);

// Update a service (with optional image upload)
router.put('/:id', upload.single('image'), serviceController.updateService);

// Delete a service
router.delete('/:id', serviceController.deleteService);

module.exports = router;
const Service = require('../models/Service');

// Get all services
exports.getServices = async (req, res) => {
    try {
        const services = await Service.find();
        res.json(services);
    } catch (error) {
        res.status(500).json({ message: 'Server Error', error });
    }
};

// Add a new service with image
exports.addService = async (req, res) => {
    try {
        const { name, description } = req.body;
        const imagePath = req.file ? `/uploads/${req.file.filename}` : null; // Store image path

        const newService = new Service({ name, description, image: imagePath });
        await newService.save();

        res.json(newService);
    } catch (error) {
        res.status(500).json({ message: 'Failed to add service', error });
    }
};

// Update a service with optional image update
exports.updateService = async (req, res) => {
    try {
        const { name, description } = req.body;
        let updatedData = { name, description };

        // If a new image is uploaded, update image path
        if (req.file) {
            updatedData.image = `/uploads/${req.file.filename}`;
        }

        await Service.findByIdAndUpdate(req.params.id, updatedData);
        res.json({ message: 'Service updated successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Failed to update service', error });
    }
};

// Delete a service
exports.deleteService = async (req, res) => {
    try {
        await Service.findByIdAndDelete(req.params.id);
        res.json({ message: 'Service deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Failed to delete service', error });
    }
};
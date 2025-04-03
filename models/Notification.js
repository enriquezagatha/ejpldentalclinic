const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
    message: {
        type: String,
        required: true
    },
    email: {  // This will store the email of the patient or medical personnel
        type: String,
        required: true
    },
    userType: {  // Indicates whether the notification is for a patient or medical personnel
        type: String,
        enum: ['patient', 'medicalPersonnel'],
        required: true
    },
    read: {
        type: Boolean,
        default: false
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

const Notification = mongoose.model('Notification', notificationSchema);

module.exports = Notification;
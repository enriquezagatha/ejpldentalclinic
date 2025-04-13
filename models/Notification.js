const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        required: false,
        refPath: 'userModel'
    },
    userModel: {
        type: String,
        required: true,
        enum: ['Patient', 'MedicalPersonnel']
    },
    title: { type: String, required: true },
    message: { type: String, required: true },
    referenceId: { type: mongoose.Schema.Types.ObjectId, required: false },
    type: { type: String, default: 'General' },
    isRead: { type: Boolean, default: false },
    isRestored: { type: Boolean, default: false },
    isDeleted: { type: Boolean, default: false },
    createdAt: { type: Date, default: Date.now },
    logoUrl: String
});

module.exports = mongoose.model('Notification', notificationSchema);
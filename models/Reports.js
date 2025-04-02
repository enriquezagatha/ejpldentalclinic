const mongoose = require('mongoose');

const ReportSchema = new mongoose.Schema({
    reportType: { type: String, enum: ['daily', 'weekly', 'monthly'], required: true },
    generatedAt: { type: Date, default: Date.now },
    addedTreatments: { type: Number, required: true },
    modifiedTreatments: { type: Number, required: true }
});

module.exports = mongoose.model('Report', ReportSchema);
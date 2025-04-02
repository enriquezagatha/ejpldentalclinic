const mongoose = require("mongoose");

const PaymentSchema = new mongoose.Schema({
    patientName: { type: String, required: true },
    email: { type: String, required: true },
    treatment: { type: String, required: true },
    amount: { type: Number, required: true }, // Stored in cents (e.g., 100 PHP = 10000)
    status: { type: String, enum: ["paid", "unpaid"], default: "unpaid" },
    paymentLink: { type: String, default: "" },
    referenceId: { type: String, unique: true }, // Store PayMongo reference ID
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model("Payment", PaymentSchema);
const axios = require("axios");
const Payment = require("../models/Payment");
require("dotenv").config();
const crypto = require("crypto");

const PAYMONGO_SECRET_KEY = process.env.PAYMONGO_SECRET_KEY;
const PAYMONGO_WEBHOOK_SECRET = process.env.PAYMONGO_WEBHOOK_SECRET;
const PAYMONGO_API_URL = "https://api.paymongo.com/v1";

// ✅ Create Payment Link
exports.createPaymentLink = async (req, res) => {
    try {
        const { patientName, patientEmail, treatmentType, amount } = req.body;

        if (!amount || isNaN(amount) || amount <= 0) {
            return res.status(400).json({ error: "Invalid amount" });
        }

        const response = await axios.post(
            `${PAYMONGO_API_URL}/links`,
            {
                data: {
                    attributes: {
                        amount: amount * 100, // Convert to cents
                        description: `Payment for ${treatmentType}`,
                        currency: "PHP"
                    }
                }
            },
            {
                headers: {
                    Authorization: `Basic ${Buffer.from(PAYMONGO_SECRET_KEY).toString("base64")}`,
                    "Content-Type": "application/json"
                }
            }
        );

        const result = response.data;

        const newPayment = new Payment({
            patientName,
            email: patientEmail,
            treatment: treatmentType,
            amount: amount * 100, // Store in cents
            status: "unpaid",
            paymentLink: result.data.attributes.checkout_url,
            referenceId: result.data.id
        });

        const savedPayment = await newPayment.save();
        res.status(201).json(savedPayment);
    } catch (error) {
        console.error("Error creating payment link:", error.response?.data || error.message);
        res.status(500).json({ error: "Failed to create payment link" });
    }
};

// ✅ Webhook to Update Payment Status
exports.updatePaymentStatus = async (req, res) => {
    try {
        const signature = req.headers["x-paymongo-signature"];
        const payload = JSON.stringify(req.body);
        const hmac = crypto.createHmac("sha256", PAYMONGO_WEBHOOK_SECRET).update(payload).digest("hex");

        if (!signature || signature !== hmac) {
            return res.status(401).json({ error: "Unauthorized webhook request" });
        }

        const { data } = req.body;
        if (!data || !data.attributes) {
            return res.status(400).json({ error: "Invalid webhook data" });
        }

        const referenceId = data.id;
        const status = data.attributes.status;

        console.log(`Webhook received: ${referenceId} - Status: ${status}`);

        const payment = await Payment.findOneAndUpdate(
            { referenceId },
            { status },
            { new: true }
        );

        if (payment) {
            console.log(`✅ Payment updated: ${payment.patientName} is now ${payment.status}`);
            res.status(200).json({ message: "Payment status updated" });
        } else {
            console.log("❌ Payment not found for reference ID:", referenceId);
            res.status(404).json({ error: "Payment not found" });
        }
    } catch (error) {
        console.error("❌ Error updating payment status:", error.message);
        res.status(500).json({ error: "Failed to update payment status" });
    }
};

// ✅ Sync Payments from PayMongo
exports.syncPayments = async (req, res) => {
    try {
        console.log("🔄 Syncing payments with PayMongo...");
        const paymongoPayments = await exports.getAllPayments();
        let updateCount = 0;
        let newCount = 0;

        for (const paymongoPayment of paymongoPayments) {
            if (!paymongoPayment || !paymongoPayment.attributes) {
                console.warn("⚠️ Skipping invalid payment record:", paymongoPayment);
                continue; // Skip if attributes are missing
            }

            const { id: paymongoId, attributes } = paymongoPayment;
            const { status, amount, created_at, billing, description, checkout_url } = attributes;

            if (!status || typeof amount !== "number") {
                console.warn("⚠️ Skipping payment with missing status or amount:", paymongoPayment);
                continue; // Skip invalid records
            }

            const email = billing?.email || "unknown@example.com";
            const treatment = description || "Unknown Treatment";
            const createdAt = new Date(created_at * 1000);
            const formattedStatus = status === "paid" ? "paid" : "unpaid";

            let existingPayment = await Payment.findOne({ referenceId: paymongoId });

            if (!existingPayment) {
                existingPayment = await Payment.findOne({ email });
            }

            if (existingPayment) {
                if (existingPayment.status !== formattedStatus || existingPayment.amount !== amount) {
                    existingPayment.status = formattedStatus;
                    existingPayment.amount = amount;
                    existingPayment.referenceId = paymongoId;
                    existingPayment.createdAt = createdAt;
                    await existingPayment.save();
                    updateCount++;
                }
            } else {
                const newPayment = new Payment({
                    patientName: "Unknown",
                    email,
                    treatment,
                    amount,
                    status: formattedStatus,
                    paymentLink: checkout_url || "",
                    referenceId: paymongoId,
                    createdAt
                });

                await newPayment.save();
                newCount++;
            }
        }

        console.log(`✅ Sync completed. Updated: ${updateCount}, Added: ${newCount}`);
        res.status(200).json({ message: "Payments synced successfully!" });
    } catch (error) {
        console.error("❌ Error syncing payments:", error.response?.data || error.message);
        res.status(500).json({ error: "Failed to sync payments" });
    }
};

// ✅ Get Payments from MongoDB
exports.getPayments = async (req, res) => {
    try {
        console.log("🔄 Fetching all payments from MongoDB...");
        
        // Fetch all payments from MongoDB
        const mongoPayments = await Payment.find().lean();

        console.log(`✅ Retrieved ${mongoPayments.length} payments from MongoDB.`);

        // Send response
        res.json({ payments: mongoPayments });

    } catch (error) {
        console.error("❌ Error fetching payments from MongoDB:", error.message);
        res.status(500).json({ error: "Failed to fetch payments from MongoDB" });
    }
};

// ✅ Fetch All Payments from PayMongo
exports.getAllPayments = async (req, res) => { // ✅ Now sends response
    try {
        let allPayments = [];
        let url = `${PAYMONGO_API_URL}/payments`;

        console.log("🔄 Fetching all payments from PayMongo...");

        while (url) {
            const response = await axios.get(url, {
                headers: {
                    Authorization: `Basic ${Buffer.from(PAYMONGO_SECRET_KEY).toString("base64")}`,
                    "Content-Type": "application/json"
                }
            });

            const data = response.data;
            if (data && data.data) {
                allPayments = allPayments.concat(data.data);
            }

            url = data.hasOwnProperty("links") && data.links.next ? data.links.next : null;
        }

        console.log(`✅ Retrieved ${allPayments.length} payments from PayMongo.`);
        res.json({ payments: allPayments }); // ✅ Send response
    } catch (error) {
        console.error("❌ Error fetching PayMongo payments:", error.response?.data || error.message);
        res.status(500).json({ error: "Failed to fetch payments" }); // ✅ Send error response
    }
};

// ✅ Delete Payment
exports.deletePayment = async (req, res) => {
    try {
        const paymentId = req.params.id;

        // Check if payment exists
        const payment = await Payment.findById(paymentId);
        if (!payment) {
            return res.status(404).json({ error: "Payment not found" });
        }

        // Delete payment
        await Payment.findByIdAndDelete(paymentId);
        res.status(200).json({ message: "Payment deleted successfully!" });

    } catch (error) {
        console.error("❌ Error deleting payment:", error.message);
        res.status(500).json({ error: "Failed to delete payment" });
    }
};

// ✅ Export all functions
module.exports = exports;
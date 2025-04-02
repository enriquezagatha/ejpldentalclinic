const axios = require("axios");
const Payment = require("../models/Payment");
require("dotenv").config();
const crypto = require("crypto");
const mongoose = require("mongoose");

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
        const signatureHeader = req.headers["x-paymongo-signature"];
        if (!signatureHeader) {
            return res.status(401).json({ error: "Missing webhook signature" });
        }

        const [t, v1] = signatureHeader.split(",");
        const payload = JSON.stringify(req.body);
        const hmac = crypto.createHmac("sha256", PAYMONGO_WEBHOOK_SECRET).update(payload).digest("hex");

        // Securely compare signatures
        if (!crypto.timingSafeEqual(Buffer.from(v1, "utf8"), Buffer.from(hmac, "utf8"))) {
            return res.status(401).json({ error: "Invalid webhook signature" });
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

        // Fetch payments directly
        let paymongoPayments = [];
        let url = `${PAYMONGO_API_URL}/payments`;

        while (url) {
            const response = await axios.get(url, {
                headers: {
                    Authorization: `Basic ${Buffer.from(PAYMONGO_SECRET_KEY).toString("base64")}`,
                    "Content-Type": "application/json"
                }
            });

            console.log("🔍 PayMongo API Response:", JSON.stringify(response.data, null, 2)); // Debugging log
            
            const data = response.data;
            if (data && data.data) {
                paymongoPayments = paymongoPayments.concat(data.data);
            }

            url = data.links?.next || null;
        }

        console.log(`✅ Retrieved ${paymongoPayments.length} payments from PayMongo.`);
        let updateCount = 0;
        let newCount = 0;

        for (const paymongoPayment of paymongoPayments) {
            if (!paymongoPayment || !paymongoPayment.attributes) {
                console.warn("⚠️ Skipping invalid payment record:", paymongoPayment);
                continue;
            }

            const paymongoId = paymongoPayment.id;
            const attributes = paymongoPayment.attributes;

            if (!attributes || !attributes.status) {
                console.warn("⚠️ Skipping payment due to missing attributes or status:", paymongoPayment);
                continue;
            }

            const { status, amount, created_at, billing, description, checkout_url } = attributes;
            const email = billing?.email || "unknown@example.com";
            const treatment = description || "Unknown Treatment";
            const createdAt = new Date(created_at * 1000);
            const formattedStatus = status === "paid" ? "paid" : "unpaid";

            let existingPayment = await Payment.findOne({ referenceId: paymongoId }) || await Payment.findOne({ email });

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
                await Payment.create({
                    patientName: "Unknown",
                    email,
                    treatment,
                    amount,
                    status: formattedStatus,
                    paymentLink: checkout_url || "",
                    referenceId: paymongoId,
                    createdAt
                });
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

// ✅ Get Payments from MongoDB with Filtering and Pagination
exports.getPayments = async (req, res) => {
    try {
        console.log("🔄 Fetching filtered payments from MongoDB...");

        // Extract query parameters
        const { status, startDate, endDate, treatment, page = 1, limit = 10 } = req.query;

        console.log("📅 Received Start Date:", startDate);
        console.log("📅 Received End Date:", endDate);
        console.log("🦷 Received Treatment:", treatment);

        let filter = {};

        // ✅ Apply Status Filter
        if (status) {
            filter.status = status;
        }

        // ✅ Apply Treatment Filter
        if (treatment) {
            filter.treatment = treatment; // Assumes treatment is stored as a string in MongoDB
        }

        // ✅ Apply Date Filtering (Ensure Proper UTC Format)
        if (startDate || endDate) {
            filter.createdAt = {};

            if (startDate) {
                const startUTC = new Date(`${startDate}T00:00:00.000Z`);
                if (isNaN(startUTC.getTime())) {
                    return res.status(400).json({ error: "Invalid startDate format. Use YYYY-MM-DD." });
                }
                filter.createdAt.$gte = startUTC;
                console.log("✅ Converted Start Date (UTC):", filter.createdAt.$gte);
            }

            if (endDate) {
                const endUTC = new Date(`${endDate}T23:59:59.999Z`);
                if (isNaN(endUTC.getTime())) {
                    return res.status(400).json({ error: "Invalid endDate format. Use YYYY-MM-DD." });
                }
                filter.createdAt.$lte = endUTC;
                console.log("✅ Converted End Date (UTC):", filter.createdAt.$lte);
            }
        }

        console.log("🛠 MongoDB Query Filter:", JSON.stringify(filter, null, 2));

        // ✅ Handle Pagination (Ensure valid page and limit numbers)
        const pageNum = Math.max(parseInt(page, 10), 1);
        const limitNum = Math.max(parseInt(limit, 10), 1);
        const skip = (pageNum - 1) * limitNum;

        console.log(`📌 Pagination: Page ${pageNum}, Limit ${limitNum}, Skipping ${skip} records`);

        // ✅ Fetch Payments
        const mongoPayments = await Payment.find(filter)
            .sort({ createdAt: -1 }) // Sort by newest payments first
            .skip(skip)
            .limit(limitNum)
            .lean();

        // ✅ Count Total Payments for Pagination
        const totalPayments = await Payment.countDocuments(filter);
        const totalPages = Math.ceil(totalPayments / limitNum);

        console.log(`✅ Retrieved ${mongoPayments.length} payments from MongoDB.`);

        res.json({
            payments: mongoPayments,
            totalPages,
            currentPage: pageNum,
            totalPayments,
        });

    } catch (error) {
        console.error("❌ Error fetching payments from MongoDB:", error.message);
        res.status(500).json({ error: "Failed to fetch payments from MongoDB" });
    }
};

// ✅ Fetch All Payments from PayMongo
exports.getAllPayments = async () => { // ❌ No Express res
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

            url = data.links?.next || null;
        }

        console.log(`✅ Retrieved ${allPayments.length} payments from PayMongo.`);
        return allPayments;
    } catch (error) {
        console.error("❌ Error fetching PayMongo payments:", error.response?.data || error.message);
        throw new Error("Failed to fetch payments");
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
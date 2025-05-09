const axios = require("axios");
const Payment = require("../models/Payment"); // Import Payment model
require("dotenv").config();

const PAYMONGO_SECRET_KEY = "sk_test_pWhDTcTMXwmFWnRWzvv1db1w"; // Keep this secret!
const PAYMONGO_API_URL = "https://api.paymongo.com/v1";

async function createPaymentMethod(userName, userEmail, paymentType) {
    try {
        const response = await axios.post(
            `${PAYMONGO_API_URL}/payment_methods`,
            {
                data: {
                    attributes: {
                        type: paymentType,
                        billing: {
                            name: userName,
                            email: userEmail
                        }
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

        return response.data.data.id; // Return the payment method ID
    } catch (error) {
        console.error("Error creating payment method:", error.response?.data || error.message);
        throw error;
    }
}

async function createPaymentIntent(userName, userEmail, treatment, amount) {
    try {
        const response = await axios.post(
            `${PAYMONGO_API_URL}/payment_intents`,
            {
                data: {
                    attributes: {
                        amount: amount, // Convert PHP to centavos
                        payment_method_allowed: ["gcash"], // Restrict to GCash
                        currency: "PHP",
                        capture_type: "automatic"
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

        const paymentIntentId = response.data.data.id; // Get PayMongo ID

        // Save the payment in MongoDB with referenceId
        const newPayment = new Payment({
            patientName: userName,
            email: userEmail,
            treatment: treatment,
            amount: amount, // Stored in centavos
            status: "unpaid",
            referenceId: paymentIntentId, // Save PayMongo ID
            createdAt: new Date()
        });

        await newPayment.save();
        console.log(`✅ Payment saved: ${newPayment.referenceId}`);

        return paymentIntentId; // Return PayMongo Payment Intent ID
    } catch (error) {
        console.error("Error creating payment intent:", error.response?.data || error.message);
        throw error;
    }
}

async function attachPaymentMethod(paymentIntentId, paymentMethodId) {
    try {
        const response = await axios.post(
            `${PAYMONGO_API_URL}/payment_intents/${paymentIntentId}/attach`,
            {
                data: {
                    attributes: {
                        payment_method: paymentMethodId
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

        return response.data; // Return the response from PayMongo
    } catch (error) {
        console.error("Error attaching payment method:", error.response?.data || error.message);
        throw error;
    }
}

async function fetchPayments() {
    try {
        const response = await axios.get(`${PAYMONGO_API_URL}/payments`, {
            headers: {
                Authorization: `Basic ${Buffer.from(PAYMONGO_SECRET_KEY).toString("base64")}`,
                "Content-Type": "application/json"
            }
        });

        const payments = response.data.data;
        const statusMap = {
            succeeded: "paid",
            failed: "unpaid",
            awaiting_payment: "unpaid",
            canceled: "unpaid"
        };

        for (const pay of payments) {
            const paymongoId = pay.id;
            const status = statusMap[pay.attributes.status] || "unpaid";
            const amount = pay.attributes.amount; // Stored in centavos

            // Find existing payment by referenceId (PayMongo ID)
            const existingPayment = await Payment.findOne({ referenceId: paymongoId });

            if (existingPayment) {
                // Update status & amount if payment exists
                existingPayment.status = status;
                existingPayment.amount = amount;
                await existingPayment.save();
                console.log(`✅ Updated: ${existingPayment.patientName} | Amount: ₱${amount / 100} | Status: ${existingPayment.status}`);
            } else {
                console.log(`❌ Payment ${paymongoId} not found in database.`);
            }
        }

        console.log("✅ PayMongo payments synced successfully.");
    } catch (error) {
        console.error("❌ Error fetching payments:", error.response?.data || error.message);
        throw error;
    }
}

module.exports = {
    createPaymentMethod,
    createPaymentIntent,
    attachPaymentMethod,
    fetchPayments
};
const express = require("express");
const router = express.Router();
const paymentController = require ("../controllers/paymentController");

router.post("/create-payment-link", paymentController.createPaymentLink);
router.post("/webhook", paymentController.updatePaymentStatus);
router.get("/sync", paymentController.syncPayments);
router.get("/getpayments", paymentController.getPayments);
router.get("/getallpayments", paymentController.getAllPayments);
router.delete("/payments/:id", paymentController.deletePayment);

module.exports = router;
const mongoose = require("mongoose");

const DiscountSchema = new mongoose.Schema({
    name: { type: String, required: true },
    percentage: { type: Number, required: true, min: 0, max: 100 }
});

module.exports = mongoose.model("Discount", DiscountSchema);
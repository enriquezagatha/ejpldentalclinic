const mongoose = require("mongoose");

const ContactSchema = new mongoose.Schema({
    landline: { type: String },
    phone: { type: String },
    facebook_page: { type: String },
    facebook_text: { type: String },
    created_at: { type: Date, default: Date.now },
    updated_at: { type: Date}
});

module.exports = mongoose.model("Contact", ContactSchema);
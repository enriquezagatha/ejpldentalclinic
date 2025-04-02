const Contact = require("../models/Contact");

// Fetch All Contacts
exports.getFirstContact = async (req, res) => {
    try {
        const contact = await Contact.findOne(); // Get the first contact
        if (!contact) return res.status(404).json({ error: "Contact details not found." });

        res.json(contact);
    } catch (error) {
        res.status(500).json({ error: "Failed to fetch contact details." });
    }
};

// ✅ Fetch All Contacts
exports.getAllContacts = async (req, res) => {
    try {
        const contacts = await Contact.find();
        res.json(contacts);
    } catch (error) {
        res.status(500).json({ error: "Failed to fetch contacts." });
    }
};

// ✅ Fetch a Single Contact by ID
exports.getContactById = async (req, res) => {
    try {
        const contact = await Contact.findById(req.params.id);
        if (!contact) return res.status(404).json({ error: "Contact not found." });

        res.json(contact);
    } catch (error) {
        res.status(500).json({ error: "Failed to fetch contact details." });
    }
};

// ✅ Create a New Contact
exports.createContact = async (req, res) => {
    try {
        const { landline, phone, facebook_page, facebook_text } = req.body;

        const newContact = new Contact({
            landline,
            phone,
            facebook_page,
            facebook_text,
        });

        await newContact.save();
        res.status(201).json({ message: "Contact added successfully!", contact: newContact });
    } catch (error) {
        res.status(500).json({ error: "Failed to create contact." });
    }
};

// ✅ Update Contact by ID
exports.updateContact = async (req, res) => {
    try {
        const { landline, phone, facebook_page, facebook_text } = req.body;

        const updatedContact = await Contact.findByIdAndUpdate(
            req.params.id,
            { landline, phone, facebook_page, facebook_text, updated_at: new Date() },
            { new: true }
        );

        if (!updatedContact) return res.status(404).json({ error: "Contact not found." });

        res.json({ message: "Contact updated successfully!", contact: updatedContact });
    } catch (error) {
        res.status(500).json({ error: "Failed to update contact details." });
    }
};

// ✅ Delete Contact by ID
exports.deleteContact = async (req, res) => {
    try {
        const deletedContact = await Contact.findByIdAndDelete(req.params.id);
        if (!deletedContact) return res.status(404).json({ error: "Contact not found." });

        res.json({ message: "Contact deleted successfully!" });
    } catch (error) {
        res.status(500).json({ error: "Failed to delete contact." });
    }
};
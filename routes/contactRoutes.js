const express = require("express");
const router = express.Router();
const contactController = require("../controllers/contactController");

// ✅ Fetch First Contacts
router.get("/first", contactController.getFirstContact);

//Fetch All Contacts
router.get("/", contactController.getAllContacts);

// ✅ Fetch a Single Contact by ID
router.get("/:id", contactController.getContactById);

// ✅ Create a New Contact
router.post("/", contactController.createContact);

// ✅ Update a Contact by ID
router.put("/:id", contactController.updateContact);

// ✅ Delete a Contact by ID
router.delete("/:id", contactController.deleteContact);

module.exports = router;
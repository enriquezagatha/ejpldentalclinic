const express = require("express");
const router = express.Router();
const treatmentController = require("../controllers/treatmentController");

// Routes using controller functions
router.get("/", treatmentController.getAllTreatments);
router.post("/", treatmentController.addTreatment);
router.put("/:id", treatmentController.updateTreatment);
router.delete("/:id", treatmentController.deleteTreatment);

module.exports = router;
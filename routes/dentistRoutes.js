const express = require("express");
const router = express.Router();
const dentistController = require("../controllers/dentistController");
const upload = require("../middleware/fileUploadMiddleware");

// Routes for dentist management
router.get("/", dentistController.getDentists);
router.post("/", upload.single("image"), dentistController.addDentist);
router.put("/:id", upload.single("image"), dentistController.updateDentist);
router.delete("/:id", dentistController.deleteDentist);

module.exports = router;
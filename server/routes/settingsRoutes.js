const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/authMiddleware");
const {
  getSettings,
  saveSettings,
} = require("../controllers/settingsController");

router.get("/", protect, getSettings);
router.post("/", protect, saveSettings);

module.exports = router;

const mongoose = require("mongoose");

const settingsSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
    unique: true,
  },
  projectSettings: {
    currency: { type: String, default: "INR" },
    wallHeightM: { type: Number, default: 3.0 },
    brickSize: { type: String, default: "standard" },
  },
  customRates: {
    type: Map,
    of: Number,
    default: {},
  },
  customQuantities: {
    type: Map,
    of: Number,
    default: {},
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model("Settings", settingsSchema);

const mongoose = require("mongoose");

const floorPlanSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: "User",
  },
  imageUrl: {
    type: String,
    required: true,
  },
  thumbnailUrl: {
    type: String,
  },
  fileName: {
    type: String,
    required: true,
  },
  analysisResult: {
    type: Object, // Store the full JSON analysis result
    required: true,
  },
  costEstimation: {
    type: Object, // Store the cost details (BOQ, totals, etc.)
    default: {},
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model("FloorPlan", floorPlanSchema);

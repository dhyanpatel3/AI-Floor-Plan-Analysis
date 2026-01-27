const asyncHandler = require("express-async-handler");
const FloorPlan = require("../models/FloorPlan");

// @desc    Save a new floor plan
// @route   POST /api/floorplans
// @access  Private
const saveFloorPlan = asyncHandler(async (req, res) => {
  if (!req.file || !req.file.path) {
    res.status(400);
    throw new Error("Image file is required");
  }

  if (!req.body.analysisResult) {
    res.status(400);
    throw new Error("Analysis result is required");
  }

  const { analysisResult, costEstimation } = req.body;

  // Parse analysisResult if it's sent as a string (multipart/form-data often sends objects as strings)
  let parsedAnalysis;
  let parsedCostEstimation = {};

  try {
    parsedAnalysis =
      typeof analysisResult === "string"
        ? JSON.parse(analysisResult)
        : analysisResult;

    if (costEstimation) {
      parsedCostEstimation =
        typeof costEstimation === "string"
          ? JSON.parse(costEstimation)
          : costEstimation;
    }
  } catch (e) {
    res.status(400);
    throw new Error("Invalid analysis or cost result format");
  }

  const floorPlan = await FloorPlan.create({
    user: req.user.id,
    imageUrl: req.file.path,
    fileName: req.file.originalname,
    analysisResult: parsedAnalysis,
    costEstimation: parsedCostEstimation,
  });

  res.status(201).json(floorPlan);
});

// @desc    Get user floor plans
// @route   GET /api/floorplans
// @access  Private
const getUserFloorPlans = asyncHandler(async (req, res) => {
  const floorPlans = await FloorPlan.find({ user: req.user.id }).sort({
    createdAt: -1,
  });
  res.status(200).json(floorPlans);
});

// @desc    Delete floor plan
// @route   DELETE /api/floorplans/:id
// @access  Private
const deleteFloorPlan = asyncHandler(async (req, res) => {
  const floorPlan = await FloorPlan.findById(req.params.id);

  if (!floorPlan) {
    res.status(404);
    throw new Error("Floor plan not found");
  }

  // Check for user
  if (!req.user) {
    res.status(401);
    throw new Error("User not found");
  }

  // Make sure the logged in user matches the goal user
  if (floorPlan.user.toString() !== req.user.id) {
    res.status(401);
    throw new Error("User not authorized");
  }

  // Ideally, delete from Cloudinary here too, but for now just DB
  await floorPlan.deleteOne();

  res.status(200).json({ id: req.params.id });
});

module.exports = {
  saveFloorPlan,
  getUserFloorPlans,
  deleteFloorPlan,
};

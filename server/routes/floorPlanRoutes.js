const express = require("express");
const router = express.Router();
const {
  saveFloorPlan,
  getUserFloorPlans,
  deleteFloorPlan,
} = require("../controllers/floorPlanController");
const { protect } = require("../middleware/authMiddleware");
const { parser } = require("../config/cloudinary");

// Route to get all plans and save a plan (with image upload)
router
  .route("/")
  .get(protect, getUserFloorPlans)
  .post(protect, parser.single("image"), saveFloorPlan);

router.route("/:id").delete(protect, deleteFloorPlan);

module.exports = router;

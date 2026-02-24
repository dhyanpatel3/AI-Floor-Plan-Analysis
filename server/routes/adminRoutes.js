const express = require("express");
const router = express.Router();
const {
  getUsers,
  updateUserCredits,
  deleteUser,
} = require("../controllers/adminController");
const { protect, admin } = require("../middleware/authMiddleware");

router.route("/users").get(protect, admin, getUsers);
router.route("/users/:id/credits").put(protect, admin, updateUserCredits);
router.route("/users/:id").delete(protect, admin, deleteUser);

module.exports = router;

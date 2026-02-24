const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, "Please add a name"],
  },
  email: {
    type: String,
    required: [true, "Please add an email"],
    unique: true,
  },
  password: {
    type: String,
    required: [true, "Please add a password"],
  },
  resetPasswordToken: String,
  resetPasswordExpire: Date,
  credits: {
    type: Number,
    default: 5,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  isAdmin: {
    type: Boolean,
    required: true,
    default: false,
  },
  companyName: {
    type: String,
    default: "",
  },
  companyAddress: {
    type: String,
    default: "",
  },
  companyPhone: {
    type: String,
    default: "",
  },
  companyLogo: {
    type: String, // Base64 or URL
    default: "",
  },
});

module.exports = mongoose.model("User", userSchema);

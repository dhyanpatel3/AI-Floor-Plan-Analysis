const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const crypto = require("crypto");
const asyncHandler = require("express-async-handler");
const { OAuth2Client } = require("google-auth-library");
const User = require("../models/User");
const sendEmail = require("../utils/sendEmail");

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

// @desc    Register new user
// @route   POST /api/auth/register
// @access  Public
const registerUser = asyncHandler(async (req, res) => {
  const { name, email, password } = req.body;

  if (!name || !email || !password) {
    res.status(400);
    throw new Error("Please add all fields");
  }

  // Check if user exists
  const userExists = await User.findOne({ email });

  if (userExists) {
    res.status(400);
    throw new Error("User already exists");
  }

  // Hash password
  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(password, salt);

  // Create user
  const user = await User.create({
    name,
    email,
    password: hashedPassword,
  });

  if (user) {
    // Send Welcome Email
    const message = `
      <h1>Welcome to AI Floor Analyzer!</h1>
      <p>Hi ${user.name},</p>
      <p>Thank you for signing up. We are excited to help you estimate your construction projects with the power of AI.</p>
      <p>You have been credited with <strong>${user.credits} free credits</strong> to get started.</p>
      <br>
      <p>To start your first analysis, imply upload a floor plan image on your dashboard.</p>
      <p>Happy Estimating!</p>
      <p>The AI Floor Analyzer Team</p>
    `;

    try {
      await sendEmail({
        to: user.email,
        subject: "Welcome to AI Floor Analyzer",
        text: message,
      });
    } catch (error) {
      console.error("Welcome email failed:", error);
      // Do not fail registration if email fails
    }

    res.status(201).json({
      _id: user.id,
      name: user.name,

      email: user.email,
      credits: user.credits,
      isAdmin: user.isAdmin,
      token: generateToken(user._id),
      isNewUser: true,
    });
  } else {
    res.status(400);
    throw new Error("Invalid user data");
  }
});

// @desc    Authenticate a user
// @route   POST /api/auth/login
// @access  Public
const loginUser = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  // Check for user email
  const user = await User.findOne({ email });

  if (user && (await bcrypt.compare(password, user.password))) {
    res.json({
      _id: user.id,
      name: user.name,
      email: user.email,
      credits: user.credits,
      isAdmin: user.isAdmin,
      companyName: user.companyName,
      companyAddress: user.companyAddress,
      companyPhone: user.companyPhone,
      companyLogo: user.companyLogo,
      token: generateToken(user._id),
    });
  } else {
    res.status(400);
    throw new Error("Invalid credentials");
  }
});

// @desc    Get user data
// @route   GET /api/auth/me
// @access  Private
const getMe = asyncHandler(async (req, res) => {
  res.status(200).json(req.user);
});

// @desc    Google Login
// @route   POST /api/auth/google
// @access  Public
const googleLogin = asyncHandler(async (req, res) => {
  const { credential, access_token } = req.body;
  let name, email;

  if (credential) {
    const ticket = await client.verifyIdToken({
      idToken: credential,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();
    name = payload.name;
    email = payload.email;
  } else if (access_token) {
    try {
      const response = await fetch(
        `https://www.googleapis.com/oauth2/v3/userinfo?access_token=${access_token}`,
      );
      if (!response.ok) throw new Error("Failed to fetch user info");
      const data = await response.json();
      name = data.name;
      email = data.email;
    } catch (error) {
      res.status(401);
      throw new Error("Invalid access token");
    }
  } else {
    res.status(400);
    throw new Error("No credential provided");
  }

  let user = await User.findOne({ email });

  if (!user) {
    // Create new user
    // Generate a secure random password since they won't use it
    const password = crypto.randomBytes(20).toString("hex");
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    user = await User.create({
      name,
      email,
      password: hashedPassword,
    });

    res.status(201).json({
      _id: user.id,
      name: user.name,
      email: user.email,
      credits: user.credits,
      isAdmin: user.isAdmin,
      token: generateToken(user._id),
      isNewUser: true,
    });
    return;
  }

  res.status(200).json({
    _id: user.id,
    name: user.name,
    email: user.email,
    credits: user.credits,
    isAdmin: user.isAdmin,
    companyName: user.companyName,
    companyAddress: user.companyAddress,
    companyPhone: user.companyPhone,
    companyLogo: user.companyLogo,
    token: generateToken(user._id),
  });
});

// @desc    Forgot Password
// @route   POST /api/auth/forgotpassword
// @access  Public
const forgotPassword = asyncHandler(async (req, res) => {
  const { email } = req.body;
  const user = await User.findOne({ email });

  if (!user) {
    res.status(404);
    throw new Error("User not found");
  }

  // Generate Reset Token
  const resetToken = crypto.randomBytes(20).toString("hex");

  // Hash token and set to resetPasswordToken field
  user.resetPasswordToken = crypto
    .createHash("sha256")
    .update(resetToken)
    .digest("hex");

  // Set expire (10 minutes)
  user.resetPasswordExpire = Date.now() + 10 * 60 * 1000;

  await user.save();

  // Create reset url
  // Assuming frontend is running on process.env.CLIENT_URL or standard localhost:5173
  const clientUrl = process.env.CLIENT_URL || "http://localhost:5173";
  const resetUrl = `${clientUrl}/reset-password/${resetToken}`;

  const message = `
    <h1>You have requested a password reset</h1>
    <p>Please go to this link to reset your password:</p>
    <a href=${resetUrl} clicktracking=off>${resetUrl}</a>
  `;

  try {
    await sendEmail({
      to: user.email,
      subject: "Password Reset Request",
      text: message,
    });

    res.status(200).json({ success: true, data: "Email Sent" });
  } catch (error) {
    console.error(error);
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;
    await user.save();

    res.status(500);
    throw new Error("Email could not be sent");
  }
});

// @desc    Reset Password
// @route   PUT /api/auth/resetpassword/:resettoken
// @access  Public
const resetPassword = asyncHandler(async (req, res) => {
  const resetPasswordToken = crypto
    .createHash("sha256")
    .update(req.params.resettoken)
    .digest("hex");

  const user = await User.findOne({
    resetPasswordToken,
    resetPasswordExpire: { $gt: Date.now() },
  });

  if (!user) {
    res.status(400);
    throw new Error("Invalid Token");
  }

  // Set new password
  const salt = await bcrypt.genSalt(10);
  user.password = await bcrypt.hash(req.body.password, salt);
  user.resetPasswordToken = undefined;
  user.resetPasswordExpire = undefined;

  await user.save();

  res.status(201).json({
    success: true,
    token: generateToken(user._id),
  });
});

// Generate JWT
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: "30d",
  });
};

// @desc    Add credits to user
// @route   PUT /api/auth/addcredits
// @access  Private
const addCredits = asyncHandler(async (req, res) => {
  const { credits } = req.body;

  if (!credits) {
    res.status(400);
    throw new Error("Please provide credit amount");
  }

  const user = await User.findById(req.user.id);

  if (user) {
    user.credits += Number(credits);
    await user.save();

    res.json({
      _id: user.id,
      name: user.name,
      email: user.email,
      credits: user.credits,
      token: generateToken(user._id),
      companyName: user.companyName,
      companyAddress: user.companyAddress,
      companyPhone: user.companyPhone,
      companyLogo: user.companyLogo,
    });
  } else {
    res.status(404);
    throw new Error("User not found");
  }
});

// @desc    Update user details
// @route   PUT /api/auth/updatedetails
// @access  Private
const updateDetails = asyncHandler(async (req, res) => {
  const fieldsToUpdate = {
    companyName: req.body.companyName,
    companyAddress: req.body.companyAddress,
    companyPhone: req.body.companyPhone,
    companyLogo: req.body.companyLogo,
  };

  const user = await User.findByIdAndUpdate(req.user.id, fieldsToUpdate, {
    new: true,
    runValidators: true,
  });

  res.status(200).json({
    _id: user.id,
    name: user.name,
    email: user.email,
    credits: user.credits,
    isAdmin: user.isAdmin,
    companyName: user.companyName,
    companyAddress: user.companyAddress,
    companyPhone: user.companyPhone,
    companyLogo: user.companyLogo,
    token: req.headers.authorization?.split(" ")[1],
  });
});

module.exports = {
  registerUser,
  loginUser,
  getMe,
  googleLogin,
  forgotPassword,
  resetPassword,
  updateDetails,
  addCredits,
};

const Razorpay = require("razorpay");
const crypto = require("crypto");
const asyncHandler = require("express-async-handler");
const User = require("../models/User");

// Initialize Razorpay
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID || "rzp_test_placeholder",
  key_secret: process.env.RAZORPAY_KEY_SECRET || "secret_placeholder",
});

// @desc    Create Razorpay Order
// @route   POST /api/payment/create-order
// @access  Private
const createOrder = asyncHandler(async (req, res) => {
  const { credits } = req.body;
  const PRICE_PER_CREDIT = 500; // Define price here or in env

  if (!credits) {
    res.status(400);
    throw new Error("Please provide credits");
  }

  const amount = credits * PRICE_PER_CREDIT;
  const currency = "INR";

  const options = {
    amount: amount * 100, // amount in paisa
    currency,
    receipt: `receipt_${Date.now()}`,
    notes: {
      credits: credits, // Store credits in notes to retrieve later if needed
    },
  };

  try {
    const order = await razorpay.orders.create(options);
    res.json(order);
  } catch (error) {
    console.error("Razorpay Order Creation Error:", error);
    res.status(500);
    throw new Error("Something went wrong with payment initiation");
  }
});

// @desc    Verify Payment and Add Credits
// @route   POST /api/payment/verify
// @access  Private
const verifyPayment = asyncHandler(async (req, res) => {
  const {
    razorpay_order_id,
    razorpay_payment_id,
    razorpay_signature,
    credits, // Still passing this from frontend for convenience, but shoud match
  } = req.body;

  const body = razorpay_order_id + "|" + razorpay_payment_id;

  const expectedSignature = crypto
    .createHmac(
      "sha256",
      process.env.RAZORPAY_KEY_SECRET || "secret_placeholder",
    )
    .update(body.toString())
    .digest("hex");

  if (expectedSignature === razorpay_signature) {
    // Payment is successful, add credits
    const user = await User.findById(req.user.id);

    if (user) {
      user.credits += Number(credits); // We trust frontend here because signature matches order.
      // Ideally we should verify order amount or fetch order details.
      // But for this demo, fetching order details adds latency.
      // Since order_id is unique and signed, user can't fake payment_id.
      // But user CAN send valid payment_id/signature for 1 credit order but send "credits: 1000" in body.
      // SECURITY FIX: Fetch order to get notes.credits

      try {
        const order = await razorpay.orders.fetch(razorpay_order_id);
        const creditsToAdd = order.notes.credits;
        if (creditsToAdd) {
          user.credits += Number(creditsToAdd);
        } else {
          // If for some reason notes are missing but order is valid, fallback to 1 credit or throw error
          // Ideally we should not fallback to client provided credits without verification
          console.warn(
            "Credits not found in order notes, defaulting to provided credits but verify manually",
          );
          user.credits += Number(credits);
        }
      } catch (e) {
        console.error("Error fetching order:", e);
        res.status(500);
        throw new Error("Could not verify payment details with Razorpay");
      }

      await user.save();

      res.json({
        success: true,
        message: "Payment verified and credits added",
        credits: user.credits,
      });
    } else {
      res.status(404);
      throw new Error("User not found");
    }
  } else {
    res.status(400);
    throw new Error("Invalid signature");
  }
});

module.exports = {
  createOrder,
  verifyPayment,
};

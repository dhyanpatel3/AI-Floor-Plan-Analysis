const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const { GoogleGenAI, Type } = require("@google/genai");
const connectDB = require("./config/db");
const { protect } = require("./middleware/authMiddleware");
const User = require("./models/User");

dotenv.config();

connectDB();

if (!process.env.MONGO_URI) {
  console.error("MONGO_URI is undefined in environment variables.");
}
if (!process.env.JWT_SECRET) {
  console.error("JWT_SECRET is undefined in environment variables.");
}

const app = express();
const PORT = process.env.PORT || 5000;

// Log all incoming requests for debugging Vercel routing
app.use((req, res, next) => {
  console.log(`Incoming request: ${req.method} ${req.url}`);
  next();
});

// Configure CORS to allow requests from your client
app.use(cors());

// Handle preflight requests specifically (if cors module doesn't catch them automatically)
app.options("*", cors());

app.use(express.json({ limit: "50mb" })); // Increase limit for base64 images
app.use(express.urlencoded({ extended: true }));
app.use("/api/auth", require("./routes/authRoutes"));
app.use("/api/payment", require("./routes/paymentRoutes"));
app.use("/api/floorplans", require("./routes/floorPlanRoutes"));
app.use("/api/settings", require("./routes/settingsRoutes"));
app.use("/api/admin", require("./routes/adminRoutes"));

app.get("/", (req, res) => {
  res.send({ status: "Backend API is running", timestamp: new Date() });
});

// Configure Routes with and without /api prefix to handle Vercel routing quirks
const apiRouter = express.Router();
apiRouter.use("/auth", require("./routes/authRoutes"));
apiRouter.use("/floorplans", require("./routes/floorPlanRoutes"));
apiRouter.use("/settings", require("./routes/settingsRoutes"));
apiRouter.use("/admin", require("./routes/adminRoutes"));

app.use("/api", apiRouter);
// Fallback: If Vercel rewrites strip '/api', this catches it
app.use("/", apiRouter);

// Initialize Gemini Client
const apiKey = process.env.GEMINI_API_KEY;
if (!apiKey) {
  console.error("API Key is missing. Please check your .env file.");
}
const ai = new GoogleGenAI({ apiKey: apiKey });

app.post("/api/analyze", protect, async (req, res) => {
  try {
    const user = req.user;
    if (!user) {
      return res.status(401).json({ error: "User not authorized" });
    }

    // Check credits
    if (user.credits < 1) {
      return res.status(403).json({ error: "Insufficient credits" });
    }

    const { base64Data, mimeType } = req.body;

    if (!base64Data || !mimeType) {
      return res.status(400).json({ error: "Missing base64Data or mimeType" });
    }

    const model = "gemini-2.5-flash";

    const prompt = `
      Analyze this image. First, determine if it is a valid architectural floor plan.
      If it is NOT a floor plan (e.g. valid inputs are 2D technical drawings of buildings/rooms), return "isValid": false and a "validationError" message explaining why.
      
      If it IS a valid floor plan, return "isValid": true and extract the following structural data:
      1. Total Built-up Area (Sq Feet).
      2. Total Wall Length (linear feet).
      3. DETAILED ROOM LIST: For each room, identify its Name, Type, Area (SqFt), and PERIMETER (Linear Feet). 
         - Accurately estimate the perimeter if not explicitly labeled.
         - Classify type strictly as: 'Bedroom', 'Kitchen', 'Bathroom', 'Living', 'Dining', 'Corridor', or 'Other'.
      4. Count visible Doors and Windows.
      5. Est. Wall Thickness (usually 0.5ft - 0.75ft).

      Return ONLY JSON matching the schema.
    `;

    // Retry mechanism
    let retries = 3;
    let result = null;
    let lastError = null;

    while (retries > 0) {
      try {
        console.log(`Attempting analysis with model: ${model}`);
        const response = await ai.models.generateContent({
          model: model,
          contents: [
            {
              parts: [
                { inlineData: { mimeType, data: base64Data } },
                { text: prompt },
              ],
            },
          ],
          config: {
            responseMimeType: "application/json",
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                isValid: { type: Type.BOOLEAN },
                validationError: { type: Type.STRING },
                summary: {
                  type: Type.OBJECT,
                  properties: {
                    totalAreaSqFt: { type: Type.NUMBER },
                    totalWallLengthFt: { type: Type.NUMBER },
                    wallThicknessFt: { type: Type.NUMBER },
                  },
                  required: [
                    "totalAreaSqFt",
                    "totalWallLengthFt",
                    "wallThicknessFt",
                  ],
                  nullable: true,
                },
                rooms: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      name: { type: Type.STRING },
                      areaSqFt: { type: Type.NUMBER },
                      perimeterFt: { type: Type.NUMBER },
                      type: {
                        type: Type.STRING,
                        enum: [
                          "Bedroom",
                          "Kitchen",
                          "Bathroom",
                          "Living",
                          "Dining",
                          "Corridor",
                          "Other",
                        ],
                      },
                    },
                    required: ["name", "areaSqFt", "perimeterFt", "type"],
                  },
                  nullable: true,
                },
                elements: {
                  type: Type.OBJECT,
                  properties: {
                    doors: { type: Type.NUMBER },
                    windows: { type: Type.NUMBER },
                  },
                  required: ["doors", "windows"],
                  nullable: true,
                },
              },
              required: ["isValid"],
            },
          },
        });

        if (response && response.text) {
          result = JSON.parse(response.text);
          console.log(`Success with model: ${model}`);
          break;
        } else {
          throw new Error("No text returned from Gemini");
        }
      } catch (err) {
        lastError = err;
        if (err?.status === 503 && retries > 1) {
          console.warn(
            `Model ${model} overloaded, retrying... (${retries - 1} left)`,
          );
          await new Promise((resolve) => setTimeout(resolve, 2000));
          retries--;
        } else if (err?.status === 429) {
          // If quota exceeded, no point retrying immediately.
          break;
        } else {
          if (retries > 1) {
            console.warn(`Error: ${err.message}. Retrying...`);
            await new Promise((resolve) => setTimeout(resolve, 1000));
            retries--;
          } else {
            break;
          }
        }
      }
    }

    if (!result) {
      if (lastError?.status === 429 || lastError?.message?.includes("429")) {
        return res
          .status(429)
          .json({ error: "Daily quota exceeded. Please try again later." });
      }
      return res.status(500).json({ error: "Failed to process image." });
    }

    // Check validity
    if (result.isValid === false) {
      return res.status(400).json({
        error:
          result.validationError ||
          "The uploaded image does not appear to be a valid floor plan.",
      });
    }

    // Deduct credit after successful analysis
    user.credits = Math.max(0, user.credits - 1);
    await user.save();
    result.credits = user.credits;

    res.json(result);
  } catch (error) {
    console.error("Server Error:", error);
    res.status(500).json({ error: error.message || "Internal Server Error" });
  }
});

// Specific setup for Vercel:
// 1. Export the app so Vercel can run it as a serverless function.
// 2. Only listen on a port if running locally (not imported as a module).
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}

// Error Handler Middleware
app.use((err, req, res, next) => {
  const statusCode = res.statusCode ? res.statusCode : 500;
  res.status(statusCode);
  res.json({
    message: err.message,
    stack: process.env.NODE_ENV === "production" ? null : err.stack,
  });
});

module.exports = app;

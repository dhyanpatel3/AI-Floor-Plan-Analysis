const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const { GoogleGenAI, Type } = require("@google/genai");

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json({ limit: "50mb" })); // Increase limit for base64 images

// Initialize Gemini Client
const apiKey = process.env.GEMINI_API_KEY;
if (!apiKey) {
  console.error("API Key is missing. Please check your .env file.");
}
const ai = new GoogleGenAI({ apiKey: apiKey });

app.post("/api/analyze", async (req, res) => {
  try {
    const { base64Data, mimeType } = req.body;

    if (!base64Data || !mimeType) {
      return res.status(400).json({ error: "Missing base64Data or mimeType" });
    }

    const model = "gemini-2.5-flash";

    const prompt = `
      Analyze this construction floor plan image/PDF. 
      Act as a professional Quantity Surveyor.
      
      Extract the following structural data:
      1. Total Built-up Area (Sq Meters).
      2. Total Wall Length (linear meters).
      3. DETAILED ROOM LIST: For each room, identify its Name, Type, Area (SqM), and PERIMETER (Linear Meters). 
         - Accurately estimate the perimeter if not explicitly labeled.
         - Classify type strictly as: 'Bedroom', 'Kitchen', 'Bathroom', 'Living', 'Dining', 'Corridor', or 'Other'.
      4. Count visible Doors and Windows.
      5. Est. Wall Thickness (usually 0.15m - 0.23m).

      Return ONLY JSON matching the schema.
    `;

    // Retry mechanism
    let retries = 3;
    let result = null;

    while (retries > 0) {
      try {
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
                summary: {
                  type: Type.OBJECT,
                  properties: {
                    totalAreaSqM: { type: Type.NUMBER },
                    totalWallLengthM: { type: Type.NUMBER },
                    wallThicknessM: { type: Type.NUMBER },
                  },
                  required: [
                    "totalAreaSqM",
                    "totalWallLengthM",
                    "wallThicknessM",
                  ],
                },
                rooms: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      name: { type: Type.STRING },
                      areaSqM: { type: Type.NUMBER },
                      perimeterM: { type: Type.NUMBER },
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
                    required: ["name", "areaSqM", "perimeterM", "type"],
                  },
                },
                elements: {
                  type: Type.OBJECT,
                  properties: {
                    doors: { type: Type.NUMBER },
                    windows: { type: Type.NUMBER },
                  },
                  required: ["doors", "windows"],
                },
              },
              required: ["summary", "rooms", "elements"],
            },
          },
        });

        if (response && response.text) {
          result = JSON.parse(response.text);
        } else {
          throw new Error("No text returned from Gemini");
        }
        break;
      } catch (err) {
        if (err?.status === 503 && retries > 1) {
          console.warn(`Model overloaded, retrying... (${retries - 1} left)`);
          await new Promise((resolve) => setTimeout(resolve, 2000));
          retries--;
        } else {
          throw err;
        }
      }
    }

    if (!result) {
      return res
        .status(500)
        .json({ error: "Failed to process image after retries." });
    }

    res.json(result);
  } catch (error) {
    console.error("Server Error:", error);
    res.status(500).json({ error: error.message || "Internal Server Error" });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

import { GoogleGenAI, Type } from "@google/genai";
import { AnalysisResult } from "../types";

// Initialize Gemini Client
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      const result = reader.result as string;
      const base64 = result.split(",")[1];
      resolve(base64);
    };
    reader.onerror = (error) => reject(error);
  });
};

export const analyzeFloorPlan = async (file: File): Promise<AnalysisResult> => {
  const base64Data = await fileToBase64(file);
  const mimeType = file.type;
  const model = "gemini-3-pro-preview"; 

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

  try {
    const response = await ai.models.generateContent({
      model: model,
      contents: {
        parts: [
          { inlineData: { mimeType, data: base64Data } },
          { text: prompt },
        ],
      },
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
              required: ["totalAreaSqM", "totalWallLengthM", "wallThicknessM"],
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
                    enum: ['Bedroom', 'Kitchen', 'Bathroom', 'Living', 'Dining', 'Corridor', 'Other'] 
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

    if (response.text) {
      return JSON.parse(response.text) as AnalysisResult;
    } else {
      throw new Error("No data returned from AI");
    }
  } catch (error) {
    console.error("Gemini Analysis Failed:", error);
    throw error;
  }
};

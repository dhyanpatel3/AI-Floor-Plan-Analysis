import { AnalysisResult } from "../types";

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

  // Get token from local storage
  let token = "";
  const userStr = localStorage.getItem("user");
  if (userStr) {
    try {
      const user = JSON.parse(userStr);
      token = user.token;
    } catch (e) {
      console.error("Error parsing user token", e);
    }
  }

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  try {
    const response = await fetch(
      `${import.meta.env.VITE_API_URL || ""}/api/analyze`,
      {
        method: "POST",
        headers,
        body: JSON.stringify({ base64Data, mimeType }),
      },
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `Server error: ${response.status}`);
    }

    const data = await response.json();
    return data as AnalysisResult;
  } catch (error) {
    console.error("Analysis Failed:", error);
    throw error;
  }
};

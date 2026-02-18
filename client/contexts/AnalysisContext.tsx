import React, {
  createContext,
  useState,
  ReactNode,
  useContext,
  useEffect,
} from "react";
import { AnalysisResult, ProjectSettings } from "../types";
import AuthContext from "./AuthContext";

interface AnalysisContextType {
  file: File | null;
  setFile: (file: File | null) => void;
  previewUrl: string | null;
  setPreviewUrl: (url: string | null) => void;
  rawAnalysis: AnalysisResult | null;
  setRawAnalysis: (analysis: AnalysisResult | null) => void;
  calibrationArea: string;
  setCalibrationArea: (area: string) => void;
  currentView: "overview" | "rooms" | "boq";
  setCurrentView: (view: "overview" | "rooms" | "boq") => void;
  settings: ProjectSettings;
  setSettings: React.Dispatch<React.SetStateAction<ProjectSettings>>;
  customRates: Record<string, number>;
  setCustomRates: React.Dispatch<React.SetStateAction<Record<string, number>>>;
  customQuantities: Record<string, number>;
  setCustomQuantities: React.Dispatch<
    React.SetStateAction<Record<string, number>>
  >;
  areaUnit: "sqm" | "sqft";
  setAreaUnit: (unit: "sqm" | "sqft") => void;
  resetAnalysis: () => void;
}

const AnalysisContext = createContext<AnalysisContextType | undefined>(
  undefined,
);

export const AnalysisProvider = ({ children }: { children: ReactNode }) => {
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [rawAnalysis, setRawAnalysis] = useState<AnalysisResult | null>(null);
  const [calibrationArea, setCalibrationArea] = useState<string>("");
  const [currentView, setCurrentView] = useState<"overview" | "rooms" | "boq">(
    "overview",
  );

  const [settings, setSettings] = useState<ProjectSettings>({
    currency: "INR",
    wallHeightFt: 10,
    brickSize: "standard",
  });

  const [customRates, setCustomRates] = useState<Record<string, number>>({});
  const [customQuantities, setCustomQuantities] = useState<
    Record<string, number>
  >({});
  const [areaUnit, setAreaUnit] = useState<"sqm" | "sqft">("sqft");

  const resetAnalysis = () => {
    setFile(null);
    setPreviewUrl(null);
    setRawAnalysis(null);
    setCalibrationArea("");
    setCurrentView("overview");
    setCustomQuantities({});
  };

  const { user } = useContext(AuthContext) || {};
  
  // Track user ID to handle user switching correctly.
  // We use user._id because the auth context defines it as _id (MongoDB style).
  // This prevents the analysis from resetting when only credits update.
  const userId = user?._id || user?.id;

  useEffect(() => {
    // If no user ID (logged out or not logged in), clear analysis state.
    if (!userId) {
      resetAnalysis();
    }
  }, [userId]); 

  return (
    <AnalysisContext.Provider
      value={{
        file,
        setFile,
        previewUrl,
        setPreviewUrl,
        rawAnalysis,
        setRawAnalysis,
        calibrationArea,
        setCalibrationArea,
        currentView,
        setCurrentView,
        settings,
        setSettings,
        customRates,
        setCustomRates,
        customQuantities,
        setCustomQuantities,
        areaUnit,
        setAreaUnit,
        resetAnalysis,
      }}
    >
      {children}
    </AnalysisContext.Provider>
  );
};

export const useAnalysis = () => {
  const context = useContext(AnalysisContext);
  if (context === undefined) {
    throw new Error("useAnalysis must be used within an AnalysisProvider");
  }
  return context;
};

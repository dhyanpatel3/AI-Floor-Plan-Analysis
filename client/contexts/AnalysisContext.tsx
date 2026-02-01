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
    wallHeightM: 3.0,
    brickSize: "standard",
  });

  const [customRates, setCustomRates] = useState<Record<string, number>>({});
  const [customQuantities, setCustomQuantities] = useState<
    Record<string, number>
  >({});
  const [areaUnit, setAreaUnit] = useState<"sqm" | "sqft">("sqm");

  const resetAnalysis = () => {
    setFile(null);
    setPreviewUrl(null);
    setRawAnalysis(null);
    setCalibrationArea("");
    setCurrentView("overview");
    setCustomQuantities({});
  };

  const { user } = useContext(AuthContext) || {};

  // Reset analysis when user authentication state changes (login/logout/signup)
  useEffect(() => {
    // This allows clearing data when a user logs out (user becomes null)
    // or when a new user logs in (user object changes).
    // The initial load might trigger this if user starts as null, which is fine (starts empty).
    resetAnalysis();
  }, [user]);

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

import React, { useState, useMemo } from "react";
import { analyzeFloorPlan } from "./services/geminiService";
import { AnalysisResult, MaterialCost, ProjectSettings } from "./types";
import {
  calculateMaterials,
  calculateRoomMaterials,
} from "./utils/calculationEngine";

// Components
import { Header } from "./components/Header";
import { FileUpload } from "./components/FileUpload";
import { CalibrationPanel } from "./components/CalibrationPanel";
import { StatsSummary } from "./components/StatsSummary";
import { ResultsDashboard } from "./components/ResultsDashboard";
import { BarChart3, Home, List } from "lucide-react";

function App() {
  // State
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [rawAnalysis, setRawAnalysis] = useState<AnalysisResult | null>(null);
  const [calibrationArea, setCalibrationArea] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const [currentView, setCurrentView] = useState<"overview" | "rooms" | "boq">(
    "overview"
  );
  const [isDarkMode, setIsDarkMode] = useState(false);

  const [settings, setSettings] = useState<ProjectSettings>({
    currency: "INR",
    wallHeightM: 3.0,
    brickSize: "standard",
  });

  // Effect to toggle dark class on html element
  React.useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [isDarkMode]);

  const toggleTheme = () => setIsDarkMode(!isDarkMode);

  const [customRates, setCustomRates] = useState<Record<string, number>>({});
  const [areaUnit, setAreaUnit] = useState<"sqm" | "sqft">("sqm");

  // Derived State: Calibrated Analysis
  const calibratedAnalysis = useMemo<AnalysisResult | null>(() => {
    if (!rawAnalysis) return null;
    const inputArea = parseFloat(calibrationArea);
    if (!calibrationArea || isNaN(inputArea) || inputArea <= 0)
      return rawAnalysis;

    const userAreaSqM = areaUnit === "sqft" ? inputArea / 10.7639 : inputArea;

    const scaleFactor = Math.sqrt(
      userAreaSqM / rawAnalysis.summary.totalAreaSqM
    );
    return {
      ...rawAnalysis,
      summary: {
        totalAreaSqM: userAreaSqM,
        totalWallLengthM: rawAnalysis.summary.totalWallLengthM * scaleFactor,
        wallThicknessM: rawAnalysis.summary.wallThicknessM,
      },
      rooms: rawAnalysis.rooms.map((r) => ({
        ...r,
        areaSqM: r.areaSqM * (scaleFactor * scaleFactor),
        perimeterM: (r.perimeterM || Math.sqrt(r.areaSqM) * 4) * scaleFactor,
      })),
    };
  }, [rawAnalysis, calibrationArea, areaUnit]);

  // Derived State: Global Structure Costs
  const globalStructureCosts = useMemo<MaterialCost[]>(() => {
    if (!calibratedAnalysis) return [];
    return calculateMaterials(calibratedAnalysis, settings, customRates);
  }, [calibratedAnalysis, settings, customRates]);

  // Combined Total Cost (Structure + Finishing of all rooms)
  const totalProjectCost = useMemo(() => {
    if (!calibratedAnalysis) return 0;
    const structureTotal = globalStructureCosts.reduce(
      (a, b) => a + b.totalCost,
      0
    );
    const roomsTotal = calibratedAnalysis.rooms.reduce((acc, room) => {
      return (
        acc + calculateRoomMaterials(room, settings, customRates).totalCost
      );
    }, 0);
    return structureTotal + roomsTotal;
  }, [globalStructureCosts, calibratedAnalysis, settings, customRates]);

  // Derived State: Consolidated Report (Simple Categories)
  const consolidatedReport = useMemo(() => {
    if (!calibratedAnalysis) return [];

    const categoryMap: Record<string, number> = {};

    // 1. Structure
    globalStructureCosts.forEach((item) => {
      const key =
        item.category === "Structure" || item.category === "Reinforcement"
          ? "Civil Structure"
          : item.category;
      categoryMap[key] = (categoryMap[key] || 0) + item.totalCost;
    });

    // 2. Finishing (Rooms)
    calibratedAnalysis.rooms.forEach((room) => {
      const roomDetails = calculateRoomMaterials(room, settings, customRates);
      roomDetails.materials.forEach((item) => {
        let key: string = item.category;
        // Simplify Categories
        if (item.category === "Finishing") {
          if (
            item.id.includes("floor") ||
            item.id.includes("tile") ||
            item.id.includes("granite")
          )
            key = "Flooring & Tiling";
          else if (
            item.id.includes("paint") ||
            item.id.includes("putty") ||
            item.id.includes("primer")
          )
            key = "Painting & Finish";
          else if (item.id.includes("door") || item.id.includes("window"))
            key = "Doors & Windows";
        } else if (item.category === "Services") key = "Electrical & Plumbing";
        else if (item.category === "Interiors") key = "Flooring & Tiling";

        categoryMap[key] = (categoryMap[key] || 0) + item.totalCost;
      });
    });

    return Object.entries(categoryMap)
      .map(([category, cost]) => ({ category, cost }))
      .sort((a, b) => b.cost - a.cost);
  }, [calibratedAnalysis, globalStructureCosts, settings, customRates]);

  // Handlers
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      setFile(selectedFile);
      const objectUrl = URL.createObjectURL(selectedFile);
      setPreviewUrl(objectUrl);
      setRawAnalysis(null);
      setCalibrationArea("");
      setError(null);
      setCustomRates({});
    }
  };

  const handleAnalyze = async () => {
    if (!file) return;
    setIsAnalyzing(true);
    setError(null);
    try {
      const result = await analyzeFloorPlan(file);
      setRawAnalysis(result);
      const area =
        areaUnit === "sqft"
          ? result.summary.totalAreaSqM * 10.7639
          : result.summary.totalAreaSqM;
      setCalibrationArea(area.toFixed(1));
    } catch (err: any) {
      setError(err.message || "Failed to analyze floor plan.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const clearFile = () => {
    setFile(null);
    setPreviewUrl(null);
    setRawAnalysis(null);
    setError(null);
  };

  const handleUnitChange = (newUnit: "sqm" | "sqft") => {
    const currentVal = parseFloat(calibrationArea);
    if (!isNaN(currentVal) && calibrationArea) {
      if (newUnit === "sqft" && areaUnit === "sqm") {
        setCalibrationArea((currentVal * 10.7639).toFixed(1));
      } else if (newUnit === "sqm" && areaUnit === "sqft") {
        setCalibrationArea((currentVal / 10.7639).toFixed(1));
      }
    }
    setAreaUnit(newUnit);
  };

  const handleRateUpdate = (id: string, newRate: number) => {
    setCustomRates((prev) => ({ ...prev, [id]: newRate }));
  };

  // Helper for currency
  const formatINR = (val: number) =>
    new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: settings.currency,
      maximumFractionDigits: 0,
    }).format(val);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-100 font-sans selection:bg-indigo-100 dark:selection:bg-indigo-900 selection:text-indigo-900 dark:selection:text-indigo-100 transition-colors duration-300">
      <Header isDarkMode={isDarkMode} toggleTheme={toggleTheme} />

      <main className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-fade-in text-slate-900 dark:text-slate-100">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* LEFT COLUMN: Sidebar Navigation & Tools */}
          <div className="lg:col-span-3 space-y-6 lg:sticky lg:top-24">
            {/* Navigation */}
            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden transition-all duration-300">
              <nav className="flex flex-col p-2 space-y-1">
                <button
                  onClick={() => setCurrentView("overview")}
                  className={`flex items-center px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                    currentView === "overview"
                      ? "bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400 border-l-4 border-indigo-600"
                      : "text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700/50 hover:text-indigo-600 dark:hover:text-indigo-400"
                  }`}
                >
                  <BarChart3 className="w-5 h-5 mr-3" />
                  Cost Overview
                </button>
                <button
                  onClick={() => setCurrentView("rooms")}
                  className={`flex items-center px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                    currentView === "rooms"
                      ? "bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400 border-l-4 border-indigo-600"
                      : "text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700/50 hover:text-indigo-600 dark:hover:text-indigo-400"
                  }`}
                >
                  <Home className="w-5 h-5 mr-3" />
                  Room Analysis
                </button>
                <button
                  onClick={() => setCurrentView("boq")}
                  className={`flex items-center px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                    currentView === "boq"
                      ? "bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400 border-l-4 border-indigo-600"
                      : "text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700/50 hover:text-indigo-600 dark:hover:text-indigo-400"
                  }`}
                >
                  <List className="w-5 h-5 mr-3" />
                  Full BOQ
                </button>
              </nav>
            </div>

            {/* Upload & Preview */}
            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-4 transition-all duration-300">
              <FileUpload
                file={file}
                previewUrl={previewUrl}
                isAnalyzing={isAnalyzing}
                error={error}
                onFileChange={handleFileChange}
                onAnalyze={handleAnalyze}
                onClear={clearFile}
              />
            </div>

            {calibratedAnalysis && (
              <CalibrationPanel
                calibrationArea={calibrationArea}
                setCalibrationArea={setCalibrationArea}
                areaUnit={areaUnit}
                setAreaUnit={handleUnitChange}
                settings={settings}
                setSettings={setSettings}
              />
            )}
          </div>

          {/* RIGHT COLUMN: Main Content */}
          <div className="lg:col-span-9 space-y-6">
            {!calibratedAnalysis ? (
              <div className="h-[600px] flex flex-col items-center justify-center bg-white dark:bg-slate-800 rounded-2xl border border-dashed border-slate-300 dark:border-slate-600 text-slate-400 dark:text-slate-500 p-8 text-center animate-fade-in transition-all duration-300">
                <div className="w-24 h-24 bg-slate-50 dark:bg-slate-700 rounded-full flex items-center justify-center mb-6 ring-1 ring-slate-100 dark:ring-slate-600">
                  <BarChart3 className="w-10 h-10 text-slate-300 dark:text-slate-500" />
                </div>
                <h3 className="text-xl font-medium text-slate-600 dark:text-slate-300 mb-3">
                  Ready to Estimate
                </h3>
                <p className="max-w-md mx-auto mb-8 text-lg">
                  Upload a construction floor plan on the left to generate
                  instant material quantity and cost estimates.
                </p>
              </div>
            ) : (
              <>
                {/* Stats Row */}
                <StatsSummary
                  analysis={calibratedAnalysis}
                  totalCost={totalProjectCost}
                  formatCurrency={formatINR}
                />

                {/* Dashboard View */}
                <ResultsDashboard
                  analysis={calibratedAnalysis}
                  globalStructureCosts={globalStructureCosts}
                  settings={settings}
                  customRates={customRates}
                  onRateUpdate={handleRateUpdate}
                  formatCurrency={formatINR}
                  consolidatedReport={consolidatedReport}
                  currentView={currentView}
                  onViewChange={setCurrentView}
                />
              </>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

export default App;

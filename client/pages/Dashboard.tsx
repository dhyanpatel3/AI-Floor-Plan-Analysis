import React, { useState, useMemo } from "react";
import { analyzeFloorPlan } from "../services/geminiService";
import { AnalysisResult, MaterialCost, ProjectSettings } from "../types";
import {
  calculateMaterials,
  calculateRoomMaterials,
} from "../utils/calculationEngine";
import { getMaterialDefaultRate } from "../constants/materials";
import { generatePDF } from "../utils/pdfGenerator";

// Components
import { Header } from "../components/Header";
import { FileUpload } from "../components/FileUpload";
import { CalibrationPanel } from "../components/CalibrationPanel";
import { StatsSummary } from "../components/StatsSummary";
import { ResultsDashboard } from "../components/ResultsDashboard";
import { Modal } from "../components/Modal";
import { BarChart3, Home, List, Save } from "lucide-react";
import AuthContext from "../contexts/AuthContext";
import floorPlanService from "../services/floorPlanService";
import settingsService from "../services/settingsService";
import { useAnalysis } from "../contexts/AnalysisContext";
import { toast } from "react-toastify";

interface DashboardProps {
  isDarkMode: boolean;
  toggleTheme: () => void;
}

function Dashboard({ isDarkMode, toggleTheme }: DashboardProps) {
  // Global Analysis State
  const {
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
  } = useAnalysis();

  // Local UI State
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const authContext = React.useContext(AuthContext);
  const { user } = authContext || {};

  // Fetch settings on load only if no active analysis session
  React.useEffect(() => {
    // If we already have an active analysis or file loaded, don't overwrite current session settings with DB defaults
    if (rawAnalysis || file) return;

    const fetchUserSettings = async () => {
      // Add a check to ensure user is fully loaded and token is valid
      if (user && user.token) {
        try {
          const res = await settingsService.fetchSettings(user.token);
          if (res) {
            if (res.projectSettings) {
              setSettings((prev) => ({ ...prev, ...res.projectSettings }));
            }
            if (res.customRates) {
              // Convert Map/Object to strict Record<string, number>
              setCustomRates(res.customRates);
            }
            if (res.customQuantities) {
              setCustomQuantities(res.customQuantities);
            }
          }
        } catch (err: any) {
          // If 401, it might mean the token is stale or invalid, we could logout or just ignore settings load
          if (err.response && err.response.status === 401) {
            console.warn(
              "Settings fetch unauthorized - likely session expired or invalid token.",
            );
          } else {
            console.error("Failed to fetch settings", err);
          }
        }
      }
    };
    fetchUserSettings();
  }, [user, rawAnalysis, file]);

  // Derived State: Calibrated Analysis
  const calibratedAnalysis = useMemo<AnalysisResult | null>(() => {
    if (!rawAnalysis) return null;
    const inputArea = parseFloat(calibrationArea);
    if (!calibrationArea || isNaN(inputArea) || inputArea <= 0)
      return rawAnalysis;

    const userAreaSqM = areaUnit === "sqft" ? inputArea / 10.7639 : inputArea;

    const scaleFactor = Math.sqrt(
      userAreaSqM / rawAnalysis.summary.totalAreaSqM,
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

  // Derived State: Base Global Structure Costs (Scientific)
  const baseStructureCosts = useMemo<MaterialCost[]>(() => {
    if (!calibratedAnalysis) return [];
    return calculateMaterials(calibratedAnalysis, settings, customRates);
  }, [calibratedAnalysis, settings, customRates]);

  // Derived State: Raw Calculated Quantities (Sum of Structure + Rooms)
  const calculatedQuantities = useMemo(() => {
    if (!calibratedAnalysis) return {};
    const quantities: Record<string, number> = {};

    // Add structure
    baseStructureCosts.forEach((item) => {
      quantities[item.id] = (quantities[item.id] || 0) + item.quantity;
    });

    // Add rooms
    calibratedAnalysis.rooms.forEach((room) => {
      const { materials } = calculateRoomMaterials(room, settings, customRates);
      materials.forEach((item) => {
        quantities[item.id] = (quantities[item.id] || 0) + item.quantity;
      });
    });
    return quantities;
  }, [baseStructureCosts, calibratedAnalysis, settings, customRates]);

  // Derived State: Scaling Factors (Custom / Calculated)
  const scalingFactors = useMemo(() => {
    const factors: Record<string, number> = {};
    Object.keys(calculatedQuantities).forEach((id) => {
      const calc = calculatedQuantities[id];
      const custom = customQuantities[id];
      if (custom !== undefined && calc > 0.0001) {
        // Avoid div by zero
        factors[id] = custom / calc;
      }
    });
    return factors;
  }, [calculatedQuantities, customQuantities]);

  // Derived State: Final Global Structure Costs (Applied Scaling)
  const globalStructureCosts = useMemo<MaterialCost[]>(() => {
    return baseStructureCosts.map((item) => {
      const factor = scalingFactors[item.id];
      const custom = customQuantities[item.id];

      if (factor !== undefined) {
        const newQty = item.quantity * factor;
        return { ...item, quantity: newQty, totalCost: newQty * item.unitRate };
      }
      return item;
    });
  }, [baseStructureCosts, scalingFactors, customQuantities]);

  // Combined Total Cost (Structure + Finishing of all rooms)
  const totalProjectCost = useMemo(() => {
    if (!calibratedAnalysis) return 0;

    // Use Aggregated methodology to support Overrides
    const allIds = new Set([
      ...Object.keys(calculatedQuantities),
      ...Object.keys(customQuantities),
    ]);
    let total = 0;

    allIds.forEach((id) => {
      const qty = customQuantities[id] ?? calculatedQuantities[id] ?? 0;
      const rate = customRates[id] ?? getMaterialDefaultRate(id);
      total += qty * rate;
    });

    return total;
  }, [calculatedQuantities, customQuantities, customRates, calibratedAnalysis]);

  // Derived State: Consolidated Report (Simple Categories)
  const consolidatedReport = useMemo(() => {
    if (!calibratedAnalysis) return [];

    const categoryMap: Record<string, number> = {};

    // Helper to categorize ID
    const getCategory = (id: string, defaultCat: string) => {
      if (defaultCat === "Structure" || defaultCat === "Reinforcement")
        return "Civil Structure";
      if (defaultCat === "Finishing") {
        if (
          id.includes("floor") ||
          id.includes("tile") ||
          id.includes("granite")
        )
          return "Flooring & Tiling";
        if (
          id.includes("paint") ||
          id.includes("putty") ||
          id.includes("primer")
        )
          return "Painting & Finish";
        if (id.includes("door") || id.includes("window"))
          return "Doors & Windows";
      }
      if (defaultCat === "Services") return "Electrical & Plumbing";
      if (defaultCat === "Interiors") return "Flooring & Tiling";
      return defaultCat;
    };

    // We must rebuild costs based on Final Quantities
    const allIds = new Set([
      ...Object.keys(calculatedQuantities),
      ...Object.keys(customQuantities),
    ]);

    // We need to know metadata for each ID (category) to group them.
    // We can infer it from the first occurrence in costs lists, or look it up in CATALOG.
    // But CATALOG is not imported here, only getMaterialDefaultRate.
    // However, we can use the `globalStructureCosts` and `calculateRoomMaterials` results to find category map.

    const idToCategoryMap: Record<string, string> = {};

    baseStructureCosts.forEach((i) => (idToCategoryMap[i.id] = i.category));
    // Scan one room to populate map for room items
    if (calibratedAnalysis.rooms.length > 0) {
      const { materials } = calculateRoomMaterials(
        calibratedAnalysis.rooms[0],
        settings,
        customRates,
      );
      materials.forEach((i) => (idToCategoryMap[i.id] = i.category));
      // Scan other rooms if types differ (e.g. Bathroom has plumbing, Bedroom doesn't)
      // Just scan all rooms to be safe or use CATALOG if I imported it.
      // Using the loop below is safer.
      calibratedAnalysis.rooms.forEach((r) => {
        calculateRoomMaterials(r, settings, customRates).materials.forEach(
          (i) => {
            idToCategoryMap[i.id] = i.category;
          },
        );
      });
    }

    allIds.forEach((id) => {
      const qty = customQuantities[id] ?? calculatedQuantities[id] ?? 0;
      const rate = customRates[id] ?? getMaterialDefaultRate(id); // Use custom rate or default
      const cost = qty * rate;

      const rawCat = idToCategoryMap[id] || "Other";
      const key = getCategory(id, rawCat);

      categoryMap[key] = (categoryMap[key] || 0) + cost;
    });

    return Object.entries(categoryMap)
      .map(([category, cost]) => ({ category, cost }))
      .sort((a, b) => b.cost - a.cost);
  }, [
    calculatedQuantities,
    customQuantities,
    customRates,
    calibratedAnalysis,
    baseStructureCosts,
    settings,
  ]);

  // Handlers
  const handleSaveSettings = async () => {
    if (!user) {
      toast.error("Please login to save settings");
      return;
    }

    // Safety check for token
    if (!user.token) {
      toast.error("Authentication error. Please login again.");
      return;
    }

    try {
      await settingsService.saveSettings(user.token, {
        projectSettings: settings,
        customRates,
        customQuantities,
      });
      toast.success("Settings saved successfully!");
      setIsSettingsOpen(false);
    } catch (err: any) {
      console.error("Save settings error:", err);
      toast.error(
        err.response?.data?.message || err.message || "Failed to save settings",
      );
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      setFile(selectedFile);
      const objectUrl = URL.createObjectURL(selectedFile);
      setPreviewUrl(objectUrl);
      setRawAnalysis(null);
      setCalibrationArea("");
      setError(null);
      // We do not clear customRates or customQuantities here.
      // They are persisted settings or session preferences.
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

  const handleSaveToProfile = async () => {
    // Save calibrated analysis if available (user adjusted it), otherwise raw
    const analysisToSave = calibratedAnalysis || rawAnalysis;

    if (!file || !analysisToSave) return;
    if (!user) {
      toast.error("Please login to save floor plan");
      return;
    }

    // Capture the current state of cost estimation
    const costEstimationData = {
      globalStructureCosts,
      consolidatedReport,
      totalProjectCost,
      customRates,
      // Any other calculated data we want to persist
      generatedAt: new Date().toISOString(),
    };

    setIsSaving(true);
    try {
      await floorPlanService.saveFloorPlan(
        file,
        analysisToSave,
        costEstimationData,
        user.token,
      );
      toast.success("Floor plan and cost estimation saved to profile!");
    } catch (error: any) {
      toast.error(error.message || "Failed to save floor plan");
    } finally {
      setIsSaving(false);
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

  const handleQuantityUpdate = (id: string, newQty: number) => {
    setCustomQuantities((prev) => ({ ...prev, [id]: newQty }));
  };

  const handleDownloadPDF = () => {
    if (!calibratedAnalysis) return;

    generatePDF({
      analysis: calibratedAnalysis,
      consolidatedReport,
      calculatedQuantities,
      customQuantities,
      customRates,
      totalCost: totalProjectCost,
      settings,
      areaUnit,
      calibrationArea,
    });
  };

  // Helper for currency
  const formatINR = (val: number) =>
    new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: settings.currency,
      maximumFractionDigits: 0,
    }).format(val);

  return (
    <div className="h-screen flex flex-col bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-100 font-sans selection:bg-indigo-100 dark:selection:bg-indigo-900 selection:text-indigo-900 dark:selection:text-indigo-100 transition-colors duration-300 overflow-hidden">
      <Header
        isDarkMode={isDarkMode}
        toggleTheme={toggleTheme}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onDownloadPDF={calibratedAnalysis ? handleDownloadPDF : undefined}
        onSaveProfile={calibratedAnalysis ? handleSaveToProfile : undefined}
        isSaving={isSaving}
      />

      <main className="flex-1 w-full max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-6 overflow-hidden">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-full">
          {/* LEFT COLUMN: Sidebar Navigation & Tools */}
          <div className="lg:col-span-3 flex flex-col gap-6 h-full overflow-hidden">
            {/* Navigation */}
            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden transition-all duration-300 shrink-0">
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
            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-4 transition-all duration-300 flex-1 overflow-y-auto lg:overflow-visible custom-scrollbar">
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
          </div>

          {/* RIGHT COLUMN: Main Content */}
          <div className="lg:col-span-9 flex flex-col gap-6 h-full overflow-hidden">
            {!calibratedAnalysis ? (
              <div className="flex-1 flex flex-col items-center justify-center bg-white dark:bg-slate-800 rounded-2xl border border-dashed border-slate-300 dark:border-slate-600 text-slate-400 dark:text-slate-500 p-8 text-center animate-fade-in transition-all duration-300">
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
                <div className="shrink-0">
                  <StatsSummary
                    analysis={calibratedAnalysis}
                    totalCost={totalProjectCost}
                    formatCurrency={formatINR}
                    areaUnit={areaUnit}
                  />
                </div>

                {/* Dashboard View */}
                <div className="flex-1 overflow-hidden">
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
                    areaUnit={areaUnit}
                    scalingFactors={scalingFactors}
                  />
                </div>
              </>
            )}
          </div>
        </div>
      </main>

      <Modal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        title="Project Settings"
      >
        <div className="flex flex-col h-full">
          <div className="flex-1 overflow-y-auto custom-scrollbar">
            <CalibrationPanel
              calibrationArea={calibrationArea}
              setCalibrationArea={setCalibrationArea}
              areaUnit={areaUnit}
              setAreaUnit={handleUnitChange}
              settings={settings}
              setSettings={setSettings}
              variant="clean"
              customRates={customRates}
              onRateUpdate={handleRateUpdate}
              calculatedQuantities={calculatedQuantities}
              customQuantities={customQuantities}
              onQuantityUpdate={handleQuantityUpdate}
            />
          </div>
          <div className="p-4 border-t border-slate-200 dark:border-slate-700 flex justify-end gap-3 bg-white dark:bg-slate-800 shrink-0">
            <button
              onClick={() => setIsSettingsOpen(false)}
              className="px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSaveSettings}
              className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-sm transition-colors flex items-center gap-2"
            >
              <Save className="w-4 h-4" />
              Save Settings
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

export default Dashboard;

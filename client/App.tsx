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
import { BarChart3 } from "lucide-react";

function App() {
  // State
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [rawAnalysis, setRawAnalysis] = useState<AnalysisResult | null>(null);
  const [calibrationArea, setCalibrationArea] = useState<string>("");
  const [error, setError] = useState<string | null>(null);

  const [settings, setSettings] = useState<ProjectSettings>({
    currency: "INR",
    wallHeightM: 3.0,
    brickSize: "standard",
  });

  const [customRates, setCustomRates] = useState<Record<string, number>>({});

  // Derived State: Calibrated Analysis
  const calibratedAnalysis = useMemo<AnalysisResult | null>(() => {
    if (!rawAnalysis) return null;
    const userArea = parseFloat(calibrationArea);
    if (!calibrationArea || isNaN(userArea) || userArea <= 0)
      return rawAnalysis;

    const scaleFactor = Math.sqrt(userArea / rawAnalysis.summary.totalAreaSqM);
    return {
      ...rawAnalysis,
      summary: {
        totalAreaSqM: userArea,
        totalWallLengthM: rawAnalysis.summary.totalWallLengthM * scaleFactor,
        wallThicknessM: rawAnalysis.summary.wallThicknessM,
      },
      rooms: rawAnalysis.rooms.map((r) => ({
        ...r,
        areaSqM: r.areaSqM * (scaleFactor * scaleFactor),
        perimeterM: (r.perimeterM || Math.sqrt(r.areaSqM) * 4) * scaleFactor,
      })),
    };
  }, [rawAnalysis, calibrationArea]);

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
      setCalibrationArea(result.summary.totalAreaSqM.toFixed(1));
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
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans selection:bg-indigo-100 selection:text-indigo-900">
      <Header />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-fade-in">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* LEFT COLUMN: Input & Settings */}
          <div className="lg:col-span-4 space-y-6 lg:sticky lg:top-24">
            <FileUpload
              file={file}
              previewUrl={previewUrl}
              isAnalyzing={isAnalyzing}
              error={error}
              onFileChange={handleFileChange}
              onAnalyze={handleAnalyze}
              onClear={clearFile}
            />

            {calibratedAnalysis && (
              <CalibrationPanel
                calibrationArea={calibrationArea}
                setCalibrationArea={setCalibrationArea}
                settings={settings}
                setSettings={setSettings}
              />
            )}
          </div>

          {/* RIGHT COLUMN: Results */}
          <div className="lg:col-span-8 space-y-6">
            {!calibratedAnalysis ? (
              <div className="h-[500px] flex flex-col items-center justify-center bg-white rounded-2xl border border-dashed border-slate-300 text-slate-400 p-8 text-center animate-fade-in">
                <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mb-4 ring-1 ring-slate-100">
                  <BarChart3 className="w-8 h-8 text-slate-300" />
                </div>
                <h3 className="text-lg font-medium text-slate-600 mb-2">
                  Ready to Estimate
                </h3>
                <p className="max-w-xs mx-auto mb-6">
                  Upload a construction floor plan on the left to generate
                  instant material quantity and cost estimates.
                </p>
                <div className="flex gap-2 justify-center">
                  <span className="w-2 h-2 rounded-full bg-slate-200"></span>
                  <span className="w-2 h-2 rounded-full bg-slate-200"></span>
                  <span className="w-2 h-2 rounded-full bg-slate-200"></span>
                </div>
              </div>
            ) : (
              <>
                <StatsSummary
                  analysis={calibratedAnalysis}
                  totalCost={totalProjectCost}
                  formatCurrency={formatINR}
                />

                <ResultsDashboard
                  analysis={calibratedAnalysis}
                  globalStructureCosts={globalStructureCosts}
                  settings={settings}
                  customRates={customRates}
                  onRateUpdate={handleRateUpdate}
                  formatCurrency={formatINR}
                  consolidatedReport={consolidatedReport}
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

import React, { useState, useMemo } from "react";
import { analyzeFloorPlan } from "../services/geminiService";
import { AnalysisResult, MaterialCost, ProjectSettings } from "../types";
import {
  calculateMaterials,
  calculateRoomMaterials,
} from "../utils/calculationEngine";
import {
  getMaterialDefaultRate,
  MATERIAL_CATALOG,
} from "../constants/materials";
import { generatePDF } from "../utils/pdfGenerator";

// Components
import { Header } from "../components/Header";
import { FileUpload } from "../components/FileUpload";
import { CalibrationPanel } from "../components/CalibrationPanel";
import { StatsSummary } from "../components/StatsSummary";
import { ResultsDashboard } from "../components/ResultsDashboard";
import { Modal } from "../components/Modal";
import LoginModal from "../components/LoginModal";
import {
  BarChart3,
  Home,
  List,
  Save,
  Ruler,
  Plus,
  ArrowRight,
  Clock,
  LayoutDashboard,
} from "lucide-react";
import AuthContext from "../contexts/AuthContext";
import floorPlanService from "../services/floorPlanService";
import settingsService from "../services/settingsService";
import { useAnalysis } from "../contexts/AnalysisContext";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";
import Swal from "sweetalert2";

interface DashboardProps {
  isDarkMode: boolean;
  toggleTheme: () => void;
}

function Dashboard({ isDarkMode, toggleTheme }: DashboardProps) {
  const navigate = useNavigate();
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
  const [isExporting, setIsExporting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Save Modal State
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [isSaveModalOpen, setIsSaveModalOpen] = useState(false);
  const [planName, setPlanName] = useState("");

  // Home Dashboard State
  const [recentPlans, setRecentPlans] = useState<any[]>([]);
  const [totalProjects, setTotalProjects] = useState(0);
  const [showUpload, setShowUpload] = useState(false);
  const [isLoadingRecent, setIsLoadingRecent] = useState(true);

  const authContext = React.useContext(AuthContext);
  const { user } = authContext || {};

  // Fetch recent plans
  React.useEffect(() => {
    // Only fetch if we are on the home view (no upload active, no analysis data)
    if (showUpload || rawAnalysis) return;

    const fetchRecent = async () => {
      if (user?.token) {
        try {
          const plans = await floorPlanService.getUserFloorPlans(user.token);
          setTotalProjects(plans.length);
          setRecentPlans(plans.slice(0, 3));
        } catch (e) {
          console.error("Failed to fetch recent plans", e);
        } finally {
          setIsLoadingRecent(false);
        }
      } else {
        setIsLoadingRecent(false);
      }
    };
    fetchRecent();
  }, [user, showUpload, rawAnalysis]);
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
              // Convert Map/Object to strict Record<string, number> and Clean defaults
              const cleanRates: Record<string, number> = {};
              Object.entries(res.customRates).forEach(([key, val]) => {
                const numVal = Number(val);
                // Filter out 0s (treat as unset) AND system defaults
                const defaultRate = getMaterialDefaultRate(key);
                if (numVal > 0 && numVal !== defaultRate) {
                  cleanRates[key] = numVal;
                }
              });
              setCustomRates(cleanRates);
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
    try {
      const inputArea = parseFloat(calibrationArea);
      if (!calibrationArea || isNaN(inputArea) || inputArea <= 0)
        return rawAnalysis;

      const userAreaSqFt = inputArea; // Always Ft

      // Handle case where rawAnalysis might be old format (optional safety or just assume new)
      const summary = rawAnalysis.summary || {};
      const rawTotalArea =
        summary.totalAreaSqFt ||
        (summary.totalAreaSqM ? summary.totalAreaSqM * 10.764 : 1000);

      // Prevent division by zero if rawTotalArea is 0
      const safeRawTotalArea = rawTotalArea > 0 ? rawTotalArea : 1000;

      const scaleFactor = Math.sqrt(userAreaSqFt / safeRawTotalArea);

      const rooms = Array.isArray(rawAnalysis.rooms) ? rawAnalysis.rooms : [];

      return {
        ...rawAnalysis,
        summary: {
          ...summary,
          totalAreaSqFt: userAreaSqFt,
          totalWallLengthFt: (summary.totalWallLengthFt || 0) * scaleFactor,
          wallThicknessFt: summary.wallThicknessFt,
        },
        rooms: rooms.map((r) => ({
          ...r,
          areaSqFt: (r.areaSqFt || 0) * (scaleFactor * scaleFactor),
          perimeterFt:
            (r.perimeterFt || 0 || Math.sqrt(r.areaSqFt || 0) * 4) *
            scaleFactor,
        })),
      };
    } catch (e) {
      console.error("Error in calibration logic", e);
      return rawAnalysis || null;
    }
  }, [rawAnalysis, calibrationArea]);

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
    if (!user) {
      setIsLoginModalOpen(true);
      // Clear input value so selecting same file again works
      e.target.value = "";
      return;
    }
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

    // Check credits for authenticated users
    // Only block if we KNOW credits are <= 0. If undefined, let server decide (it returns 403).
    if (user && user.credits !== undefined && user.credits <= 0) {
      toast.error("Insufficient credits. Please upgrade to continue.");
      navigate("/pricing");
      return;
    }

    setIsAnalyzing(true);
    setError(null);
    try {
      const result: any = await analyzeFloorPlan(file);

      // Early exit if result is null/undefined
      if (!result) {
        throw new Error("Analysis result is empty.");
      }

      // Update credits from response if available
      if (user && result.credits !== undefined) {
        if (authContext && authContext.updateCredits) {
          authContext.updateCredits(result.credits);
        }
      }

      // Calculate area before setting rawAnalysis
      const summary = result.summary || {};
      const areaM =
        summary.totalAreaSqM ||
        (summary.totalAreaSqFt ? summary.totalAreaSqFt / 10.764 : 0);
      const area =
        areaUnit === "sqft" ? summary.totalAreaSqFt || areaM * 10.764 : areaM;

      const safeArea =
        area && !isNaN(area) ? area : summary.totalAreaSqFt || 1000;

      // Update state in specific order: calibration area first, then raw analysis which triggers memo
      setCalibrationArea(safeArea.toFixed(1));

      // Wait a tick to ensure parsing has time? No, react batches.
      setRawAnalysis(result);

      // Force scroll to top if needed?
      // But we just want to switch views.
    } catch (err: any) {
      console.error("Analysis Failed:", err);
      if (err.message && err.message.includes("403")) {
        toast.error("Insufficient credits.");
        navigate("/pricing");
      } else {
        const errorMsg = err.message || "Failed to analyze floor plan.";
        setError(errorMsg);

        // Show prominent alert for invalid floor plans or other analysis errors
        Swal.fire({
          icon: "error",
          title: "Analysis Failed",
          text: errorMsg,
          confirmButtonColor: "#4f46e5",
        });
      }
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleSaveToProfile = () => {
    if (!file || !rawAnalysis) return;
    if (!user) {
      toast.error("Please login to save floor plan");
      return;
    }
    setPlanName("");
    setIsSaveModalOpen(true);
  };

  const performSave = async () => {
    // Save calibrated analysis if available (user adjusted it), otherwise raw
    const analysisToSave = calibratedAnalysis || rawAnalysis;

    if (!file || !analysisToSave) return;
    if (!user) {
      toast.error("Please login to save floor plan");
      return;
    }

    if (!planName.trim()) {
      toast.error("Please enter a name for the project");
      return;
    }

    setIsSaveModalOpen(false);

    // Calculate all data needed for storage
    // 1. Calculate Per-Room Costs
    const roomCosts = calibratedAnalysis.rooms.map((room) => {
      const result = calculateRoomMaterials(room, settings, customRates);

      // Apply scaling
      const scaledMaterials = result.materials.map((item) => {
        const factor = scalingFactors[item.id];
        if (factor !== undefined) {
          const newQty = item.quantity * factor;
          return {
            ...item,
            quantity: newQty,
            totalCost: newQty * item.unitRate,
          };
        }
        return item;
      });

      const newTotal = scaledMaterials.reduce(
        (acc, curr) => acc + curr.totalCost,
        0,
      );
      return { ...result, materials: scaledMaterials, totalCost: newTotal };
    });

    // 2. Calculate Full BOQ
    const combinedBOQMap = new Map<string, MaterialCost>();
    // Add Global Structure
    globalStructureCosts.forEach((m) => {
      if (combinedBOQMap.has(m.id)) {
        const ex = combinedBOQMap.get(m.id)!;
        combinedBOQMap.set(m.id, {
          ...ex,
          quantity: ex.quantity + m.quantity,
          totalCost: ex.totalCost + m.totalCost,
        });
      } else {
        combinedBOQMap.set(m.id, { ...m });
      }
    });

    // Add Rooms
    roomCosts.forEach((r) => {
      r.materials.forEach((m) => {
        if (combinedBOQMap.has(m.id)) {
          const ex = combinedBOQMap.get(m.id)!;
          combinedBOQMap.set(m.id, {
            ...ex,
            quantity: ex.quantity + m.quantity,
            totalCost: ex.totalCost + m.totalCost,
          });
        } else {
          combinedBOQMap.set(m.id, { ...m });
        }
      });
    });
    const fullBOQ = Array.from(combinedBOQMap.values());

    // Capture the current state of cost estimation
    const costEstimationData = {
      globalStructureCosts,
      consolidatedReport,
      totalProjectCost,
      customRates,
      customQuantities,
      settings,
      calibrationArea,
      // areaUnit removed
      calculatedQuantities,
      baseStructureCosts,
      scalingFactors,
      roomCosts,
      fullBOQ,
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
        planName,
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
    // Don't hide the upload view, just reset the file
    // setShowUpload(false);
  };

  const handleLoadPlan = (plan: any) => {
    setPreviewUrl(plan.imageUrl);
    // Setting rawAnalysis triggers the view switch because calibratedAnalysis becomes derived
    setRawAnalysis(plan.analysisResult);

    // Restore saved context
    if (plan.costEstimation) {
      if (plan.costEstimation.calibrationArea) {
        setCalibrationArea(plan.costEstimation.calibrationArea);
      }
      if (plan.costEstimation.settings) {
        setSettings((prev) => ({ ...prev, ...plan.costEstimation.settings }));
      }
      if (plan.costEstimation.customRates) {
        setCustomRates(plan.costEstimation.customRates);
      }
      if (plan.costEstimation.customQuantities) {
        setCustomQuantities(plan.costEstimation.customQuantities);
      }
    }
  };

  const handleRateUpdate = (id: string, newRate: number) => {
    setCustomRates((prev) => {
      // If rate is 0, remove it from overrides to let system default apply
      if (newRate === 0) {
        const { [id]: _, ...rest } = prev;
        return rest;
      }
      return { ...prev, [id]: newRate };
    });
  };

  const handleQuantityUpdate = (id: string, newQuantity: number) => {
    // If we are in "Room View", we might need more complex logic to reverse-engineer the global quantity.
    // For now, let's assume direct edits are overrides for the GLOBAL total if in BOQ/Overview.
    // However, if we are in Room View, editing 'Quantity' for a room item only affects that room?
    // The current state model: customQuantities is a map { materialId: TOTAL_QUANTITY }.
    // It scales everything proportionally.
    // We cannot easily set quantity for just one room without a more complex state (e.g. room-specific overrides).
    // Given the constraints and likely user intent (adjusting BOQ), let's implement global override behavior.

    // CAUTION: If user edits quantity in a Room View, they might be expecting to change ONLY that room.
    // But currently backend logic scales everything globally.
    // To support "Edit what you see", we need to know the context.
    // But CostTable doesn't pass context.

    // Simplest approach: Update customQuantities directly.
    // If the user expects to see 100 in the room, and we force the global total to be such that the room is 100...
    // That requires: globalTotal = (desiredRoomQty / currentRoomQty) * currentGlobalTotal
    // We don't have enough info here easily.

    // Let's implement direct global override first, as it's the primary mechanism.
    setCustomQuantities((prev) => {
      if (newQuantity < 0) {
        const { [id]: _, ...rest } = prev;
        return rest;
      }
      return { ...prev, [id]: newQuantity };
    });
  };

  const handleDownloadPDF = async () => {
    if (!calibratedAnalysis) return;

    setIsExporting(true);
    // Give UI a moment to update and show loader
    await new Promise((resolve) => setTimeout(() => resolve(null), 100));

    try {
      await generatePDF({
        analysis: calibratedAnalysis,
        consolidatedReport,
        calculatedQuantities,
        customQuantities,
        customRates,
        totalCost: totalProjectCost,
        settings,
        calibrationArea,
        companyDetails: user
          ? {
              name: user.companyName,
              address: user.companyAddress,
              phone: user.companyPhone,
              logo: user.companyLogo,
            }
          : undefined,
      });
    } catch (e) {
      console.error("PDF Generation failed", e);
      toast.error("Failed to generate PDF");
    } finally {
      setIsExporting(false);
    }
  };

  // Helper
  const formatINR = (amount: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <div className="h-screen flex flex-col bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-100 font-sans selection:bg-indigo-100 dark:selection:bg-indigo-900 selection:text-indigo-900 dark:selection:text-indigo-100 transition-colors duration-300 overflow-hidden">
      <Header
        isDarkMode={isDarkMode}
        toggleTheme={toggleTheme}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onDownloadPDF={calibratedAnalysis ? handleDownloadPDF : undefined}
        onSaveProfile={calibratedAnalysis ? handleSaveToProfile : undefined}
        isSaving={isSaving}
        isExporting={isExporting}
      />

      <main className="flex-1 w-full px-4 py-6 overflow-hidden">
        {!calibratedAnalysis ? (
          user && !showUpload ? (
            // HOME DASHBOARD VIEW
            <div className="h-full flex flex-col animate-fade-in overflow-y-auto custom-scrollbar pb-10">
              {/* Welcome Section */}
              <div className="mb-10 mt-4">
                <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">
                  Welcome back{user?.name ? `, ${user.name.split(" ")[0]}` : ""}
                  !
                </h1>
                <p className="text-slate-600 dark:text-slate-400 max-w-2xl">
                  Manage your construction estimates or start a new detailed
                  analysis from your floor plans.
                </p>
              </div>

              {/* Quick Actions Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
                {/* Create New Card */}
                <div
                  onClick={() => setShowUpload(true)}
                  className="group cursor-pointer bg-gradient-to-br from-indigo-600 to-indigo-700 rounded-2xl p-6 text-white shadow-lg shadow-indigo-200 dark:shadow-none hover:shadow-xl hover:scale-[1.02] transition-all duration-300 relative overflow-hidden"
                >
                  <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:opacity-20 transition-opacity">
                    <Plus size={120} />
                  </div>
                  <div className="relative z-10 h-full flex flex-col justify-between">
                    <div>
                      <div className="p-3 bg-white/20 rounded-xl w-fit mb-4 backdrop-blur-sm">
                        <Plus className="w-8 h-8 text-white" />
                      </div>
                      <h3 className="text-xl font-bold mb-1">New Estimate</h3>
                      <p className="text-indigo-100 text-sm">
                        Upload a floor plan to start analysis
                      </p>
                    </div>
                    <div className="flex items-center text-sm font-semibold mt-6">
                      Start Now{" "}
                      <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                    </div>
                  </div>
                </div>

                {/* Go to Profile / Saved Plans Card */}
                <div
                  onClick={() => navigate("/saved-plans")}
                  className="group cursor-pointer bg-white dark:bg-slate-800 rounded-2xl p-6 border border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-md hover:border-indigo-300 dark:hover:border-indigo-700 transition-all duration-300 relative overflow-hidden"
                >
                  <div className="absolute top-0 right-0 p-8 opacity-5 dark:opacity-[0.03] group-hover:opacity-10 transition-opacity text-indigo-600 dark:text-indigo-400">
                    <LayoutDashboard size={120} />
                  </div>
                  <div className="relative z-10 h-full flex flex-col justify-between">
                    <div>
                      <div className="p-3 bg-indigo-50 dark:bg-slate-700 rounded-xl w-fit mb-4 text-indigo-600 dark:text-indigo-400">
                        <LayoutDashboard className="w-8 h-8" />
                      </div>
                      <h3 className="text-xl font-bold mb-1 text-slate-900 dark:text-white">
                        Saved Projects
                      </h3>
                      <p className="text-slate-500 dark:text-slate-400 text-sm">
                        View and manage your past estimates
                      </p>
                    </div>
                    <div className="flex items-center text-sm font-semibold text-indigo-600 dark:text-indigo-400 mt-6">
                      Go to Projects{" "}
                      <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                    </div>
                  </div>
                </div>

                {/* Stats / Info Card (Optional) */}
                <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col justify-center items-center text-center">
                  <div className="p-4 bg-emerald-50 dark:bg-emerald-900/20 rounded-full mb-3">
                    <Clock className="w-8 h-8 text-emerald-600 dark:text-emerald-400" />
                  </div>
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-1">
                    {isLoadingRecent ? "..." : totalProjects}
                  </h3>
                  <p className="text-sm text-slate-500 dark:text-slate-400">
                    Total Projects Created
                  </p>
                </div>
              </div>

              {/* Recent Projects Section */}
              <div>
                <div className="flex justify-between items-end mb-6">
                  <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                    Recent Activity
                  </h2>
                  {recentPlans.length > 0 && (
                    <button
                      onClick={() => navigate("/saved-plans")}
                      className="text-sm font-medium text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 flex items-center"
                    >
                      View All <ArrowRight className="w-4 h-4 ml-1" />
                    </button>
                  )}
                </div>

                {isLoadingRecent ? (
                  <div className="flex justify-center p-8">
                    <div className="w-8 h-8 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
                  </div>
                ) : recentPlans.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {recentPlans.map((plan) => (
                      <div
                        key={plan._id}
                        onClick={() =>
                          navigate("/saved-plans", {
                            state: { openPlanId: plan._id },
                          })
                        }
                        className="group cursor-pointer bg-white dark:bg-slate-800 rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-lg transition-all duration-300"
                      >
                        <div className="h-40 overflow-hidden bg-slate-100 dark:bg-slate-900 relative">
                          <img
                            src={plan.imageUrl}
                            alt="Floor Plan"
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-4">
                            <span className="text-white text-sm font-medium">
                              View Analysis
                            </span>
                          </div>
                        </div>
                        <div className="p-4">
                          <h4 className="font-bold text-slate-900 dark:text-white mb-1 truncate">
                            {new Date(plan.createdAt).toLocaleDateString(
                              undefined,
                              {
                                year: "numeric",
                                month: "long",
                                day: "numeric",
                              },
                            )}
                          </h4>
                          <div className="flex items-center text-xs text-slate-500 dark:text-slate-400 gap-3">
                            <span>
                              {(
                                plan.analysisResult.summary?.totalAreaSqFt ||
                                (plan.analysisResult.summary?.totalAreaSqM
                                  ? plan.analysisResult.summary.totalAreaSqM *
                                    10.7639
                                  : 0)
                              ).toFixed(1)}{" "}
                              ft²
                            </span>
                            <span>•</span>
                            <span>
                              {plan.analysisResult.rooms?.length || 0} Rooms
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-16 bg-white dark:bg-slate-800 rounded-xl border border-dashed border-slate-300 dark:border-slate-700">
                    <div className="bg-slate-50 dark:bg-slate-900 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Plus className="w-8 h-8 text-slate-400" />
                    </div>
                    <h3 className="text-slate-900 dark:text-white font-medium mb-1">
                      No saved plans yet
                    </h3>
                    <p className="text-slate-500 dark:text-slate-400 text-sm">
                      Create your first estimate to see it here.
                    </p>
                  </div>
                )}
              </div>
            </div>
          ) : (
            // UPLOAD VIEW (Original Hero)
            <div className="h-full flex flex-col items-center justify-center animate-fade-in transition-all duration-300 pointer-events-auto relative">
              {user && (
                <button
                  onClick={() => setShowUpload(false)}
                  className="absolute top-4 left-0 flex items-center text-sm font-medium text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 transition-colors z-10"
                >
                  <ArrowRight className="w-4 h-4 mr-1 rotate-180" /> Back to
                  Home
                </button>
              )}
              <div className="w-full max-w-3xl mx-auto px-4">
                <div className="transform transition-all hover:scale-[1.01] duration-300 shadow-xl rounded-xl">
                  <FileUpload
                    file={file}
                    previewUrl={previewUrl}
                    isAnalyzing={isAnalyzing}
                    error={error}
                    onFileChange={handleFileChange}
                    onAnalyze={handleAnalyze}
                    onClear={clearFile}
                    variant="hero"
                  />
                </div>
              </div>
            </div>
          )
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-auto lg:h-full overflow-y-auto lg:overflow-hidden p-4 lg:p-0">
            {/* LEFT COLUMN: Sidebar Navigation & Tools */}
            <div className="lg:col-span-3 flex flex-col gap-4 lg:gap-6 h-auto lg:h-full lg:overflow-hidden order-2 lg:order-1">
              {/* Navigation - Hidden on Mobile to save space, maybe move to bottom or top bar? Keeping for now but styling for mobile */}
              <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden transition-all duration-300 shrink-0">
                <nav className="flex lg:flex-col flex-row p-2 space-y-0 lg:space-y-1 space-x-2 lg:space-x-0 overflow-x-auto lg:overflow-visible">
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

              {/* Parameters Panel */}
              <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-4 shrink-0 transition-all duration-300">
                <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider mb-3 flex items-center">
                  <Ruler className="w-4 h-4 mr-2 text-indigo-500" />
                  Parameters
                </h3>
                <div className="grid grid-cols-1 gap-4">
                  {/* Ceiling Height */}
                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <label className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                        Ceiling Height
                      </label>
                    </div>
                    <div className="relative">
                      <input
                        type="number"
                        step="0.1"
                        value={
                          settings.wallHeightFt === 0
                            ? ""
                            : settings.wallHeightFt
                        }
                        onChange={(e) => {
                          const val = e.target.value;
                          setSettings((prev) => ({
                            ...prev,
                            wallHeightFt: val === "" ? 0 : parseFloat(val),
                          }));
                        }}
                        className="block w-full rounded-md border-slate-200 dark:border-slate-600 pl-3 pr-8 text-sm py-1.5 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-indigo-500 focus:border-indigo-500 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                      />
                      <span className="absolute right-3 top-2 text-xs text-slate-500 font-bold">
                        ft
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Upload & Preview */}
              <div className="transition-all duration-300 flex-1 min-h-0 flex flex-col">
                <FileUpload
                  file={file}
                  previewUrl={previewUrl}
                  isAnalyzing={isAnalyzing}
                  error={error}
                  onFileChange={handleFileChange}
                  onAnalyze={handleAnalyze}
                  onClear={clearFile}
                  hideClearButton={true}
                />
              </div>
            </div>

            {/* RIGHT COLUMN: Main Content */}
            <div className="lg:col-span-9 flex flex-col gap-4 lg:gap-6 h-auto lg:h-full lg:overflow-hidden order-1 lg:order-2">
              {/* Stats Row */}
              <div className="shrink-0">
                <StatsSummary
                  analysis={calibratedAnalysis}
                  totalCost={totalProjectCost}
                  formatCurrency={formatINR}
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
                  onQuantityUpdate={handleQuantityUpdate}
                  formatCurrency={formatINR}
                  consolidatedReport={consolidatedReport}
                  currentView={currentView}
                  onViewChange={setCurrentView}
                  scalingFactors={scalingFactors}
                />
              </div>
            </div>
          </div>
        )}
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
              settings={settings}
              setSettings={setSettings}
              variant="clean"
              customRates={customRates}
              onRateUpdate={handleRateUpdate}
              // Removed customQuantities props to CalibrationPanel as requested
              isPlanAnalyzed={!!calibratedAnalysis}
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

      <Modal
        isOpen={isSaveModalOpen}
        onClose={() => setIsSaveModalOpen(false)}
        title="Save Project"
      >
        <div className="p-4 space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
              Project Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={planName}
              onChange={(e) => setPlanName(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-slate-50 dark:bg-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all font-medium text-sm"
              placeholder="e.g. My Dream Home"
              autoFocus
              onKeyDown={(e) => {
                if (e.key === "Enter") performSave();
              }}
            />
          </div>
          <div className="flex justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-700">
            <button
              onClick={() => setIsSaveModalOpen(false)}
              className="px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={performSave}
              className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-sm transition-colors flex items-center gap-2"
              disabled={isSaving}
            >
              <Save className="w-4 h-4" />
              {isSaving ? "Saving..." : "Save Project"}
            </button>
          </div>
        </div>
      </Modal>

      <LoginModal
        isOpen={isLoginModalOpen}
        onClose={() => setIsLoginModalOpen(false)}
      />
    </div>
  );
}

export default Dashboard;

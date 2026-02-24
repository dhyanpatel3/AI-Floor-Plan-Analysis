import React, { useContext, useEffect, useState } from "react";
import AuthContext from "../contexts/AuthContext";
import floorPlanService from "../services/floorPlanService";
import { toast } from "react-toastify";
import {
  Eye,
  Trash2,
  Download,
  ArrowLeft,
  Edit2,
  Save,
  X,
  Search,
} from "lucide-react";
import { Modal } from "../components/Modal";
import { AnalysisResult, ProjectSettings } from "../types";
import { generatePDF } from "../utils/pdfGenerator";
import { useNavigate, useLocation } from "react-router-dom";
import Swal from "sweetalert2";

interface FloorPlanRecord {
  _id: string;
  imageUrl: string;
  fileName?: string;
  analysisResult: AnalysisResult;
  costEstimation?: {
    totalProjectCost: number;
    consolidatedReport: Array<{ category: string; cost: number }>;
    globalStructureCosts: any[];
    customRates?: Record<string, number>;
    customQuantities?: Record<string, number>;
    calculatedQuantities?: Record<string, number>;
    settings?: ProjectSettings;
    areaUnit?: "sqm" | "sqft";
    calibrationArea?: string;
    roomCosts?: Array<{
      roomName: string;
      totalCost: number;
      materials: Array<{
        id: string;
        name: string;
        quantity: number;
        unit: string;
        unitRate: number;
        totalCost: number;
      }>;
    }>;
    fullBOQ?: Array<{
      id: string;
      category: string;
      name: string;
      quantity: number;
      unit: string;
      unitRate: number;
      totalCost: number;
    }>;
  };
  createdAt: string;
}

function SavedPlans() {
  const navigate = useNavigate();
  const location = useLocation();
  const authContext = useContext(AuthContext);

  if (!authContext) {
    throw new Error("AuthContext must be used within an AuthProvider");
  }

  const { user } = authContext;
  const [floorPlans, setFloorPlans] = useState<FloorPlanRecord[]>([]);
  const [filteredPlans, setFilteredPlans] = useState<FloorPlanRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [isDownloading, setIsDownloading] = useState(false);

  const [selectedPlan, setSelectedPlan] = useState<FloorPlanRecord | null>(
    null,
  );
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [activeTab, setActiveTab] = useState<"overview" | "rooms" | "boq">(
    "overview",
  );

  const handleViewDetails = (plan: FloorPlanRecord) => {
    setSelectedPlan(plan);
    setActiveTab("overview");
    setIsModalOpen(true);
    setIsEditing(false);
  };

  useEffect(() => {
    const fetchFloorPlans = async () => {
      if (user?.token) {
        try {
          const data = await floorPlanService.getUserFloorPlans(user.token);
          setFloorPlans(data);
          setFilteredPlans(data);

          // Check for auto-open request
          const state = location.state as { openPlanId?: string };
          if (state?.openPlanId) {
            const targetPlan = data.find(
              (p: FloorPlanRecord) => p._id === state.openPlanId,
            );
            if (targetPlan) {
              // Clear state so it doesn't reopen on refresh
              window.history.replaceState({}, document.title);
              // "View Details" logic inline
              setSelectedPlan(targetPlan);
              setActiveTab("overview");
              setIsModalOpen(true);
              setIsEditing(false);
            }
          }
        } catch (error: any) {
          // toast.error(error.message || "Failed to load floor plans");
        } finally {
          setIsLoading(false);
        }
      } else {
        setIsLoading(false);
        // Redirect if not logged in? Or just show empty
        if (!user) {
          navigate("/login");
        }
      }
    };

    fetchFloorPlans();
  }, [user, location.state, navigate]);

  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredPlans(floorPlans);
    } else {
      const query = searchQuery.toLowerCase();
      setFilteredPlans(
        floorPlans.filter(
          (plan) =>
            plan.fileName?.toLowerCase().includes(query) ||
            plan.analysisResult?.rooms?.length.toString().includes(query),
        ),
      );
    }
  }, [searchQuery, floorPlans]);

  const handleDelete = async (id: string, name?: string) => {
    if (!user) return;

    const result = await Swal.fire({
      title: "Are you sure?",
      text: `You won't be able to revert this!`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#3085d6",
      cancelButtonColor: "#d33",
      confirmButtonText: "Yes, delete it!",
    });

    if (result.isConfirmed) {
      try {
        await floorPlanService.deleteFloorPlan(id, user.token);
        const updatedPlans = floorPlans.filter((plan) => plan._id !== id);
        setFloorPlans(updatedPlans);
        // Filtering will be updated by useEffect dependency on floorPlans
        Swal.fire("Deleted!", "Your floor plan has been deleted.", "success");
      } catch (error: any) {
        Swal.fire(
          "Error!",
          error.message || "Failed to delete floor plan",
          "error",
        );
      }
    }
  };

  const handleEditPlan = (plan: FloorPlanRecord) => {
    setSelectedPlan(JSON.parse(JSON.stringify(plan)));
    setActiveTab("boq");
    setIsModalOpen(true);
    setIsEditing(true);
  };

  const handleUpdateBOQ = (
    id: string,
    field: "quantity" | "unitRate",
    value: number,
  ) => {
    if (
      !selectedPlan ||
      !selectedPlan.costEstimation ||
      !selectedPlan.costEstimation.fullBOQ
    )
      return;

    const updatedPlan = { ...selectedPlan };
    const boq = [...updatedPlan.costEstimation.fullBOQ!];

    // Find the item
    const itemIndex = boq.findIndex((item) => item.id === id);
    if (itemIndex === -1) return;

    // Update item
    boq[itemIndex] = { ...boq[itemIndex], [field]: value };

    // Recalculate total cost for item
    boq[itemIndex].totalCost =
      boq[itemIndex].quantity * boq[itemIndex].unitRate;

    // Update BOQ in plan
    updatedPlan.costEstimation.fullBOQ = boq;

    // Recalculate Global Total
    updatedPlan.costEstimation.totalProjectCost = boq.reduce(
      (sum, item) => sum + item.totalCost,
      0,
    );

    // Recalculate Consolidated Report
    const categoryMap = new Map<string, number>();
    boq.forEach((item) => {
      const current = categoryMap.get(item.category) || 0;
      categoryMap.set(item.category, current + item.totalCost);
    });

    updatedPlan.costEstimation.consolidatedReport = Array.from(
      categoryMap.entries(),
    ).map(([category, cost]) => ({
      category,
      cost,
    }));

    setSelectedPlan(updatedPlan);
  };

  const handleUpdateRoomMaterial = (
    roomIndex: number,
    materialIndex: number,
    field: "quantity" | "unitRate",
    value: number,
  ) => {
    if (
      !selectedPlan ||
      !selectedPlan.costEstimation ||
      !selectedPlan.costEstimation.roomCosts
    )
      return;

    const updatedPlan = JSON.parse(JSON.stringify(selectedPlan));
    const room = updatedPlan.costEstimation.roomCosts[roomIndex];
    const material = room.materials[materialIndex];

    // Update field
    material[field] = value;
    // Recalculate material cost
    material.totalCost = material.quantity * material.unitRate;

    // Recalculate Room Total
    room.totalCost = room.materials.reduce(
      (sum: number, m: any) => sum + m.totalCost,
      0,
    );

    // Sync with BOQ and Totals
    // 1. Map existing categories from BOQ to IDs
    const categoryMap = new Map<string, string>(); // ID -> Category
    if (updatedPlan.costEstimation.fullBOQ) {
      updatedPlan.costEstimation.fullBOQ.forEach((item: any) => {
        categoryMap.set(item.id, item.category);
      });
    }

    // 2. Aggregate from all rooms
    const aggMap = new Map<string, any>(); // ID -> Combined Item

    updatedPlan.costEstimation.roomCosts.forEach((r: any) => {
      r.materials.forEach((m: any) => {
        if (!aggMap.has(m.id)) {
          aggMap.set(m.id, {
            id: m.id,
            name: m.name,
            unit: m.unit,
            quantity: 0,
            totalCost: 0,
            category: categoryMap.get(m.id) || "Uncategorized", // Preserve category
          });
        }
        const item = aggMap.get(m.id);
        item.quantity += m.quantity;
        item.totalCost += m.totalCost;
      });
    });

    // 3. Convert map back to BOQ array
    const newBOQ = Array.from(aggMap.values()).map((item) => ({
      ...item,
      unitRate: item.quantity > 0 ? item.totalCost / item.quantity : 0,
    }));

    updatedPlan.costEstimation.fullBOQ = newBOQ;

    // 4. Recalculate Project Total
    updatedPlan.costEstimation.totalProjectCost = newBOQ.reduce(
      (sum: number, item: any) => sum + item.totalCost,
      0,
    );

    // 5. Recalculate Consolidated Report
    const reportMap = new Map<string, number>();
    newBOQ.forEach((item: any) => {
      const current = reportMap.get(item.category) || 0;
      reportMap.set(item.category, current + item.totalCost);
    });
    updatedPlan.costEstimation.consolidatedReport = Array.from(
      reportMap.entries(),
    ).map(([category, cost]) => ({
      category,
      cost,
    }));

    setSelectedPlan(updatedPlan);
  };

  const handleSaveChanges = async () => {
    if (!selectedPlan || !user) return;

    try {
      await floorPlanService.updateFloorPlan(
        selectedPlan._id,
        selectedPlan.costEstimation,
        user.token,
      );

      // Update the list of plans
      const updatedPlans = floorPlans.map((p) =>
        p._id === selectedPlan._id ? selectedPlan : p,
      );
      setFloorPlans(updatedPlans);

      toast.success("Floor plan updated successfully");
      setIsEditing(false);
    } catch (error: any) {
      toast.error(error.message || "Failed to update floor plan");
    }
  };

  const handleDownloadPDF = async () => {
    if (!selectedPlan || !selectedPlan.costEstimation) return;

    setIsDownloading(true);

    setTimeout(() => {
      try {
        if (!selectedPlan || !selectedPlan.costEstimation) {
          setIsDownloading(false);
          return;
        }

        const {
          consolidatedReport,
          calculatedQuantities,
          customQuantities,
          customRates,
          totalProjectCost,
          settings,
          areaUnit,
          calibrationArea,
        } = selectedPlan.costEstimation;

        generatePDF({
          analysis: selectedPlan.analysisResult,
          consolidatedReport: consolidatedReport || [],
          calculatedQuantities: calculatedQuantities || {},
          customQuantities: customQuantities || {},
          customRates: customRates || {},
          totalCost: totalProjectCost || 0,
          settings: settings || {
            currency: "INR",
            wallHeightFt: 10,
            brickSize: "standard",
          },
          areaUnit: areaUnit || "sqft",
          calibrationArea: calibrationArea || "",
          companyDetails: user
            ? {
                name: user.companyName,
                address: user.companyAddress,
                phone: user.companyPhone,
                logo: user.companyLogo,
              }
            : undefined,
        });
        // PDF download happens via browser
      } catch (error) {
        console.error("PDF Generation Error:", error);
        toast.error("Failed to generate PDF");
      } finally {
        setIsDownloading(false);
      }
    }, 100);
  };

  return (
    <div className="container mx-auto px-6 md:px-12 py-10 min-h-screen">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate("/dashboard")}
            className="p-2 rounded-full hover:bg-slate-200 dark:hover:bg-slate-700 transition text-slate-700 dark:text-slate-300"
            aria-label="Go back"
          >
            <ArrowLeft className="w-6 h-6" />
          </button>
          <div>
            <h1 className="text-3xl font-bold dark:text-white mb-2">
              Saved Projects
            </h1>
            <p className="text-slate-500 dark:text-slate-400">
              Manage and access your floor plan analyses.
            </p>
          </div>
        </div>

        <div className="relative w-full md:w-64">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-4 w-4 text-slate-400" />
          </div>
          <input
            type="text"
            placeholder="Search projects..."
            className="pl-10 pr-4 py-2 w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
        </div>
      ) : filteredPlans.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredPlans.map((plan) => (
            <div
              key={plan._id}
              className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden hover:shadow-lg hover:border-indigo-300 dark:hover:border-indigo-700 transition-all group"
            >
              <div className="h-48 overflow-hidden bg-slate-100 dark:bg-slate-900 relative">
                <img
                  src={plan.imageUrl}
                  alt="Floor Plan"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
              </div>
              <div className="p-5 flex-1 flex flex-col">
                <div className="flex justify-between items-start mb-2">
                  <h3
                    className="font-bold text-lg truncate text-slate-900 dark:text-white flex-1 mr-2"
                    title={plan.fileName}
                  >
                    {plan.fileName || "Untitled Project"}
                  </h3>
                </div>

                <p className="text-xs text-slate-500 dark:text-slate-400 mb-4 flex items-center gap-1">
                  Created on {new Date(plan.createdAt).toLocaleDateString()}
                </p>

                <div className="grid grid-cols-2 gap-3 mb-4 text-sm">
                  <div className="bg-slate-50 dark:bg-slate-700/50 p-2 rounded-lg">
                    <span className="block text-xs text-slate-500 dark:text-slate-400">
                      Total Area
                    </span>
                    <span className="font-medium text-slate-900 dark:text-white">
                      {(
                        plan.analysisResult.summary?.totalAreaSqFt ||
                        (plan.analysisResult.summary?.totalAreaSqM
                          ? plan.analysisResult.summary.totalAreaSqM * 10.7639
                          : 0)
                      ).toFixed(0)}{" "}
                      ft²
                    </span>
                  </div>
                  {plan.costEstimation?.totalProjectCost ? (
                    <div className="bg-slate-50 dark:bg-slate-700/50 p-2 rounded-lg">
                      <span className="block text-xs text-slate-500 dark:text-slate-400">
                        Est. Cost
                      </span>
                      <span className="font-medium text-indigo-600 dark:text-indigo-400">
                        ₹
                        {(plan.costEstimation.totalProjectCost / 1000).toFixed(
                          1,
                        )}
                        k
                      </span>
                    </div>
                  ) : (
                    <div className="bg-slate-50 dark:bg-slate-700/50 p-2 rounded-lg">
                      <span className="block text-xs text-slate-500 dark:text-slate-400">
                        Est. Cost
                      </span>
                      <span className="font-medium text-slate-400">-</span>
                    </div>
                  )}
                </div>

                <div className="mt-auto flex gap-2 pt-2 border-t border-slate-100 dark:border-slate-700">
                  <button
                    onClick={() => handleViewDetails(plan)}
                    className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-medium rounded-lg hover:opacity-90 transition-opacity text-sm"
                  >
                    <Eye size={16} />
                    View
                  </button>
                  <button
                    onClick={() => handleEditPlan(plan)}
                    className="p-2 text-indigo-600 bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-900/30 dark:text-indigo-400 dark:hover:bg-indigo-900/50 rounded-lg transition-colors border border-transparent"
                    title="Edit Estimate"
                  >
                    <Edit2 size={18} />
                  </button>
                  <button
                    onClick={() => handleDelete(plan._id, plan.fileName)}
                    className="p-2 text-red-600 bg-red-50 hover:bg-red-100 dark:bg-red-900/30 dark:text-red-400 dark:hover:bg-red-900/50 rounded-lg transition-colors border border-transparent"
                    title="Delete Project"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-20 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-dashed border-slate-300 dark:border-slate-700">
          <div className="bg-white dark:bg-slate-800 p-4 rounded-full shadow-sm mb-4">
            <Search className="w-8 h-8 text-slate-400" />
          </div>
          <h3 className="text-xl font-medium text-slate-900 dark:text-white mb-2">
            No projects found
          </h3>
          <p className="text-slate-500 dark:text-slate-400 max-w-sm text-center mb-6">
            {searchQuery
              ? "Try adjusting your search query."
              : "Upload a floor plan to get started with your first estimate."}
          </p>
          {!searchQuery && (
            <button
              onClick={() => navigate("/dashboard")}
              className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-xl transition-colors shadow-lg shadow-indigo-500/20"
            >
              Create New Project
            </button>
          )}
        </div>
      )}

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={selectedPlan?.fileName || "Analysis Information"}
      >
        {selectedPlan && (
          <div className="flex flex-col h-[70vh]">
            <div className="flex justify-between items-center border-b border-slate-200 dark:border-slate-700 shrink-0">
              <div className="flex">
                <button
                  onClick={() => setActiveTab("overview")}
                  className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 ${
                    activeTab === "overview"
                      ? "border-indigo-600 text-indigo-600 dark:text-indigo-400"
                      : "border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
                  }`}
                >
                  Overview
                </button>
                <button
                  onClick={() => setActiveTab("rooms")}
                  className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 ${
                    activeTab === "rooms"
                      ? "border-indigo-600 text-indigo-600 dark:text-indigo-400"
                      : "border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
                  }`}
                >
                  Room Analysis
                </button>
                <button
                  onClick={() => setActiveTab("boq")}
                  className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 ${
                    activeTab === "boq"
                      ? "border-indigo-600 text-indigo-600 dark:text-indigo-400"
                      : "border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
                  }`}
                >
                  Full BOQ
                </button>
              </div>
              <button
                onClick={handleDownloadPDF}
                disabled={isDownloading}
                className={`mr-4 flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-white rounded-md shadow-sm transition-colors ${
                  isDownloading
                    ? "bg-indigo-400 cursor-not-allowed"
                    : "bg-indigo-600 hover:bg-indigo-700"
                }`}
              >
                {isDownloading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Downloading...
                  </>
                ) : (
                  <>
                    <Download size={16} />
                    Download Report
                  </>
                )}
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 md:p-8 custom-scrollbar">
              {activeTab === "overview" && (
                <div className="space-y-6">
                  <div className="flex flex-col md:flex-row gap-8">
                    {/* Left: Image & Badge */}
                    <div className="w-full md:w-5/12">
                      <div className="sticky top-0 space-y-3">
                        <div className="relative rounded-xl overflow-hidden shadow-md border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800">
                          <img
                            src={selectedPlan.imageUrl}
                            alt="Floor Plan"
                            className="w-full h-auto object-contain max-h-[400px]"
                          />
                        </div>
                        <div className="bg-indigo-50 dark:bg-slate-800 rounded-lg p-3 border border-indigo-100 dark:border-slate-700 text-center">
                          <p className="text-xs text-indigo-600 dark:text-indigo-400 font-semibold uppercase tracking-wide">
                            Analyzed Plan
                          </p>
                          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                            {new Date(
                              selectedPlan.createdAt,
                            ).toLocaleDateString(undefined, {
                              weekday: "long",
                              year: "numeric",
                              month: "long",
                              day: "numeric",
                            })}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Right: Detailed Metrics & Summary */}
                    <div className="w-full md:w-7/12 space-y-6">
                      {/* Key Metrics Grid */}
                      <div className="grid grid-cols-2 gap-4">
                        <div className="bg-white dark:bg-slate-800 p-4 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700">
                          <h4 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">
                            Total Area
                          </h4>
                          <div className="text-2xl font-bold text-slate-900 dark:text-white">
                            {(
                              selectedPlan.analysisResult.summary
                                .totalAreaSqFt ||
                              (selectedPlan.analysisResult.summary.totalAreaSqM
                                ? selectedPlan.analysisResult.summary
                                    .totalAreaSqM * 10.7639
                                : 0)
                            ).toFixed(1)}
                            <span className="text-sm font-medium text-slate-500 ml-1">
                              ft²
                            </span>
                          </div>
                        </div>
                        <div className="bg-white dark:bg-slate-800 p-4 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700">
                          <h4 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">
                            Wall Length
                          </h4>
                          <div className="text-2xl font-bold text-slate-900 dark:text-white">
                            {(
                              selectedPlan.analysisResult.summary
                                .totalWallLengthFt ||
                              (selectedPlan.analysisResult.summary
                                .totalWallLengthM
                                ? selectedPlan.analysisResult.summary
                                    .totalWallLengthM * 3.28084
                                : 0)
                            ).toFixed(1)}
                            <span className="text-sm font-medium text-slate-500 ml-1">
                              ft
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Elements Count */}
                      <div className="bg-white dark:bg-slate-800 p-5 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700">
                        <h4 className="text-sm font-bold text-slate-800 dark:text-white mb-4 flex items-center">
                          <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 mr-2"></span>
                          Detected Structure
                        </h4>
                        <div className="flex gap-8">
                          <div className="flex flex-col">
                            <span className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-1">
                              Doors
                            </span>
                            <span className="text-xl font-bold text-slate-900 dark:text-white">
                              {selectedPlan.analysisResult.elements.doors}
                            </span>
                          </div>
                          <div className="flex flex-col">
                            <span className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-1">
                              Windows
                            </span>
                            <span className="text-xl font-bold text-slate-900 dark:text-white">
                              {selectedPlan.analysisResult.elements.windows}
                            </span>
                          </div>
                          <div className="flex flex-col">
                            <span className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-1">
                              Rooms
                            </span>
                            <span className="text-xl font-bold text-slate-900 dark:text-white">
                              {selectedPlan.analysisResult.rooms.length}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Financial Summary */}
                      {selectedPlan.costEstimation &&
                        selectedPlan.costEstimation.totalProjectCost > 0 && (
                          <div className="bg-white dark:bg-slate-800 p-5 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700">
                            <h4 className="text-sm font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-6 border-b border-slate-100 dark:border-slate-700 pb-2">
                              Project Cost Breakdown
                            </h4>

                            <div className="space-y-3 mb-6">
                              {selectedPlan.costEstimation.consolidatedReport.map(
                                (item, idx) => (
                                  <div
                                    key={idx}
                                    className="flex justify-between items-center text-sm group"
                                  >
                                    <span className="text-slate-600 dark:text-slate-300 font-medium">
                                      {item.category}
                                    </span>
                                    <span className="font-medium text-slate-900 dark:text-white">
                                      ₹ {item.cost.toLocaleString()}
                                    </span>
                                  </div>
                                ),
                              )}
                            </div>

                            <div className="pt-4 border-t border-slate-100 dark:border-slate-700 flex justify-between items-end">
                              <span className="text-sm font-medium text-slate-500 dark:text-slate-400">
                                Total Estimated Cost
                              </span>
                              <span className="text-2xl font-bold text-indigo-600 dark:text-indigo-400 tracking-tight">
                                ₹{" "}
                                {selectedPlan.costEstimation.totalProjectCost.toLocaleString()}
                              </span>
                            </div>
                          </div>
                        )}
                    </div>
                  </div>
                </div>
              )}

              {activeTab === "rooms" && (
                <div>
                  <div className="flex justify-between items-center mb-3">
                    <h4 className="text-lg font-bold text-slate-800 dark:text-white">
                      Room Breakdown
                    </h4>
                    {!isEditing ? (
                      <button
                        onClick={() => setIsEditing(true)}
                        className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-indigo-600 bg-indigo-50 border border-indigo-200 rounded hover:bg-indigo-100 transition-colors dark:bg-slate-700 dark:text-indigo-400 dark:border-slate-600 dark:hover:bg-slate-600"
                      >
                        <Edit2 size={14} />
                        Edit Rooms
                      </button>
                    ) : (
                      <div className="flex gap-2">
                        <button
                          onClick={() => {
                            // Cancel edits - revert to original from floorPlans list
                            const original = floorPlans.find(
                              (p) => p._id === selectedPlan?._id,
                            );
                            if (original)
                              setSelectedPlan(
                                JSON.parse(JSON.stringify(original)),
                              );
                            setIsEditing(false);
                          }}
                          className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-slate-600 bg-white border border-slate-300 rounded hover:bg-slate-50 transition-colors dark:bg-slate-800 dark:text-slate-300 dark:border-slate-600 dark:hover:bg-slate-700"
                        >
                          <X size={14} />
                          Cancel
                        </button>
                        <button
                          onClick={handleSaveChanges}
                          className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-white bg-green-600 rounded hover:bg-green-700 transition-colors shadow-sm"
                        >
                          <Save size={14} />
                          Save Changes
                        </button>
                      </div>
                    )}
                  </div>
                  {selectedPlan.costEstimation?.roomCosts ? (
                    <div className="space-y-6">
                      {selectedPlan.costEstimation.roomCosts.map(
                        (room, idx) => (
                          <div
                            key={idx}
                            className="bg-slate-50 dark:bg-slate-700/50 rounded-lg p-4 border border-slate-200 dark:border-slate-700"
                          >
                            <div className="flex justify-between items-start mb-4">
                              <div>
                                <h5 className="font-bold text-slate-900 dark:text-white">
                                  {room.roomName}
                                </h5>
                                {selectedPlan.analysisResult.rooms[idx] && (
                                  <p className="text-sm text-slate-500 dark:text-slate-400">
                                    {
                                      selectedPlan.analysisResult.rooms[idx]
                                        .type
                                    }{" "}
                                    •{" "}
                                    {(
                                      selectedPlan.analysisResult.rooms[idx]
                                        .areaSqFt ||
                                      (selectedPlan.analysisResult.rooms[idx]
                                        .areaSqM
                                        ? selectedPlan.analysisResult.rooms[idx]
                                            .areaSqM * 10.7639
                                        : 0)
                                    ).toFixed(1)}{" "}
                                    ft²
                                  </p>
                                )}
                              </div>
                              <div className="text-right">
                                <span className="block text-sm text-slate-500 dark:text-slate-400">
                                  Total Cost
                                </span>
                                <span className="font-bold text-slate-900 dark:text-white">
                                  ₹ {room.totalCost.toLocaleString()}
                                </span>
                              </div>
                            </div>
                            <div className="overflow-x-auto">
                              <table className="w-full text-sm text-left text-slate-600 dark:text-slate-300">
                                <thead className="text-xs text-slate-700 dark:text-slate-200 uppercase bg-slate-100 dark:bg-slate-600">
                                  <tr>
                                    <th className="px-3 py-2">Item</th>
                                    <th className="px-3 py-2 text-right">
                                      Qty
                                    </th>
                                    <th className="px-3 py-2 text-right">
                                      Rate
                                    </th>
                                    <th className="px-3 py-2 text-right">
                                      Amount
                                    </th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {room.materials.map(
                                    (mat: any, mIdx: number) => (
                                      <tr
                                        key={mIdx}
                                        className="border-b dark:border-slate-600 last:border-0"
                                      >
                                        <td className="px-3 py-2 font-medium">
                                          {mat.name}
                                        </td>
                                        <td className="px-3 py-2 text-right">
                                          {isEditing ? (
                                            <input
                                              type="number"
                                              value={mat.quantity}
                                              onChange={(e) =>
                                                handleUpdateRoomMaterial(
                                                  idx,
                                                  mIdx,
                                                  "quantity",
                                                  parseFloat(e.target.value) ||
                                                    0,
                                                )
                                              }
                                              className="w-20 px-1 py-0.5 text-right text-sm border rounded dark:bg-slate-700 dark:border-slate-600"
                                              step="0.01"
                                            />
                                          ) : (
                                            `${mat.quantity.toFixed(1)}`
                                          )}{" "}
                                          {mat.unit}
                                        </td>
                                        <td className="px-3 py-2 text-right">
                                          {isEditing ? (
                                            <div className="flex items-center justify-end gap-1">
                                              <span className="text-xs">₹</span>
                                              <input
                                                type="number"
                                                value={mat.unitRate}
                                                onChange={(e) =>
                                                  handleUpdateRoomMaterial(
                                                    idx,
                                                    mIdx,
                                                    "unitRate",
                                                    parseFloat(
                                                      e.target.value,
                                                    ) || 0,
                                                  )
                                                }
                                                className="w-20 px-1 py-0.5 text-right text-sm border rounded dark:bg-slate-700 dark:border-slate-600"
                                              />
                                            </div>
                                          ) : (
                                            `₹${mat.unitRate}`
                                          )}
                                        </td>
                                        <td className="px-3 py-2 text-right">
                                          ₹
                                          {Math.round(
                                            mat.totalCost,
                                          ).toLocaleString()}
                                        </td>
                                      </tr>
                                    ),
                                  )}
                                </tbody>
                              </table>
                            </div>
                          </div>
                        ),
                      )}
                    </div>
                  ) : (
                    <div className="overflow-x-auto border rounded-lg">
                      <table className="w-full text-sm text-left text-slate-600 dark:text-slate-300">
                        <thead className="text-xs text-slate-700 dark:text-slate-200 uppercase bg-slate-100 dark:bg-slate-700">
                          <tr>
                            <th className="px-4 py-3">Room Name</th>
                            <th className="px-4 py-3">Type</th>
                            <th className="px-4 py-3 text-right">
                              Area (SqFt)
                            </th>
                            <th className="px-4 py-3 text-right">
                              Perimeter (Ft)
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {selectedPlan.analysisResult.rooms.map(
                            (room: any, idx: number) => (
                              <tr
                                key={idx}
                                className="bg-white dark:bg-slate-800 border-b dark:border-slate-700"
                              >
                                <td className="px-4 py-3 font-medium text-slate-900 dark:text-white">
                                  {room.name}
                                </td>
                                <td className="px-4 py-3 capitalize">
                                  {room.type}
                                </td>
                                <td className="px-4 py-3 text-right">
                                  {(
                                    room.areaSqFt ||
                                    (room.areaSqM ? room.areaSqM * 10.7639 : 0)
                                  ).toFixed(2)}
                                </td>
                                <td className="px-4 py-3 text-right">
                                  {room.perimeterFt
                                    ? room.perimeterFt.toFixed(2)
                                    : room.perimeterM
                                      ? (room.perimeterM * 3.28084).toFixed(2)
                                      : "N/A"}
                                </td>
                              </tr>
                            ),
                          )}
                        </tbody>
                      </table>
                      <p className="mt-4 text-center text-sm text-slate-500 italic">
                        Detailed cost breakdown is not available for this plan.
                      </p>
                    </div>
                  )}
                </div>
              )}

              {activeTab === "boq" && (
                <div>
                  <div className="flex justify-between items-center mb-3">
                    <h4 className="text-lg font-bold text-slate-800 dark:text-white">
                      Bill of Quantities (BOQ)
                    </h4>
                    {!isEditing ? (
                      <button
                        onClick={() => setIsEditing(true)}
                        className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-indigo-600 bg-indigo-50 border border-indigo-200 rounded hover:bg-indigo-100 transition-colors dark:bg-slate-700 dark:text-indigo-400 dark:border-slate-600 dark:hover:bg-slate-600"
                      >
                        <Edit2 size={14} />
                        Edit BOQ
                      </button>
                    ) : (
                      <div className="flex gap-2">
                        <button
                          onClick={() => {
                            // Cancel edits - revert to original from floorPlans list
                            const original = floorPlans.find(
                              (p) => p._id === selectedPlan?._id,
                            );
                            if (original)
                              setSelectedPlan(
                                JSON.parse(JSON.stringify(original)),
                              );
                            setIsEditing(false);
                          }}
                          className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-slate-600 bg-white border border-slate-300 rounded hover:bg-slate-50 transition-colors dark:bg-slate-800 dark:text-slate-300 dark:border-slate-600 dark:hover:bg-slate-700"
                        >
                          <X size={14} />
                          Cancel
                        </button>
                        <button
                          onClick={handleSaveChanges}
                          className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-white bg-green-600 rounded hover:bg-green-700 transition-colors shadow-sm"
                        >
                          <Save size={14} />
                          Save Changes
                        </button>
                      </div>
                    )}
                  </div>
                  {selectedPlan.costEstimation?.fullBOQ ? (
                    <div className="overflow-x-auto border rounded-lg">
                      <table className="w-full text-sm text-left text-slate-600 dark:text-slate-300">
                        <thead className="text-xs text-slate-700 dark:text-slate-200 uppercase bg-slate-100 dark:bg-slate-700">
                          <tr>
                            <th className="px-4 py-3">Category</th>
                            <th className="px-4 py-3">Material Item</th>
                            <th className="px-4 py-3 text-right">Quantity</th>
                            <th className="px-4 py-3 text-right">Unit Rate</th>
                            <th className="px-4 py-3 text-right">Total Cost</th>
                          </tr>
                        </thead>
                        <tbody>
                          {[...selectedPlan.costEstimation.fullBOQ]
                            .sort((a, b) =>
                              a.category.localeCompare(b.category),
                            )
                            .map((item) => (
                              <tr
                                key={item.id} // Use ID as key
                                className="bg-white dark:bg-slate-800 border-b dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/50"
                              >
                                <td className="px-4 py-3 font-medium text-slate-900 dark:text-white">
                                  {item.category}
                                </td>
                                <td className="px-4 py-3">{item.name}</td>
                                <td className="px-4 py-3 text-right">
                                  {isEditing ? (
                                    <input
                                      type="number"
                                      value={item.quantity}
                                      onChange={(e) =>
                                        handleUpdateBOQ(
                                          item.id,
                                          "quantity",
                                          parseFloat(e.target.value) || 0,
                                        )
                                      }
                                      className="w-24 px-2 py-1 text-right text-sm border rounded dark:bg-slate-700 dark:border-slate-600"
                                      step="0.01"
                                    />
                                  ) : (
                                    `${item.quantity.toFixed(2)}`
                                  )}{" "}
                                  <span className="text-xs">{item.unit}</span>
                                </td>
                                <td className="px-4 py-3 text-right">
                                  {isEditing ? (
                                    <div className="flex items-center justify-end gap-1">
                                      <span className="text-xs">₹</span>
                                      <input
                                        type="number"
                                        value={item.unitRate}
                                        onChange={(e) =>
                                          handleUpdateBOQ(
                                            item.id,
                                            "unitRate",
                                            parseFloat(e.target.value) || 0,
                                          )
                                        }
                                        className="w-24 px-2 py-1 text-right text-sm border rounded dark:bg-slate-700 dark:border-slate-600"
                                      />
                                    </div>
                                  ) : (
                                    `₹ ${item.unitRate.toLocaleString()}`
                                  )}
                                </td>
                                <td className="px-4 py-3 text-right font-medium">
                                  ₹{" "}
                                  {Math.round(item.totalCost).toLocaleString()}
                                </td>
                              </tr>
                            ))}
                        </tbody>
                        <tfoot className="bg-slate-100 dark:bg-slate-700 font-bold">
                          <tr>
                            <td colSpan={4} className="px-4 py-3 text-right">
                              Grand Total
                            </td>
                            <td className="px-4 py-3 text-right">
                              ₹{" "}
                              {selectedPlan.costEstimation.fullBOQ
                                .reduce((acc, curr) => acc + curr.totalCost, 0)
                                .toLocaleString()}
                            </td>
                          </tr>
                        </tfoot>
                      </table>
                    </div>
                  ) : (
                    <p className="text-center text-slate-500 italic py-8">
                      Full BOQ data is not available for this plan.
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}

export default SavedPlans;

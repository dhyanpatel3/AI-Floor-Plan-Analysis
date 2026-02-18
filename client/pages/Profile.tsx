import React, { useContext, useEffect, useState } from "react";
import AuthContext from "../contexts/AuthContext";
import floorPlanService from "../services/floorPlanService";
import { toast } from "react-toastify";
import { Eye, Trash2, Download, ArrowLeft, Edit2, Save, X } from "lucide-react";
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

function Profile() {
  const navigate = useNavigate();
  const location = useLocation();
  const authContext = useContext(AuthContext);

  if (!authContext) {
    throw new Error("AuthContext must be used within an AuthProvider");
  }

  const { user } = authContext;
  const [floorPlans, setFloorPlans] = useState<FloorPlanRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);

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
      }
    };

    fetchFloorPlans();
  }, [user, location.state]);

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
        setFloorPlans(floorPlans.filter((plan) => plan._id !== id));
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

    // Update Room Costs if possible?
    // This is harder because fullBOQ is flattened.
    // If we want to strictly keep consistency, we might need to update roomCosts too.
    // But roomCosts structure relies on knowing which room a material belongs to.
    // fullBOQ usually aggregates same materials?
    // If fullBOQ aggregates, then we can't easily map back to rooms unless fullBOQ items have room reference.
    // Let's check if BOQ items have roomIds. The interface doesn't show it.
    // If fullBOQ is aggregated (e.g. Total Bricks), changing it here breaks the link to Room Costs.
    // For now, we will update BOQ totals and Project Totals. Room Costs might fall out of sync.
    // Ideally, we should warn user or just accept that "Edit BOQ" overrides the granular breakdown.

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
      setFloorPlans((prev) =>
        prev.map((p) => (p._id === selectedPlan._id ? selectedPlan : p)),
      );

      toast.success("Floor plan updated successfully");
      setIsEditing(false);
    } catch (error: any) {
      toast.error(error.message || "Failed to update floor plan");
    }
  };

  const handleDownloadPDF = () => {
    if (!selectedPlan || !selectedPlan.costEstimation) return;

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
    });
  };

  return (
    <div className="container mx-auto mt-10 p-5">
      <div className="flex items-center gap-4 mb-5">
        <button
          onClick={() => navigate("/dashboard")}
          className="p-2 rounded-full hover:bg-slate-200 dark:hover:bg-slate-700 transition"
        >
          <ArrowLeft className="w-6 h-6 dark:text-white" />
        </button>
        <h1 className="text-3xl font-bold dark:text-white">Profile</h1>
      </div>
      {user ? (
        <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow-lg mb-8 text-slate-900 dark:text-slate-100">
          <p className="text-xl">
            <strong>Name:</strong> {user.name}
          </p>
          <p className="text-xl">
            <strong>Email:</strong> {user.email}
          </p>
        </div>
      ) : (
        <p className="dark:text-white">Please login to view profile.</p>
      )}

      {user && (
        <div>
          <h2 className="text-2xl font-bold mb-4 dark:text-white">
            Saved Floor Plans
          </h2>
          {isLoading ? (
            <p className="dark:text-white">Loading...</p>
          ) : floorPlans.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {floorPlans.map((plan) => (
                <div
                  key={plan._id}
                  className="bg-white dark:bg-slate-800 rounded-xl shadow-md overflow-hidden hover:shadow-lg transition-shadow flex flex-col"
                >
                  <div className="h-48 overflow-hidden bg-gray-200">
                    <img
                      src={plan.imageUrl}
                      alt="Floor Plan"
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="p-4 flex-1 flex flex-col">
                    <h3
                      className="font-bold text-lg mb-1 truncate text-slate-900 dark:text-white"
                      title={plan.fileName}
                    >
                      {plan.fileName || "Untitled Project"}
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mb-3">
                      {new Date(plan.createdAt).toLocaleDateString()}
                    </p>
                    <p className="text-sm text-slate-600 dark:text-slate-300 mb-4">
                      Area:{" "}
                      <span className="font-medium text-slate-900 dark:text-white">
                        {(
                          plan.analysisResult.summary?.totalAreaSqFt ||
                          (plan.analysisResult.summary?.totalAreaSqM
                            ? plan.analysisResult.summary.totalAreaSqM * 10.7639
                            : 0)
                        ).toFixed(1)}{" "}
                        ft²
                      </span>
                    </p>
                    <div className="mt-auto flex gap-2">
                      <button
                        onClick={() => handleViewDetails(plan)}
                        className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition"
                      >
                        <Eye size={16} />
                        View
                      </button>
                      <button
                        onClick={() => handleEditPlan(plan)}
                        className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 transition"
                      >
                        <Edit2 size={16} />
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(plan._id, plan.fileName)}
                        className="flex items-center justify-center gap-2 px-3 py-2 bg-red-100 text-red-600 rounded hover:bg-red-200 transition"
                        title="Delete"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-slate-600 dark:text-slate-400">
              No saved floor plans found.
            </p>
          )}
        </div>
      )}

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Analysis Information"
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
                className="mr-4 flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700 transition-colors shadow-sm"
              >
                <Download size={16} />
                Download Report
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

export default Profile;

import React, { useContext, useEffect, useState } from "react";
import AuthContext from "../contexts/AuthContext";
import floorPlanService from "../services/floorPlanService";
import { toast } from "react-toastify";
import { Eye, Trash2, Download, ArrowLeft } from "lucide-react";
import { Modal } from "../components/Modal";
import { AnalysisResult, ProjectSettings } from "../types";
import { generatePDF } from "../utils/pdfGenerator";
import { useNavigate } from "react-router-dom";

interface FloorPlanRecord {
  _id: string;
  imageUrl: string;
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
  const [activeTab, setActiveTab] = useState<"overview" | "rooms" | "boq">(
    "overview",
  );

  useEffect(() => {
    const fetchFloorPlans = async () => {
      if (user?.token) {
        try {
          const data = await floorPlanService.getUserFloorPlans(user.token);
          setFloorPlans(data);
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
  }, [user]);

  const handleDelete = async (id: string) => {
    if (
      !user ||
      !window.confirm("Are you sure you want to delete this floor plan?")
    )
      return;

    try {
      await floorPlanService.deleteFloorPlan(id, user.token);
      setFloorPlans(floorPlans.filter((plan) => plan._id !== id));
      toast.success("Floor plan deleted successfully");
    } catch (error: any) {
      toast.error(error.message || "Failed to delete floor plan");
    }
  };

  const handleViewDetails = (plan: FloorPlanRecord) => {
    setSelectedPlan(plan);
    setActiveTab("overview");
    setIsModalOpen(true);
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
        wallHeightM: 3.0,
        brickSize: "standard",
      },
      areaUnit: areaUnit || "sqm",
      calibrationArea: calibrationArea || "",
    });
  };

  return (
    <div className="container mx-auto mt-10 p-5">
      <div className="flex items-center gap-4 mb-5">
        <button
          onClick={() => navigate("/")}
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
                    <h3 className="font-bold text-lg mb-2 text-slate-900 dark:text-white">
                      {new Date(plan.createdAt).toLocaleDateString()}
                    </h3>
                    <p className="text-sm text-slate-600 dark:text-slate-300 mb-4">
                      Area:{" "}
                      <span className="font-medium text-slate-900 dark:text-white">
                        {plan.analysisResult.summary?.totalAreaSqM?.toFixed(
                          1,
                        ) || "N/A"}{" "}
                        SqM
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
                        onClick={() => handleDelete(plan._id)}
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
            <div className="flex justify-between items-center border-b border-slate-200 dark:border-slate-700 mb-4 shrink-0">
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

            <div className="flex-1 overflow-y-auto p-1 custom-scrollbar">
              {activeTab === "overview" && (
                <div className="space-y-6">
                  <div className="flex flex-col md:flex-row gap-6">
                    <div className="w-full md:w-1/3">
                      <img
                        src={selectedPlan.imageUrl}
                        alt="Floor Plan"
                        className="w-full h-auto rounded border shadow-sm"
                      />
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 text-center">
                        Analyzed Floor Plan
                      </p>
                    </div>

                    <div className="w-full md:w-2/3 space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="bg-blue-50 dark:bg-slate-700 p-3 rounded-lg">
                          <h4 className="text-xs font-semibold text-blue-800 dark:text-blue-200 uppercase mb-1">
                            Total area
                          </h4>
                          <p className="text-lg font-bold text-slate-800 dark:text-white">
                            {selectedPlan.analysisResult.summary.totalAreaSqM.toFixed(
                              2,
                            )}{" "}
                            SqM
                          </p>
                        </div>
                        <div className="bg-green-50 dark:bg-slate-700 p-3 rounded-lg">
                          <h4 className="text-xs font-semibold text-green-800 dark:text-green-200 uppercase mb-1">
                            Wall Length
                          </h4>
                          <p className="text-lg font-bold text-slate-800 dark:text-white">
                            {selectedPlan.analysisResult.summary.totalWallLengthM.toFixed(
                              2,
                            )}{" "}
                            M
                          </p>
                        </div>
                      </div>

                      <div className="bg-gray-50 dark:bg-slate-700 p-4 rounded-lg">
                        <h4 className="font-semibold text-slate-800 dark:text-white mb-2">
                          Detected Elements
                        </h4>
                        <div className="flex gap-4">
                          <div className="flex items-center gap-2">
                            <span className="text-slate-600 dark:text-slate-300">
                              Doors:
                            </span>
                            <span className="font-bold text-slate-900 dark:text-white">
                              {selectedPlan.analysisResult.elements.doors}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-slate-600 dark:text-slate-300">
                              Windows:
                            </span>
                            <span className="font-bold text-slate-900 dark:text-white">
                              {selectedPlan.analysisResult.elements.windows}
                            </span>
                          </div>
                        </div>
                      </div>

                      {selectedPlan.costEstimation &&
                        selectedPlan.costEstimation.totalProjectCost > 0 && (
                          <div className="bg-orange-50 dark:bg-slate-700 p-4 rounded-lg">
                            <h4 className="font-semibold text-orange-900 dark:text-orange-200 mb-2">
                              Cost Estimate Summary
                            </h4>
                            <div className="flex justify-between items-end mb-3">
                              <span className="text-sm text-slate-600 dark:text-slate-400">
                                Total Project Cost
                              </span>
                              <span className="text-xl font-bold text-slate-900 dark:text-white">
                                ₹{" "}
                                {selectedPlan.costEstimation.totalProjectCost.toLocaleString()}
                              </span>
                            </div>
                            <div className="space-y-1">
                              {selectedPlan.costEstimation.consolidatedReport.map(
                                (item, idx) => (
                                  <div
                                    key={idx}
                                    className="flex justify-between text-sm"
                                  >
                                    <span className="text-slate-600 dark:text-slate-300">
                                      {item.category}
                                    </span>
                                    <span className="font-medium text-slate-900 dark:text-white">
                                      ₹ {item.cost.toLocaleString()}
                                    </span>
                                  </div>
                                ),
                              )}
                            </div>
                          </div>
                        )}
                    </div>
                  </div>
                </div>
              )}

              {activeTab === "rooms" && (
                <div>
                  <h4 className="text-lg font-bold text-slate-800 dark:text-white mb-3">
                    Room Breakdown
                  </h4>
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
                                    {selectedPlan.analysisResult.rooms[
                                      idx
                                    ].areaSqM.toFixed(1)}{" "}
                                    m²
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
                                          {mat.quantity.toFixed(1)} {mat.unit}
                                        </td>
                                        <td className="px-3 py-2 text-right">
                                          ₹{mat.unitRate}
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
                            <th className="px-4 py-3 text-right">Area (SqM)</th>
                            <th className="px-4 py-3 text-right">
                              Perimeter (M)
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
                                  {room.areaSqM.toFixed(2)}
                                </td>
                                <td className="px-4 py-3 text-right">
                                  {room.perimeterM
                                    ? room.perimeterM.toFixed(2)
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
                  <h4 className="text-lg font-bold text-slate-800 dark:text-white mb-3">
                    Bill of Quantities (BOQ)
                  </h4>
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
                          {selectedPlan.costEstimation.fullBOQ
                            .sort((a, b) =>
                              a.category.localeCompare(b.category),
                            )
                            .map((item, idx) => (
                              <tr
                                key={idx}
                                className="bg-white dark:bg-slate-800 border-b dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/50"
                              >
                                <td className="px-4 py-3 font-medium text-slate-900 dark:text-white">
                                  {item.category}
                                </td>
                                <td className="px-4 py-3">{item.name}</td>
                                <td className="px-4 py-3 text-right">
                                  {item.quantity.toFixed(2)} {item.unit}
                                </td>
                                <td className="px-4 py-3 text-right">
                                  ₹ {item.unitRate.toLocaleString()}
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

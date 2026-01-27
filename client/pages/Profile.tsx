import React, { useContext, useEffect, useState } from "react";
import AuthContext from "../contexts/AuthContext";
import floorPlanService from "../services/floorPlanService";
import { toast } from "react-toastify";
import { Eye, Trash2 } from "lucide-react";
import { Modal } from "../components/Modal";
import { AnalysisResult } from "../types";

interface FloorPlanRecord {
  _id: string;
  imageUrl: string;
  analysisResult: AnalysisResult;
  costEstimation?: {
    totalProjectCost: number;
    consolidatedReport: Array<{ category: string; cost: number }>;
    globalStructureCosts: any[];
  };
  createdAt: string;
}

function Profile() {
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
    setIsModalOpen(true);
  };

  return (
    <div className="container mx-auto mt-10 p-5">
      <h1 className="text-3xl font-bold mb-5 dark:text-white">Profile</h1>
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
          <div className="space-y-6 max-h-[70vh] overflow-y-auto p-1">
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

            <div>
              <h4 className="text-lg font-bold text-slate-800 dark:text-white mb-3">
                Room Breakdown
              </h4>
              <div className="overflow-x-auto border rounded-lg">
                <table className="w-full text-sm text-left text-slate-600 dark:text-slate-300">
                  <thead className="text-xs text-slate-700 dark:text-slate-200 uppercase bg-slate-100 dark:bg-slate-700">
                    <tr>
                      <th className="px-4 py-3">Room Name</th>
                      <th className="px-4 py-3">Type</th>
                      <th className="px-4 py-3 text-right">Area (SqM)</th>
                      <th className="px-4 py-3 text-right">Perimeter (M)</th>
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
                          <td className="px-4 py-3 capitalize">{room.type}</td>
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
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}

export default Profile;

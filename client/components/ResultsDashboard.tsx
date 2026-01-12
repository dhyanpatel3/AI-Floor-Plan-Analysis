import React, { useState } from "react";
import {
  AnalysisResult,
  MaterialCost,
  ProjectSettings,
  RoomCost,
} from "../types";
import {
  ArrowLeft,
  ChevronRight,
  Home,
  BarChart3,
  List,
  Layers,
} from "lucide-react";
import { CostTable } from "./CostTable";
import { CostDistributionChart } from "./Charts";
import { calculateRoomMaterials } from "../utils/calculationEngine";

interface ResultsDashboardProps {
  analysis: AnalysisResult;
  globalStructureCosts: MaterialCost[];
  settings: ProjectSettings;
  customRates: Record<string, number>;
  onRateUpdate: (id: string, newRate: number) => void;
  formatCurrency: (val: number) => string;
  consolidatedReport: { category: string; cost: number }[];
}

export const ResultsDashboard: React.FC<ResultsDashboardProps> = ({
  analysis,
  globalStructureCosts,
  settings,
  customRates,
  onRateUpdate,
  formatCurrency,
  consolidatedReport,
}) => {
  const [activeTab, setActiveTab] = useState<
    "report" | "summary" | "materials"
  >("report");
  const [selectedRoomIndex, setSelectedRoomIndex] = useState<number | null>(
    null
  );

  // Derived: Selected Room
  const selectedRoomCost =
    selectedRoomIndex !== null
      ? calculateRoomMaterials(
          analysis.rooms[selectedRoomIndex],
          settings,
          customRates
        )
      : null;

  // Chart Data
  const chartData = consolidatedReport.map((item) => ({
    name: item.category,
    value: item.cost,
  }));

  // Room Detail View
  if (selectedRoomCost && selectedRoomIndex !== null) {
    return (
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden min-h-[500px] animate-fade-in">
        <div className="bg-slate-50/80 px-6 py-4 border-b border-slate-200 flex justify-between items-center backdrop-blur-sm">
          <button
            onClick={() => setSelectedRoomIndex(null)}
            className="flex items-center text-sm font-medium text-slate-600 hover:text-indigo-600 transition-colors"
          >
            <ArrowLeft className="w-4 h-4 mr-1" /> Back to Dashboard
          </button>
          <div className="flex items-center space-x-2">
            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-100 text-indigo-700 uppercase tracking-wide">
              {analysis.rooms[selectedRoomIndex].type}
            </span>
            <h3 className="text-lg font-bold text-slate-800">
              {selectedRoomCost.roomName}
            </h3>
          </div>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-indigo-50/50 p-4 rounded-xl border border-indigo-100">
              <div className="text-xs text-slate-500 uppercase font-semibold">
                Total Cost
              </div>
              <div className="text-2xl font-bold text-indigo-700 mt-1">
                {formatCurrency(selectedRoomCost.totalCost)}
              </div>
            </div>
            <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm">
              <div className="text-xs text-slate-500 uppercase font-semibold">
                Area
              </div>
              <div className="text-xl font-medium text-slate-800 mt-1">
                {analysis.rooms[selectedRoomIndex].areaSqM.toFixed(1)}{" "}
                <span className="text-sm text-slate-400">m²</span>
              </div>
            </div>
            <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm">
              <div className="text-xs text-slate-500 uppercase font-semibold">
                Perimeter
              </div>
              <div className="text-xl font-medium text-slate-800 mt-1">
                {analysis.rooms[selectedRoomIndex].perimeterM.toFixed(1)}{" "}
                <span className="text-sm text-slate-400">m</span>
              </div>
            </div>
          </div>

          <CostTable
            materials={selectedRoomCost.materials}
            currency={settings.currency}
            onUpdateRate={onRateUpdate}
          />
        </div>
      </div>
    );
  }

  // Dashboard View
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden min-h-[500px]">
      {/* Tab Navigation */}
      <div className="border-b border-slate-200 px-6">
        <nav className="-mb-px flex space-x-8 overflow-x-auto">
          <button
            onClick={() => setActiveTab("report")}
            className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center whitespace-nowrap transition-colors ${
              activeTab === "report"
                ? "border-indigo-500 text-indigo-600"
                : "border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300"
            }`}
          >
            <BarChart3 className="w-4 h-4 mr-2" />
            Cost Overview
          </button>
          <button
            onClick={() => setActiveTab("summary")}
            className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center whitespace-nowrap transition-colors ${
              activeTab === "summary"
                ? "border-indigo-500 text-indigo-600"
                : "border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300"
            }`}
          >
            <Home className="w-4 h-4 mr-2" />
            Room Analysis
          </button>
          <button
            onClick={() => setActiveTab("materials")}
            className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center whitespace-nowrap transition-colors ${
              activeTab === "materials"
                ? "border-indigo-500 text-indigo-600"
                : "border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300"
            }`}
          >
            <List className="w-4 h-4 mr-2" />
            Full BOQ
          </button>
        </nav>
      </div>

      <div className="p-6 bg-slate-50/30">
        {activeTab === "report" && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 animate-fade-in">
            <div className="space-y-6">
              <h3 className="text-lg font-bold text-slate-800 flex items-center">
                <Layers className="w-5 h-5 mr-2 text-indigo-500" /> Cost
                Breakdown
              </h3>
              <div className="space-y-3">
                {consolidatedReport.map((item, idx) => (
                  <div
                    key={idx}
                    className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm flex items-center justify-between hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-center space-x-3">
                      <span
                        className={`w-3 h-3 rounded-full bg-indigo-${
                          ((idx % 4) + 4) * 100
                        }`}
                      ></span>
                      <span className="font-medium text-slate-700">
                        {item.category}
                      </span>
                    </div>
                    <span className="font-bold text-slate-900">
                      {formatCurrency(item.cost)}
                    </span>
                  </div>
                ))}
              </div>

              <div className="bg-blue-50/50 p-4 rounded-xl border border-blue-100 mt-4">
                <p className="text-xs text-blue-700 leading-relaxed">
                  <span className="font-bold">Note:</span> Initial structure
                  cost (foundations, columns, slabs) is distributed. Adjust
                  specific rates in the <strong>Full BOQ</strong> tab for
                  precision.
                </p>
              </div>
            </div>

            <div>
              <CostDistributionChart
                data={chartData}
                formatCurrency={formatCurrency}
              />
            </div>
          </div>
        )}

        {activeTab === "summary" && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-fade-in">
            {analysis.rooms.map((room, index) => {
              const details = calculateRoomMaterials(
                room,
                settings,
                customRates
              );
              return (
                <div
                  key={index}
                  onClick={() => setSelectedRoomIndex(index)}
                  className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm hover:shadow-md hover:border-indigo-300 cursor-pointer transition-all group"
                >
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h4 className="font-bold text-slate-800 text-lg group-hover:text-indigo-600 transition-colors">
                        {room.name}
                      </h4>
                      <span className="text-xs font-semibold bg-slate-100 text-slate-500 px-2 py-1 rounded mt-1 inline-block">
                        {room.type}
                      </span>
                    </div>
                    <div className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center text-slate-400 group-hover:bg-indigo-50 group-hover:text-indigo-500 transition-colors">
                      <ChevronRight className="w-5 h-5" />
                    </div>
                  </div>
                  <div className="flex justify-between items-end">
                    <div className="text-sm text-slate-500">
                      {room.areaSqM.toFixed(1)} m²
                    </div>
                    <div className="font-bold text-slate-900">
                      {formatCurrency(details.totalCost)}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {activeTab === "materials" && (
          <div className="animate-fade-in space-y-8">
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
              <div className="px-6 py-4 bg-slate-50 border-b border-slate-200">
                <h3 className="font-bold text-slate-800">
                  Civil & Structural Materials
                </h3>
              </div>
              <div className="p-4">
                <CostTable
                  materials={globalStructureCosts}
                  currency={settings.currency}
                  onUpdateRate={onRateUpdate}
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

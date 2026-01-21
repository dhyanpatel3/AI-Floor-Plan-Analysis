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
  currentView: "overview" | "rooms" | "boq";
  onViewChange?: (view: "overview" | "rooms" | "boq") => void;
}

export const ResultsDashboard: React.FC<ResultsDashboardProps> = ({
  analysis,
  globalStructureCosts,
  settings,
  customRates,
  onRateUpdate,
  formatCurrency,
  consolidatedReport,
  currentView,
  onViewChange,
}) => {
  const [selectedRoomIndex, setSelectedRoomIndex] = useState<number | null>(
    null
  );
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  // Derived: Selected Room
  const selectedRoomCost =
    selectedRoomIndex !== null
      ? calculateRoomMaterials(
          analysis.rooms[selectedRoomIndex],
          settings,
          customRates
        )
      : null;

  // Get materials for selected category
  const getCategoryMaterials = (category: string): MaterialCost[] => {
    const materials: MaterialCost[] = [];

    // Check if it's from global structure costs
    if (category === "Civil Structure") {
      return globalStructureCosts.filter(
        (m) => m.category === "Structure" || m.category === "Reinforcement"
      );
    }

    // Check other categories from rooms
    analysis.rooms.forEach((room) => {
      const roomDetails = calculateRoomMaterials(room, settings, customRates);
      roomDetails.materials.forEach((item) => {
        let itemCategory: string = item.category;

        if (item.category === "Finishing") {
          if (
            item.id.includes("floor") ||
            item.id.includes("tile") ||
            item.id.includes("granite")
          )
            itemCategory = "Flooring & Tiling";
          else if (
            item.id.includes("paint") ||
            item.id.includes("putty") ||
            item.id.includes("primer")
          )
            itemCategory = "Painting & Finish";
          else if (item.id.includes("door") || item.id.includes("window"))
            itemCategory = "Doors & Windows";
        } else if (item.category === "Services") {
          itemCategory = "Electrical & Plumbing";
        } else if (item.category === "Interiors") {
          itemCategory = "Flooring & Tiling";
        }

        if (itemCategory === category) {
          materials.push(item);
        }
      });
    });

    return materials;
  };

  const selectedCategoryMaterials = selectedCategory
    ? getCategoryMaterials(selectedCategory)
    : null;

  // Derived: Full BOQ (Aggregated)
  const fullProjectBOQ = React.useMemo(() => {
    const combined = new Map<string, MaterialCost>();

    // Helper to add material to map
    const addMaterial = (m: MaterialCost) => {
      if (combined.has(m.id)) {
        const existing = combined.get(m.id)!;
        combined.set(m.id, {
          ...existing,
          quantity: existing.quantity + m.quantity,
          totalCost: existing.totalCost + m.totalCost,
        });
      } else {
        combined.set(m.id, { ...m });
      }
    };

    // 1. Global Structure Costs
    globalStructureCosts.forEach(addMaterial);

    // 2. All Room Materials
    analysis.rooms.forEach((room) => {
      const roomDetails = calculateRoomMaterials(room, settings, customRates);
      roomDetails.materials.forEach(addMaterial);
    });

    return Array.from(combined.values());
  }, [globalStructureCosts, analysis.rooms, settings, customRates]);

  // Chart Data
  const chartData = consolidatedReport.map((item) => ({
    name: item.category,
    value: item.cost,
  }));

  // Room Detail View
  if (selectedRoomCost && selectedRoomIndex !== null) {
    return (
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden min-h-[500px] animate-fade-in transition-all duration-300">
        <div className="bg-slate-50/80 dark:bg-slate-900/50 px-6 py-4 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center backdrop-blur-sm">
          <button
            onClick={() => setSelectedRoomIndex(null)}
            className="flex items-center text-sm font-medium text-slate-600 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
          >
            <ArrowLeft className="w-4 h-4 mr-1" /> Back to Dashboard
          </button>
          <div className="flex items-center space-x-2">
            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-100 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300 uppercase tracking-wide">
              {analysis.rooms[selectedRoomIndex].type}
            </span>
            <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100">
              {selectedRoomCost.roomName}
            </h3>
          </div>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-indigo-50/50 dark:bg-indigo-900/20 p-4 rounded-xl border border-indigo-100 dark:border-indigo-800">
              <div className="text-xs text-slate-500 dark:text-slate-400 uppercase font-semibold">
                Total Cost
              </div>
              <div className="text-2xl font-bold text-indigo-700 dark:text-indigo-400 mt-1">
                {formatCurrency(selectedRoomCost.totalCost)}
              </div>
            </div>
            <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-100 dark:border-slate-700 shadow-sm">
              <div className="text-xs text-slate-500 dark:text-slate-400 uppercase font-semibold">
                Area
              </div>
              <div className="text-xl font-medium text-slate-800 dark:text-slate-200 mt-1">
                {analysis.rooms[selectedRoomIndex].areaSqM.toFixed(1)}{" "}
                <span className="text-sm text-slate-400 dark:text-slate-500">
                  m²
                </span>
              </div>
            </div>
            <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-100 dark:border-slate-700 shadow-sm">
              <div className="text-xs text-slate-500 dark:text-slate-400 uppercase font-semibold">
                Perimeter
              </div>
              <div className="text-xl font-medium text-slate-800 dark:text-slate-200 mt-1">
                {analysis.rooms[selectedRoomIndex].perimeterM.toFixed(1)}{" "}
                <span className="text-sm text-slate-400 dark:text-slate-500">
                  m
                </span>
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

  // Category Detail View
  if (selectedCategoryMaterials && selectedCategory) {
    const totalCategoryCost = selectedCategoryMaterials.reduce(
      (sum, m) => sum + m.totalCost,
      0
    );

    return (
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden min-h-[500px] animate-fade-in transition-all duration-300">
        <div className="bg-slate-50/80 dark:bg-slate-900/50 px-6 py-4 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center backdrop-blur-sm">
          <button
            onClick={() => setSelectedCategory(null)}
            className="flex items-center text-sm font-medium text-slate-600 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
          >
            <ArrowLeft className="w-4 h-4 mr-1" /> Back to Overview
          </button>
          <div className="flex items-center space-x-2">
            <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100">
              {selectedCategory}
            </h3>
          </div>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <div className="bg-indigo-50/50 dark:bg-indigo-900/20 p-4 rounded-xl border border-indigo-100 dark:border-indigo-800">
              <div className="text-xs text-slate-500 dark:text-slate-400 uppercase font-semibold">
                Total Cost
              </div>
              <div className="text-2xl font-bold text-indigo-700 dark:text-indigo-400 mt-1">
                {formatCurrency(totalCategoryCost)}
              </div>
            </div>
            <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-100 dark:border-slate-700 shadow-sm">
              <div className="text-xs text-slate-500 dark:text-slate-400 uppercase font-semibold">
                Total Items
              </div>
              <div className="text-xl font-medium text-slate-800 dark:text-slate-200 mt-1">
                {selectedCategoryMaterials.length}{" "}
                <span className="text-sm text-slate-400 dark:text-slate-500">
                  materials
                </span>
              </div>
            </div>
          </div>

          <CostTable
            materials={selectedCategoryMaterials}
            currency={settings.currency}
            onUpdateRate={onRateUpdate}
          />
        </div>
      </div>
    );
  }

  // Dashboard View
  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden min-h-[500px]">
      <div className="p-6 bg-white dark:bg-slate-800">
        {currentView === "overview" && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 animate-fade-in">
            <div className="space-y-6">
              <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 flex items-center">
                <Layers className="w-5 h-5 mr-2 text-indigo-500" /> Cost
                Breakdown
              </h3>
              <div className="space-y-3">
                {consolidatedReport.map((item, idx) => (
                  <div
                    key={idx}
                    onClick={() => setSelectedCategory(item.category)}
                    className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-100 dark:border-slate-700 shadow-sm flex items-center justify-between hover:shadow-md hover:border-indigo-300 dark:hover:border-indigo-500 transition-all cursor-pointer group"
                  >
                    <div className="flex items-center space-x-3">
                      <span
                        className={`w-3 h-3 rounded-full bg-indigo-${
                          ((idx % 4) + 4) * 100
                        }`}
                      ></span>
                      <span className="font-medium text-slate-700 dark:text-slate-300 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                        {item.category}
                      </span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="font-bold text-slate-900 dark:text-white">
                        {formatCurrency(item.cost)}
                      </span>
                      <ChevronRight className="w-4 h-4 text-slate-400 dark:text-slate-500 group-hover:text-indigo-500 dark:group-hover:text-indigo-400 transition-colors" />
                    </div>
                  </div>
                ))}
              </div>

              <div className="bg-blue-50/50 dark:bg-blue-900/20 p-4 rounded-xl border border-blue-100 dark:border-blue-800 mt-4">
                <p className="text-xs text-blue-700 dark:text-blue-300 leading-relaxed">
                  <span className="font-bold">Note:</span> Initial structure
                  cost (foundations, columns, slabs) is distributed. Adjust
                  specific rates in the <strong>Full BOQ</strong> tab for
                  precision.
                </p>
              </div>
            </div>

            <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-700 p-6 shadow-sm">
              <h3 className="text-sm font-semibold text-slate-500 dark:text-slate-400 mb-6">
                Cost Distribution
              </h3>
              <CostDistributionChart
                data={chartData}
                formatCurrency={formatCurrency}
              />
            </div>
          </div>
        )}

        {currentView === "rooms" && (
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
                  className="bg-white dark:bg-slate-800 p-5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-md hover:border-indigo-300 dark:hover:border-indigo-500 cursor-pointer transition-all group"
                >
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h4 className="font-bold text-slate-800 dark:text-white text-lg group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                        {room.name}
                      </h4>
                      <span className="text-xs font-semibold bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-300 px-2 py-1 rounded mt-1 inline-block">
                        {room.type}
                      </span>
                    </div>
                    <div className="w-8 h-8 rounded-full bg-slate-50 dark:bg-slate-700 flex items-center justify-center text-slate-400 dark:text-slate-500 group-hover:bg-indigo-50 dark:group-hover:bg-indigo-900/50 group-hover:text-indigo-500 dark:group-hover:text-indigo-400 transition-colors">
                      <ChevronRight className="w-5 h-5" />
                    </div>
                  </div>
                  <div className="flex justify-between items-end">
                    <div className="text-sm text-slate-500 dark:text-slate-400">
                      {room.areaSqM.toFixed(1)} m²
                    </div>
                    <div className="font-bold text-slate-900 dark:text-white">
                      {formatCurrency(details.totalCost)}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {currentView === "boq" && (
          <div className="animate-fade-in space-y-8">
            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
              <div className="px-6 py-4 bg-slate-50 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-700">
                <h3 className="font-bold text-slate-800 dark:text-white">
                  Full Project Bill of Quantities
                </h3>
              </div>
              <div className="p-4">
                <CostTable
                  materials={fullProjectBOQ}
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

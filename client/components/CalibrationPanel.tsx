import React, { useState } from "react";
import {
  Ruler,
  Settings2,
  Package,
  ChevronDown,
  ChevronRight,
} from "lucide-react";
import { ProjectSettings } from "../types";
import { MATERIAL_CATALOG } from "../constants/materials";

interface CalibrationPanelProps {
  calibrationArea: string;
  setCalibrationArea: (area: string) => void;
  areaUnit: "sqm" | "sqft";
  setAreaUnit: (unit: "sqm" | "sqft") => void;
  settings: ProjectSettings;
  setSettings: React.Dispatch<React.SetStateAction<ProjectSettings>>;
  variant?: "card" | "clean";
  customRates?: Record<string, number>;
  onRateUpdate?: (materialId: string, newRate: number) => void;
  calculatedQuantities?: Record<string, number>;
  customQuantities?: Record<string, number>;
  onQuantityUpdate?: (materialId: string, newQty: number) => void;
}

export const CalibrationPanel: React.FC<CalibrationPanelProps> = ({
  calibrationArea,
  setCalibrationArea,
  areaUnit,
  setAreaUnit,
  settings,
  setSettings,
  variant = "card",
  customRates = {},
  onRateUpdate,
  calculatedQuantities = {},
  customQuantities = {},
  onQuantityUpdate,
}) => {
  const [heightUnit, setHeightUnit] = useState<"m" | "ft">("m");

  const categories = Array.from(
    new Set(MATERIAL_CATALOG.map((m) => m.category)),
  );

  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(
    new Set(categories),
  );

  const toggleCategory = (category: string) => {
    const next = new Set(expandedCategories);
    if (next.has(category)) next.delete(category);
    else next.add(category);
    setExpandedCategories(next);
  };

  const content = (
    <div
      className={
        variant === "card"
          ? "p-6 space-y-8"
          : "p-6 space-y-8 min-h-full bg-slate-50 dark:bg-slate-900"
      }
    >
      {/* SECTION 1: GLOBAL SETTINGS */}
      <div className="space-y-4">
        <h4 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center">
          <Settings2 className="w-4 h-4 mr-2 text-indigo-500" />
          Global Parameters
        </h4>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Area Calibration */}
          <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                Total Floor Area
              </label>
              <Ruler className="w-4 h-4 text-indigo-400" />
            </div>
            <div className="relative rounded-md shadow-sm group">
              <input
                type="number"
                value={calibrationArea}
                onChange={(e) => setCalibrationArea(e.target.value)}
                className="block w-full rounded-lg border-slate-200 dark:border-slate-600 pl-3 pr-16 focus:border-indigo-500 focus:ring-indigo-500 text-sm py-2 bg-transparent text-slate-900 dark:text-white placeholder-slate-400 font-medium"
                placeholder="0.0"
              />
              <div className="absolute inset-y-0 right-0 flex items-center">
                <select
                  value={areaUnit}
                  onChange={(e) =>
                    setAreaUnit(e.target.value as "sqm" | "sqft")
                  }
                  className="h-full py-0 pl-2 pr-2 border-transparent bg-transparent text-xs font-bold text-slate-500 dark:text-slate-400 rounded-md focus:ring-indigo-500 focus:border-indigo-500 cursor-pointer hover:text-indigo-600 dark:hover:text-indigo-400"
                >
                  <option value="sqm" className="dark:bg-slate-800">
                    m²
                  </option>
                  <option value="sqft" className="dark:bg-slate-800">
                    ft²
                  </option>
                </select>
              </div>
            </div>
            <p className="text-[10px] text-slate-400 mt-2 leading-tight">
              Calibrates scale for all calculations.
            </p>
          </div>

          {/* Wall Height */}
          <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                Ceiling Height
              </label>
            </div>
            <div className="relative rounded-md shadow-sm">
              <input
                type="number"
                step="0.1"
                value={
                  heightUnit === "m"
                    ? settings.wallHeightM
                    : (settings.wallHeightM * 3.28084).toFixed(2)
                }
                onChange={(e) => {
                  const val = parseFloat(e.target.value) || 0;
                  setSettings((prev) => ({
                    ...prev,
                    wallHeightM: heightUnit === "m" ? val : val / 3.28084,
                  }));
                }}
                className="block w-full rounded-lg border-slate-200 dark:border-slate-600 pl-3 pr-16 focus:border-indigo-500 focus:ring-indigo-500 text-sm py-2 bg-transparent text-slate-900 dark:text-white font-medium"
              />
              <div className="absolute inset-y-0 right-0 flex items-center">
                <select
                  value={heightUnit}
                  onChange={(e) => setHeightUnit(e.target.value as "m" | "ft")}
                  className="h-full py-0 pl-2 pr-2 border-transparent bg-transparent text-xs font-bold text-slate-500 dark:text-slate-400 rounded-md focus:ring-indigo-500 focus:border-indigo-500 cursor-pointer hover:text-indigo-600 dark:hover:text-indigo-400"
                >
                  <option value="m" className="dark:bg-slate-800">
                    m
                  </option>
                  <option value="ft" className="dark:bg-slate-800">
                    ft
                  </option>
                </select>
              </div>
            </div>
          </div>

          {/* Currency */}
          <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                Currency
              </label>
            </div>
            <select
              value={settings.currency}
              onChange={(e) =>
                setSettings((prev) => ({ ...prev, currency: e.target.value }))
              }
              className="block w-full rounded-lg border-slate-200 dark:border-slate-600 focus:border-indigo-500 focus:ring-indigo-500 text-sm py-2 bg-transparent text-slate-900 dark:text-white font-medium"
            >
              <option value="INR" className="dark:bg-slate-800">
                INR (₹)
              </option>
              <option value="USD" className="dark:bg-slate-800">
                USD ($)
              </option>
              <option value="EUR" className="dark:bg-slate-800">
                EUR (€)
              </option>
              <option value="GBP" className="dark:bg-slate-800">
                GBP (£)
              </option>
            </select>
          </div>
        </div>
      </div>

      {/* SECTION 2: MATERIALS */}
      <div className="pt-2">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center">
            <Package className="w-4 h-4 mr-2 text-indigo-500" />
            Material Specifications
          </h3>
          <button
            onClick={() =>
              setExpandedCategories(
                expandedCategories.size === categories.length
                  ? new Set()
                  : new Set(categories),
              )
            }
            className="text-xs text-indigo-600 hover:text-indigo-700 font-medium"
          >
            {expandedCategories.size === categories.length
              ? "Collapse All"
              : "Expand All"}
          </button>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          {categories.map((category) => (
            <div
              key={category}
              className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden shadow-sm h-fit"
            >
              <button
                onClick={() => toggleCategory(category)}
                className="w-full flex items-center justify-between p-4 bg-slate-50/50 dark:bg-slate-800/50 hover:bg-slate-100 dark:hover:bg-slate-700/50 transition-colors border-b border-slate-100 dark:border-slate-700"
                type="button"
              >
                <div className="flex items-center">
                  <span
                    className={`w-2 h-2 rounded-full mr-3 ${expandedCategories.has(category) ? "bg-indigo-500" : "bg-slate-300 dark:bg-slate-600"}`}
                  ></span>
                  <span className="text-sm font-bold text-slate-700 dark:text-slate-200">
                    {category}
                  </span>
                </div>
                {expandedCategories.has(category) ? (
                  <ChevronDown className="w-4 h-4 text-slate-400" />
                ) : (
                  <ChevronRight className="w-4 h-4 text-slate-400" />
                )}
              </button>

              {expandedCategories.has(category) && (
                <div className="p-0 animate-fade-in">
                  <div className="grid grid-cols-12 gap-2 text-[10px] text-slate-400 font-bold uppercase tracking-wider bg-slate-50 dark:bg-slate-900/30 py-2 px-4 border-b border-slate-100 dark:border-slate-800">
                    <div className="col-span-6">Material Item</div>
                    <div className="col-span-3 text-right">Qty</div>
                    <div className="col-span-3 text-right">Rate</div>
                  </div>
                  <div className="divide-y divide-slate-100 dark:divide-slate-800">
                    {MATERIAL_CATALOG.filter(
                      (m) => m.category === category,
                    ).map((material) => (
                      <div
                        key={material.id}
                        className="grid grid-cols-12 gap-4 items-center py-3 px-4 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
                      >
                        <div className="col-span-6">
                          <div className="text-xs font-semibold text-slate-700 dark:text-slate-200 mb-0.5">
                            {material.name}
                          </div>
                          <div className="text-[10px] text-slate-500 dark:text-slate-400 inline-flex items-center">
                            Unit:{" "}
                            <span className="ml-1 font-mono bg-slate-100 dark:bg-slate-700 px-1 rounded text-slate-600 dark:text-slate-300">
                              {material.unit}
                            </span>
                          </div>
                        </div>
                        {/* Quantity */}
                        <div className="col-span-3 relative">
                          <input
                            type="number"
                            placeholder={(
                              calculatedQuantities[material.id] ?? 0
                            ).toFixed(0)}
                            value={customQuantities[material.id] ?? ""}
                            onChange={(e) => {
                              const val =
                                e.target.value === ""
                                  ? NaN
                                  : parseFloat(e.target.value);
                              if (!isNaN(val)) {
                                onQuantityUpdate?.(material.id, val);
                              } else {
                                onQuantityUpdate?.(material.id, 0);
                              }
                            }}
                            className={`block w-full rounded-md text-right border-0 ring-1 ring-inset ${customQuantities[material.id] !== undefined ? "ring-indigo-500 bg-indigo-50/10" : "ring-slate-300 dark:ring-slate-600 bg-transparent"} focus:ring-2 focus:ring-inset focus:ring-indigo-600 text-xs py-1.5 text-slate-900 dark:text-slate-100 placeholder:text-slate-400`}
                          />
                        </div>
                        {/* Rate */}
                        <div className="col-span-3 relative">
                          <div className="relative rounded-md shadow-sm">
                            <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-2 text-slate-400 text-xs text-[10px]">
                              {settings.currency === "INR"
                                ? "₹"
                                : settings.currency === "USD"
                                  ? "$"
                                  : settings.currency === "EUR"
                                    ? "€"
                                    : "£"}
                            </span>
                            <input
                              type="number"
                              value={
                                customRates[material.id] ?? material.defaultRate
                              }
                              onChange={(e) =>
                                onRateUpdate?.(
                                  material.id,
                                  parseFloat(e.target.value) || 0,
                                )
                              }
                              className="block w-full rounded-md text-right border-0 ring-1 ring-inset ring-slate-300 dark:ring-slate-600 bg-transparent focus:ring-2 focus:ring-inset focus:ring-indigo-600 text-xs py-1.5 pl-6 text-slate-900 dark:text-slate-100"
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  if (variant === "clean") return content;

  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden animate-fade-in">
      <div className="p-5 border-b border-slate-100 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/50 flex items-center justify-between">
        <h2 className="text-base font-semibold text-slate-800 dark:text-white flex items-center">
          <Settings2 className="w-4 h-4 mr-2 text-indigo-600 dark:text-indigo-400" />
          Project Settings
        </h2>
      </div>
      {content}
    </div>
  );
};

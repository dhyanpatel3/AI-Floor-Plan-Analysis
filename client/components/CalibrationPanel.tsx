import React from "react";
import { Ruler, Settings2 } from "lucide-react";
import { ProjectSettings } from "../types";

interface CalibrationPanelProps {
  calibrationArea: string;
  setCalibrationArea: (area: string) => void;
  settings: ProjectSettings;
  setSettings: React.Dispatch<React.SetStateAction<ProjectSettings>>;
}

export const CalibrationPanel: React.FC<CalibrationPanelProps> = ({
  calibrationArea,
  setCalibrationArea,
  settings,
  setSettings,
}) => {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden animate-fade-in">
      <div className="p-5 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
        <h2 className="text-base font-semibold text-slate-800 flex items-center">
          <Settings2 className="w-4 h-4 mr-2 text-indigo-600" />
          Project Settings
        </h2>
      </div>

      <div className="p-6 space-y-5">
        <div className="bg-indigo-50 border border-indigo-100 rounded-lg p-3 text-xs text-indigo-800 flex items-start">
          <Ruler className="w-4 h-4 mr-2 mt-0.5 flex-shrink-0" />
          <p>
            Adjust the total area below to automatically calibrate scale for all
            measurements.
          </p>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-2">
            Total Floor Area
          </label>
          <div className="relative rounded-md shadow-sm group">
            <input
              type="number"
              value={calibrationArea}
              onChange={(e) => setCalibrationArea(e.target.value)}
              className="block w-full rounded-lg border-slate-200 pl-4 pr-16 focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm py-2.5 transition-shadow"
              placeholder="0.0"
            />
            <div className="absolute inset-y-0 right-0 flex items-center pr-4 pointer-events-none">
              <span className="text-slate-400 text-sm font-medium">sq. m</span>
            </div>
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-2">
            Wall Height
          </label>
          <div className="relative rounded-md shadow-sm">
            <input
              type="number"
              step="0.1"
              value={settings.wallHeightM}
              onChange={(e) =>
                setSettings((prev) => ({
                  ...prev,
                  wallHeightM: parseFloat(e.target.value) || 0,
                }))
              }
              className="block w-full rounded-lg border-slate-200 pl-4 pr-16 focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm py-2.5 transition-shadow"
            />
            <div className="absolute inset-y-0 right-0 flex items-center pr-4 pointer-events-none">
              <span className="text-slate-400 text-sm font-medium">meters</span>
            </div>
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-2">
            Currency
          </label>
          <select
            value={settings.currency}
            onChange={(e) =>
              setSettings((prev) => ({ ...prev, currency: e.target.value }))
            }
            className="block w-full rounded-lg border-slate-200 focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm py-2.5"
          >
            <option value="INR">INR (₹)</option>
            <option value="USD">USD ($)</option>
            <option value="EUR">EUR (€)</option>
            <option value="GBP">GBP (£)</option>
          </select>
        </div>
      </div>
    </div>
  );
};

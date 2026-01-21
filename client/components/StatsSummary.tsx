import React from "react";
import { AnalysisResult } from "../types";
import { AreaChart, Layers, DollarSign } from "lucide-react";

interface StatsSummaryProps {
  analysis: AnalysisResult;
  totalCost: number;
  formatCurrency: (val: number) => string;
}

export const StatsSummary: React.FC<StatsSummaryProps> = ({
  analysis,
  totalCost,
  formatCurrency,
}) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-slide-up">
      <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 flex items-center space-x-4 hover:shadow-md dark:hover:shadow-slate-700/30 transition-all duration-300">
        <div className="w-12 h-12 bg-blue-100/50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-xl flex items-center justify-center transition-colors">
          <AreaChart size={24} />
        </div>
        <div>
          <div className="text-xs text-slate-500 dark:text-slate-400 font-semibold uppercase tracking-wider">
            Total Area
          </div>
          <div className="text-2xl font-bold text-slate-900 dark:text-white mt-1">
            {analysis.summary.totalAreaSqM.toLocaleString(undefined, {
              maximumFractionDigits: 1,
            })}
            <span className="text-sm font-normal text-slate-400 dark:text-slate-500 ml-1">
              m²
            </span>
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 flex items-center space-x-4 hover:shadow-md dark:hover:shadow-slate-700/30 transition-all duration-300">
        <div className="w-12 h-12 bg-purple-100/50 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 rounded-xl flex items-center justify-center transition-colors">
          <Layers size={24} />
        </div>
        <div>
          <div className="text-xs text-slate-500 dark:text-slate-400 font-semibold uppercase tracking-wider">
            Total Rooms
          </div>
          <div className="text-2xl font-bold text-slate-900 dark:text-white mt-1">
            {analysis.rooms.length}
            <span className="text-sm font-normal text-slate-400 dark:text-slate-500 ml-1">
              Units
            </span>
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 flex items-center space-x-4 hover:shadow-md dark:hover:shadow-slate-700/30 transition-all duration-300">
        <div className="w-12 h-12 bg-emerald-100/50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 rounded-xl flex items-center justify-center transition-colors">
          <DollarSign size={24} />
        </div>
        <div>
          <div className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold uppercase tracking-wider">
            Est. Project Cost
          </div>
          <div className="text-2xl font-bold text-slate-900 dark:text-white mt-1">
            {formatCurrency(totalCost)}
          </div>
        </div>
      </div>
    </div>
  );
};

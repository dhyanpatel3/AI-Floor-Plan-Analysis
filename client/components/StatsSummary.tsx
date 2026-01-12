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
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-fade-in-up">
      <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200 flex items-center space-x-4 hover:shadow-md transition-shadow">
        <div className="w-12 h-12 bg-blue-100/50 text-blue-600 rounded-xl flex items-center justify-center">
          <AreaChart size={24} />
        </div>
        <div>
          <div className="text-xs text-slate-500 font-semibold uppercase tracking-wider">
            Total Area
          </div>
          <div className="text-2xl font-bold text-slate-900 mt-1">
            {analysis.summary.totalAreaSqM.toLocaleString(undefined, {
              maximumFractionDigits: 1,
            })}
            <span className="text-sm font-normal text-slate-400 ml-1">m²</span>
          </div>
        </div>
      </div>

      <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200 flex items-center space-x-4 hover:shadow-md transition-shadow">
        <div className="w-12 h-12 bg-purple-100/50 text-purple-600 rounded-xl flex items-center justify-center">
          <Layers size={24} />
        </div>
        <div>
          <div className="text-xs text-slate-500 font-semibold uppercase tracking-wider">
            Total Rooms
          </div>
          <div className="text-2xl font-bold text-slate-900 mt-1">
            {analysis.rooms.length}
            <span className="text-sm font-normal text-slate-400 ml-1">
              Units
            </span>
          </div>
        </div>
      </div>

      <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200 flex items-center space-x-4 hover:shadow-md transition-shadow ring-1 ring-emerald-100">
        <div className="w-12 h-12 bg-emerald-100/50 text-emerald-600 rounded-xl flex items-center justify-center">
          <DollarSign size={24} />
        </div>
        <div>
          <div className="text-xs text-emerald-600 font-semibold uppercase tracking-wider">
            Est. Project Cost
          </div>
          <div className="text-2xl font-bold text-slate-900 mt-1">
            {formatCurrency(totalCost)}
          </div>
        </div>
      </div>
    </div>
  );
};

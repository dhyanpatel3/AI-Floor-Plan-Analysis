import React from "react";

export const Header: React.FC = () => {
  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-50 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div>
            <h1 className="text-xl font-bold bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent tracking-tight">
              AI-Floor-Plan-Analysis
            </h1>
            <p className="text-[10px] text-slate-500 font-medium uppercase tracking-wider -mt-1">
              Construction Estimator
            </p>
          </div>
        </div>
      </div>
    </header>
  );
};

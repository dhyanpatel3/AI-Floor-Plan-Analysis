import React, { useState, useEffect, useMemo } from 'react';
import { Upload, FileText, Settings, RefreshCw, ChevronRight, BarChart3, Ruler, DollarSign, Hammer, Home, ArrowLeft, FileCheck } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip, Legend } from 'recharts';
import { analyzeFloorPlan } from './services/geminiService';
import { AnalysisResult, MaterialCost, ProjectSettings, RoomCost } from './types';
import { calculateMaterials, calculateRoomMaterials } from './utils/calculationEngine';
import { CostTable } from './components/CostTable';

function App() {
  // State
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [rawAnalysis, setRawAnalysis] = useState<AnalysisResult | null>(null);
  const [calibrationArea, setCalibrationArea] = useState<string>(''); 
  const [error, setError] = useState<string | null>(null);
  const [selectedRoomIndex, setSelectedRoomIndex] = useState<number | null>(null);
  
  const [settings, setSettings] = useState<ProjectSettings>({
    currency: 'INR',
    wallHeightM: 3.0,
    brickSize: 'standard',
  });

  const [customRates, setCustomRates] = useState<Record<string, number>>({});
  const [activeTab, setActiveTab] = useState<'report' | 'summary' | 'materials'>('report');

  // Derived State: Calibrated Analysis
  const calibratedAnalysis = useMemo<AnalysisResult | null>(() => {
    if (!rawAnalysis) return null;
    const userArea = parseFloat(calibrationArea);
    if (!calibrationArea || isNaN(userArea) || userArea <= 0) return rawAnalysis;

    const scaleFactor = Math.sqrt(userArea / rawAnalysis.summary.totalAreaSqM);
    return {
      ...rawAnalysis,
      summary: {
        totalAreaSqM: userArea,
        totalWallLengthM: rawAnalysis.summary.totalWallLengthM * scaleFactor,
        wallThicknessM: rawAnalysis.summary.wallThicknessM 
      },
      rooms: rawAnalysis.rooms.map(r => ({
        ...r,
        areaSqM: r.areaSqM * (scaleFactor * scaleFactor),
        perimeterM: (r.perimeterM || Math.sqrt(r.areaSqM)*4) * scaleFactor
      }))
    };
  }, [rawAnalysis, calibrationArea]);

  // Derived State: Global Structure Costs
  const globalStructureCosts = useMemo<MaterialCost[]>(() => {
    if (!calibratedAnalysis) return [];
    return calculateMaterials(calibratedAnalysis, settings, customRates);
  }, [calibratedAnalysis, settings, customRates]);

  // Derived State: Selected Room Details
  const selectedRoomCost = useMemo<RoomCost | null>(() => {
    if (!calibratedAnalysis || selectedRoomIndex === null) return null;
    return calculateRoomMaterials(calibratedAnalysis.rooms[selectedRoomIndex], settings, customRates);
  }, [calibratedAnalysis, selectedRoomIndex, settings, customRates]);

  // Combined Total Cost (Structure + Finishing of all rooms)
  const totalProjectCost = useMemo(() => {
    if (!calibratedAnalysis) return 0;
    const structureTotal = globalStructureCosts.reduce((a, b) => a + b.totalCost, 0);
    const roomsTotal = calibratedAnalysis.rooms.reduce((acc, room) => {
      return acc + calculateRoomMaterials(room, settings, customRates).totalCost;
    }, 0);
    return structureTotal + roomsTotal;
  }, [globalStructureCosts, calibratedAnalysis, settings, customRates]);

  // Derived State: Consolidated Report (Simple Categories)
  const consolidatedReport = useMemo(() => {
    if (!calibratedAnalysis) return [];
    
    const categoryMap: Record<string, number> = {};

    // 1. Structure
    globalStructureCosts.forEach(item => {
      // Group Structure & Reinforcement
      const key = (item.category === 'Structure' || item.category === 'Reinforcement') ? 'Civil Structure' : item.category;
      categoryMap[key] = (categoryMap[key] || 0) + item.totalCost;
    });

    // 2. Finishing (Rooms)
    calibratedAnalysis.rooms.forEach(room => {
      const roomDetails = calculateRoomMaterials(room, settings, customRates);
      roomDetails.materials.forEach(item => {
        let key: string = item.category;
        // Simplify Categories
        if (item.category === 'Finishing') {
            if (item.id.includes('floor') || item.id.includes('tile') || item.id.includes('granite')) key = 'Flooring & Tiling';
            else if (item.id.includes('paint') || item.id.includes('putty') || item.id.includes('primer')) key = 'Painting & Finish';
            else if (item.id.includes('door') || item.id.includes('window')) key = 'Doors & Windows';
        }
        else if (item.category === 'Services') key = 'Electrical & Plumbing';
        else if (item.category === 'Interiors') key = 'Flooring & Tiling';

        categoryMap[key] = (categoryMap[key] || 0) + item.totalCost;
      });
    });

    return Object.entries(categoryMap)
      .map(([category, cost]) => ({ category, cost }))
      .sort((a, b) => b.cost - a.cost);
  }, [calibratedAnalysis, globalStructureCosts, settings, customRates]);

  // Handlers
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      setFile(selectedFile);
      const objectUrl = URL.createObjectURL(selectedFile);
      setPreviewUrl(objectUrl);
      setRawAnalysis(null);
      setCalibrationArea('');
      setError(null);
      setCustomRates({});
      setSelectedRoomIndex(null);
    }
  };

  const handleAnalyze = async () => {
    if (!file) return;
    setIsAnalyzing(true);
    setError(null);
    try {
      const result = await analyzeFloorPlan(file);
      setRawAnalysis(result);
      setCalibrationArea(result.summary.totalAreaSqM.toFixed(1)); 
    } catch (err: any) {
      setError(err.message || "Failed to analyze floor plan.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleRateUpdate = (id: string, newRate: number) => {
    setCustomRates(prev => ({ ...prev, [id]: newRate }));
  };

  // Helper for currency
  const formatINR = (val: number) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: settings.currency, maximumFractionDigits: 0 }).format(val);

  // Charts Data
  const chartData = useMemo(() => {
    const data: Record<string, number> = {};
    // Aggregated data for pie chart
    consolidatedReport.forEach(item => {
      data[item.category] = item.cost;
    });
    return Object.entries(data).map(([name, value]) => ({ name, value }));
  }, [consolidatedReport]);

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans">
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white">
              <Hammer size={18} />
            </div>
            <h1 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
              Structura AI
            </h1>
          </div>
          <div className="flex items-center space-x-4">
            <div className="text-xs font-mono bg-slate-100 px-2 py-1 rounded text-slate-500">
              v1.1.0 (Indian Std)
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* LEFT: Input & Preview */}
          <div className="lg:col-span-4 space-y-6">
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
              <h2 className="text-lg font-semibold mb-4 flex items-center">
                <Upload className="w-5 h-5 mr-2 text-blue-600" />
                Input Floor Plan
              </h2>
              <div className="border-2 border-dashed border-slate-300 rounded-lg p-8 text-center hover:bg-slate-50 transition-colors relative">
                 <input 
                  type="file" 
                  accept="image/*,application/pdf"
                  onChange={handleFileChange}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />
                {previewUrl ? (
                   file?.type.includes('pdf') ? (
                    <div className="flex flex-col items-center justify-center h-48">
                        <FileText className="w-16 h-16 text-red-500 mb-2" />
                        <span className="text-sm font-medium text-slate-700">{file.name}</span>
                    </div>
                   ) : (
                    <img src={previewUrl} alt="Preview" className="max-h-64 mx-auto rounded shadow-sm object-contain" />
                   )
                ) : (
                  <div className="space-y-2">
                    <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mx-auto">
                      <Upload size={20} />
                    </div>
                    <p className="text-sm font-medium text-slate-700">Click or Drag to Upload</p>
                  </div>
                )}
              </div>
              {file && (
                <button
                  onClick={handleAnalyze}
                  disabled={isAnalyzing}
                  className={`mt-4 w-full flex items-center justify-center py-2.5 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white ${
                    isAnalyzing ? 'bg-indigo-400 cursor-not-allowed' : 'bg-indigo-600 hover:bg-indigo-700'
                  }`}
                >
                  {isAnalyzing ? (
                    <><RefreshCw className="animate-spin w-4 h-4 mr-2" />Analyzing...</>
                  ) : (
                    <>Analyze Plan<ChevronRight className="w-4 h-4 ml-2" /></>
                  )}
                </button>
              )}
              {error && <div className="mt-4 p-3 bg-red-50 border border-red-100 rounded text-red-700 text-xs">{error}</div>}
            </div>

            {calibratedAnalysis && (
              <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 animate-fade-in">
                <h2 className="text-lg font-semibold mb-4 flex items-center">
                  <Ruler className="w-5 h-5 mr-2 text-blue-600" />
                  Calibration
                </h2>
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-medium text-slate-500 mb-1">Total Floor Area (m²)</label>
                    <div className="flex rounded-md shadow-sm">
                      <input
                        type="number"
                        value={calibrationArea}
                        onChange={(e) => setCalibrationArea(e.target.value)}
                        className="flex-1 block w-full rounded-none rounded-l-md border-slate-300 focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 border"
                      />
                      <span className="inline-flex items-center px-3 rounded-r-md border border-l-0 border-slate-300 bg-slate-50 text-gray-500 sm:text-sm">
                        sq. m
                      </span>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-500 mb-1">Wall Height (m)</label>
                    <div className="flex rounded-md shadow-sm">
                      <input
                        type="number"
                        step="0.1"
                        value={settings.wallHeightM}
                        onChange={(e) => setSettings(prev => ({ ...prev, wallHeightM: parseFloat(e.target.value) || 0 }))}
                        className="flex-1 block w-full rounded-none rounded-l-md border-slate-300 focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 border"
                      />
                      <span className="inline-flex items-center px-3 rounded-r-md border border-l-0 border-slate-300 bg-slate-50 text-gray-500 sm:text-sm">
                        meters
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* RIGHT: Results */}
          <div className="lg:col-span-8">
            {!calibratedAnalysis ? (
              <div className="h-full min-h-[400px] flex flex-col items-center justify-center bg-white rounded-xl border border-dashed border-slate-300 text-slate-400">
                <BarChart3 className="w-12 h-12 mb-3 opacity-50" />
                <p>Upload and analyze a floor plan to see estimates.</p>
              </div>
            ) : (
              <div className="space-y-6">
                
                {/* Stats */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                    <div className="text-xs text-slate-500 uppercase font-bold tracking-wider">Total Area</div>
                    <div className="text-2xl font-bold text-slate-900 mt-1">
                      {calibratedAnalysis.summary.totalAreaSqM.toLocaleString(undefined, { maximumFractionDigits: 1 })} <span className="text-sm font-normal text-slate-500">m²</span>
                    </div>
                  </div>
                  <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                    <div className="text-xs text-slate-500 uppercase font-bold tracking-wider">Rooms</div>
                    <div className="text-2xl font-bold text-slate-900 mt-1">{calibratedAnalysis.rooms.length}</div>
                  </div>
                  <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm col-span-2">
                    <div className="text-xs text-slate-500 uppercase font-bold tracking-wider">Total Est. Cost</div>
                    <div className="text-2xl font-bold text-blue-600 mt-1">
                      {formatINR(totalProjectCost)}
                    </div>
                  </div>
                </div>

                {/* Main Content Area */}
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden min-h-[500px]">
                  
                  {/* Room Detail View */}
                  {selectedRoomCost ? (
                    <div className="flex flex-col h-full">
                       <div className="bg-slate-50 px-6 py-4 border-b border-slate-200 flex justify-between items-center">
                          <button 
                            onClick={() => setSelectedRoomIndex(null)}
                            className="flex items-center text-sm font-medium text-blue-600 hover:text-blue-800"
                          >
                            <ArrowLeft className="w-4 h-4 mr-1" /> Back to Summary
                          </button>
                          <h3 className="text-lg font-bold text-slate-800">
                            {selectedRoomCost.roomName} Details
                          </h3>
                       </div>
                       <div className="p-6">
                          <div className="flex justify-between items-end mb-4">
                             <div>
                                <div className="text-sm text-slate-500">Finishing & Services Cost</div>
                                <div className="text-2xl font-bold text-indigo-600">
                                  {formatINR(selectedRoomCost.totalCost)}
                                </div>
                             </div>
                             <div className="text-right text-xs text-slate-400">
                                Area: {calibratedAnalysis.rooms[selectedRoomIndex!].areaSqM.toFixed(1)} m² <br/>
                                Perimeter: {calibratedAnalysis.rooms[selectedRoomIndex!].perimeterM.toFixed(1)} m
                             </div>
                          </div>
                          <CostTable materials={selectedRoomCost.materials} currency={settings.currency} onUpdateRate={handleRateUpdate} />
                       </div>
                    </div>
                  ) : (
                    // Tabs View
                    <>
                      <div className="border-b border-slate-200 px-6 pt-4">
                        <nav className="-mb-px flex space-x-8 overflow-x-auto">
                          <button onClick={() => setActiveTab('report')} className={`pb-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap ${activeTab === 'report' ? 'border-blue-500 text-blue-600' : 'border-transparent text-slate-500'}`}>
                            Cost Report
                          </button>
                          <button onClick={() => setActiveTab('summary')} className={`pb-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap ${activeTab === 'summary' ? 'border-blue-500 text-blue-600' : 'border-transparent text-slate-500'}`}>
                            Room Analysis
                          </button>
                          <button onClick={() => setActiveTab('materials')} className={`pb-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap ${activeTab === 'materials' ? 'border-blue-500 text-blue-600' : 'border-transparent text-slate-500'}`}>
                            Structural BOM
                          </button>
                        </nav>
                      </div>

                      <div className="p-6">
                        {/* 1. REPORT TAB */}
                        {activeTab === 'report' && (
                          <div className="space-y-8">
                             {/* High Level Cards */}
                             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="p-5 bg-blue-50 rounded-lg border border-blue-100 relative overflow-hidden">
                                    <div className="absolute right-0 top-0 opacity-10 p-4"><Hammer size={64} /></div>
                                    <h4 className="font-bold text-blue-900 mb-1">Structure (Skeleton)</h4>
                                    <p className="text-xs text-blue-700 mb-3 opacity-80">
                                      Civil works including Concrete, Steel, Bricks, and Plastering.
                                    </p>
                                    <div className="text-2xl font-bold text-blue-900">
                                      {formatINR(consolidatedReport.find(c => c.category === 'Civil Structure')?.cost || 0)}
                                    </div>
                                </div>
                                <div className="p-5 bg-emerald-50 rounded-lg border border-emerald-100 relative overflow-hidden">
                                    <div className="absolute right-0 top-0 opacity-10 p-4"><Home size={64} /></div>
                                    <h4 className="font-bold text-emerald-900 mb-1">Finishing & Services</h4>
                                    <p className="text-xs text-emerald-700 mb-3 opacity-80">
                                      Interiors including Flooring, Paint, Electrical, and Plumbing.
                                    </p>
                                    <div className="text-2xl font-bold text-emerald-900">
                                       {formatINR(totalProjectCost - (consolidatedReport.find(c => c.category === 'Civil Structure')?.cost || 0))}
                                    </div>
                                </div>
                             </div>

                             {/* Breakdown List */}
                             <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
                                <div className="px-4 py-3 bg-slate-50 border-b border-slate-200 font-medium text-slate-700">
                                  Category Breakdown
                                </div>
                                <div className="divide-y divide-slate-100">
                                  {consolidatedReport.map((item, idx) => (
                                    <div key={idx} className="flex items-center justify-between px-4 py-3 hover:bg-slate-50">
                                      <div className="flex items-center">
                                        <div className="w-2 h-2 rounded-full mr-3" style={{ backgroundColor: COLORS[idx % COLORS.length] }}></div>
                                        <span className="text-sm font-medium text-slate-700">{item.category}</span>
                                      </div>
                                      <div className="flex items-center space-x-6">
                                        <div className="w-24 bg-slate-100 rounded-full h-1.5 hidden sm:block">
                                          <div className="bg-slate-400 h-1.5 rounded-full" style={{ width: `${(item.cost / totalProjectCost) * 100}%`, backgroundColor: COLORS[idx % COLORS.length] }}></div>
                                        </div>
                                        <span className="text-sm text-slate-500 w-12 text-right">{((item.cost / totalProjectCost) * 100).toFixed(0)}%</span>
                                        <span className="text-sm font-bold text-slate-900 w-24 text-right">{formatINR(item.cost)}</span>
                                      </div>
                                    </div>
                                  ))}
                                  <div className="flex items-center justify-between px-4 py-4 bg-slate-50">
                                    <span className="font-bold text-slate-900">Grand Total</span>
                                    <span className="text-xl font-bold text-blue-700">{formatINR(totalProjectCost)}</span>
                                  </div>
                                </div>
                             </div>
                          </div>
                        )}

                        {/* 2. SUMMARY TAB (Room Analysis) */}
                        {activeTab === 'summary' && (
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div>
                              <h3 className="text-lg font-medium text-slate-900 mb-4">Detected Rooms</h3>
                              <p className="text-xs text-slate-500 mb-2">Click a room to see detailed finishing costs.</p>
                              <div className="space-y-2 max-h-[400px] overflow-y-auto pr-2">
                                {calibratedAnalysis.rooms.map((room, idx) => (
                                  <div 
                                    key={idx} 
                                    onClick={() => setSelectedRoomIndex(idx)}
                                    className="p-3 bg-slate-50 rounded-lg border border-slate-200 hover:border-blue-400 hover:bg-blue-50 cursor-pointer transition-all flex justify-between items-center group"
                                  >
                                    <div className="flex items-center">
                                      <Home className={`w-4 h-4 mr-3 ${room.type === 'Bathroom' ? 'text-cyan-500' : room.type === 'Kitchen' ? 'text-orange-500' : 'text-slate-400'}`} />
                                      <div>
                                        <div className="text-sm font-semibold text-slate-800">{room.name}</div>
                                        <div className="text-xs text-slate-500">{room.type} • {room.areaSqM.toFixed(1)} m²</div>
                                      </div>
                                    </div>
                                    <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-blue-500" />
                                  </div>
                                ))}
                              </div>
                            </div>
                            <div>
                              <h3 className="text-lg font-medium text-slate-900 mb-4">Cost Visualizer</h3>
                              <div className="h-64">
                                <ResponsiveContainer width="100%" height="100%">
                                  <PieChart>
                                    <Pie data={chartData} cx="50%" cy="50%" innerRadius={60} outerRadius={80} fill="#8884d8" paddingAngle={5} dataKey="value">
                                      {chartData.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                                    </Pie>
                                    <RechartsTooltip formatter={(value) => formatINR(value as number)} />
                                    <Legend verticalAlign="bottom" height={36} />
                                  </PieChart>
                                </ResponsiveContainer>
                              </div>
                            </div>
                          </div>
                        )}

                        {/* 3. MATERIALS TAB (Structure BOM) */}
                        {activeTab === 'materials' && (
                          <div className="space-y-4">
                             <div className="p-4 bg-yellow-50 text-yellow-800 text-sm rounded-lg mb-4 flex items-start">
                                <FileCheck className="w-5 h-5 mr-2 mt-0.5 flex-shrink-0" />
                                <div>
                                  <strong>Structural Bill of Materials (BOM)</strong><br/>
                                  This list covers the core structural materials (Concrete, Brick, Steel, Sand) required to build the frame of the building. 
                                  Finishing items are listed under individual rooms in the 'Room Analysis' tab.
                                </div>
                             </div>
                            <CostTable materials={globalStructureCosts} currency={settings.currency} onUpdateRate={handleRateUpdate} />
                          </div>
                        )}
                      </div>
                    </>
                  )}
                </div>

              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

export default App;
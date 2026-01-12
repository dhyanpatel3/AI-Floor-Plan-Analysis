export interface AnalysisResult {
  summary: {
    totalAreaSqM: number;
    totalWallLengthM: number;
    wallThicknessM: number;
  };
  rooms: Array<{
    name: string;
    areaSqM: number;
    perimeterM: number; // Added perimeter for accurate wall calculations
    type: 'Bedroom' | 'Kitchen' | 'Bathroom' | 'Living' | 'Dining' | 'Corridor' | 'Other';
  }>;
  elements: {
    doors: number;
    windows: number;
  };
}

export interface MaterialCost {
  id: string;
  category: 'Structure' | 'Finishing' | 'Reinforcement' | 'Services' | 'Interiors';
  name: string;
  unit: string;
  quantity: number;
  unitRate: number;
  totalCost: number;
}

export interface RoomCost {
  roomName: string;
  totalCost: number;
  materials: MaterialCost[];
}

export interface ProjectSettings {
  currency: string;
  wallHeightM: number;
  brickSize: 'standard' | 'modular';
}

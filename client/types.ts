export interface AnalysisResult {
  summary: {
    totalAreaSqFt: number;
    totalWallLengthFt: number;
    wallThicknessFt: number;
    // Legacy fields
    totalAreaSqM?: number;
    totalWallLengthM?: number;
    wallThicknessM?: number;
  };
  rooms: Array<{
    name: string;
    areaSqFt: number;
    perimeterFt: number; // Added perimeter for accurate wall calculations
    type:
      | "Bedroom"
      | "Kitchen"
      | "Bathroom"
      | "Living"
      | "Dining"
      | "Corridor"
      | "Other";
    // Legacy fields
    areaSqM?: number;
    perimeterM?: number;
  }>;
  elements: {
    doors: number;
    windows: number;
  };
}

export interface MaterialCost {
  id: string;
  category:
    | "Structure"
    | "Finishing"
    | "Reinforcement"
    | "Services"
    | "Interiors";
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
  wallHeightFt: number;
  brickSize: "standard" | "modular";
}

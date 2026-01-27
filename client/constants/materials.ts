export interface MaterialDefinition {
  id: string;
  name: string;
  unit: string;
  category:
    | "Structure"
    | "Finishing"
    | "Reinforcement"
    | "Services"
    | "Interiors";
  defaultRate: number;
}

export const MATERIAL_CATALOG: MaterialDefinition[] = [
  // Structure
  {
    id: "cement",
    name: "Cement (Ultratech/ACC)",
    unit: "Bags",
    category: "Structure",
    defaultRate: 390,
  },
  {
    id: "steel",
    name: "TMT Steel Bars (Fe550)",
    unit: "Kg",
    category: "Reinforcement",
    defaultRate: 72,
  },
  {
    id: "sand",
    name: "M-Sand / River Sand",
    unit: "Cubic Ft",
    category: "Structure",
    defaultRate: 65,
  },
  {
    id: "aggregate",
    name: "Aggregate (20mm)",
    unit: "Cubic Ft",
    category: "Structure",
    defaultRate: 45,
  },
  {
    id: "bricks",
    name: "Red Clay Bricks",
    unit: "Nos",
    category: "Structure",
    defaultRate: 10,
  },

  // Flooring & Wall
  {
    id: "flooring_vitrified",
    name: "Vitrified Floor Tiles",
    unit: "Sq. Ft",
    category: "Finishing",
    defaultRate: 65,
  },
  {
    id: "flooring_antiskid",
    name: "Anti-Skid Floor Tiles",
    unit: "Sq. Ft",
    category: "Finishing",
    defaultRate: 55,
  },
  {
    id: "wall_tiles_bath",
    name: "Wall Tiles (Ceramic)",
    unit: "Sq. Ft",
    category: "Finishing",
    defaultRate: 50,
  },
  {
    id: "wall_tiles_kitchen",
    name: "Dado Wall Tiles",
    unit: "Sq. Ft",
    category: "Finishing",
    defaultRate: 60,
  },
  {
    id: "granite",
    name: "Granite Countertop",
    unit: "Sq. Ft",
    category: "Interiors",
    defaultRate: 180,
  },

  // Paint
  {
    id: "putty",
    name: "Wall Putty (2 Coats)",
    unit: "Kg",
    category: "Finishing",
    defaultRate: 30,
  },
  {
    id: "primer",
    name: "Primer",
    unit: "Liters",
    category: "Finishing",
    defaultRate: 220,
  },
  {
    id: "paint_emulsion",
    name: "Emulsion Paint",
    unit: "Liters",
    category: "Finishing",
    defaultRate: 350,
  },

  // Fixtures
  {
    id: "door_flush",
    name: "Flush Door (Laminate)",
    unit: "Nos",
    category: "Finishing",
    defaultRate: 8000,
  },
  {
    id: "door_toilet",
    name: "PVC/WPC Door",
    unit: "Nos",
    category: "Finishing",
    defaultRate: 4500,
  },
  {
    id: "window_upvc",
    name: "UPVC Windows",
    unit: "Sq. Ft",
    category: "Finishing",
    defaultRate: 600,
  },

  // Plumbing/Sanitary
  {
    id: "wc_ewc",
    name: "EWC / Commode",
    unit: "Nos",
    category: "Services",
    defaultRate: 12000,
  },
  {
    id: "wash_basin",
    name: "Wash Basin",
    unit: "Nos",
    category: "Services",
    defaultRate: 4000,
  },
  {
    id: "kitchen_sink",
    name: "SS Sink",
    unit: "Nos",
    category: "Services",
    defaultRate: 6000,
  },
  {
    id: "taps_mixer",
    name: "Taps & Mixers (Set)",
    unit: "Set",
    category: "Services",
    defaultRate: 3500,
  },
  {
    id: "plumbing_point",
    name: "Plumbing Points",
    unit: "Pts",
    category: "Services",
    defaultRate: 1500,
  },

  // Electrical
  {
    id: "electrical_point",
    name: "Electrical Points",
    unit: "Pts",
    category: "Services",
    defaultRate: 850,
  },
];

export const getMaterialDefaultRate = (id: string) => {
  return MATERIAL_CATALOG.find((m) => m.id === id)?.defaultRate || 0;
};

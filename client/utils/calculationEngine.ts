import { AnalysisResult, MaterialCost, ProjectSettings, RoomCost } from "../types";

// Indian Construction Standards
const SQFT_PER_M2 = 10.7639;
const BRICKS_PER_M3 = 500; 
const STEEL_KG_PER_SQFT = 3.5; 

// --- Rate Database (INR) ---
const RATES: Record<string, number> = {
  // Structure
  'cement': 390,
  'steel': 72,
  'sand': 65,
  'aggregate': 45,
  'bricks': 10,
  
  // Flooring & Wall
  'flooring_vitrified': 65, // Tiles
  'flooring_antiskid': 55,  // Bath/Balcony
  'wall_tiles_bath': 50,    // Ceramic
  'wall_tiles_kitchen': 60, // Dado
  'granite': 180,           // Kitchen Counter
  
  // Paint
  'paint_emulsion': 350,
  'putty': 30,
  'primer': 220,

  // Fixtures
  'door_flush': 8000,
  'door_toilet': 4500,
  'window_upvc': 600, // per sqft
  
  // Plumbing/Sanitary
  'wc_ewc': 12000,
  'wash_basin': 4000,
  'kitchen_sink': 6000,
  'taps_mixer': 3500,
  'plumbing_point': 1500, // per point

  // Electrical
  'electrical_point': 850, // per point (wiring+switch)
};

/**
 * Calculates global material quantities (Structure mainly)
 */
export const calculateMaterials = (
  analysis: AnalysisResult,
  settings: ProjectSettings,
  currentRates: Record<string, number>
): MaterialCost[] => {
  const { totalWallLengthM, totalAreaSqM, wallThicknessM } = analysis.summary;
  const wallHeight = settings.wallHeightM;
  const totalAreaSqFt = totalAreaSqM * SQFT_PER_M2;

  // 1. Structure Volume
  const grossWallVol = totalWallLengthM * wallHeight * wallThicknessM;
  const openingVol = ((analysis.elements.doors * 1.89) + (analysis.elements.windows * 1.8)) * wallThicknessM;
  const netBrickworkVol = Math.max(0, grossWallVol - openingVol);
  
  // Concrete (Slab + Columns + Beams) -> Approx 0.17 m3 per m2 area
  const totalConcreteVol = totalAreaSqM * 0.17;

  // 2. Quantities
  const numBricks = Math.ceil(netBrickworkVol * BRICKS_PER_M3);
  const totalCementBags = Math.ceil((netBrickworkVol * 1.26) + (totalConcreteVol * 8.0) + (totalWallLengthM * wallHeight * 2 * 0.015 * 0.15 * 28)); // Includes plaster
  const totalSteelKg = Math.ceil(totalAreaSqFt * STEEL_KG_PER_SQFT);
  const totalSandCft = Math.ceil((netBrickworkVol * 6) + (totalConcreteVol * 15) + (totalWallLengthM * wallHeight * 2 * 0.015 * 1.2 * 35));
  const totalAggCft = Math.ceil(totalConcreteVol * 30);

  // 3. Construct Items
  const items: Partial<MaterialCost>[] = [
    { id: 'cement', category: 'Structure', name: 'Cement (Ultratech/ACC)', unit: 'Bags', quantity: totalCementBags },
    { id: 'steel', category: 'Reinforcement', name: 'TMT Steel Bars (Fe550)', unit: 'Kg', quantity: totalSteelKg },
    { id: 'sand', category: 'Structure', name: 'M-Sand / River Sand', unit: 'Cubic Ft', quantity: totalSandCft },
    { id: 'aggregate', category: 'Structure', name: 'Aggregate (20mm)', unit: 'Cubic Ft', quantity: totalAggCft },
    { id: 'bricks', category: 'Structure', name: 'Red Clay Bricks', unit: 'Nos', quantity: numBricks },
  ];

  return items.map(item => {
    const rate = currentRates[item.id!] ?? RATES[item.id!] ?? 0;
    return {
      id: item.id!,
      category: item.category!,
      name: item.name!,
      unit: item.unit!,
      quantity: item.quantity!,
      unitRate: rate,
      totalCost: item.quantity! * rate
    };
  });
};

/**
 * Calculates specific finishing materials for a single room based on its type
 */
export const calculateRoomMaterials = (
  room: AnalysisResult['rooms'][0], 
  settings: ProjectSettings,
  currentRates: Record<string, number>
): RoomCost => {
  const areaSqFt = room.areaSqM * SQFT_PER_M2;
  const perimeterFt = room.perimeterM * 3.28084;
  const wallAreaSqFt = perimeterFt * (settings.wallHeightM * 3.28084);
  
  const items: Partial<MaterialCost>[] = [];

  // 1. Flooring
  if (room.type === 'Bathroom') {
    items.push({ id: 'flooring_antiskid', category: 'Finishing', name: 'Anti-Skid Floor Tiles', unit: 'Sq. Ft', quantity: Math.ceil(areaSqFt * 1.1) });
    // Wall Tiles (7ft height)
    const tileHeight = 7;
    items.push({ id: 'wall_tiles_bath', category: 'Finishing', name: 'Wall Tiles (Ceramic)', unit: 'Sq. Ft', quantity: Math.ceil(perimeterFt * tileHeight) });
    // Plumbing
    items.push({ id: 'wc_ewc', category: 'Services', name: 'EWC / Commode', unit: 'Nos', quantity: 1 });
    items.push({ id: 'wash_basin', category: 'Services', name: 'Wash Basin', unit: 'Nos', quantity: 1 });
    items.push({ id: 'taps_mixer', category: 'Services', name: 'Taps & Mixers (Set)', unit: 'Set', quantity: 1 });
    items.push({ id: 'plumbing_point', category: 'Services', name: 'Plumbing Points (Inlet/Outlet)', unit: 'Pts', quantity: 5 }); // WC, Basin, Shower(2), Geyser
    items.push({ id: 'door_toilet', category: 'Finishing', name: 'PVC/WPC Door', unit: 'Nos', quantity: 1 });
  } 
  else if (room.type === 'Kitchen') {
    items.push({ id: 'flooring_vitrified', category: 'Finishing', name: 'Vitrified Floor Tiles', unit: 'Sq. Ft', quantity: Math.ceil(areaSqFt * 1.1) });
    // Countertop (Assume L shape approx 50% perimeter)
    const counterLenFt = perimeterFt * 0.5;
    items.push({ id: 'granite', category: 'Interiors', name: 'Granite Countertop', unit: 'Sq. Ft', quantity: Math.ceil(counterLenFt * 2.5) }); // 2.5ft width
    // Dado Tiles (2ft above counter)
    items.push({ id: 'wall_tiles_kitchen', category: 'Finishing', name: 'Dado Wall Tiles', unit: 'Sq. Ft', quantity: Math.ceil(counterLenFt * 2) });
    items.push({ id: 'kitchen_sink', category: 'Services', name: 'SS Sink', unit: 'Nos', quantity: 1 });
    items.push({ id: 'taps_mixer', category: 'Services', name: 'Sink Mixer/Tap', unit: 'Nos', quantity: 1 });
    items.push({ id: 'plumbing_point', category: 'Services', name: 'Plumbing Points', unit: 'Pts', quantity: 3 }); // Sink, RO, Dishwasher
  } 
  else {
    // Living / Bedroom / Dining
    items.push({ id: 'flooring_vitrified', category: 'Finishing', name: 'Vitrified Floor Tiles', unit: 'Sq. Ft', quantity: Math.ceil(areaSqFt * 1.05) });
    // Paint (Wall + Ceiling)
    const paintArea = (wallAreaSqFt * 0.85) + areaSqFt; // Deduct 15% for doors/windows approx
    items.push({ id: 'putty', category: 'Finishing', name: 'Wall Putty (2 Coats)', unit: 'Kg', quantity: Math.ceil(paintArea / 14) });
    items.push({ id: 'primer', category: 'Finishing', name: 'Primer', unit: 'Liters', quantity: Math.ceil(paintArea / 140) });
    items.push({ id: 'paint_emulsion', category: 'Finishing', name: 'Emulsion Paint', unit: 'Liters', quantity: Math.ceil(paintArea / 120) });
    
    // Door (1 per room roughly)
    if (room.type === 'Bedroom') {
         items.push({ id: 'door_flush', category: 'Finishing', name: 'Flush Door (Laminate)', unit: 'Nos', quantity: 1 });
    }
  }

  // Electrical (Thumb rules)
  let elecPoints = 0;
  if (room.type === 'Bedroom') elecPoints = 8; // 2 Light, 1 Fan, 2 Plug, 1 AC, 1 TV, 1 Bedside
  else if (room.type === 'Living') elecPoints = 12; // More lights, TV, WiFi
  else if (room.type === 'Kitchen') elecPoints = 6; // Light, Exhaust, Mixer, Fridge, Oven, RO
  else if (room.type === 'Bathroom') elecPoints = 3; // Light, Exhaust, Geyser
  else elecPoints = 4;

  if (elecPoints > 0) {
    items.push({ id: 'electrical_point', category: 'Services', name: 'Electrical Points (Wiring+Switch)', unit: 'Pts', quantity: elecPoints });
  }

  // Calculate Costs
  const finalList = items.map(item => {
    const rate = currentRates[item.id!] ?? RATES[item.id!] ?? 0;
    return {
      id: item.id!,
      category: item.category!,
      name: item.name!,
      unit: item.unit!,
      quantity: item.quantity!,
      unitRate: rate,
      totalCost: item.quantity! * rate
    } as MaterialCost;
  });

  const total = finalList.reduce((acc, curr) => acc + curr.totalCost, 0);

  return {
    roomName: room.name || room.type,
    totalCost: total,
    materials: finalList
  };
};

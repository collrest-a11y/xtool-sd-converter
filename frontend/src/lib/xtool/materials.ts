/**
 * xTool Material Database
 * Comprehensive material profiles for laser cutting and engraving
 */

import type { MaterialProfile, XToolMachine, XToolMachineId } from './types';

// Common xTool machines database
export const XTOOL_MACHINES: Record<XToolMachineId, XToolMachine> = {
  'xtool-d1': {
    id: 'xtool-d1',
    name: 'xTool D1',
    workArea: { width: 432, height: 406 },
    powerRange: { min: 1, max: 100 },
    speedRange: { min: 1, max: 20000 },
    supportedMaterials: ['wood', 'acrylic', 'leather', 'fabric', 'paper'],
    features: ['air-assist', 'auto-focus', 'safety-sensors']
  },
  'xtool-d1-pro': {
    id: 'xtool-d1-pro',
    name: 'xTool D1 Pro',
    workArea: { width: 432, height: 950 },
    powerRange: { min: 1, max: 100 },
    speedRange: { min: 1, max: 20000 },
    supportedMaterials: ['wood', 'acrylic', 'leather', 'fabric', 'paper', 'metal'],
    features: ['air-assist', 'auto-focus', 'safety-sensors', 'infrared-module']
  },
  'xtool-m1': {
    id: 'xtool-m1',
    name: 'xTool M1',
    workArea: { width: 385, height: 385 },
    powerRange: { min: 1, max: 100 },
    speedRange: { min: 1, max: 15000 },
    supportedMaterials: ['wood', 'acrylic', 'leather', 'fabric', 'paper'],
    features: ['ultra-compact', 'blade-cutting', 'pen-drawing']
  },
  'xtool-p2': {
    id: 'xtool-p2',
    name: 'xTool P2',
    workArea: { width: 600, height: 308 },
    powerRange: { min: 1, max: 100 },
    speedRange: { min: 1, max: 25000 },
    supportedMaterials: ['wood', 'acrylic', 'leather', 'fabric', 'paper', 'metal'],
    features: ['enclosed-design', 'camera-positioning', 'pass-through', 'rotary-support']
  }
};

// Material profiles database
export const MATERIAL_PROFILES: Record<string, MaterialProfile> = {
  // Wood Materials
  'basswood-3mm': {
    id: 'basswood-3mm',
    name: 'Basswood 3mm',
    category: 'wood',
    thickness: 3,
    density: 0.35,
    cutSettings: {
      power: 100,
      speed: 200,
      passes: 1,
      airAssist: true
    },
    engraveSettings: {
      power: 35,
      speed: 1500,
      passes: 1,
      airAssist: false
    },
    safetyNotes: ['Use air assist for cutting', 'Good ventilation required'],
    maxPasses: 3
  },
  'plywood-3mm': {
    id: 'plywood-3mm',
    name: 'Plywood 3mm',
    category: 'wood',
    thickness: 3,
    density: 0.5,
    cutSettings: {
      power: 100,
      speed: 150,
      passes: 1,
      airAssist: true
    },
    engraveSettings: {
      power: 40,
      speed: 1200,
      passes: 1,
      airAssist: false
    },
    safetyNotes: ['May contain formaldehyde', 'Use air assist', 'Good ventilation required'],
    maxPasses: 2
  },
  'mdf-3mm': {
    id: 'mdf-3mm',
    name: 'MDF 3mm',
    category: 'wood',
    thickness: 3,
    density: 0.75,
    cutSettings: {
      power: 100,
      speed: 100,
      passes: 1,
      airAssist: true
    },
    engraveSettings: {
      power: 45,
      speed: 1000,
      passes: 1,
      airAssist: true
    },
    safetyNotes: ['Contains formaldehyde', 'Use air assist', 'Excellent ventilation required'],
    maxPasses: 2
  },

  // Acrylic Materials
  'acrylic-clear-3mm': {
    id: 'acrylic-clear-3mm',
    name: 'Clear Acrylic 3mm',
    category: 'acrylic',
    thickness: 3,
    density: 1.18,
    cutSettings: {
      power: 70,
      speed: 300,
      passes: 1,
      airAssist: false
    },
    engraveSettings: {
      power: 30,
      speed: 2000,
      passes: 1,
      airAssist: false
    },
    safetyNotes: ['Flame polished edges', 'No air assist for cutting'],
    maxPasses: 1
  },
  'acrylic-frosted-3mm': {
    id: 'acrylic-frosted-3mm',
    name: 'Frosted Acrylic 3mm',
    category: 'acrylic',
    thickness: 3,
    density: 1.18,
    cutSettings: {
      power: 75,
      speed: 250,
      passes: 1,
      airAssist: false
    },
    engraveSettings: {
      power: 25,
      speed: 2500,
      passes: 1,
      airAssist: false
    },
    safetyNotes: ['Creates visible white marks when engraved', 'No air assist for cutting'],
    maxPasses: 1
  },

  // Leather Materials
  'leather-2mm': {
    id: 'leather-2mm',
    name: 'Leather 2mm',
    category: 'leather',
    thickness: 2,
    density: 0.85,
    cutSettings: {
      power: 60,
      speed: 400,
      passes: 1,
      airAssist: true
    },
    engraveSettings: {
      power: 20,
      speed: 3000,
      passes: 1,
      airAssist: false
    },
    safetyNotes: ['Use vegetable-tanned leather only', 'Chrome-tanned leather produces toxic fumes'],
    maxPasses: 2
  },

  // Fabric Materials
  'felt-3mm': {
    id: 'felt-3mm',
    name: 'Felt 3mm',
    category: 'fabric',
    thickness: 3,
    density: 0.25,
    cutSettings: {
      power: 30,
      speed: 800,
      passes: 1,
      airAssist: true
    },
    engraveSettings: {
      power: 15,
      speed: 4000,
      passes: 1,
      airAssist: false
    },
    safetyNotes: ['Natural fibers only', 'Synthetic materials may melt'],
    maxPasses: 1
  },
  'denim-1mm': {
    id: 'denim-1mm',
    name: 'Denim 1mm',
    category: 'fabric',
    thickness: 1,
    density: 0.5,
    cutSettings: {
      power: 25,
      speed: 1000,
      passes: 1,
      airAssist: true
    },
    engraveSettings: {
      power: 12,
      speed: 5000,
      passes: 1,
      airAssist: false
    },
    safetyNotes: ['100% cotton recommended', 'Avoid synthetic blends'],
    maxPasses: 1
  },

  // Paper Materials
  'cardstock-0.3mm': {
    id: 'cardstock-0.3mm',
    name: 'Cardstock 0.3mm',
    category: 'paper',
    thickness: 0.3,
    density: 0.8,
    cutSettings: {
      power: 15,
      speed: 2000,
      passes: 1,
      airAssist: false
    },
    engraveSettings: {
      power: 8,
      speed: 8000,
      passes: 1,
      airAssist: false
    },
    safetyNotes: ['Low power to avoid burning', 'Watch for charring'],
    maxPasses: 1
  },
  'corrugated-cardboard-3mm': {
    id: 'corrugated-cardboard-3mm',
    name: 'Corrugated Cardboard 3mm',
    category: 'paper',
    thickness: 3,
    density: 0.15,
    cutSettings: {
      power: 40,
      speed: 500,
      passes: 1,
      airAssist: true
    },
    engraveSettings: {
      power: 20,
      speed: 2000,
      passes: 1,
      airAssist: false
    },
    safetyNotes: ['Air assist helps with debris', 'May need multiple passes for thick cardboard'],
    maxPasses: 2
  }
};

/**
 * Get all materials compatible with a specific machine
 */
export function getCompatibleMaterials(machineId: XToolMachineId): MaterialProfile[] {
  const machine = XTOOL_MACHINES[machineId];
  if (!machine) {
    throw new Error(`Unknown machine: ${machineId}`);
  }

  return Object.values(MATERIAL_PROFILES).filter(material =>
    machine.supportedMaterials.includes(material.category)
  );
}

/**
 * Get materials by category
 */
export function getMaterialsByCategory(category: MaterialProfile['category']): MaterialProfile[] {
  return Object.values(MATERIAL_PROFILES).filter(material => material.category === category);
}

/**
 * Find material by thickness and category
 */
export function findMaterialByThickness(
  category: MaterialProfile['category'],
  thickness: number,
  tolerance: number = 0.5
): MaterialProfile[] {
  return Object.values(MATERIAL_PROFILES).filter(material =>
    material.category === category &&
    Math.abs(material.thickness - thickness) <= tolerance
  );
}

/**
 * Get recommended settings for a material and operation
 */
export function getRecommendedSettings(
  materialId: string,
  operation: 'cut' | 'engrave'
): { power: number; speed: number; passes: number; airAssist?: boolean } | null {
  const material = MATERIAL_PROFILES[materialId];
  if (!material) {
    return null;
  }

  return operation === 'cut' ? material.cutSettings : material.engraveSettings;
}

/**
 * Validate material compatibility with machine
 */
export function validateMaterialCompatibility(
  materialId: string,
  machineId: XToolMachineId
): { compatible: boolean; issues: string[] } {
  const material = MATERIAL_PROFILES[materialId];
  const machine = XTOOL_MACHINES[machineId];
  const issues: string[] = [];

  if (!material) {
    issues.push(`Unknown material: ${materialId}`);
    return { compatible: false, issues };
  }

  if (!machine) {
    issues.push(`Unknown machine: ${machineId}`);
    return { compatible: false, issues };
  }

  if (!machine.supportedMaterials.includes(material.category)) {
    issues.push(`Material category '${material.category}' not supported by ${machine.name}`);
  }

  // Check if settings are within machine limits
  const cutSettings = material.cutSettings;
  const engraveSettings = material.engraveSettings;

  if (cutSettings.power > machine.powerRange.max || cutSettings.power < machine.powerRange.min) {
    issues.push(`Cut power ${cutSettings.power}% outside machine range (${machine.powerRange.min}-${machine.powerRange.max}%)`);
  }

  if (cutSettings.speed > machine.speedRange.max || cutSettings.speed < machine.speedRange.min) {
    issues.push(`Cut speed ${cutSettings.speed}mm/min outside machine range (${machine.speedRange.min}-${machine.speedRange.max}mm/min)`);
  }

  if (engraveSettings.power > machine.powerRange.max || engraveSettings.power < machine.powerRange.min) {
    issues.push(`Engrave power ${engraveSettings.power}% outside machine range (${machine.powerRange.min}-${machine.powerRange.max}%)`);
  }

  if (engraveSettings.speed > machine.speedRange.max || engraveSettings.speed < machine.speedRange.min) {
    issues.push(`Engrave speed ${engraveSettings.speed}mm/min outside machine range (${machine.speedRange.min}-${machine.speedRange.max}mm/min)`);
  }

  return { compatible: issues.length === 0, issues };
}

/**
 * Create a custom material profile
 */
export function createCustomMaterial(
  id: string,
  name: string,
  category: MaterialProfile['category'],
  thickness: number,
  cutPower: number,
  cutSpeed: number,
  engravePower: number,
  engraveSpeed: number
): MaterialProfile {
  return {
    id,
    name,
    category,
    thickness,
    density: 0.5, // Default density
    cutSettings: {
      power: cutPower,
      speed: cutSpeed,
      passes: 1,
      airAssist: category === 'wood' || category === 'fabric'
    },
    engraveSettings: {
      power: engravePower,
      speed: engraveSpeed,
      passes: 1,
      airAssist: false
    },
    safetyNotes: ['Custom material - test settings before use'],
    maxPasses: 3
  };
}

/**
 * Get all available machine IDs
 */
export function getAvailableMachines(): XToolMachine[] {
  return Object.values(XTOOL_MACHINES);
}

/**
 * Get machine by ID
 */
export function getMachine(machineId: XToolMachineId): XToolMachine | null {
  return XTOOL_MACHINES[machineId] || null;
}

/**
 * Get material by ID
 */
export function getMaterial(materialId: string): MaterialProfile | null {
  return MATERIAL_PROFILES[materialId] || null;
}

/**
 * Calculate estimated cutting time
 */
export function estimateCuttingTime(
  pathLength: number, // mm
  settings: { speed: number; passes: number }
): number {
  // Basic time estimation: path length / speed * passes + setup time
  const cuttingTime = (pathLength / settings.speed) * settings.passes; // minutes
  const setupTime = 0.5; // minutes for acceleration/deceleration
  return cuttingTime + setupTime;
}

/**
 * Calculate estimated power consumption
 */
export function estimatePowerConsumption(
  cuttingTime: number, // minutes
  power: number, // %
  machineId: XToolMachineId
): number {
  // Rough estimation based on typical laser power consumption
  const basePowerWatts = 40; // Typical diode laser power consumption
  const laserPowerWatts = basePowerWatts * (power / 100);
  const timeHours = cuttingTime / 60;
  return laserPowerWatts * timeHours; // Wh
}
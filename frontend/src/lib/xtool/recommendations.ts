/**
 * xTool Power and Speed Recommendation Engine
 * Provides intelligent recommendations for laser settings based on material and operation
 */

import type {
  PowerSpeedRecommendation,
  OptimizationRecommendation,
  MaterialProfile,
  XToolMachine,
  LaserSettings,
  XToolMachineId
} from './types';
import { MATERIAL_PROFILES, XTOOL_MACHINES, validateMaterialCompatibility } from './materials';

/**
 * Material property modifiers for different thicknesses
 */
const THICKNESS_MODIFIERS: Record<string, { cut: number; engrave: number }> = {
  'wood': { cut: 1.2, engrave: 1.1 },
  'acrylic': { cut: 1.3, engrave: 1.0 },
  'leather': { cut: 1.1, engrave: 1.0 },
  'fabric': { cut: 1.0, engrave: 0.9 },
  'paper': { cut: 0.8, engrave: 0.8 },
  'metal': { cut: 2.0, engrave: 1.5 }
};

/**
 * Quality level modifiers
 */
const QUALITY_MODIFIERS: Record<string, { power: number; speed: number }> = {
  'draft': { power: 0.8, speed: 1.5 },
  'normal': { power: 1.0, speed: 1.0 },
  'high': { power: 1.1, speed: 0.8 },
  'ultra': { power: 1.2, speed: 0.6 }
};

/**
 * Calculate adjusted settings for different thickness
 */
function adjustForThickness(
  baseSettings: LaserSettings,
  baseMaterial: MaterialProfile,
  targetThickness: number,
  operation: 'cut' | 'engrave'
): LaserSettings {
  const thicknessRatio = targetThickness / baseMaterial.thickness;
  const modifier = THICKNESS_MODIFIERS[baseMaterial.category][operation];

  let adjustedPower = baseSettings.power * Math.pow(thicknessRatio, modifier);
  let adjustedSpeed = baseSettings.speed / Math.pow(thicknessRatio, modifier * 0.5);

  // Keep within reasonable bounds
  adjustedPower = Math.max(1, Math.min(100, adjustedPower));
  adjustedSpeed = Math.max(10, Math.min(20000, adjustedSpeed));

  return {
    ...baseSettings,
    power: Math.round(adjustedPower),
    speed: Math.round(adjustedSpeed)
  };
}

/**
 * Find similar materials for recommendations
 */
function findSimilarMaterials(
  category: MaterialProfile['category'],
  thickness: number,
  tolerance: number = 1.0
): MaterialProfile[] {
  return Object.values(MATERIAL_PROFILES).filter(material =>
    material.category === category &&
    Math.abs(material.thickness - thickness) <= tolerance
  );
}

/**
 * Generate power and speed recommendations
 */
export function generatePowerSpeedRecommendation(
  materialId: string,
  thickness: number,
  operation: 'cut' | 'engrave' | 'score',
  machineId: XToolMachineId,
  quality: 'draft' | 'normal' | 'high' | 'ultra' = 'normal'
): PowerSpeedRecommendation {
  const machine = XTOOL_MACHINES[machineId];
  if (!machine) {
    throw new Error(`Unknown machine: ${machineId}`);
  }

  // Try to find exact material match
  let material = MATERIAL_PROFILES[materialId];
  let confidence = 1.0;
  let notes: string[] = [];

  if (!material) {
    // If exact material not found, try to infer from ID
    const parts = materialId.split('-');
    const category = parts[0] as MaterialProfile['category'];

    if (category && THICKNESS_MODIFIERS[category]) {
      const similarMaterials = findSimilarMaterials(category, thickness);

      if (similarMaterials.length > 0) {
        material = similarMaterials[0];
        confidence = 0.7;
        notes.push(`Using similar material ${material.name} as reference`);
      } else {
        throw new Error(`No suitable material found for category ${category}`);
      }
    } else {
      throw new Error(`Unknown material: ${materialId}`);
    }
  }

  // Check machine compatibility
  const compatibility = validateMaterialCompatibility(material.id, machineId);
  if (!compatibility.compatible) {
    confidence *= 0.5;
    notes.push(...compatibility.issues);
  }

  // Get base settings
  const baseSettings = operation === 'cut' ? material.cutSettings : material.engraveSettings;

  // Handle score operation (between cut and engrave)
  let settings = baseSettings;
  if (operation === 'score') {
    const cutSettings = material.cutSettings;
    const engraveSettings = material.engraveSettings;

    settings = {
      power: Math.round((cutSettings.power + engraveSettings.power) / 2),
      speed: Math.round((cutSettings.speed + engraveSettings.speed) / 2),
      passes: 1,
      airAssist: cutSettings.airAssist
    };

    confidence *= 0.8;
    notes.push('Score settings interpolated between cut and engrave');
  }

  // Adjust for different thickness
  if (Math.abs(material.thickness - thickness) > 0.1) {
    settings = adjustForThickness(settings, material, thickness, operation);
    confidence *= 0.9;
    notes.push(`Adjusted for ${thickness}mm thickness (base: ${material.thickness}mm)`);
  }

  // Apply quality modifiers
  const qualityMod = QUALITY_MODIFIERS[quality];
  settings = {
    ...settings,
    power: Math.max(1, Math.min(100, Math.round(settings.power * qualityMod.power))),
    speed: Math.max(10, Math.min(20000, Math.round(settings.speed * qualityMod.speed)))
  };

  if (quality !== 'normal') {
    notes.push(`Adjusted for ${quality} quality`);
  }

  // Ensure settings are within machine limits
  const finalSettings: LaserSettings = {
    ...settings,
    power: Math.max(machine.powerRange.min, Math.min(machine.powerRange.max, settings.power)),
    speed: Math.max(machine.speedRange.min, Math.min(machine.speedRange.max, settings.speed))
  };

  if (finalSettings.power !== settings.power || finalSettings.speed !== settings.speed) {
    confidence *= 0.9;
    notes.push('Settings clamped to machine limits');
  }

  // Generate alternative settings
  const alternatives: LaserSettings[] = [];

  // Conservative alternative (lower power, slower speed)
  alternatives.push({
    ...finalSettings,
    power: Math.round(finalSettings.power * 0.8),
    speed: Math.round(finalSettings.speed * 0.8),
    passes: Math.min(material.maxPasses || 3, finalSettings.passes + 1)
  });

  // Aggressive alternative (higher power, faster speed)
  alternatives.push({
    ...finalSettings,
    power: Math.min(machine.powerRange.max, Math.round(finalSettings.power * 1.2)),
    speed: Math.round(finalSettings.speed * 1.2),
    passes: Math.max(1, finalSettings.passes - 1)
  });

  // Multi-pass alternative for better quality
  if (operation === 'cut' && finalSettings.passes === 1) {
    alternatives.push({
      ...finalSettings,
      power: Math.round(finalSettings.power * 0.7),
      speed: Math.round(finalSettings.speed * 1.1),
      passes: 2
    });
  }

  return {
    material: material.name,
    thickness,
    operation,
    recommended: finalSettings,
    alternatives: alternatives.filter(alt =>
      alt.power >= machine.powerRange.min && alt.power <= machine.powerRange.max &&
      alt.speed >= machine.speedRange.min && alt.speed <= machine.speedRange.max
    ),
    confidence: Math.max(0, Math.min(1, confidence)),
    notes
  };
}

/**
 * Generate optimization recommendations based on job analysis
 */
export function generateOptimizationRecommendations(
  materialId: string,
  thickness: number,
  machineId: XToolMachineId,
  pathCount: number,
  estimatedTime: number
): OptimizationRecommendation[] {
  const recommendations: OptimizationRecommendation[] = [];
  const material = MATERIAL_PROFILES[materialId];
  const machine = XTOOL_MACHINES[machineId];

  if (!material || !machine) {
    recommendations.push({
      type: 'material',
      severity: 'error',
      message: 'Unknown material or machine specification',
      suggestion: 'Please select a valid material and machine combination'
    });
    return recommendations;
  }

  // Material compatibility check
  const compatibility = validateMaterialCompatibility(materialId, machineId);
  if (!compatibility.compatible) {
    recommendations.push({
      type: 'material',
      severity: 'error',
      message: `Material ${material.name} is not compatible with ${machine.name}`,
      suggestion: compatibility.issues.join('; ')
    });
  }

  // Thickness recommendations
  if (thickness > material.thickness * 1.5) {
    recommendations.push({
      type: 'material',
      severity: 'warning',
      message: `Material thickness (${thickness}mm) significantly different from reference (${material.thickness}mm)`,
      suggestion: 'Consider using multiple passes or adjusting power settings'
    });
  }

  // Path complexity recommendations
  if (pathCount > 500) {
    recommendations.push({
      type: 'path',
      severity: 'warning',
      message: 'High path count detected',
      suggestion: 'Enable path optimization to reduce cutting time',
      autoFixAvailable: true
    });
  }

  // Time-based recommendations
  if (estimatedTime > 120) { // 2 hours
    recommendations.push({
      type: 'settings',
      severity: 'info',
      message: 'Long cutting time estimated',
      suggestion: 'Consider breaking the job into smaller parts or using draft quality for testing'
    });
  }

  // Safety recommendations
  if (material.safetyNotes && material.safetyNotes.length > 0) {
    recommendations.push({
      type: 'safety',
      severity: 'warning',
      message: 'Material requires special safety precautions',
      suggestion: material.safetyNotes.join('; ')
    });
  }

  // Air assist recommendations
  const cutSettings = material.cutSettings;
  if (cutSettings.airAssist && !machine.features.includes('air-assist')) {
    recommendations.push({
      type: 'settings',
      severity: 'warning',
      message: 'Material recommends air assist but machine may not support it',
      suggestion: 'Check machine configuration or consider manual air assist'
    });
  }

  // Power efficiency recommendations
  if (material.cutSettings.power > 80) {
    recommendations.push({
      type: 'settings',
      severity: 'info',
      message: 'High power settings required',
      suggestion: 'Ensure adequate ventilation and monitor cutting progress closely'
    });
  }

  return recommendations;
}

/**
 * Get recommended layer order for operations
 */
export function getRecommendedLayerOrder(
  layers: { id: string; type: 'cut' | 'engrave' | 'score' }[]
): string[] {
  const operationPriority = { 'engrave': 1, 'score': 2, 'cut': 3 };

  return layers
    .sort((a, b) => operationPriority[a.type] - operationPriority[b.type])
    .map(layer => layer.id);
}

/**
 * Suggest material alternatives
 */
export function suggestMaterialAlternatives(
  materialId: string,
  machineId: XToolMachineId
): { material: MaterialProfile; compatibility: number; notes: string[] }[] {
  const targetMaterial = MATERIAL_PROFILES[materialId];
  const machine = XTOOL_MACHINES[machineId];

  if (!targetMaterial || !machine) {
    return [];
  }

  const alternatives = Object.values(MATERIAL_PROFILES)
    .filter(mat => mat.id !== materialId && mat.category === targetMaterial.category)
    .map(material => {
      const compatibility = validateMaterialCompatibility(material.id, machineId);
      const thicknessDiff = Math.abs(material.thickness - targetMaterial.thickness);

      let score = compatibility.compatible ? 1.0 : 0.3;
      score *= Math.max(0.1, 1 - (thicknessDiff / 5)); // Penalize thickness differences

      const notes: string[] = [];
      if (thicknessDiff > 0.5) {
        notes.push(`Different thickness: ${material.thickness}mm vs ${targetMaterial.thickness}mm`);
      }
      if (!compatibility.compatible) {
        notes.push('May require setting adjustments');
      }

      return {
        material,
        compatibility: score,
        notes
      };
    })
    .sort((a, b) => b.compatibility - a.compatibility)
    .slice(0, 5); // Top 5 alternatives

  return alternatives;
}

/**
 * Calculate power efficiency score
 */
export function calculatePowerEfficiency(settings: LaserSettings): number {
  // Lower power with higher speed is more efficient
  const powerFactor = 1 - (settings.power / 100);
  const speedFactor = Math.min(1, settings.speed / 10000);
  const passFactor = 1 / settings.passes;

  return Math.round((powerFactor * 0.4 + speedFactor * 0.4 + passFactor * 0.2) * 100);
}

/**
 * Generate quality recommendations
 */
export function generateQualityRecommendations(
  operation: 'cut' | 'engrave' | 'score',
  material: string,
  settings: LaserSettings
): OptimizationRecommendation[] {
  const recommendations: OptimizationRecommendation[] = [];

  // High power warnings
  if (settings.power > 90) {
    recommendations.push({
      type: 'settings',
      severity: 'warning',
      message: 'Very high power setting may cause burning or rough edges',
      suggestion: 'Consider reducing power and increasing passes for better quality'
    });
  }

  // Speed recommendations
  if (operation === 'engrave' && settings.speed > 5000) {
    recommendations.push({
      type: 'settings',
      severity: 'info',
      message: 'High engraving speed may reduce detail quality',
      suggestion: 'Reduce speed for finer details and better finish'
    });
  }

  if (operation === 'cut' && settings.speed < 100) {
    recommendations.push({
      type: 'settings',
      severity: 'info',
      message: 'Very slow cutting speed may cause heat buildup',
      suggestion: 'Consider increasing speed or reducing power'
    });
  }

  // Multi-pass recommendations
  if (settings.passes > 3) {
    recommendations.push({
      type: 'settings',
      severity: 'warning',
      message: 'Many passes may cause excessive heat and burning',
      suggestion: 'Try increasing power instead of adding more passes'
    });
  }

  return recommendations;
}

/**
 * Estimate material cost based on usage
 */
export function estimateMaterialCost(
  materialId: string,
  areaUsed: number, // cm²
  pricePerSheet?: number,
  sheetArea?: number // cm²
): { estimatedCost: number; utilization: number } | null {
  if (!pricePerSheet || !sheetArea) {
    return null;
  }

  const costPerCm2 = pricePerSheet / sheetArea;
  const estimatedCost = areaUsed * costPerCm2;
  const utilization = Math.min(100, (areaUsed / sheetArea) * 100);

  return {
    estimatedCost: Math.round(estimatedCost * 100) / 100,
    utilization: Math.round(utilization * 100) / 100
  };
}
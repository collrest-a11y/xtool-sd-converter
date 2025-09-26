/**
 * xTool Optimizer Types and Interfaces
 * Defines the core types for the xTool laser optimization system
 */

import type { ProcessingResult } from '../styles/types';

// xTool Machine Specifications
export interface XToolMachine {
  id: string;
  name: string;
  workArea: {
    width: number; // mm
    height: number; // mm
  };
  powerRange: {
    min: number; // %
    max: number; // %
  };
  speedRange: {
    min: number; // mm/min
    max: number; // mm/min
  };
  supportedMaterials: string[];
  features: string[];
}

// Material Properties and Settings
export interface MaterialProfile {
  id: string;
  name: string;
  category: 'wood' | 'acrylic' | 'leather' | 'fabric' | 'paper' | 'metal' | 'other';
  thickness: number; // mm
  density: number; // g/cm³
  cutSettings: LaserSettings;
  engraveSettings: LaserSettings;
  safetyNotes?: string[];
  maxPasses?: number;
}

export interface LaserSettings {
  power: number; // %
  speed: number; // mm/min
  passes: number;
  airAssist?: boolean;
  rotaryMode?: boolean;
}

// Path and Toolpath Types
export interface PathPoint {
  x: number;
  y: number;
  z?: number;
}

export interface LaserPath {
  id: string;
  type: 'cut' | 'engrave' | 'score';
  points: PathPoint[];
  settings: LaserSettings;
  material: string;
  priority: number; // execution order
  closed: boolean;
  depth?: number; // for engraving
}

export interface ToolpathLayer {
  id: string;
  name: string;
  type: 'cut' | 'engrave' | 'score';
  paths: LaserPath[];
  settings: LaserSettings;
  color: string;
  visible: boolean;
  locked: boolean;
}

// Optimization Parameters
export interface OptimizationSettings {
  machine: string; // machine ID
  material: string; // material ID
  optimizeTravel: boolean;
  minimizeSharpTurns: boolean;
  groupSimilarOperations: boolean;
  optimizeLayerOrder: boolean;
  respectMaterialLimits: boolean;
  safetyMargin: number; // mm from work area edges
}

export interface PathOptimizationResult {
  originalLength: number; // mm
  optimizedLength: number; // mm
  timeReduction: number; // seconds
  energySaving: number; // %
  layerOrder: string[];
  warnings: string[];
}

// Recommendation Engine Types
export interface PowerSpeedRecommendation {
  material: string;
  thickness: number;
  operation: 'cut' | 'engrave' | 'score';
  recommended: LaserSettings;
  alternatives: LaserSettings[];
  confidence: number; // 0-1
  notes: string[];
}

export interface OptimizationRecommendation {
  type: 'material' | 'settings' | 'path' | 'safety';
  severity: 'info' | 'warning' | 'error';
  message: string;
  suggestion?: string;
  autoFixAvailable?: boolean;
}

// Export and Output Types
export interface XToolExportSettings {
  fileFormat: 'gcode' | 'lbrn2' | 'svg' | 'dxf';
  includeComments: boolean;
  coordinateSystem: 'absolute' | 'relative';
  units: 'mm' | 'inches';
  precision: number; // decimal places
}

export interface XToolJob {
  id: string;
  name: string;
  machine: XToolMachine;
  material: MaterialProfile;
  layers: ToolpathLayer[];
  settings: OptimizationSettings;
  estimatedTime: number; // minutes
  estimatedPowerUsage: number; // Wh
  createdAt: Date;
  modifiedAt: Date;
}

// Processing and Queue Types
export interface OptimizationJob {
  id: string;
  inputImage: string;
  styleId: string;
  settings: OptimizationSettings;
  status: 'queued' | 'processing' | 'optimizing' | 'completed' | 'failed';
  progress: number; // 0-100
  result?: OptimizationResult;
  createdAt: Date;
  completedAt?: Date;
  errors?: string[];
}

export interface OptimizationResult {
  success: boolean;
  job: XToolJob;
  layers: ToolpathLayer[];
  pathOptimization: PathOptimizationResult;
  recommendations: OptimizationRecommendation[];
  previewUrl?: string;
  exportFiles?: {
    format: string;
    filename: string;
    content: string;
  }[];
  error?: string;
}

// UI Component Types
export interface LayerControlProps {
  layers: ToolpathLayer[];
  onLayerToggle: (layerId: string) => void;
  onLayerReorder: (layerIds: string[]) => void;
  onLayerSettings: (layerId: string, settings: LaserSettings) => void;
}

export interface MaterialSelectorProps {
  materials: MaterialProfile[];
  selected?: string;
  onSelect: (materialId: string) => void;
  customMaterialsEnabled?: boolean;
}

export interface PathPreviewProps {
  layers: ToolpathLayer[];
  workArea: { width: number; height: number };
  showTravel: boolean;
  animationSpeed: number;
  selectedLayer?: string;
}

// Configuration Types
export interface XToolOptimizerConfig {
  defaultMachine: string;
  defaultMaterial: string;
  autoOptimize: boolean;
  previewEnabled: boolean;
  exportFormats: string[];
  safetyChecks: boolean;
  maxJobSize: number; // MB
  cacheResults: boolean;
}

// Event Types for Real-time Updates
export interface OptimizationEvent {
  type: 'progress' | 'layer_complete' | 'optimization_complete' | 'error' | 'warning';
  jobId: string;
  data: any;
  timestamp: Date;
}

// Style Integration Types
export interface StyleToXToolMapping {
  styleId: string;
  defaultOperation: 'cut' | 'engrave' | 'score';
  layerSeparation: boolean;
  pathExtraction: 'contour' | 'raster' | 'vector';
  qualityLevel: 'draft' | 'normal' | 'high' | 'ultra';
}

// Utility Types
export type XToolMachineId = 'xtool-d1' | 'xtool-d1-pro' | 'xtool-m1' | 'xtool-p2';
export type MaterialCategory = MaterialProfile['category'];
export type LaserOperation = 'cut' | 'engrave' | 'score';
export type ExportFormat = 'gcode' | 'lbrn2' | 'svg' | 'dxf';

// Error Types
export class XToolOptimizationError extends Error {
  constructor(
    message: string,
    public code: string,
    public jobId?: string,
    public suggestions?: string[]
  ) {
    super(message);
    this.name = 'XToolOptimizationError';
  }
}

export class MaterialCompatibilityError extends XToolOptimizationError {
  constructor(material: string, machine: string, suggestions?: string[]) {
    super(
      `Material '${material}' is not compatible with machine '${machine}'`,
      'MATERIAL_INCOMPATIBLE',
      undefined,
      suggestions
    );
  }
}

export class WorkAreaExceededError extends XToolOptimizationError {
  constructor(dimensions: { width: number; height: number }, maxDimensions: { width: number; height: number }) {
    super(
      `Design dimensions (${dimensions.width}×${dimensions.height}mm) exceed work area (${maxDimensions.width}×${maxDimensions.height}mm)`,
      'WORK_AREA_EXCEEDED'
    );
  }
}
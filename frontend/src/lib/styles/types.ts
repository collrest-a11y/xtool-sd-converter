/**
 * Style Engine Types and Interfaces
 * Defines the core types for the laser engraving style processing system
 */

export interface StyleSettings {
  strength: number;
  steps: number;
  guidance_scale?: number;
  width?: number;
  height?: number;
  seed?: number;
}

export interface StyleParameters {
  contrast: number;
  brightness: number;
  sharpness: number;
  threshold?: number;
  dotSize?: number;
  density?: number;
  angle?: number;
}

export interface ProcessingResult {
  success: boolean;
  imageUrl?: string;
  error?: string;
  metadata?: {
    processingTime: number;
    settings: StyleSettings;
    parameters: StyleParameters;
  };
}

export interface StylePromptTemplate {
  basePrompt: string;
  negativePrompt: string;
  styleModifiers: string[];
  qualityTags: string[];
}

export interface StyleProcessor {
  id: string;
  name: string;
  description: string;
  category: 'vector' | 'raster' | 'hybrid';

  // Core processing methods
  generatePrompt(parameters: StyleParameters): StylePromptTemplate;
  validateParameters(parameters: StyleParameters): boolean;
  getDefaultParameters(): StyleParameters;
  getDefaultSettings(): StyleSettings;

  // Optional pre/post processing
  preProcess?(imageData: string): Promise<string>;
  postProcess?(result: ProcessingResult): Promise<ProcessingResult>;
}

export interface LaserConversionStyle {
  id: string;
  name: string;
  description: string;
  thumbnail: string;
  category: 'vector' | 'raster' | 'hybrid';
  processor: StyleProcessor;
  defaultSettings: StyleSettings;
  defaultParameters: StyleParameters;

  // UI configuration
  parameterControls: ParameterControl[];
  previewOptions: PreviewOptions;
}

export interface ParameterControl {
  key: keyof StyleParameters;
  label: string;
  type: 'slider' | 'toggle' | 'select' | 'number';
  min?: number;
  max?: number;
  step?: number;
  options?: { value: any; label: string }[];
  description?: string;
}

export interface PreviewOptions {
  showRealTime: boolean;
  updateDelay: number;
  thumbnailSize: number;
  showParameters: boolean;
}

export interface StyleEngineConfig {
  sdApiEndpoint: string;
  maxConcurrentJobs: number;
  defaultTimeout: number;
  cacheResults: boolean;
  previewEnabled: boolean;
}

export interface ProcessingQueue {
  id: string;
  styleId: string;
  imageData: string;
  parameters: StyleParameters;
  settings: StyleSettings;
  status: 'queued' | 'processing' | 'completed' | 'failed';
  createdAt: Date;
  completedAt?: Date;
  result?: ProcessingResult;
}

// Style-specific parameter interfaces
export interface LineArtParameters extends StyleParameters {
  edgeThreshold: number;
  lineWeight: number;
  smoothing: number;
}

export interface HalftoneParameters extends StyleParameters {
  dotSize: number;
  screenAngle: number;
  frequency: number;
  shape: 'circle' | 'square' | 'diamond';
}

export interface StippleParameters extends StyleParameters {
  dotDensity: number;
  minDotSize: number;
  maxDotSize: number;
  randomness: number;
}

export interface GeometricParameters extends StyleParameters {
  patternType: 'triangular' | 'hexagonal' | 'diamond' | 'custom';
  complexity: number;
  symmetry: boolean;
}

export interface MinimalistParameters extends StyleParameters {
  contrastBoost: number;
  noiseReduction: number;
  edgePreservation: number;
}

export type StyleSpecificParameters =
  | LineArtParameters
  | HalftoneParameters
  | StippleParameters
  | GeometricParameters
  | MinimalistParameters;
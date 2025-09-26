/**
 * Style Engine Module Index
 * Main exports for the laser engraving style processing system
 */

// Core engine
export { StyleEngine } from './style-engine';

// Types
export type {
  StyleSettings,
  StyleParameters,
  ProcessingResult,
  StyleProcessor,
  LaserConversionStyle,
  ParameterControl,
  PreviewOptions,
  ProcessingQueue,
  StyleEngineConfig,
  LineArtParameters,
  HalftoneParameters,
  StippleParameters,
  GeometricParameters,
  MinimalistParameters,
  StyleSpecificParameters,
} from './types';

// Processors
export {
  BaseStyleProcessor,
  LineArtProcessor,
  HalftoneProcessor,
  StippleProcessor,
  GeometricProcessor,
  MinimalistProcessor,
  STYLE_PROCESSORS,
  getStyleProcessor,
  getAllStyleProcessors,
  getStyleProcessorsByCategory,
  hasStyleProcessor,
} from './processors';

// Prompts
export {
  LINE_ART_PROMPTS,
  HALFTONE_PROMPTS,
  STIPPLE_PROMPTS,
  GEOMETRIC_PROMPTS,
  MINIMALIST_PROMPTS,
  getPromptTemplate,
  buildPrompt,
  buildNegativePrompt,
  COMMON_LASER_TAGS,
  COMMON_NEGATIVE_PROMPT,
  QUALITY_MODIFIERS,
} from './prompts';
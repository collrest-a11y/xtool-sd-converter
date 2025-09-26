/**
 * Style Processors Index
 * Exports all style processors for the laser engraving system
 */

export { BaseStyleProcessor } from './base-processor';
export { LineArtProcessor } from './line-art-processor';
export { HalftoneProcessor } from './halftone-processor';
export { StippleProcessor } from './stipple-processor';
export { GeometricProcessor } from './geometric-processor';
export { MinimalistProcessor } from './minimalist-processor';

import { LineArtProcessor } from './line-art-processor';
import { HalftoneProcessor } from './halftone-processor';
import { StippleProcessor } from './stipple-processor';
import { GeometricProcessor } from './geometric-processor';
import { MinimalistProcessor } from './minimalist-processor';

import type { StyleProcessor } from '../types';

/**
 * Registry of all available style processors
 */
export const STYLE_PROCESSORS: Record<string, StyleProcessor> = {
  'line-art': new LineArtProcessor(),
  'halftone': new HalftoneProcessor(),
  'stipple': new StippleProcessor(),
  'geometric': new GeometricProcessor(),
  'minimalist': new MinimalistProcessor(),
};

/**
 * Get a style processor by ID
 */
export function getStyleProcessor(styleId: string): StyleProcessor {
  const processor = STYLE_PROCESSORS[styleId];
  if (!processor) {
    throw new Error(`Unknown style processor: ${styleId}`);
  }
  return processor;
}

/**
 * Get all available style processors
 */
export function getAllStyleProcessors(): StyleProcessor[] {
  return Object.values(STYLE_PROCESSORS);
}

/**
 * Get style processors by category
 */
export function getStyleProcessorsByCategory(category: 'vector' | 'raster' | 'hybrid'): StyleProcessor[] {
  return getAllStyleProcessors().filter(processor => processor.category === category);
}

/**
 * Check if a style processor exists
 */
export function hasStyleProcessor(styleId: string): boolean {
  return styleId in STYLE_PROCESSORS;
}
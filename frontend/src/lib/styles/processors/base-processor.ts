/**
 * Base Style Processor
 * Abstract base class for all style processors
 */

import type {
  StyleProcessor,
  StyleSettings,
  StyleParameters,
  StylePromptTemplate,
  ProcessingResult,
} from '../types';

export abstract class BaseStyleProcessor implements StyleProcessor {
  abstract readonly id: string;
  abstract readonly name: string;
  abstract readonly description: string;
  abstract readonly category: 'vector' | 'raster' | 'hybrid';

  /**
   * Generate the prompt template for this style
   */
  abstract generatePrompt(parameters: StyleParameters): StylePromptTemplate;

  /**
   * Get default parameters for this style
   */
  abstract getDefaultParameters(): StyleParameters;

  /**
   * Get default settings for this style
   */
  abstract getDefaultSettings(): StyleSettings;

  /**
   * Validate parameters for this style
   */
  validateParameters(parameters: StyleParameters): boolean {
    const defaults = this.getDefaultParameters();
    const required = Object.keys(defaults);

    // Check that all required parameters are present
    for (const key of required) {
      if (!(key in parameters)) {
        console.warn(`Missing required parameter: ${key}`);
        return false;
      }
    }

    // Validate basic constraints
    return this.validateConstraints(parameters);
  }

  /**
   * Validate parameter constraints (override in subclasses)
   */
  protected validateConstraints(parameters: StyleParameters): boolean {
    // Basic validation for common parameters
    if (parameters.contrast < 0 || parameters.contrast > 2) {
      console.warn('Contrast must be between 0 and 2');
      return false;
    }

    if (parameters.brightness < 0 || parameters.brightness > 2) {
      console.warn('Brightness must be between 0 and 2');
      return false;
    }

    if (parameters.sharpness < 0 || parameters.sharpness > 2) {
      console.warn('Sharpness must be between 0 and 2');
      return false;
    }

    return true;
  }

  /**
   * Optional pre-processing hook
   */
  async preProcess(imageData: string): Promise<string> {
    // Default implementation: no pre-processing
    return imageData;
  }

  /**
   * Optional post-processing hook
   */
  async postProcess(result: ProcessingResult): Promise<ProcessingResult> {
    // Default implementation: no post-processing
    return result;
  }

  /**
   * Merge user parameters with defaults
   */
  protected mergeParameters(userParams: Partial<StyleParameters>): StyleParameters {
    const defaults = this.getDefaultParameters();
    return { ...defaults, ...userParams };
  }

  /**
   * Merge user settings with defaults
   */
  protected mergeSettings(userSettings: Partial<StyleSettings>): StyleSettings {
    const defaults = this.getDefaultSettings();
    return { ...defaults, ...userSettings };
  }

  /**
   * Clamp value to range
   */
  protected clamp(value: number, min: number, max: number): number {
    return Math.max(min, Math.min(max, value));
  }

  /**
   * Generate consistent seed for reproducible results
   */
  protected generateSeed(input: string): number {
    let hash = 0;
    for (let i = 0; i < input.length; i++) {
      const char = input.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    return Math.abs(hash);
  }
}
/**
 * Stipple Style Processor
 * Pointillism texture effect for detailed engraving
 */

import { BaseStyleProcessor } from './base-processor';
import { STIPPLE_PROMPTS, buildPrompt, buildNegativePrompt } from '../prompts';
import type {
  StyleSettings,
  StylePromptTemplate,
  StippleParameters,
} from '../types';

export class StippleProcessor extends BaseStyleProcessor {
  readonly id = 'stipple';
  readonly name = 'Stipple';
  readonly description = 'Stippled/pointillism effect for texture';
  readonly category = 'raster' as const;

  generatePrompt(parameters: StippleParameters): StylePromptTemplate {
    const modifiers: string[] = [];

    // Add dot density modifiers
    if (parameters.dotDensity > 0.7) {
      modifiers.push('dense stippling', 'heavy dotwork', 'rich texture');
    } else if (parameters.dotDensity < 0.3) {
      modifiers.push('sparse stippling', 'minimal dots', 'light texture');
    } else {
      modifiers.push('medium density stippling');
    }

    // Add dot size variation modifiers
    const sizeRange = parameters.maxDotSize - parameters.minDotSize;
    if (sizeRange > 0.5) {
      modifiers.push('varied dot sizes', 'organic stippling', 'natural variation');
    } else if (sizeRange < 0.2) {
      modifiers.push('uniform dot sizes', 'consistent stippling', 'mechanical precision');
    }

    // Add randomness modifiers
    if (parameters.randomness > 0.7) {
      modifiers.push('organic placement', 'natural randomness', 'artistic stippling');
    } else if (parameters.randomness < 0.3) {
      modifiers.push('structured placement', 'geometric stippling', 'ordered dots');
    }

    // Add size-specific modifiers
    if (parameters.maxDotSize > 0.8) {
      modifiers.push('large stipple dots', 'bold pointwork');
    } else if (parameters.maxDotSize < 0.3) {
      modifiers.push('fine stipple dots', 'delicate pointwork');
    }

    const negativeModifiers: string[] = [];

    // Add negative modifiers based on parameters
    if (parameters.dotDensity > 0.8) {
      negativeModifiers.push('sparse dots', 'empty areas');
    } else if (parameters.dotDensity < 0.2) {
      negativeModifiers.push('dense patterns', 'crowded dots');
    }

    return {
      basePrompt: buildPrompt(STIPPLE_PROMPTS, modifiers),
      negativePrompt: buildNegativePrompt(STIPPLE_PROMPTS, negativeModifiers),
      styleModifiers: modifiers,
      qualityTags: STIPPLE_PROMPTS.qualityTags,
    };
  }

  getDefaultParameters(): StippleParameters {
    return {
      contrast: 1.4,
      brightness: 1.0,
      sharpness: 1.3,
      dotDensity: 0.6,
      minDotSize: 0.1,
      maxDotSize: 0.5,
      randomness: 0.7,
    };
  }

  getDefaultSettings(): StyleSettings {
    return {
      strength: 0.6,
      steps: 30,
      guidance_scale: 7.0,
      width: 512,
      height: 512,
    };
  }

  protected validateConstraints(parameters: StippleParameters): boolean {
    if (!super.validateConstraints(parameters)) {
      return false;
    }

    // Validate stipple specific parameters
    if (parameters.dotDensity < 0 || parameters.dotDensity > 1) {
      console.warn('Dot density must be between 0 and 1');
      return false;
    }

    if (parameters.minDotSize < 0 || parameters.minDotSize > 1) {
      console.warn('Min dot size must be between 0 and 1');
      return false;
    }

    if (parameters.maxDotSize < 0 || parameters.maxDotSize > 1) {
      console.warn('Max dot size must be between 0 and 1');
      return false;
    }

    if (parameters.minDotSize >= parameters.maxDotSize) {
      console.warn('Min dot size must be less than max dot size');
      return false;
    }

    if (parameters.randomness < 0 || parameters.randomness > 1) {
      console.warn('Randomness must be between 0 and 1');
      return false;
    }

    return true;
  }

  async preProcess(imageData: string): Promise<string> {
    // For stipple, we might want to pre-process to analyze areas of detail
    console.log('Pre-processing image for stipple conversion');
    return imageData;
  }

  /**
   * Get recommended dot density based on image complexity
   */
  getRecommendedDensity(imageComplexity: 'low' | 'medium' | 'high'): number {
    switch (imageComplexity) {
      case 'low':
        return 0.3; // Sparse stippling for simple images
      case 'medium':
        return 0.6; // Medium density for balanced images
      case 'high':
        return 0.8; // Dense stippling for complex images
      default:
        return 0.6;
    }
  }

  /**
   * Calculate optimal size range based on target engraving scale
   */
  getOptimalSizeRange(targetSize: 'small' | 'medium' | 'large'): { min: number; max: number } {
    switch (targetSize) {
      case 'small':
        return { min: 0.05, max: 0.2 }; // Fine dots for small engravings
      case 'medium':
        return { min: 0.1, max: 0.5 }; // Standard range
      case 'large':
        return { min: 0.2, max: 0.8 }; // Larger dots for big engravings
      default:
        return { min: 0.1, max: 0.5 };
    }
  }
}
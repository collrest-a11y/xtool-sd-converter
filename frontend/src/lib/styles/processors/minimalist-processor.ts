/**
 * Minimalist Style Processor
 * Simplified high-contrast output for clean results
 */

import { BaseStyleProcessor } from './base-processor';
import { MINIMALIST_PROMPTS, buildPrompt, buildNegativePrompt } from '../prompts';
import type {
  StyleSettings,
  StylePromptTemplate,
  MinimalistParameters,
} from '../types';

export class MinimalistProcessor extends BaseStyleProcessor {
  readonly id = 'minimalist';
  readonly name = 'Minimalist';
  readonly description = 'Simplified high-contrast output';
  readonly category = 'vector' as const;

  generatePrompt(parameters: MinimalistParameters): StylePromptTemplate {
    const modifiers: string[] = [];

    // Add contrast boost modifiers
    if (parameters.contrastBoost > 1.5) {
      modifiers.push('maximum contrast', 'stark black and white', 'pure contrast');
    } else if (parameters.contrastBoost > 1.0) {
      modifiers.push('high contrast', 'strong definition');
    } else {
      modifiers.push('subtle contrast', 'gentle definition');
    }

    // Add noise reduction modifiers
    if (parameters.noiseReduction > 0.7) {
      modifiers.push('ultra clean', 'pristine surfaces', 'perfect clarity');
    } else if (parameters.noiseReduction > 0.4) {
      modifiers.push('clean design', 'smooth surfaces');
    }

    // Add edge preservation modifiers
    if (parameters.edgePreservation > 0.7) {
      modifiers.push('sharp edges', 'crisp boundaries', 'defined outlines');
    } else if (parameters.edgePreservation < 0.3) {
      modifiers.push('soft edges', 'gentle transitions');
    }

    // Add simplification level modifiers
    const simplificationLevel = this.calculateSimplificationLevel(parameters);
    switch (simplificationLevel) {
      case 'extreme':
        modifiers.push('extreme simplification', 'essential elements only', 'maximum reduction');
        break;
      case 'high':
        modifiers.push('highly simplified', 'reduced complexity', 'clean reduction');
        break;
      case 'moderate':
        modifiers.push('thoughtful simplification', 'balanced reduction');
        break;
      case 'subtle':
        modifiers.push('subtle simplification', 'refined details');
        break;
    }

    const negativeModifiers: string[] = [];

    // Add negative modifiers based on minimalist goals
    negativeModifiers.push(
      'excessive detail',
      'complex patterns',
      'busy composition',
      'decorative elements',
      'ornamental features',
      'cluttered design'
    );

    // Noise-specific negatives
    if (parameters.noiseReduction > 0.5) {
      negativeModifiers.push('texture', 'grain', 'rough surfaces', 'artifacts');
    }

    return {
      basePrompt: buildPrompt(MINIMALIST_PROMPTS, modifiers),
      negativePrompt: buildNegativePrompt(MINIMALIST_PROMPTS, negativeModifiers),
      styleModifiers: modifiers,
      qualityTags: MINIMALIST_PROMPTS.qualityTags,
    };
  }

  getDefaultParameters(): MinimalistParameters {
    return {
      contrast: 2.0,
      brightness: 1.0,
      sharpness: 1.4,
      contrastBoost: 1.8,
      noiseReduction: 0.8,
      edgePreservation: 0.9,
    };
  }

  getDefaultSettings(): StyleSettings {
    return {
      strength: 0.8,
      steps: 15,
      guidance_scale: 9.0,
      width: 512,
      height: 512,
    };
  }

  protected validateConstraints(parameters: MinimalistParameters): boolean {
    if (!super.validateConstraints(parameters)) {
      return false;
    }

    // Validate minimalist specific parameters
    if (parameters.contrastBoost < 0.5 || parameters.contrastBoost > 3.0) {
      console.warn('Contrast boost must be between 0.5 and 3.0');
      return false;
    }

    if (parameters.noiseReduction < 0 || parameters.noiseReduction > 1) {
      console.warn('Noise reduction must be between 0 and 1');
      return false;
    }

    if (parameters.edgePreservation < 0 || parameters.edgePreservation > 1) {
      console.warn('Edge preservation must be between 0 and 1');
      return false;
    }

    return true;
  }

  async preProcess(imageData: string): Promise<string> {
    // For minimalist, we might want to pre-process to identify key elements
    console.log('Pre-processing image for minimalist conversion');
    return imageData;
  }

  /**
   * Calculate the level of simplification based on parameters
   */
  private calculateSimplificationLevel(parameters: MinimalistParameters): 'extreme' | 'high' | 'moderate' | 'subtle' {
    const simplificationScore =
      (parameters.contrastBoost - 1) * 0.4 +
      parameters.noiseReduction * 0.3 +
      parameters.edgePreservation * 0.3;

    if (simplificationScore > 1.2) {
      return 'extreme';
    } else if (simplificationScore > 0.8) {
      return 'high';
    } else if (simplificationScore > 0.4) {
      return 'moderate';
    } else {
      return 'subtle';
    }
  }

  /**
   * Get recommended settings for different target uses
   */
  getRecommendedSettings(targetUse: 'cutting' | 'engraving' | 'marking'): Partial<MinimalistParameters> {
    switch (targetUse) {
      case 'cutting':
        return {
          contrastBoost: 2.5,
          noiseReduction: 0.9,
          edgePreservation: 1.0,
        };
      case 'engraving':
        return {
          contrastBoost: 1.8,
          noiseReduction: 0.7,
          edgePreservation: 0.8,
        };
      case 'marking':
        return {
          contrastBoost: 1.5,
          noiseReduction: 0.6,
          edgePreservation: 0.7,
        };
      default:
        return this.getDefaultParameters();
    }
  }

  /**
   * Analyze if image is suitable for minimalist conversion
   */
  analyzeImageSuitability(imageComplexity: number): {
    suitable: boolean;
    confidence: number;
    recommendations: string[];
  } {
    const recommendations: string[] = [];
    let confidence = 1.0;

    if (imageComplexity > 0.8) {
      confidence -= 0.3;
      recommendations.push('Consider using a different style for complex images');
      recommendations.push('Try increasing noise reduction to simplify details');
    }

    if (imageComplexity > 0.6) {
      recommendations.push('Increase contrast boost for better definition');
    }

    if (imageComplexity < 0.3) {
      recommendations.push('Image may already be simple enough');
      recommendations.push('Consider reducing contrast boost to preserve subtle details');
    }

    return {
      suitable: confidence > 0.5,
      confidence,
      recommendations,
    };
  }
}
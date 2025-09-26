/**
 * Geometric Style Processor
 * Angular pattern interpretation for modern aesthetics
 */

import { BaseStyleProcessor } from './base-processor';
import { GEOMETRIC_PROMPTS, buildPrompt, buildNegativePrompt } from '../prompts';
import type {
  StyleSettings,
  StylePromptTemplate,
  GeometricParameters,
} from '../types';

export class GeometricProcessor extends BaseStyleProcessor {
  readonly id = 'geometric';
  readonly name = 'Geometric';
  readonly description = 'Geometric pattern interpretation';
  readonly category = 'hybrid' as const;

  generatePrompt(parameters: GeometricParameters): StylePromptTemplate {
    const modifiers: string[] = [];

    // Add pattern type modifiers
    switch (parameters.patternType) {
      case 'triangular':
        modifiers.push('triangular tessellation', 'triangle patterns', 'angular geometry');
        break;
      case 'hexagonal':
        modifiers.push('hexagonal grid', 'honeycomb pattern', 'six-sided geometry');
        break;
      case 'diamond':
        modifiers.push('diamond lattice', 'rhombus patterns', 'crystal structure');
        break;
      case 'custom':
        modifiers.push('custom geometric pattern', 'unique tessellation');
        break;
    }

    // Add complexity modifiers
    if (parameters.complexity > 0.7) {
      modifiers.push('intricate geometry', 'complex patterns', 'detailed tessellation');
    } else if (parameters.complexity < 0.3) {
      modifiers.push('simple geometry', 'minimal patterns', 'basic shapes');
    } else {
      modifiers.push('moderate complexity', 'balanced geometry');
    }

    // Add symmetry modifiers
    if (parameters.symmetry) {
      modifiers.push('perfect symmetry', 'mirrored patterns', 'radial balance');
    } else {
      modifiers.push('asymmetric design', 'irregular patterns', 'organic variation');
    }

    // Add contrast-based modifiers
    if (parameters.contrast > 1.5) {
      modifiers.push('high contrast geometry', 'bold pattern definition');
    }

    const negativeModifiers: string[] = [];

    // Add negative modifiers based on pattern type
    const allPatterns = ['triangular', 'hexagonal', 'diamond'];
    const excludePatterns = allPatterns.filter(p => p !== parameters.patternType);

    if (parameters.patternType !== 'custom') {
      excludePatterns.forEach(pattern => {
        negativeModifiers.push(`${pattern} patterns`);
      });
    }

    // Add symmetry-based negatives
    if (parameters.symmetry) {
      negativeModifiers.push('asymmetric', 'irregular', 'chaotic');
    } else {
      negativeModifiers.push('perfect symmetry', 'mirror image');
    }

    return {
      basePrompt: buildPrompt(GEOMETRIC_PROMPTS, modifiers),
      negativePrompt: buildNegativePrompt(GEOMETRIC_PROMPTS, negativeModifiers),
      styleModifiers: modifiers,
      qualityTags: GEOMETRIC_PROMPTS.qualityTags,
    };
  }

  getDefaultParameters(): GeometricParameters {
    return {
      contrast: 1.8,
      brightness: 1.0,
      sharpness: 1.6,
      patternType: 'triangular',
      complexity: 0.5,
      symmetry: true,
    };
  }

  getDefaultSettings(): StyleSettings {
    return {
      strength: 0.9,
      steps: 20,
      guidance_scale: 8.5,
      width: 512,
      height: 512,
    };
  }

  protected validateConstraints(parameters: GeometricParameters): boolean {
    if (!super.validateConstraints(parameters)) {
      return false;
    }

    // Validate geometric specific parameters
    const validPatterns = ['triangular', 'hexagonal', 'diamond', 'custom'];
    if (!validPatterns.includes(parameters.patternType)) {
      console.warn('Pattern type must be one of: triangular, hexagonal, diamond, custom');
      return false;
    }

    if (parameters.complexity < 0 || parameters.complexity > 1) {
      console.warn('Complexity must be between 0 and 1');
      return false;
    }

    if (typeof parameters.symmetry !== 'boolean') {
      console.warn('Symmetry must be a boolean value');
      return false;
    }

    return true;
  }

  async preProcess(imageData: string): Promise<string> {
    // For geometric, we might want to pre-process to identify edges and structure
    console.log('Pre-processing image for geometric conversion');
    return imageData;
  }

  /**
   * Get recommended pattern type based on image characteristics
   */
  getRecommendedPattern(imageAspect: number, hasCircularElements: boolean): GeometricParameters['patternType'] {
    if (hasCircularElements) {
      return 'hexagonal'; // Hexagons work well with circular elements
    }

    if (imageAspect > 1.5 || imageAspect < 0.67) {
      return 'diamond'; // Diamonds work well with rectangular compositions
    }

    return 'triangular'; // Default for square-ish compositions
  }

  /**
   * Calculate complexity based on image detail level
   */
  getOptimalComplexity(detailLevel: 'low' | 'medium' | 'high'): number {
    switch (detailLevel) {
      case 'low':
        return 0.3; // Simple patterns for minimal detail
      case 'medium':
        return 0.5; // Balanced complexity
      case 'high':
        return 0.8; // Complex patterns for detailed images
      default:
        return 0.5;
    }
  }

  /**
   * Determine if symmetry should be used based on image composition
   */
  shouldUseSymmetry(hasSymmetricComposition: boolean, isPortrait: boolean): boolean {
    // Use symmetry for symmetric compositions or portraits
    return hasSymmetricComposition || isPortrait;
  }
}
/**
 * Halftone Style Processor
 * Dot pattern for grayscale representation
 */

import { BaseStyleProcessor } from './base-processor';
import { HALFTONE_PROMPTS, buildPrompt, buildNegativePrompt } from '../prompts';
import type {
  StyleSettings,
  StylePromptTemplate,
  HalftoneParameters,
} from '../types';

export class HalftoneProcessor extends BaseStyleProcessor {
  readonly id = 'halftone';
  readonly name = 'Halftone';
  readonly description = 'Dot pattern for grayscale representation';
  readonly category = 'raster' as const;

  generatePrompt(parameters: HalftoneParameters): StylePromptTemplate {
    const modifiers: string[] = [];

    // Add dot size modifiers
    if (parameters.dotSize > 0.7) {
      modifiers.push('large dots', 'coarse screen', 'bold pattern');
    } else if (parameters.dotSize < 0.3) {
      modifiers.push('fine dots', 'high resolution screen', 'detailed pattern');
    }

    // Add frequency modifiers
    if (parameters.frequency > 0.7) {
      modifiers.push('high frequency', 'dense pattern');
    } else if (parameters.frequency < 0.3) {
      modifiers.push('low frequency', 'sparse pattern');
    }

    // Add screen angle modifiers
    const angleDesc = this.getAngleDescription(parameters.screenAngle);
    if (angleDesc) {
      modifiers.push(angleDesc);
    }

    // Add shape modifiers
    switch (parameters.shape) {
      case 'square':
        modifiers.push('square dots', 'geometric pattern');
        break;
      case 'diamond':
        modifiers.push('diamond dots', 'angular pattern');
        break;
      case 'circle':
      default:
        modifiers.push('circular dots', 'classic halftone');
        break;
    }

    const negativeModifiers: string[] = [];

    // Add negative modifiers for unwanted patterns
    if (parameters.shape !== 'circle') {
      negativeModifiers.push('circular dots');
    }
    if (parameters.shape !== 'square') {
      negativeModifiers.push('square dots');
    }

    return {
      basePrompt: buildPrompt(HALFTONE_PROMPTS, modifiers),
      negativePrompt: buildNegativePrompt(HALFTONE_PROMPTS, negativeModifiers),
      styleModifiers: modifiers,
      qualityTags: HALFTONE_PROMPTS.qualityTags,
    };
  }

  getDefaultParameters(): HalftoneParameters {
    return {
      contrast: 1.6,
      brightness: 1.0,
      sharpness: 1.2,
      dotSize: 0.5,
      screenAngle: 45,
      frequency: 0.6,
      shape: 'circle',
    };
  }

  getDefaultSettings(): StyleSettings {
    return {
      strength: 0.7,
      steps: 25,
      guidance_scale: 8.0,
      width: 512,
      height: 512,
    };
  }

  protected validateConstraints(parameters: HalftoneParameters): boolean {
    if (!super.validateConstraints(parameters)) {
      return false;
    }

    // Validate halftone specific parameters
    if (parameters.dotSize < 0 || parameters.dotSize > 1) {
      console.warn('Dot size must be between 0 and 1');
      return false;
    }

    if (parameters.screenAngle < 0 || parameters.screenAngle >= 180) {
      console.warn('Screen angle must be between 0 and 180 degrees');
      return false;
    }

    if (parameters.frequency < 0 || parameters.frequency > 1) {
      console.warn('Frequency must be between 0 and 1');
      return false;
    }

    const validShapes = ['circle', 'square', 'diamond'];
    if (!validShapes.includes(parameters.shape)) {
      console.warn('Shape must be one of: circle, square, diamond');
      return false;
    }

    return true;
  }

  private getAngleDescription(angle: number): string | null {
    // Common screen angles for different printing processes
    if (angle >= 42 && angle <= 48) {
      return 'classic 45 degree screen';
    } else if (angle >= 13 && angle <= 17) {
      return '15 degree cyan screen';
    } else if (angle >= 73 && angle <= 77) {
      return '75 degree magenta screen';
    } else if (angle >= 88 && angle <= 92) {
      return '90 degree yellow screen';
    } else if (angle === 0 || angle >= 178) {
      return 'horizontal screen lines';
    }
    return null;
  }

  async preProcess(imageData: string): Promise<string> {
    // For halftone, we might want to pre-process to optimize grayscale conversion
    console.log('Pre-processing image for halftone conversion');
    return imageData;
  }
}
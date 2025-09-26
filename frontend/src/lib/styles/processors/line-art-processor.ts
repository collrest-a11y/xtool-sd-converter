/**
 * Line Art Style Processor
 * Clean vector-like outlines perfect for laser cutting
 */

import { BaseStyleProcessor } from './base-processor';
import { LINE_ART_PROMPTS, buildPrompt, buildNegativePrompt } from '../prompts';
import type {
  StyleSettings,
  StylePromptTemplate,
  LineArtParameters,
} from '../types';

export class LineArtProcessor extends BaseStyleProcessor {
  readonly id = 'line-art';
  readonly name = 'Line Art';
  readonly description = 'Clean vector-like outlines perfect for laser cutting';
  readonly category = 'vector' as const;

  generatePrompt(parameters: LineArtParameters): StylePromptTemplate {
    const modifiers: string[] = [];

    // Add edge threshold modifiers
    if (parameters.edgeThreshold > 0.7) {
      modifiers.push('high contrast edges', 'sharp boundaries');
    } else if (parameters.edgeThreshold < 0.3) {
      modifiers.push('subtle edges', 'soft boundaries');
    }

    // Add line weight modifiers
    if (parameters.lineWeight > 0.7) {
      modifiers.push('thick lines', 'bold outlines');
    } else if (parameters.lineWeight < 0.3) {
      modifiers.push('thin lines', 'fine outlines');
    }

    // Add smoothing modifiers
    if (parameters.smoothing > 0.7) {
      modifiers.push('smooth curves', 'flowing lines');
    } else if (parameters.smoothing < 0.3) {
      modifiers.push('angular lines', 'geometric precision');
    }

    const negativeModifiers: string[] = [];

    // Add negative modifiers based on parameters
    if (parameters.contrast > 1.5) {
      negativeModifiers.push('medium contrast', 'subtle shading');
    }

    return {
      basePrompt: buildPrompt(LINE_ART_PROMPTS, modifiers),
      negativePrompt: buildNegativePrompt(LINE_ART_PROMPTS, negativeModifiers),
      styleModifiers: modifiers,
      qualityTags: LINE_ART_PROMPTS.qualityTags,
    };
  }

  getDefaultParameters(): LineArtParameters {
    return {
      contrast: 1.8,
      brightness: 1.0,
      sharpness: 1.5,
      edgeThreshold: 0.5,
      lineWeight: 0.5,
      smoothing: 0.3,
    };
  }

  getDefaultSettings(): StyleSettings {
    return {
      strength: 0.8,
      steps: 20,
      guidance_scale: 7.5,
      width: 512,
      height: 512,
    };
  }

  protected validateConstraints(parameters: LineArtParameters): boolean {
    if (!super.validateConstraints(parameters)) {
      return false;
    }

    // Validate line art specific parameters
    if (parameters.edgeThreshold < 0 || parameters.edgeThreshold > 1) {
      console.warn('Edge threshold must be between 0 and 1');
      return false;
    }

    if (parameters.lineWeight < 0 || parameters.lineWeight > 1) {
      console.warn('Line weight must be between 0 and 1');
      return false;
    }

    if (parameters.smoothing < 0 || parameters.smoothing > 1) {
      console.warn('Smoothing must be between 0 and 1');
      return false;
    }

    return true;
  }

  async preProcess(imageData: string): Promise<string> {
    // For line art, we might want to pre-process the image to enhance edges
    // This is a placeholder for actual image processing
    console.log('Pre-processing image for line art conversion');
    return imageData;
  }
}
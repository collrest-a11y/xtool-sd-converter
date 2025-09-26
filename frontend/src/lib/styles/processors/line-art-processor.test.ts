/**
 * Line Art Processor Tests
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { LineArtProcessor } from './line-art-processor';
import type { LineArtParameters } from '../types';

describe('LineArtProcessor', () => {
  let processor: LineArtProcessor;

  beforeEach(() => {
    processor = new LineArtProcessor();
  });

  describe('Basic Properties', () => {
    it('should have correct basic properties', () => {
      expect(processor.id).toBe('line-art');
      expect(processor.name).toBe('Line Art');
      expect(processor.description).toBe('Clean vector-like outlines perfect for laser cutting');
      expect(processor.category).toBe('vector');
    });
  });

  describe('Default Parameters', () => {
    it('should return valid default parameters', () => {
      const defaults = processor.getDefaultParameters();

      expect(defaults).toMatchObject({
        contrast: expect.any(Number),
        brightness: expect.any(Number),
        sharpness: expect.any(Number),
        edgeThreshold: expect.any(Number),
        lineWeight: expect.any(Number),
        smoothing: expect.any(Number),
      });

      expect(defaults.contrast).toBeGreaterThan(0);
      expect(defaults.brightness).toBeGreaterThan(0);
      expect(defaults.sharpness).toBeGreaterThan(0);
      expect(defaults.edgeThreshold).toBeGreaterThanOrEqual(0);
      expect(defaults.edgeThreshold).toBeLessThanOrEqual(1);
      expect(defaults.lineWeight).toBeGreaterThanOrEqual(0);
      expect(defaults.lineWeight).toBeLessThanOrEqual(1);
      expect(defaults.smoothing).toBeGreaterThanOrEqual(0);
      expect(defaults.smoothing).toBeLessThanOrEqual(1);
    });
  });

  describe('Default Settings', () => {
    it('should return valid default settings', () => {
      const defaults = processor.getDefaultSettings();

      expect(defaults).toMatchObject({
        strength: expect.any(Number),
        steps: expect.any(Number),
        guidance_scale: expect.any(Number),
        width: expect.any(Number),
        height: expect.any(Number),
      });

      expect(defaults.strength).toBeGreaterThan(0);
      expect(defaults.strength).toBeLessThanOrEqual(1);
      expect(defaults.steps).toBeGreaterThan(0);
      expect(defaults.guidance_scale).toBeGreaterThan(0);
      expect(defaults.width).toBeGreaterThan(0);
      expect(defaults.height).toBeGreaterThan(0);
    });
  });

  describe('Parameter Validation', () => {
    it('should validate correct parameters', () => {
      const validParams: LineArtParameters = {
        contrast: 1.5,
        brightness: 1.0,
        sharpness: 1.2,
        edgeThreshold: 0.5,
        lineWeight: 0.6,
        smoothing: 0.3,
      };

      expect(processor.validateParameters(validParams)).toBe(true);
    });

    it('should reject parameters with invalid edge threshold', () => {
      const invalidParams: LineArtParameters = {
        contrast: 1.5,
        brightness: 1.0,
        sharpness: 1.2,
        edgeThreshold: 1.5, // Invalid: > 1
        lineWeight: 0.6,
        smoothing: 0.3,
      };

      expect(processor.validateParameters(invalidParams)).toBe(false);
    });

    it('should reject parameters with invalid line weight', () => {
      const invalidParams: LineArtParameters = {
        contrast: 1.5,
        brightness: 1.0,
        sharpness: 1.2,
        edgeThreshold: 0.5,
        lineWeight: -0.1, // Invalid: < 0
        smoothing: 0.3,
      };

      expect(processor.validateParameters(invalidParams)).toBe(false);
    });

    it('should reject parameters with invalid smoothing', () => {
      const invalidParams: LineArtParameters = {
        contrast: 1.5,
        brightness: 1.0,
        sharpness: 1.2,
        edgeThreshold: 0.5,
        lineWeight: 0.6,
        smoothing: 1.5, // Invalid: > 1
      };

      expect(processor.validateParameters(invalidParams)).toBe(false);
    });

    it('should reject parameters with invalid base parameters', () => {
      const invalidParams: LineArtParameters = {
        contrast: -0.5, // Invalid: < 0
        brightness: 1.0,
        sharpness: 1.2,
        edgeThreshold: 0.5,
        lineWeight: 0.6,
        smoothing: 0.3,
      };

      expect(processor.validateParameters(invalidParams)).toBe(false);
    });
  });

  describe('Prompt Generation', () => {
    it('should generate prompts with high edge threshold', () => {
      const params: LineArtParameters = {
        contrast: 1.5,
        brightness: 1.0,
        sharpness: 1.2,
        edgeThreshold: 0.8, // High threshold
        lineWeight: 0.5,
        smoothing: 0.3,
      };

      const prompt = processor.generatePrompt(params);

      expect(prompt.basePrompt).toContain('high contrast edges');
      expect(prompt.basePrompt).toContain('sharp boundaries');
      expect(prompt.negativePrompt).toBeDefined();
      expect(prompt.styleModifiers).toContain('high contrast edges');
      expect(prompt.qualityTags).toBeDefined();
    });

    it('should generate prompts with low edge threshold', () => {
      const params: LineArtParameters = {
        contrast: 1.5,
        brightness: 1.0,
        sharpness: 1.2,
        edgeThreshold: 0.2, // Low threshold
        lineWeight: 0.5,
        smoothing: 0.3,
      };

      const prompt = processor.generatePrompt(params);

      expect(prompt.basePrompt).toContain('subtle edges');
      expect(prompt.basePrompt).toContain('soft boundaries');
      expect(prompt.styleModifiers).toContain('subtle edges');
    });

    it('should generate prompts with thick lines', () => {
      const params: LineArtParameters = {
        contrast: 1.5,
        brightness: 1.0,
        sharpness: 1.2,
        edgeThreshold: 0.5,
        lineWeight: 0.8, // Thick lines
        smoothing: 0.3,
      };

      const prompt = processor.generatePrompt(params);

      expect(prompt.basePrompt).toContain('thick lines');
      expect(prompt.basePrompt).toContain('bold outlines');
      expect(prompt.styleModifiers).toContain('thick lines');
    });

    it('should generate prompts with thin lines', () => {
      const params: LineArtParameters = {
        contrast: 1.5,
        brightness: 1.0,
        sharpness: 1.2,
        edgeThreshold: 0.5,
        lineWeight: 0.2, // Thin lines
        smoothing: 0.3,
      };

      const prompt = processor.generatePrompt(params);

      expect(prompt.basePrompt).toContain('thin lines');
      expect(prompt.basePrompt).toContain('fine outlines');
      expect(prompt.styleModifiers).toContain('thin lines');
    });

    it('should generate prompts with high smoothing', () => {
      const params: LineArtParameters = {
        contrast: 1.5,
        brightness: 1.0,
        sharpness: 1.2,
        edgeThreshold: 0.5,
        lineWeight: 0.5,
        smoothing: 0.8, // High smoothing
      };

      const prompt = processor.generatePrompt(params);

      expect(prompt.basePrompt).toContain('smooth curves');
      expect(prompt.basePrompt).toContain('flowing lines');
      expect(prompt.styleModifiers).toContain('smooth curves');
    });

    it('should generate prompts with low smoothing', () => {
      const params: LineArtParameters = {
        contrast: 1.5,
        brightness: 1.0,
        sharpness: 1.2,
        edgeThreshold: 0.5,
        lineWeight: 0.5,
        smoothing: 0.2, // Low smoothing
      };

      const prompt = processor.generatePrompt(params);

      expect(prompt.basePrompt).toContain('angular lines');
      expect(prompt.basePrompt).toContain('geometric precision');
      expect(prompt.styleModifiers).toContain('angular lines');
    });

    it('should include negative modifiers for high contrast', () => {
      const params: LineArtParameters = {
        contrast: 1.8, // High contrast
        brightness: 1.0,
        sharpness: 1.2,
        edgeThreshold: 0.5,
        lineWeight: 0.5,
        smoothing: 0.3,
      };

      const prompt = processor.generatePrompt(params);

      expect(prompt.negativePrompt).toContain('medium contrast');
      expect(prompt.negativePrompt).toContain('subtle shading');
    });

    it('should always include base line art elements', () => {
      const params = processor.getDefaultParameters();
      const prompt = processor.generatePrompt(params);

      expect(prompt.basePrompt).toContain('line art drawing');
      expect(prompt.basePrompt).toContain('clean vector outlines');
      expect(prompt.basePrompt).toContain('laser engraving optimized');
      expect(prompt.negativePrompt).toContain('blurry');
      expect(prompt.negativePrompt).toContain('filled shapes');
      expect(prompt.qualityTags).toContain('precise linework');
    });
  });

  describe('Pre-processing', () => {
    it('should handle pre-processing', async () => {
      const imageData = 'data:image/png;base64,test';
      const result = await processor.preProcess(imageData);
      expect(result).toBe(imageData); // Default implementation returns unchanged
    });
  });
});
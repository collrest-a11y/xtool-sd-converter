/**
 * Style Engine Tests
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { StyleEngine } from './style-engine';
import type { StyleEngineConfig, StyleParameters, StyleSettings } from './types';

// Mock the SD client
vi.mock('../sd-client', () => ({
  SDWebUIClient: vi.fn().mockImplementation(() => ({
    checkHealth: vi.fn().mockResolvedValue(true),
    imageToImage: vi.fn().mockResolvedValue({
      success: true,
      imageUrl: 'data:image/png;base64,mock-result',
      metadata: {
        processingTime: 1000,
        settings: { strength: 0.8, steps: 20 },
        parameters: { contrast: 1.0, brightness: 1.0, sharpness: 1.0 },
      },
    }),
    cancelProcessing: vi.fn().mockResolvedValue(undefined),
    updateConfig: vi.fn(),
  })),
}));

describe('StyleEngine', () => {
  let engine: StyleEngine;
  let mockConfig: Partial<StyleEngineConfig>;

  beforeEach(() => {
    mockConfig = {
      sdApiEndpoint: 'http://localhost:7860',
      maxConcurrentJobs: 2,
      defaultTimeout: 30000,
      cacheResults: true,
      previewEnabled: true,
    };
    engine = new StyleEngine(mockConfig);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Initialization', () => {
    it('should create engine with default config', () => {
      const defaultEngine = new StyleEngine();
      const config = defaultEngine.getConfig();

      expect(config.sdApiEndpoint).toBe('http://127.0.0.1:7860');
      expect(config.maxConcurrentJobs).toBe(2);
      expect(config.defaultTimeout).toBe(60000);
      expect(config.cacheResults).toBe(true);
      expect(config.previewEnabled).toBe(true);
    });

    it('should create engine with custom config', () => {
      const config = engine.getConfig();

      expect(config.sdApiEndpoint).toBe('http://localhost:7860');
      expect(config.maxConcurrentJobs).toBe(2);
      expect(config.defaultTimeout).toBe(30000);
      expect(config.cacheResults).toBe(true);
      expect(config.previewEnabled).toBe(true);
    });

    it('should initialize successfully', async () => {
      const onInitialized = vi.fn();
      engine.on('initialized', onInitialized);

      await engine.initialize();

      expect(onInitialized).toHaveBeenCalledWith({ success: true });
    });
  });

  describe('Style Management', () => {
    it('should return all available styles', () => {
      const styles = engine.getAvailableStyles();

      expect(styles).toHaveLength(5);
      expect(styles.map(s => s.id)).toContain('line-art');
      expect(styles.map(s => s.id)).toContain('halftone');
      expect(styles.map(s => s.id)).toContain('stipple');
      expect(styles.map(s => s.id)).toContain('geometric');
      expect(styles.map(s => s.id)).toContain('minimalist');

      // Check that each style has required properties
      styles.forEach(style => {
        expect(style).toMatchObject({
          id: expect.any(String),
          name: expect.any(String),
          description: expect.any(String),
          thumbnail: expect.any(String),
          category: expect.stringMatching(/^(vector|raster|hybrid)$/),
          processor: expect.any(Object),
          defaultSettings: expect.any(Object),
          defaultParameters: expect.any(Object),
          parameterControls: expect.any(Array),
          previewOptions: expect.any(Object),
        });
      });
    });

    it('should return specific style by ID', () => {
      const lineArtStyle = engine.getStyle('line-art');

      expect(lineArtStyle).not.toBeNull();
      expect(lineArtStyle?.id).toBe('line-art');
      expect(lineArtStyle?.name).toBe('Line Art');
      expect(lineArtStyle?.category).toBe('vector');
    });

    it('should return null for unknown style ID', () => {
      const unknownStyle = engine.getStyle('unknown-style');
      expect(unknownStyle).toBeNull();
    });

    it('should validate style categories', () => {
      const styles = engine.getAvailableStyles();
      const lineArt = styles.find(s => s.id === 'line-art');
      const halftone = styles.find(s => s.id === 'halftone');
      const geometric = styles.find(s => s.id === 'geometric');

      expect(lineArt?.category).toBe('vector');
      expect(halftone?.category).toBe('raster');
      expect(geometric?.category).toBe('hybrid');
    });
  });

  describe('Parameter Controls Generation', () => {
    it('should generate base parameter controls for all styles', () => {
      const styles = engine.getAvailableStyles();

      styles.forEach(style => {
        const baseControls = style.parameterControls.filter(c =>
          ['contrast', 'brightness', 'sharpness'].includes(c.key as string)
        );

        expect(baseControls).toHaveLength(3);

        baseControls.forEach(control => {
          expect(control).toMatchObject({
            key: expect.any(String),
            label: expect.any(String),
            type: expect.stringMatching(/^(slider|toggle|select|number)$/),
            description: expect.any(String),
          });

          if (control.type === 'slider') {
            expect(control.min).toBeDefined();
            expect(control.max).toBeDefined();
            expect(control.step).toBeDefined();
          }
        });
      });
    });

    it('should generate style-specific controls for line art', () => {
      const lineArt = engine.getStyle('line-art');
      const specificControls = lineArt?.parameterControls.filter(c =>
        ['edgeThreshold', 'lineWeight', 'smoothing'].includes(c.key as string)
      );

      expect(specificControls).toHaveLength(3);
      expect(specificControls?.map(c => c.key)).toContain('edgeThreshold');
      expect(specificControls?.map(c => c.key)).toContain('lineWeight');
      expect(specificControls?.map(c => c.key)).toContain('smoothing');
    });

    it('should generate style-specific controls for halftone', () => {
      const halftone = engine.getStyle('halftone');
      const specificControls = halftone?.parameterControls.filter(c =>
        ['dotSize', 'screenAngle', 'shape'].includes(c.key as string)
      );

      expect(specificControls).toHaveLength(3);

      const shapeControl = specificControls?.find(c => c.key === 'shape');
      expect(shapeControl?.type).toBe('select');
      expect(shapeControl?.options).toContainEqual({ value: 'circle', label: 'Circle' });
      expect(shapeControl?.options).toContainEqual({ value: 'square', label: 'Square' });
      expect(shapeControl?.options).toContainEqual({ value: 'diamond', label: 'Diamond' });
    });

    it('should generate style-specific controls for geometric', () => {
      const geometric = engine.getStyle('geometric');
      const specificControls = geometric?.parameterControls.filter(c =>
        ['patternType', 'complexity', 'symmetry'].includes(c.key as string)
      );

      expect(specificControls).toHaveLength(3);

      const patternControl = specificControls?.find(c => c.key === 'patternType');
      expect(patternControl?.type).toBe('select');
      expect(patternControl?.options).toContainEqual({ value: 'triangular', label: 'Triangular' });

      const symmetryControl = specificControls?.find(c => c.key === 'symmetry');
      expect(symmetryControl?.type).toBe('toggle');
    });
  });

  describe('Image Processing', () => {
    it('should process image successfully', async () => {
      const imageData = 'data:image/png;base64,test-image';
      const styleId = 'line-art';
      const parameters: Partial<StyleParameters> = { contrast: 1.5 };
      const settings: Partial<StyleSettings> = { strength: 0.8 };

      const result = await engine.processImage(imageData, styleId, parameters, settings);

      expect(result.success).toBe(true);
      expect(result.imageUrl).toBe('data:image/png;base64,mock-result');
      expect(result.metadata).toBeDefined();
      expect(result.metadata?.processingTime).toBeGreaterThan(0);
    });

    it('should emit processing events', async () => {
      const onQueued = vi.fn();
      const onStarted = vi.fn();
      const onCompleted = vi.fn();

      engine.on('processing:queued', onQueued);
      engine.on('processing:started', onStarted);
      engine.on('processing:completed', onCompleted);

      const imageData = 'data:image/png;base64,test-image';
      await engine.processImage(imageData, 'line-art');

      expect(onQueued).toHaveBeenCalled();
      expect(onStarted).toHaveBeenCalled();
      expect(onCompleted).toHaveBeenCalled();
    });

    it('should cache successful results when enabled', async () => {
      const imageData = 'data:image/png;base64,test-image';
      const styleId = 'line-art';

      // First processing
      const result1 = await engine.processImage(imageData, styleId);
      expect(result1.success).toBe(true);

      // Second processing should return cached result
      const result2 = await engine.processImage(imageData, styleId);
      expect(result2.success).toBe(true);
      expect(result2.imageUrl).toBe(result1.imageUrl);
    });

    it('should generate preview with lower quality settings', async () => {
      const imageData = 'data:image/png;base64,test-image';
      const styleId = 'line-art';

      const result = await engine.generatePreview(imageData, styleId);

      expect(result.success).toBe(true);
      // Preview should use lower quality settings
      expect(result.metadata?.settings.width).toBe(256);
      expect(result.metadata?.settings.height).toBe(256);
      expect(result.metadata?.settings.steps).toBe(10);
    });

    it('should throw error when preview is disabled', async () => {
      engine.updateConfig({ previewEnabled: false });

      await expect(
        engine.generatePreview('data:image/png;base64,test', 'line-art')
      ).rejects.toThrow('Preview generation is disabled');
    });
  });

  describe('Queue Management', () => {
    it('should track processing queue', async () => {
      const imageData = 'data:image/png;base64,test-image';

      // Start processing (don't await)
      const processingPromise = engine.processImage(imageData, 'line-art');

      // Check queue status
      const queueStatus = engine.getQueueStatus();
      expect(queueStatus.length).toBeGreaterThan(0);

      // Wait for completion
      await processingPromise;

      const finalStatus = engine.getQueueStatus();
      const completedJob = finalStatus.find(job => job.status === 'completed');
      expect(completedJob).toBeDefined();
    });

    it('should clear completed jobs', async () => {
      const imageData = 'data:image/png;base64,test-image';
      await engine.processImage(imageData, 'line-art');

      let queueStatus = engine.getQueueStatus();
      expect(queueStatus.length).toBeGreaterThan(0);

      engine.clearCompletedJobs();

      queueStatus = engine.getQueueStatus();
      const completedJobs = queueStatus.filter(job => job.status === 'completed');
      expect(completedJobs).toHaveLength(0);
    });

    it('should clear cache', () => {
      const onCacheCleared = vi.fn();
      engine.on('cache:cleared', onCacheCleared);

      engine.clearCache();

      expect(onCacheCleared).toHaveBeenCalled();
    });
  });

  describe('Configuration Management', () => {
    it('should update configuration', () => {
      const newConfig = {
        maxConcurrentJobs: 4,
        cacheResults: false,
      };

      engine.updateConfig(newConfig);

      const config = engine.getConfig();
      expect(config.maxConcurrentJobs).toBe(4);
      expect(config.cacheResults).toBe(false);
      expect(config.sdApiEndpoint).toBe('http://localhost:7860'); // Should keep existing values
    });

    it('should get current configuration', () => {
      const config = engine.getConfig();

      expect(config).toMatchObject({
        sdApiEndpoint: expect.any(String),
        maxConcurrentJobs: expect.any(Number),
        defaultTimeout: expect.any(Number),
        cacheResults: expect.any(Boolean),
        previewEnabled: expect.any(Boolean),
      });
    });
  });

  describe('Event System', () => {
    it('should register and emit events', () => {
      const callback = vi.fn();
      engine.on('test-event', callback);

      // Access private method for testing
      (engine as any).emit('test-event', { data: 'test' });

      expect(callback).toHaveBeenCalledWith({ data: 'test' });
    });

    it('should unregister event listeners', () => {
      const callback = vi.fn();
      engine.on('test-event', callback);
      engine.off('test-event', callback);

      (engine as any).emit('test-event', { data: 'test' });

      expect(callback).not.toHaveBeenCalled();
    });

    it('should handle errors in event listeners gracefully', () => {
      const errorCallback = vi.fn(() => {
        throw new Error('Test error');
      });
      const normalCallback = vi.fn();

      engine.on('test-event', errorCallback);
      engine.on('test-event', normalCallback);

      expect(() => {
        (engine as any).emit('test-event', { data: 'test' });
      }).not.toThrow();

      expect(errorCallback).toHaveBeenCalled();
      expect(normalCallback).toHaveBeenCalled();
    });
  });
});
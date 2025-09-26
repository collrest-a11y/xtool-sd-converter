/**
 * Style Processing Engine
 * Main engine for managing laser engraving style conversions
 */

import { SDWebUIClient } from '../sd-client';
import { getStyleProcessor, STYLE_PROCESSORS } from './processors';
import { getPromptTemplate } from './prompts';
import type {
  StyleSettings,
  StyleParameters,
  ProcessingResult,
  ProcessingQueue,
  StyleEngineConfig,
  LaserConversionStyle,
  ParameterControl,
  PreviewOptions,
} from './types';

export class StyleEngine {
  private sdClient: SDWebUIClient;
  private config: StyleEngineConfig;
  private processingQueue: Map<string, ProcessingQueue> = new Map();
  private cache: Map<string, ProcessingResult> = new Map();
  private eventListeners: Map<string, ((data: any) => void)[]> = new Map();

  constructor(config: Partial<StyleEngineConfig> = {}) {
    this.config = {
      sdApiEndpoint: config.sdApiEndpoint || 'http://127.0.0.1:7860',
      maxConcurrentJobs: config.maxConcurrentJobs || 2,
      defaultTimeout: config.defaultTimeout || 60000,
      cacheResults: config.cacheResults ?? true,
      previewEnabled: config.previewEnabled ?? true,
      ...config,
    };

    this.sdClient = new SDWebUIClient({
      baseUrl: this.config.sdApiEndpoint,
      timeout: this.config.defaultTimeout,
    });
  }

  /**
   * Initialize the style engine
   */
  async initialize(): Promise<void> {
    try {
      const isHealthy = await this.sdClient.checkHealth();
      if (!isHealthy) {
        throw new Error('SD WebUI API is not available');
      }

      this.emit('initialized', { success: true });
    } catch (error) {
      this.emit('initialized', { success: false, error });
      throw error;
    }
  }

  /**
   * Get all available conversion styles
   */
  getAvailableStyles(): LaserConversionStyle[] {
    return Object.entries(STYLE_PROCESSORS).map(([id, processor]) => ({
      id,
      name: processor.name,
      description: processor.description,
      thumbnail: `/api/placeholder/150/150?text=${encodeURIComponent(processor.name)}`,
      category: processor.category,
      processor,
      defaultSettings: processor.getDefaultSettings(),
      defaultParameters: processor.getDefaultParameters(),
      parameterControls: this.generateParameterControls(id),
      previewOptions: this.getDefaultPreviewOptions(),
    }));
  }

  /**
   * Get a specific style by ID
   */
  getStyle(styleId: string): LaserConversionStyle | null {
    const processor = STYLE_PROCESSORS[styleId];
    if (!processor) {
      return null;
    }

    return {
      id: styleId,
      name: processor.name,
      description: processor.description,
      thumbnail: `/api/placeholder/150/150?text=${encodeURIComponent(processor.name)}`,
      category: processor.category,
      processor,
      defaultSettings: processor.getDefaultSettings(),
      defaultParameters: processor.getDefaultParameters(),
      parameterControls: this.generateParameterControls(styleId),
      previewOptions: this.getDefaultPreviewOptions(),
    };
  }

  /**
   * Process an image with the specified style
   */
  async processImage(
    imageData: string,
    styleId: string,
    parameters: Partial<StyleParameters> = {},
    settings: Partial<StyleSettings> = {}
  ): Promise<ProcessingResult> {
    const jobId = this.generateJobId(imageData, styleId, parameters, settings);

    // Check cache first
    if (this.config.cacheResults && this.cache.has(jobId)) {
      const cachedResult = this.cache.get(jobId)!;
      this.emit('processing:completed', { jobId, result: cachedResult });
      return cachedResult;
    }

    // Add to processing queue
    const queueItem: ProcessingQueue = {
      id: jobId,
      styleId,
      imageData,
      parameters: parameters as StyleParameters,
      settings: settings as StyleSettings,
      status: 'queued',
      createdAt: new Date(),
    };

    this.processingQueue.set(jobId, queueItem);
    this.emit('processing:queued', { jobId, queueItem });

    try {
      // Update status to processing
      queueItem.status = 'processing';
      this.processingQueue.set(jobId, queueItem);
      this.emit('processing:started', { jobId, queueItem });

      const result = await this.executeProcessing(imageData, styleId, parameters, settings);

      // Update queue item with result
      queueItem.status = result.success ? 'completed' : 'failed';
      queueItem.completedAt = new Date();
      queueItem.result = result;
      this.processingQueue.set(jobId, queueItem);

      // Cache successful results
      if (result.success && this.config.cacheResults) {
        this.cache.set(jobId, result);
      }

      this.emit('processing:completed', { jobId, result });
      return result;

    } catch (error) {
      const result: ProcessingResult = {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };

      queueItem.status = 'failed';
      queueItem.completedAt = new Date();
      queueItem.result = result;
      this.processingQueue.set(jobId, queueItem);

      this.emit('processing:failed', { jobId, error, result });
      return result;
    }
  }

  /**
   * Generate a preview for the specified style
   */
  async generatePreview(
    imageData: string,
    styleId: string,
    parameters: Partial<StyleParameters> = {}
  ): Promise<ProcessingResult> {
    if (!this.config.previewEnabled) {
      throw new Error('Preview generation is disabled');
    }

    // Use lower quality settings for faster preview generation
    const previewSettings: Partial<StyleSettings> = {
      width: 256,
      height: 256,
      steps: 10,
      strength: 0.6,
    };

    return this.processImage(imageData, styleId, parameters, previewSettings);
  }

  /**
   * Cancel a processing job
   */
  async cancelProcessing(jobId: string): Promise<void> {
    const queueItem = this.processingQueue.get(jobId);
    if (!queueItem) {
      throw new Error(`Job ${jobId} not found`);
    }

    if (queueItem.status === 'processing') {
      await this.sdClient.cancelProcessing();
    }

    queueItem.status = 'failed';
    queueItem.result = {
      success: false,
      error: 'Processing cancelled by user',
    };

    this.processingQueue.set(jobId, queueItem);
    this.emit('processing:cancelled', { jobId });
  }

  /**
   * Get processing queue status
   */
  getQueueStatus(): ProcessingQueue[] {
    return Array.from(this.processingQueue.values());
  }

  /**
   * Clear completed jobs from queue
   */
  clearCompletedJobs(): void {
    for (const [jobId, queueItem] of this.processingQueue.entries()) {
      if (queueItem.status === 'completed' || queueItem.status === 'failed') {
        this.processingQueue.delete(jobId);
      }
    }
    this.emit('queue:cleared');
  }

  /**
   * Clear cache
   */
  clearCache(): void {
    this.cache.clear();
    this.emit('cache:cleared');
  }

  /**
   * Execute the actual processing
   */
  private async executeProcessing(
    imageData: string,
    styleId: string,
    parameters: Partial<StyleParameters>,
    settings: Partial<StyleSettings>
  ): Promise<ProcessingResult> {
    const processor = getStyleProcessor(styleId);

    // Merge parameters with defaults
    const finalParameters = { ...processor.getDefaultParameters(), ...parameters };
    const finalSettings = { ...processor.getDefaultSettings(), ...settings };

    // Validate parameters
    if (!processor.validateParameters(finalParameters)) {
      throw new Error('Invalid parameters for style processor');
    }

    // Pre-process the image if needed
    const processedImageData = await processor.preProcess?.(imageData) || imageData;

    // Generate the prompt
    const promptTemplate = processor.generatePrompt(finalParameters);

    // Process with SD WebUI
    const result = await this.sdClient.imageToImage(
      promptTemplate.basePrompt,
      processedImageData,
      promptTemplate.negativePrompt,
      finalSettings
    );

    // Post-process the result if needed
    return processor.postProcess?.(result) || result;
  }

  /**
   * Generate parameter controls for a style
   */
  private generateParameterControls(styleId: string): ParameterControl[] {
    const baseControls: ParameterControl[] = [
      {
        key: 'contrast',
        label: 'Contrast',
        type: 'slider',
        min: 0.5,
        max: 2.0,
        step: 0.1,
        description: 'Adjust the contrast of the output',
      },
      {
        key: 'brightness',
        label: 'Brightness',
        type: 'slider',
        min: 0.5,
        max: 1.5,
        step: 0.1,
        description: 'Adjust the brightness of the output',
      },
      {
        key: 'sharpness',
        label: 'Sharpness',
        type: 'slider',
        min: 0.5,
        max: 2.0,
        step: 0.1,
        description: 'Adjust the sharpness of edges and details',
      },
    ];

    // Add style-specific controls
    switch (styleId) {
      case 'line-art':
        baseControls.push(
          {
            key: 'edgeThreshold',
            label: 'Edge Threshold',
            type: 'slider',
            min: 0.0,
            max: 1.0,
            step: 0.1,
            description: 'Sensitivity for edge detection',
          },
          {
            key: 'lineWeight',
            label: 'Line Weight',
            type: 'slider',
            min: 0.0,
            max: 1.0,
            step: 0.1,
            description: 'Thickness of the lines',
          },
          {
            key: 'smoothing',
            label: 'Smoothing',
            type: 'slider',
            min: 0.0,
            max: 1.0,
            step: 0.1,
            description: 'Smoothness of line curves',
          }
        );
        break;

      case 'halftone':
        baseControls.push(
          {
            key: 'dotSize',
            label: 'Dot Size',
            type: 'slider',
            min: 0.1,
            max: 1.0,
            step: 0.1,
            description: 'Size of halftone dots',
          },
          {
            key: 'screenAngle',
            label: 'Screen Angle',
            type: 'slider',
            min: 0,
            max: 90,
            step: 15,
            description: 'Angle of the halftone screen',
          },
          {
            key: 'shape',
            label: 'Dot Shape',
            type: 'select',
            options: [
              { value: 'circle', label: 'Circle' },
              { value: 'square', label: 'Square' },
              { value: 'diamond', label: 'Diamond' },
            ],
            description: 'Shape of the halftone dots',
          }
        );
        break;

      case 'stipple':
        baseControls.push(
          {
            key: 'dotDensity',
            label: 'Dot Density',
            type: 'slider',
            min: 0.1,
            max: 1.0,
            step: 0.1,
            description: 'Density of stipple dots',
          },
          {
            key: 'randomness',
            label: 'Randomness',
            type: 'slider',
            min: 0.0,
            max: 1.0,
            step: 0.1,
            description: 'Randomness in dot placement',
          }
        );
        break;

      case 'geometric':
        baseControls.push(
          {
            key: 'patternType',
            label: 'Pattern Type',
            type: 'select',
            options: [
              { value: 'triangular', label: 'Triangular' },
              { value: 'hexagonal', label: 'Hexagonal' },
              { value: 'diamond', label: 'Diamond' },
              { value: 'custom', label: 'Custom' },
            ],
            description: 'Type of geometric pattern',
          },
          {
            key: 'complexity',
            label: 'Complexity',
            type: 'slider',
            min: 0.0,
            max: 1.0,
            step: 0.1,
            description: 'Complexity of the pattern',
          },
          {
            key: 'symmetry',
            label: 'Symmetry',
            type: 'toggle',
            description: 'Enable symmetric patterns',
          }
        );
        break;

      case 'minimalist':
        baseControls.push(
          {
            key: 'contrastBoost',
            label: 'Contrast Boost',
            type: 'slider',
            min: 1.0,
            max: 3.0,
            step: 0.1,
            description: 'Boost contrast for minimalist effect',
          },
          {
            key: 'noiseReduction',
            label: 'Noise Reduction',
            type: 'slider',
            min: 0.0,
            max: 1.0,
            step: 0.1,
            description: 'Remove noise and artifacts',
          }
        );
        break;
    }

    return baseControls;
  }

  /**
   * Get default preview options
   */
  private getDefaultPreviewOptions(): PreviewOptions {
    return {
      showRealTime: true,
      updateDelay: 500,
      thumbnailSize: 256,
      showParameters: true,
    };
  }

  /**
   * Generate a unique job ID
   */
  private generateJobId(
    imageData: string,
    styleId: string,
    parameters: Partial<StyleParameters>,
    settings: Partial<StyleSettings>
  ): string {
    const hash = this.simpleHash(
      JSON.stringify({ imageData: imageData.substring(0, 100), styleId, parameters, settings })
    );
    return `${styleId}-${hash}-${Date.now()}`;
  }

  /**
   * Simple hash function for generating job IDs
   */
  private simpleHash(str: string): string {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    return Math.abs(hash).toString(16);
  }

  /**
   * Event system for real-time updates
   */
  on(event: string, callback: (data: any) => void): void {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, []);
    }
    this.eventListeners.get(event)!.push(callback);
  }

  off(event: string, callback: (data: any) => void): void {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      const index = listeners.indexOf(callback);
      if (index > -1) {
        listeners.splice(index, 1);
      }
    }
  }

  private emit(event: string, data: any = {}): void {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      listeners.forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error(`Error in event listener for ${event}:`, error);
        }
      });
    }
  }

  /**
   * Update engine configuration
   */
  updateConfig(newConfig: Partial<StyleEngineConfig>): void {
    this.config = { ...this.config, ...newConfig };
    this.sdClient.updateConfig({
      baseUrl: this.config.sdApiEndpoint,
      timeout: this.config.defaultTimeout,
    });
  }

  /**
   * Get current configuration
   */
  getConfig(): StyleEngineConfig {
    return { ...this.config };
  }
}
/**
 * Stable Diffusion WebUI API Client
 * Handles communication with SD WebUI API for image processing
 */

import type { StyleSettings, ProcessingResult } from './styles/types';

export interface SDWebUIConfig {
  baseUrl: string;
  timeout: number;
  maxRetries: number;
  retryDelay: number;
}

export interface SDWebUIRequest {
  prompt: string;
  negative_prompt?: string;
  width?: number;
  height?: number;
  steps?: number;
  cfg_scale?: number;
  sampler_name?: string;
  seed?: number;
  batch_size?: number;
  n_iter?: number;
  restore_faces?: boolean;
  tiling?: boolean;
  enable_hr?: boolean;
  hr_scale?: number;
  hr_upscaler?: string;
  hr_second_pass_steps?: number;
  hr_resize_x?: number;
  hr_resize_y?: number;
  denoising_strength?: number;
  init_images?: string[];
  resize_mode?: number;
  image_cfg_scale?: number;
  mask?: string;
  mask_blur?: number;
  inpainting_fill?: number;
  inpaint_full_res?: boolean;
  inpaint_full_res_padding?: number;
  inpainting_mask_invert?: number;
  initial_noise_multiplier?: number;
  styles?: string[];
  subseed?: number;
  subseed_strength?: number;
  seed_resize_from_h?: number;
  seed_resize_from_w?: number;
  override_settings?: Record<string, any>;
  override_settings_restore_afterwards?: boolean;
}

export interface SDWebUIResponse {
  images: string[];
  parameters: any;
  info: string;
}

export interface SDWebUIErrorResponse {
  detail: string;
  errors?: string;
  error?: string;
}

export class SDWebUIClient {
  private config: SDWebUIConfig;
  private abortController: AbortController | null = null;

  constructor(config: Partial<SDWebUIConfig> = {}) {
    this.config = {
      baseUrl: config.baseUrl || 'http://127.0.0.1:7860',
      timeout: config.timeout || 60000,
      maxRetries: config.maxRetries || 3,
      retryDelay: config.retryDelay || 1000,
      ...config,
    };
  }

  /**
   * Check if the SD WebUI API is available
   */
  async checkHealth(): Promise<boolean> {
    try {
      const response = await this.makeRequest('/sdapi/v1/options', {
        method: 'GET',
        timeout: 5000,
      });
      return response.ok;
    } catch (error) {
      console.warn('SD WebUI health check failed:', error);
      return false;
    }
  }

  /**
   * Get available samplers
   */
  async getSamplers(): Promise<string[]> {
    try {
      const response = await this.makeRequest('/sdapi/v1/samplers');
      const data = await response.json();
      return data.map((sampler: any) => sampler.name);
    } catch (error) {
      console.warn('Failed to get samplers:', error);
      return ['Euler a', 'DPM++ 2M Karras', 'DDIM'];
    }
  }

  /**
   * Get available models
   */
  async getModels(): Promise<string[]> {
    try {
      const response = await this.makeRequest('/sdapi/v1/sd-models');
      const data = await response.json();
      return data.map((model: any) => model.title);
    } catch (error) {
      console.warn('Failed to get models:', error);
      return [];
    }
  }

  /**
   * Generate image using text-to-image
   */
  async textToImage(
    prompt: string,
    negativePrompt: string = '',
    settings: StyleSettings = {}
  ): Promise<ProcessingResult> {
    const startTime = Date.now();

    try {
      const request: SDWebUIRequest = {
        prompt,
        negative_prompt: negativePrompt,
        width: settings.width || 512,
        height: settings.height || 512,
        steps: settings.steps || 20,
        cfg_scale: settings.guidance_scale || 7.5,
        sampler_name: 'Euler a',
        seed: settings.seed || -1,
        batch_size: 1,
        n_iter: 1,
        restore_faces: false,
        tiling: false,
      };

      const response = await this.makeRequest('/sdapi/v1/txt2img', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
      });

      if (!response.ok) {
        const errorData: SDWebUIErrorResponse = await response.json();
        throw new Error(errorData.detail || errorData.error || 'Unknown error');
      }

      const data: SDWebUIResponse = await response.json();
      const processingTime = Date.now() - startTime;

      if (!data.images || data.images.length === 0) {
        throw new Error('No images generated');
      }

      // Convert base64 to data URL
      const imageUrl = `data:image/png;base64,${data.images[0]}`;

      return {
        success: true,
        imageUrl,
        metadata: {
          processingTime,
          settings,
          parameters: {
            contrast: 1.0,
            brightness: 1.0,
            sharpness: 1.0,
          },
        },
      };
    } catch (error) {
      const processingTime = Date.now() - startTime;
      console.error('Text-to-image generation failed:', error);

      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        metadata: {
          processingTime,
          settings,
          parameters: {
            contrast: 1.0,
            brightness: 1.0,
            sharpness: 1.0,
          },
        },
      };
    }
  }

  /**
   * Generate image using image-to-image
   */
  async imageToImage(
    prompt: string,
    initImage: string,
    negativePrompt: string = '',
    settings: StyleSettings = {}
  ): Promise<ProcessingResult> {
    const startTime = Date.now();

    try {
      // Remove data URL prefix if present
      const base64Image = initImage.replace(/^data:image\/[^;]+;base64,/, '');

      const request: SDWebUIRequest = {
        prompt,
        negative_prompt: negativePrompt,
        init_images: [base64Image],
        width: settings.width || 512,
        height: settings.height || 512,
        steps: settings.steps || 20,
        cfg_scale: settings.guidance_scale || 7.5,
        denoising_strength: settings.strength || 0.7,
        sampler_name: 'Euler a',
        seed: settings.seed || -1,
        batch_size: 1,
        n_iter: 1,
        restore_faces: false,
        tiling: false,
      };

      const response = await this.makeRequest('/sdapi/v1/img2img', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
      });

      if (!response.ok) {
        const errorData: SDWebUIErrorResponse = await response.json();
        throw new Error(errorData.detail || errorData.error || 'Unknown error');
      }

      const data: SDWebUIResponse = await response.json();
      const processingTime = Date.now() - startTime;

      if (!data.images || data.images.length === 0) {
        throw new Error('No images generated');
      }

      // Convert base64 to data URL
      const imageUrl = `data:image/png;base64,${data.images[0]}`;

      return {
        success: true,
        imageUrl,
        metadata: {
          processingTime,
          settings,
          parameters: {
            contrast: 1.0,
            brightness: 1.0,
            sharpness: 1.0,
          },
        },
      };
    } catch (error) {
      const processingTime = Date.now() - startTime;
      console.error('Image-to-image generation failed:', error);

      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        metadata: {
          processingTime,
          settings,
          parameters: {
            contrast: 1.0,
            brightness: 1.0,
            sharpness: 1.0,
          },
        },
      };
    }
  }

  /**
   * Cancel current processing
   */
  async cancelProcessing(): Promise<void> {
    if (this.abortController) {
      this.abortController.abort();
      this.abortController = null;
    }

    try {
      await this.makeRequest('/sdapi/v1/interrupt', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({}),
      });
    } catch (error) {
      console.warn('Failed to send interrupt signal:', error);
    }
  }

  /**
   * Get current progress
   */
  async getProgress(): Promise<{
    progress: number;
    eta_relative: number;
    state: any;
    current_image?: string;
  }> {
    try {
      const response = await this.makeRequest('/sdapi/v1/progress', {
        timeout: 5000,
      });
      return await response.json();
    } catch (error) {
      console.warn('Failed to get progress:', error);
      return {
        progress: 0,
        eta_relative: 0,
        state: {},
      };
    }
  }

  /**
   * Make HTTP request with retries and timeout
   */
  private async makeRequest(
    endpoint: string,
    options: RequestInit & { timeout?: number } = {}
  ): Promise<Response> {
    const { timeout = this.config.timeout, ...requestOptions } = options;
    const url = `${this.config.baseUrl}${endpoint}`;

    for (let attempt = 0; attempt <= this.config.maxRetries; attempt++) {
      try {
        this.abortController = new AbortController();
        const timeoutId = setTimeout(() => {
          this.abortController?.abort();
        }, timeout);

        const response = await fetch(url, {
          ...requestOptions,
          signal: this.abortController.signal,
        });

        clearTimeout(timeoutId);
        this.abortController = null;

        if (response.ok || attempt === this.config.maxRetries) {
          return response;
        }

        // If it's a server error and we have retries left, continue
        if (response.status >= 500) {
          console.warn(`Attempt ${attempt + 1} failed with status ${response.status}, retrying...`);
          await this.delay(this.config.retryDelay * (attempt + 1));
          continue;
        }

        return response;
      } catch (error) {
        this.abortController = null;

        if (error instanceof Error && error.name === 'AbortError') {
          throw new Error('Request timeout');
        }

        if (attempt === this.config.maxRetries) {
          throw error;
        }

        console.warn(`Attempt ${attempt + 1} failed:`, error);
        await this.delay(this.config.retryDelay * (attempt + 1));
      }
    }

    throw new Error('Max retries exceeded');
  }

  /**
   * Delay utility for retries
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Update configuration
   */
  updateConfig(newConfig: Partial<SDWebUIConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }

  /**
   * Get current configuration
   */
  getConfig(): SDWebUIConfig {
    return { ...this.config };
  }
}
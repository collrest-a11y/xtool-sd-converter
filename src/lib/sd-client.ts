import type {
  SDClientConfig,
  Txt2ImgRequest,
  Txt2ImgResponse,
  Img2ImgRequest,
  Img2ImgResponse,
  ProgressResponse,
  SDModel,
  Sampler,
  WebUIOptions,
  APIInfo,
  MemoryInfo,
  HealthCheckResult,
} from './types/sd-api'

import { SDConfig, getSDConfig } from './config/sd-config'
import {
  retryableFetch,
  withRetry,
  createRetryLogger,
  SDAPIError,
  SDConnectionError,
  SDValidationError,
  type RetryOptions
} from './utils/retry'

export class SDWebUIClient {
  private config: SDConfig
  private logger?: (error: Error, attempt: number) => void

  constructor(configOverrides?: Partial<SDClientConfig>) {
    this.config = getSDConfig(configOverrides)

    if (this.config.isLoggingEnabled()) {
      this.logger = createRetryLogger('SDWebUIClient')
    }

    // Validate configuration on initialization
    const validation = this.config.validate()
    if (!validation.isValid) {
      throw new SDValidationError(
        `Invalid configuration: ${validation.errors.join(', ')}`,
        validation.errors
      )
    }
  }

  // Private helper to make API requests
  private async makeRequest<T>(
    endpoint: string,
    options: RequestInit = {},
    customRetryOptions?: Partial<RetryOptions>
  ): Promise<T> {
    const url = `${this.config.getApiUrl()}${endpoint}`

    const retryOptions: RetryOptions = {
      maxAttempts: this.config.getRetryAttempts(),
      delay: this.config.getRetryDelay(),
      backoff: 'exponential',
      maxDelay: 30000, // 30 seconds max
      onRetry: this.logger,
      ...customRetryOptions,
    }

    const response = await retryableFetch(
      url,
      {
        timeout: this.config.getTimeout(),
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
        ...options,
      },
      retryOptions
    )

    const data = await response.json()

    // Check for API errors in response
    if (data.error) {
      throw new SDAPIError(
        data.error,
        response.status,
        data,
        false // API errors are typically not retryable
      )
    }

    return data
  }

  // Get API information and version
  public async getApiInfo(): Promise<APIInfo> {
    return this.makeRequest<APIInfo>('/api/v1/version')
  }

  // Get available models
  public async getModels(): Promise<SDModel[]> {
    return this.makeRequest<SDModel[]>('/sd-models')
  }

  // Get available samplers
  public async getSamplers(): Promise<Sampler[]> {
    return this.makeRequest<Sampler[]>('/samplers')
  }

  // Get current WebUI options
  public async getOptions(): Promise<WebUIOptions> {
    return this.makeRequest<WebUIOptions>('/options')
  }

  // Set WebUI options
  public async setOptions(options: Partial<WebUIOptions>): Promise<void> {
    await this.makeRequest('/options', {
      method: 'POST',
      body: JSON.stringify(options),
    })
  }

  // Get current progress for active generation
  public async getProgress(skipCurrentImage = false): Promise<ProgressResponse> {
    const params = new URLSearchParams()
    if (skipCurrentImage) {
      params.set('skip_current_image', 'true')
    }

    const endpoint = `/progress${params.toString() ? `?${params.toString()}` : ''}`
    return this.makeRequest<ProgressResponse>(endpoint)
  }

  // Interrupt current generation
  public async interrupt(): Promise<void> {
    await this.makeRequest('/interrupt', {
      method: 'POST',
    })
  }

  // Skip current image in batch
  public async skip(): Promise<void> {
    await this.makeRequest('/skip', {
      method: 'POST',
    })
  }

  // Get memory information
  public async getMemory(): Promise<MemoryInfo> {
    return this.makeRequest<MemoryInfo>('/memory')
  }

  // Reload models and refresh WebUI
  public async reload(): Promise<void> {
    await this.makeRequest('/reload-checkpoint', {
      method: 'POST',
    })
  }

  // Update configuration
  public updateConfig(overrides: Partial<SDClientConfig>): void {
    this.config.update(overrides)

    const validation = this.config.validate()
    if (!validation.isValid) {
      throw new SDValidationError(
        `Invalid configuration update: ${validation.errors.join(', ')}`,
        validation.errors
      )
    }

    // Update logger if logging setting changed
    if (this.config.isLoggingEnabled() && !this.logger) {
      this.logger = createRetryLogger('SDWebUIClient')
    } else if (!this.config.isLoggingEnabled()) {
      this.logger = undefined
    }
  }

  // Get current configuration
  public getConfig(): Required<SDClientConfig> {
    return this.config.get()
  }

  // Validate request parameters
  private validateTxt2ImgRequest(request: Txt2ImgRequest): void {
    const errors: string[] = []

    if (!request.prompt || request.prompt.trim().length === 0) {
      errors.push('Prompt is required and cannot be empty')
    }

    if (request.steps !== undefined && (request.steps < 1 || request.steps > 150)) {
      errors.push('Steps must be between 1 and 150')
    }

    if (request.cfg_scale !== undefined && (request.cfg_scale < 0 || request.cfg_scale > 30)) {
      errors.push('CFG scale must be between 0 and 30')
    }

    if (request.width !== undefined && (request.width < 64 || request.width > 2048)) {
      errors.push('Width must be between 64 and 2048')
    }

    if (request.height !== undefined && (request.height < 64 || request.height > 2048)) {
      errors.push('Height must be between 64 and 2048')
    }

    if (request.batch_size !== undefined && (request.batch_size < 1 || request.batch_size > 8)) {
      errors.push('Batch size must be between 1 and 8')
    }

    if (errors.length > 0) {
      throw new SDValidationError('Invalid txt2img request', errors)
    }
  }

  private validateImg2ImgRequest(request: Img2ImgRequest): void {
    const errors: string[] = []

    if (!request.prompt || request.prompt.trim().length === 0) {
      errors.push('Prompt is required and cannot be empty')
    }

    if (!request.init_images || request.init_images.length === 0) {
      errors.push('At least one init image is required')
    }

    if (request.denoising_strength === undefined ||
        request.denoising_strength < 0 ||
        request.denoising_strength > 1) {
      errors.push('Denoising strength must be between 0 and 1')
    }

    // Validate base parameters
    if (request.steps !== undefined && (request.steps < 1 || request.steps > 150)) {
      errors.push('Steps must be between 1 and 150')
    }

    if (request.cfg_scale !== undefined && (request.cfg_scale < 0 || request.cfg_scale > 30)) {
      errors.push('CFG scale must be between 0 and 30')
    }

    if (errors.length > 0) {
      throw new SDValidationError('Invalid img2img request', errors)
    }
  }

  // Text-to-Image generation
  public async txt2img(request: Txt2ImgRequest): Promise<Txt2ImgResponse> {
    this.validateTxt2ImgRequest(request)

    return this.makeRequest<Txt2ImgResponse>('/txt2img', {
      method: 'POST',
      body: JSON.stringify(request),
    }, {
      // Longer timeout for image generation
      maxAttempts: 1, // Don't retry generation requests
    })
  }

  // Image-to-Image generation
  public async img2img(request: Img2ImgRequest): Promise<Img2ImgResponse> {
    this.validateImg2ImgRequest(request)

    return this.makeRequest<Img2ImgResponse>('/img2img', {
      method: 'POST',
      body: JSON.stringify(request),
    }, {
      // Longer timeout for image generation
      maxAttempts: 1, // Don't retry generation requests
    })
  }

  // Health check with connection testing
  public async healthCheck(): Promise<HealthCheckResult> {
    const startTime = Date.now()

    try {
      // Try to get API info as a health check
      const apiInfo = await this.getApiInfo()
      const latency = Date.now() - startTime

      return {
        isHealthy: true,
        latency,
        version: apiInfo.version,
        timestamp: Date.now(),
      }
    } catch (error) {
      const latency = Date.now() - startTime

      return {
        isHealthy: false,
        latency,
        error: error instanceof Error ? error.message : String(error),
        timestamp: Date.now(),
      }
    }
  }

  // Wait for the server to be ready
  public async waitForReady(
    maxWaitTime = 30000, // 30 seconds
    pollInterval = 2000   // 2 seconds
  ): Promise<boolean> {
    const startTime = Date.now()

    while (Date.now() - startTime < maxWaitTime) {
      try {
        const health = await this.healthCheck()
        if (health.isHealthy) {
          return true
        }
      } catch {
        // Ignore errors while waiting
      }

      await new Promise(resolve => setTimeout(resolve, pollInterval))
    }

    return false
  }
}
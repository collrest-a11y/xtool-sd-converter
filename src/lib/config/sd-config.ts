import type { SDClientConfig } from '../types/sd-api'

// Default configuration values
export const DEFAULT_SD_CONFIG: Required<SDClientConfig> = {
  baseUrl: 'http://127.0.0.1:7860',
  timeout: 30000, // 30 seconds
  retryAttempts: 3,
  retryDelay: 1000, // 1 second
  enableLogging: process.env.NODE_ENV === 'development',
}

// Environment variable configuration
export class SDConfig {
  private config: Required<SDClientConfig>

  constructor(overrides?: Partial<SDClientConfig>) {
    this.config = {
      ...DEFAULT_SD_CONFIG,
      ...this.loadFromEnv(),
      ...overrides,
    }
  }

  private loadFromEnv(): Partial<SDClientConfig> {
    const envConfig: Partial<SDClientConfig> = {}

    // Load base URL from environment
    if (process.env.SD_WEBUI_URL) {
      envConfig.baseUrl = process.env.SD_WEBUI_URL
    }

    // Load timeout from environment
    if (process.env.SD_WEBUI_TIMEOUT) {
      const timeout = parseInt(process.env.SD_WEBUI_TIMEOUT, 10)
      if (!isNaN(timeout) && timeout > 0) {
        envConfig.timeout = timeout
      }
    }

    // Load retry attempts from environment
    if (process.env.SD_WEBUI_RETRY_ATTEMPTS) {
      const retryAttempts = parseInt(process.env.SD_WEBUI_RETRY_ATTEMPTS, 10)
      if (!isNaN(retryAttempts) && retryAttempts >= 0) {
        envConfig.retryAttempts = retryAttempts
      }
    }

    // Load retry delay from environment
    if (process.env.SD_WEBUI_RETRY_DELAY) {
      const retryDelay = parseInt(process.env.SD_WEBUI_RETRY_DELAY, 10)
      if (!isNaN(retryDelay) && retryDelay >= 0) {
        envConfig.retryDelay = retryDelay
      }
    }

    // Load logging flag from environment
    if (process.env.SD_WEBUI_ENABLE_LOGGING) {
      envConfig.enableLogging = process.env.SD_WEBUI_ENABLE_LOGGING.toLowerCase() === 'true'
    }

    return envConfig
  }

  public get(): Required<SDClientConfig> {
    return { ...this.config }
  }

  public getBaseUrl(): string {
    return this.config.baseUrl
  }

  public getApiUrl(): string {
    return `${this.config.baseUrl}/sdapi/v1`
  }

  public getTimeout(): number {
    return this.config.timeout
  }

  public getRetryAttempts(): number {
    return this.config.retryAttempts
  }

  public getRetryDelay(): number {
    return this.config.retryDelay
  }

  public isLoggingEnabled(): boolean {
    return this.config.enableLogging
  }

  public update(overrides: Partial<SDClientConfig>): void {
    this.config = {
      ...this.config,
      ...overrides,
    }
  }

  public validate(): { isValid: boolean; errors: string[] } {
    const errors: string[] = []

    // Validate base URL
    try {
      new URL(this.config.baseUrl)
    } catch (error) {
      errors.push(`Invalid base URL: ${this.config.baseUrl}`)
    }

    // Validate timeout
    if (this.config.timeout <= 0) {
      errors.push(`Timeout must be positive: ${this.config.timeout}`)
    }

    // Validate retry attempts
    if (this.config.retryAttempts < 0) {
      errors.push(`Retry attempts must be non-negative: ${this.config.retryAttempts}`)
    }

    // Validate retry delay
    if (this.config.retryDelay < 0) {
      errors.push(`Retry delay must be non-negative: ${this.config.retryDelay}`)
    }

    return {
      isValid: errors.length === 0,
      errors,
    }
  }
}

// Singleton instance for global configuration
let globalConfig: SDConfig | null = null

export function getSDConfig(overrides?: Partial<SDClientConfig>): SDConfig {
  if (!globalConfig || overrides) {
    globalConfig = new SDConfig(overrides)
  }
  return globalConfig
}

export function resetSDConfig(): void {
  globalConfig = null
}
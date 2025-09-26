import { SDConfig, DEFAULT_SD_CONFIG, getSDConfig, resetSDConfig } from '../lib/config/sd-config'

describe('SDConfig', () => {
  beforeEach(() => {
    // Clear environment variables before each test
    delete process.env.SD_WEBUI_URL
    delete process.env.SD_WEBUI_TIMEOUT
    delete process.env.SD_WEBUI_RETRY_ATTEMPTS
    delete process.env.SD_WEBUI_RETRY_DELAY
    delete process.env.SD_WEBUI_ENABLE_LOGGING

    // Reset global config
    resetSDConfig()
  })

  describe('Constructor and Defaults', () => {
    it('should use default configuration', () => {
      const config = new SDConfig()
      const settings = config.get()

      expect(settings.baseUrl).toBe(DEFAULT_SD_CONFIG.baseUrl)
      expect(settings.timeout).toBe(DEFAULT_SD_CONFIG.timeout)
      expect(settings.retryAttempts).toBe(DEFAULT_SD_CONFIG.retryAttempts)
      expect(settings.retryDelay).toBe(DEFAULT_SD_CONFIG.retryDelay)
      expect(settings.enableLogging).toBe(DEFAULT_SD_CONFIG.enableLogging)
    })

    it('should apply constructor overrides', () => {
      const overrides = {
        baseUrl: 'http://custom:8080',
        timeout: 45000,
        retryAttempts: 5,
      }

      const config = new SDConfig(overrides)
      const settings = config.get()

      expect(settings.baseUrl).toBe(overrides.baseUrl)
      expect(settings.timeout).toBe(overrides.timeout)
      expect(settings.retryAttempts).toBe(overrides.retryAttempts)
      expect(settings.retryDelay).toBe(DEFAULT_SD_CONFIG.retryDelay) // Not overridden
    })

    it('should load from environment variables', () => {
      process.env.SD_WEBUI_URL = 'http://env:9999'
      process.env.SD_WEBUI_TIMEOUT = '60000'
      process.env.SD_WEBUI_RETRY_ATTEMPTS = '5'
      process.env.SD_WEBUI_RETRY_DELAY = '2000'
      process.env.SD_WEBUI_ENABLE_LOGGING = 'true'

      const config = new SDConfig()
      const settings = config.get()

      expect(settings.baseUrl).toBe('http://env:9999')
      expect(settings.timeout).toBe(60000)
      expect(settings.retryAttempts).toBe(5)
      expect(settings.retryDelay).toBe(2000)
      expect(settings.enableLogging).toBe(true)
    })

    it('should prioritize constructor overrides over environment', () => {
      process.env.SD_WEBUI_URL = 'http://env:9999'
      process.env.SD_WEBUI_TIMEOUT = '60000'

      const overrides = {
        baseUrl: 'http://override:7777',
        retryAttempts: 10,
      }

      const config = new SDConfig(overrides)
      const settings = config.get()

      expect(settings.baseUrl).toBe('http://override:7777')
      expect(settings.timeout).toBe(60000) // From env
      expect(settings.retryAttempts).toBe(10) // From override
    })

    it('should handle invalid environment values gracefully', () => {
      process.env.SD_WEBUI_TIMEOUT = 'invalid'
      process.env.SD_WEBUI_RETRY_ATTEMPTS = '-5'
      process.env.SD_WEBUI_RETRY_DELAY = 'not-a-number'
      process.env.SD_WEBUI_ENABLE_LOGGING = 'maybe'

      const config = new SDConfig()
      const settings = config.get()

      // Should fall back to defaults for invalid values
      expect(settings.timeout).toBe(DEFAULT_SD_CONFIG.timeout)
      expect(settings.retryAttempts).toBe(DEFAULT_SD_CONFIG.retryAttempts)
      expect(settings.retryDelay).toBe(DEFAULT_SD_CONFIG.retryDelay)
      expect(settings.enableLogging).toBe(DEFAULT_SD_CONFIG.enableLogging)
    })
  })

  describe('Getters', () => {
    it('should return correct base URL', () => {
      const config = new SDConfig({ baseUrl: 'http://test:1234' })
      expect(config.getBaseUrl()).toBe('http://test:1234')
    })

    it('should return correct API URL', () => {
      const config = new SDConfig({ baseUrl: 'http://test:1234' })
      expect(config.getApiUrl()).toBe('http://test:1234/sdapi/v1')
    })

    it('should return timeout', () => {
      const config = new SDConfig({ timeout: 45000 })
      expect(config.getTimeout()).toBe(45000)
    })

    it('should return retry attempts', () => {
      const config = new SDConfig({ retryAttempts: 7 })
      expect(config.getRetryAttempts()).toBe(7)
    })

    it('should return retry delay', () => {
      const config = new SDConfig({ retryDelay: 3000 })
      expect(config.getRetryDelay()).toBe(3000)
    })

    it('should return logging status', () => {
      const config = new SDConfig({ enableLogging: true })
      expect(config.isLoggingEnabled()).toBe(true)
    })
  })

  describe('Update Configuration', () => {
    it('should update configuration', () => {
      const config = new SDConfig()

      config.update({
        timeout: 60000,
        retryAttempts: 5,
      })

      const settings = config.get()
      expect(settings.timeout).toBe(60000)
      expect(settings.retryAttempts).toBe(5)
      expect(settings.baseUrl).toBe(DEFAULT_SD_CONFIG.baseUrl) // Unchanged
    })

    it('should merge with existing configuration', () => {
      const config = new SDConfig({
        baseUrl: 'http://initial:8080',
        timeout: 30000,
      })

      config.update({
        timeout: 45000,
        retryAttempts: 7,
      })

      const settings = config.get()
      expect(settings.baseUrl).toBe('http://initial:8080') // Preserved
      expect(settings.timeout).toBe(45000) // Updated
      expect(settings.retryAttempts).toBe(7) // Updated
    })
  })

  describe('Validation', () => {
    it('should validate correct configuration', () => {
      const config = new SDConfig({
        baseUrl: 'http://valid:7860',
        timeout: 30000,
        retryAttempts: 3,
        retryDelay: 1000,
      })

      const validation = config.validate()
      expect(validation.isValid).toBe(true)
      expect(validation.errors).toHaveLength(0)
    })

    it('should detect invalid base URL', () => {
      const config = new SDConfig({ baseUrl: 'not-a-url' })

      const validation = config.validate()
      expect(validation.isValid).toBe(false)
      expect(validation.errors).toContain('Invalid base URL: not-a-url')
    })

    it('should detect invalid timeout', () => {
      const config = new SDConfig({ timeout: 0 })

      const validation = config.validate()
      expect(validation.isValid).toBe(false)
      expect(validation.errors).toContain('Timeout must be positive: 0')
    })

    it('should detect invalid retry attempts', () => {
      const config = new SDConfig({ retryAttempts: -1 })

      const validation = config.validate()
      expect(validation.isValid).toBe(false)
      expect(validation.errors).toContain('Retry attempts must be non-negative: -1')
    })

    it('should detect invalid retry delay', () => {
      const config = new SDConfig({ retryDelay: -100 })

      const validation = config.validate()
      expect(validation.isValid).toBe(false)
      expect(validation.errors).toContain('Retry delay must be non-negative: -100')
    })

    it('should collect multiple validation errors', () => {
      const config = new SDConfig({
        baseUrl: 'invalid',
        timeout: -1,
        retryAttempts: -5,
      })

      const validation = config.validate()
      expect(validation.isValid).toBe(false)
      expect(validation.errors).toHaveLength(3)
    })
  })

  describe('Global Configuration Management', () => {
    it('should return singleton instance', () => {
      const config1 = getSDConfig()
      const config2 = getSDConfig()

      expect(config1).toBe(config2)
    })

    it('should create new instance with overrides', () => {
      const config1 = getSDConfig()
      const config2 = getSDConfig({ timeout: 45000 })

      expect(config1).not.toBe(config2)
      expect(config2.getTimeout()).toBe(45000)
    })

    it('should reset global configuration', () => {
      const config1 = getSDConfig()
      resetSDConfig()
      const config2 = getSDConfig()

      expect(config1).not.toBe(config2)
    })
  })
})
import { SDWebUIClient } from '../lib/sd-client'
import { SDConfig, DEFAULT_SD_CONFIG, resetSDConfig } from '../lib/config/sd-config'
import { SDAPIError, SDConnectionError, SDValidationError } from '../lib/utils/retry'
import type {
  Txt2ImgRequest,
  Img2ImgRequest,
  APIInfo,
  HealthCheckResult
} from '../lib/types/sd-api'

// Mock fetch for testing
const mockFetch = jest.fn()
global.fetch = mockFetch

describe('SDWebUIClient', () => {
  let client: SDWebUIClient

  beforeEach(() => {
    jest.clearAllMocks()
    client = new SDWebUIClient({
      baseUrl: 'http://localhost:7860',
      retryAttempts: 1, // Reduce retries for faster tests
      enableLogging: false,
    })
  })

  describe('Constructor and Configuration', () => {
    it('should create client with default configuration', () => {
      // Reset environment variables for clean test
      delete process.env.SD_WEBUI_URL
      resetSDConfig() // Reset global config

      const defaultClient = new SDWebUIClient()
      const config = defaultClient.getConfig()

      expect(config.baseUrl).toBe(DEFAULT_SD_CONFIG.baseUrl) // Should use actual default
      expect(config.timeout).toBe(DEFAULT_SD_CONFIG.timeout)
      expect(config.retryAttempts).toBe(DEFAULT_SD_CONFIG.retryAttempts)
    })

    it('should create client with custom configuration', () => {
      const customConfig = {
        baseUrl: 'http://custom:8080',
        timeout: 45000,
        retryAttempts: 5,
      }

      const customClient = new SDWebUIClient(customConfig)
      const config = customClient.getConfig()

      expect(config.baseUrl).toBe(customConfig.baseUrl)
      expect(config.timeout).toBe(customConfig.timeout)
      expect(config.retryAttempts).toBe(customConfig.retryAttempts)
    })

    it('should throw validation error for invalid configuration', () => {
      expect(() => {
        new SDWebUIClient({ baseUrl: 'invalid-url' })
      }).toThrow(SDValidationError)
    })

    it('should update configuration after creation', () => {
      const newConfig = {
        timeout: 60000,
        retryAttempts: 2,
      }

      client.updateConfig(newConfig)
      const config = client.getConfig()

      expect(config.timeout).toBe(newConfig.timeout)
      expect(config.retryAttempts).toBe(newConfig.retryAttempts)
    })
  })

  describe('API Info', () => {
    it('should fetch API information successfully', async () => {
      const mockApiInfo: APIInfo = {
        version: '1.6.0',
        api_version: '1.0.0',
        build_hash: 'abc123',
      }

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve(mockApiInfo),
      })

      const result = await client.getApiInfo()

      expect(result).toEqual(mockApiInfo)
      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:7860/sdapi/v1/api/v1/version',
        expect.objectContaining({
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
          }),
        })
      )
    })

    it('should handle API info fetch error', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
        text: () => Promise.resolve('Server error'),
      })

      await expect(client.getApiInfo()).rejects.toThrow(SDAPIError)
    })
  })

  describe('Text-to-Image', () => {
    const validTxt2ImgRequest: Txt2ImgRequest = {
      prompt: 'a beautiful landscape',
      negative_prompt: 'blurry, low quality',
      steps: 20,
      cfg_scale: 7.5,
      width: 512,
      height: 512,
      batch_size: 1,
    }

    it('should validate txt2img request parameters', async () => {
      // Empty prompt should fail
      await expect(client.txt2img({
        ...validTxt2ImgRequest,
        prompt: ''
      })).rejects.toThrow(SDValidationError)

      // Invalid steps should fail
      await expect(client.txt2img({
        ...validTxt2ImgRequest,
        steps: 0
      })).rejects.toThrow(SDValidationError)

      // Invalid cfg_scale should fail
      await expect(client.txt2img({
        ...validTxt2ImgRequest,
        cfg_scale: 35
      })).rejects.toThrow(SDValidationError)

      // Invalid dimensions should fail
      await expect(client.txt2img({
        ...validTxt2ImgRequest,
        width: 32
      })).rejects.toThrow(SDValidationError)

      await expect(client.txt2img({
        ...validTxt2ImgRequest,
        height: 3000
      })).rejects.toThrow(SDValidationError)

      // Invalid batch size should fail
      await expect(client.txt2img({
        ...validTxt2ImgRequest,
        batch_size: 10
      })).rejects.toThrow(SDValidationError)
    })

    it('should successfully generate txt2img', async () => {
      const mockResponse = {
        images: ['base64-image-data'],
        parameters: validTxt2ImgRequest,
        info: 'generation info',
      }

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve(mockResponse),
      })

      const result = await client.txt2img(validTxt2ImgRequest)

      expect(result).toEqual(mockResponse)
      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:7860/sdapi/v1/txt2img',
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
          }),
          body: JSON.stringify(validTxt2ImgRequest),
        })
      )
    })

    it('should handle txt2img generation errors', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 422,
        statusText: 'Unprocessable Entity',
        text: () => Promise.resolve('Invalid parameters'),
      })

      await expect(client.txt2img(validTxt2ImgRequest)).rejects.toThrow(SDAPIError)
    })
  })

  describe('Image-to-Image', () => {
    const validImg2ImgRequest: Img2ImgRequest = {
      prompt: 'enhance this image',
      init_images: ['base64-init-image'],
      denoising_strength: 0.7,
      steps: 20,
      cfg_scale: 7.5,
    }

    it('should validate img2img request parameters', async () => {
      // Empty prompt should fail
      await expect(client.img2img({
        ...validImg2ImgRequest,
        prompt: ''
      })).rejects.toThrow(SDValidationError)

      // Missing init images should fail
      await expect(client.img2img({
        ...validImg2ImgRequest,
        init_images: []
      })).rejects.toThrow(SDValidationError)

      // Invalid denoising strength should fail
      await expect(client.img2img({
        ...validImg2ImgRequest,
        denoising_strength: 1.5
      })).rejects.toThrow(SDValidationError)

      await expect(client.img2img({
        ...validImg2ImgRequest,
        denoising_strength: -0.1
      })).rejects.toThrow(SDValidationError)
    })

    it('should successfully generate img2img', async () => {
      const mockResponse = {
        images: ['base64-result-image'],
        parameters: validImg2ImgRequest,
        info: 'img2img generation info',
      }

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve(mockResponse),
      })

      const result = await client.img2img(validImg2ImgRequest)

      expect(result).toEqual(mockResponse)
      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:7860/sdapi/v1/img2img',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify(validImg2ImgRequest),
        })
      )
    })
  })

  describe('Health Check', () => {
    it('should return healthy status when API is accessible', async () => {
      const mockApiInfo: APIInfo = {
        version: '1.6.0',
        api_version: '1.0.0',
      }

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve(mockApiInfo),
      })

      const result = await client.healthCheck()

      expect(result.isHealthy).toBe(true)
      expect(result.version).toBe('1.6.0')
      expect(typeof result.latency).toBe('number')
      expect(result.latency).toBeGreaterThanOrEqual(0) // Can be 0 with mocked fetch
      expect(typeof result.timestamp).toBe('number')
    })

    it('should return unhealthy status when API is not accessible', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Connection refused'))

      const result = await client.healthCheck()

      expect(result.isHealthy).toBe(false)
      expect(result.error).toContain('Connection refused')
      expect(typeof result.latency).toBe('number')
      expect(typeof result.timestamp).toBe('number')
    })

    it('should return unhealthy status for HTTP errors', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
        text: () => Promise.resolve('Server error'),
      })

      const result = await client.healthCheck()

      expect(result.isHealthy).toBe(false)
      expect(result.error).toContain('HTTP 500')
    })
  })

  describe('Wait for Ready', () => {
    it('should return true when server becomes ready', async () => {
      const mockApiInfo: APIInfo = {
        version: '1.6.0',
        api_version: '1.0.0',
      }

      mockFetch.mockResolvedValue({
        ok: true,
        status: 200,
        json: () => Promise.resolve(mockApiInfo),
      })

      const result = await client.waitForReady(5000, 100) // 5s max, 100ms intervals

      expect(result).toBe(true)
    })

    it('should return false when server does not become ready in time', async () => {
      mockFetch.mockRejectedValue(new Error('Connection refused'))

      const result = await client.waitForReady(1000, 100) // 1s max, 100ms intervals

      expect(result).toBe(false)
    })

    it('should return true when server becomes ready after initial failures', async () => {
      const mockApiInfo: APIInfo = {
        version: '1.6.0',
        api_version: '1.0.0',
      }

      // First two calls fail, third succeeds
      mockFetch
        .mockRejectedValueOnce(new Error('Connection refused'))
        .mockRejectedValueOnce(new Error('Connection refused'))
        .mockResolvedValue({
          ok: true,
          status: 200,
          json: () => Promise.resolve(mockApiInfo),
        })

      const result = await client.waitForReady(5000, 100)

      expect(result).toBe(true)
      expect(mockFetch).toHaveBeenCalledTimes(3)
    })
  })

  describe('Progress and Control', () => {
    it('should fetch generation progress', async () => {
      const mockProgress = {
        progress: 0.5,
        eta_relative: 30.0,
        state: {
          skipped: false,
          interrupted: false,
          job: 'txt2img',
          job_count: 1,
          job_timestamp: '20231001123000',
          job_no: 1,
        },
        textinfo: 'Generating...',
      }

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve(mockProgress),
      })

      const result = await client.getProgress()

      expect(result).toEqual(mockProgress)
      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:7860/sdapi/v1/progress',
        expect.any(Object)
      )
    })

    it('should interrupt generation', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve({}),
      })

      await client.interrupt()

      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:7860/sdapi/v1/interrupt',
        expect.objectContaining({
          method: 'POST',
        })
      )
    })

    it('should skip current image', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve({}),
      })

      await client.skip()

      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:7860/sdapi/v1/skip',
        expect.objectContaining({
          method: 'POST',
        })
      )
    })
  })

  describe('Models and Samplers', () => {
    it('should fetch available models', async () => {
      const mockModels = [
        {
          title: 'stable-diffusion-v1-5',
          model_name: 'v1-5-pruned-emaonly',
          hash: 'abc123',
          filename: 'v1-5-pruned-emaonly.safetensors',
        },
      ]

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve(mockModels),
      })

      const result = await client.getModels()

      expect(result).toEqual(mockModels)
    })

    it('should fetch available samplers', async () => {
      const mockSamplers = [
        {
          name: 'Euler a',
          aliases: ['euler_a'],
          options: {},
        },
      ]

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve(mockSamplers),
      })

      const result = await client.getSamplers()

      expect(result).toEqual(mockSamplers)
    })
  })

  describe('Options Management', () => {
    it('should get WebUI options', async () => {
      const mockOptions = {
        samples_save: true,
        samples_format: 'png',
        save_images_add_number: true,
      }

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve(mockOptions),
      })

      const result = await client.getOptions()

      expect(result).toEqual(mockOptions)
    })

    it('should set WebUI options', async () => {
      const newOptions = {
        samples_save: false,
        samples_format: 'jpg',
      }

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve({}),
      })

      await client.setOptions(newOptions)

      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:7860/sdapi/v1/options',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify(newOptions),
        })
      )
    })
  })

  describe('Memory Information', () => {
    it('should fetch memory information', async () => {
      const mockMemory = {
        ram: {
          free: 8000000000,
          used: 4000000000,
          total: 12000000000,
        },
        cuda: {
          system: {
            free: 6000000000,
            used: 2000000000,
            total: 8000000000,
          },
          active: {
            free: 6000000000,
            used: 2000000000,
            total: 8000000000,
          },
        },
      }

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve(mockMemory),
      })

      const result = await client.getMemory()

      expect(result).toEqual(mockMemory)
    })
  })
})
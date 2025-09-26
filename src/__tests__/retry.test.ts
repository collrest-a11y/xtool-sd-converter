import {
  withRetry,
  retryableFetch,
  defaultShouldRetry,
  createRetryLogger,
  SDAPIError,
  SDConnectionError,
  SDTimeoutError,
  SDValidationError,
  type RetryOptions
} from '../lib/utils/retry'

// Mock fetch for testing
const mockFetch = jest.fn()
global.fetch = mockFetch

// Mock console methods
const consoleSpy = jest.spyOn(console, 'warn').mockImplementation()

describe('Retry Utilities', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('Error Classes', () => {
    it('should create SDAPIError with correct properties', () => {
      const error = new SDAPIError('Test error', 500, { detail: 'details' }, false)

      expect(error.name).toBe('SDAPIError')
      expect(error.message).toBe('Test error')
      expect(error.statusCode).toBe(500)
      expect(error.responseBody).toEqual({ detail: 'details' })
      expect(error.isRetryable).toBe(false)
    })

    it('should create SDConnectionError with correct properties', () => {
      const originalError = new Error('Network error')
      const error = new SDConnectionError('Connection failed', originalError)

      expect(error.name).toBe('SDConnectionError')
      expect(error.message).toBe('Connection failed: Connection failed')
      expect(error.isRetryable).toBe(true)
      expect(error.responseBody).toBe(originalError)
    })

    it('should create SDTimeoutError with correct properties', () => {
      const error = new SDTimeoutError(30000)

      expect(error.name).toBe('SDTimeoutError')
      expect(error.message).toBe('Request timed out after 30000ms')
      expect(error.statusCode).toBe(408)
      expect(error.isRetryable).toBe(true)
    })

    it('should create SDValidationError with correct properties', () => {
      const error = new SDValidationError('Invalid input', ['field1', 'field2'])

      expect(error.name).toBe('SDValidationError')
      expect(error.message).toBe('Validation error: Invalid input')
      expect(error.statusCode).toBe(400)
      expect(error.responseBody).toEqual(['field1', 'field2'])
      expect(error.isRetryable).toBe(false)
    })
  })

  describe('Default Retry Logic', () => {
    it('should retry connection errors', () => {
      const error = new SDConnectionError('Network error')
      expect(defaultShouldRetry(error, 1)).toBe(true)
    })

    it('should retry timeout errors', () => {
      const error = new SDTimeoutError(30000)
      expect(defaultShouldRetry(error, 1)).toBe(true)
    })

    it('should retry 5xx status codes', () => {
      const error = new SDAPIError('Server error', 500)
      expect(defaultShouldRetry(error, 1)).toBe(true)
    })

    it('should retry 429 (rate limiting)', () => {
      const error = new SDAPIError('Too many requests', 429)
      expect(defaultShouldRetry(error, 1)).toBe(true)
    })

    it('should not retry validation errors', () => {
      const error = new SDValidationError('Bad request')
      expect(defaultShouldRetry(error, 1)).toBe(false)
    })

    it('should not retry 4xx client errors (except 429)', () => {
      const error = new SDAPIError('Bad request', 400)
      expect(defaultShouldRetry(error, 1)).toBe(false)
    })

    it('should not retry non-retryable API errors', () => {
      const error = new SDAPIError('Custom error', 500, undefined, false)
      expect(defaultShouldRetry(error, 1)).toBe(false)
    })

    it('should retry generic network errors', () => {
      const error = new Error('fetch failed')
      expect(defaultShouldRetry(error, 1)).toBe(true)
    })
  })

  describe('withRetry Function', () => {
    it('should succeed on first attempt', async () => {
      const operation = jest.fn().mockResolvedValue('success')
      const options: RetryOptions = { maxAttempts: 3, delay: 100 }

      const result = await withRetry(operation, options)

      expect(result).toBe('success')
      expect(operation).toHaveBeenCalledTimes(1)
    })

    it('should retry on retryable errors', async () => {
      const operation = jest.fn()
        .mockRejectedValueOnce(new SDConnectionError('Network error'))
        .mockRejectedValueOnce(new SDTimeoutError(30000))
        .mockResolvedValue('success')

      const options: RetryOptions = { maxAttempts: 3, delay: 10 } // Very short delay

      const result = await withRetry(operation, options)

      expect(result).toBe('success')
      expect(operation).toHaveBeenCalledTimes(3)
    })

    it('should not retry non-retryable errors', async () => {
      const operation = jest.fn().mockRejectedValue(new SDValidationError('Bad request'))
      const options: RetryOptions = { maxAttempts: 3, delay: 100 }

      await expect(withRetry(operation, options)).rejects.toThrow(SDValidationError)
      expect(operation).toHaveBeenCalledTimes(1)
    })

    it('should exhaust max attempts and throw last error', async () => {
      const error = new SDConnectionError('Persistent error')
      const operation = jest.fn().mockRejectedValue(error)
      const options: RetryOptions = { maxAttempts: 3, delay: 10 }

      await expect(withRetry(operation, options)).rejects.toThrow(error)
      expect(operation).toHaveBeenCalledTimes(3)
    })

    it('should use custom shouldRetry function', async () => {
      const error = new Error('Custom error')
      const operation = jest.fn().mockRejectedValue(error)
      const shouldRetry = jest.fn().mockReturnValue(false)
      const options: RetryOptions = { maxAttempts: 3, delay: 100, shouldRetry }

      await expect(withRetry(operation, options)).rejects.toThrow(error)
      expect(operation).toHaveBeenCalledTimes(1)
      expect(shouldRetry).toHaveBeenCalledWith(error, 1)
    })

    it('should call onRetry callback', async () => {
      const error = new SDConnectionError('Network error')
      const operation = jest.fn()
        .mockRejectedValueOnce(error)
        .mockResolvedValue('success')

      const onRetry = jest.fn()
      const options: RetryOptions = { maxAttempts: 3, delay: 10, onRetry }

      await withRetry(operation, options)

      expect(onRetry).toHaveBeenCalledWith(error, 1)
    })

    it('should use exponential backoff', async () => {
      const operation = jest.fn()
        .mockRejectedValueOnce(new SDConnectionError('Error 1'))
        .mockRejectedValueOnce(new SDConnectionError('Error 2'))
        .mockResolvedValue('success')

      const options: RetryOptions = {
        maxAttempts: 3,
        delay: 10,
        backoff: 'exponential'
      }

      // We can verify the operation completes with retries
      const result = await withRetry(operation, options)
      expect(result).toBe('success')
      expect(operation).toHaveBeenCalledTimes(3)
    })

    it('should respect maxDelay setting', async () => {
      const operation = jest.fn()
        .mockRejectedValueOnce(new SDConnectionError('Error'))
        .mockResolvedValue('success')

      const options: RetryOptions = {
        maxAttempts: 2,
        delay: 100,
        backoff: 'exponential',
        maxDelay: 50 // Cap at 50ms
      }

      const result = await withRetry(operation, options)
      expect(result).toBe('success')
      expect(operation).toHaveBeenCalledTimes(2)
    })
  })

  describe('retryableFetch Function', () => {
    it('should make successful request', async () => {
      const mockResponse = { ok: true, status: 200, json: () => Promise.resolve({ data: 'test' }) }
      mockFetch.mockResolvedValue(mockResponse)

      const result = await retryableFetch('http://test.com')

      expect(result).toBe(mockResponse)
      expect(mockFetch).toHaveBeenCalledWith('http://test.com', expect.any(Object))
    })

    it('should handle HTTP errors', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
        text: () => Promise.resolve('Server error')
      })

      await expect(retryableFetch('http://test.com')).rejects.toThrow(SDAPIError)
    })

    it('should handle abort errors as timeouts', async () => {
      const abortError = Object.assign(new Error('aborted'), { name: 'AbortError' })
      mockFetch.mockRejectedValue(abortError)

      await expect(retryableFetch('http://test.com', { timeout: 1000 })).rejects.toThrow(SDTimeoutError)
    })

    it('should handle network errors', async () => {
      mockFetch.mockRejectedValue(new TypeError('fetch failed'))

      await expect(retryableFetch('http://test.com')).rejects.toThrow(SDConnectionError)
    })

    it('should retry on retryable errors', async () => {
      mockFetch
        .mockResolvedValueOnce({
          ok: false,
          status: 500,
          statusText: 'Server Error',
          text: () => Promise.resolve('Error')
        })
        .mockResolvedValue({
          ok: true,
          status: 200,
          json: () => Promise.resolve({ success: true })
        })

      const result = await retryableFetch('http://test.com', {}, { maxAttempts: 2, delay: 10 })
      expect(result.ok).toBe(true)
      expect(mockFetch).toHaveBeenCalledTimes(2)
    })

    it('should pass through fetch options', async () => {
      const mockResponse = { ok: true, status: 200 }
      mockFetch.mockResolvedValue(mockResponse)

      const options = {
        method: 'POST',
        headers: { 'Custom-Header': 'test' },
        body: 'test data',
        timeout: 5000
      }

      await retryableFetch('http://test.com', options)

      expect(mockFetch).toHaveBeenCalledWith(
        'http://test.com',
        expect.objectContaining({
          method: 'POST',
          headers: { 'Custom-Header': 'test' },
          body: 'test data',
          signal: expect.any(AbortSignal)
        })
      )
    })
  })

  describe('createRetryLogger', () => {
    it('should create logger that logs retry attempts', () => {
      const logger = createRetryLogger('TestAPI')
      const error = new SDAPIError('Test error', 500)

      logger(error, 2)

      expect(consoleSpy).toHaveBeenCalledWith(
        'TestAPI retry attempt 2:',
        {
          error: 'Test error',
          type: 'SDAPIError',
          statusCode: 500,
        }
      )
    })

    it('should use default prefix', () => {
      const logger = createRetryLogger()
      const error = new Error('Generic error')

      logger(error, 1)

      expect(consoleSpy).toHaveBeenCalledWith(
        'SD API retry attempt 1:',
        {
          error: 'Generic error',
          type: 'Error',
          statusCode: undefined,
        }
      )
    })
  })
})
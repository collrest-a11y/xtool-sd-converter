// Retry utilities for SD WebUI API calls

export interface RetryOptions {
  maxAttempts: number
  delay: number
  backoff?: 'fixed' | 'exponential' | 'linear'
  maxDelay?: number
  shouldRetry?: (error: Error, attempt: number) => boolean
  onRetry?: (error: Error, attempt: number) => void
}

export class SDAPIError extends Error {
  public readonly statusCode?: number
  public readonly responseBody?: any
  public readonly isRetryable: boolean

  constructor(
    message: string,
    statusCode?: number,
    responseBody?: any,
    isRetryable = true
  ) {
    super(message)
    this.name = 'SDAPIError'
    this.statusCode = statusCode
    this.responseBody = responseBody
    this.isRetryable = isRetryable
  }
}

export class SDConnectionError extends SDAPIError {
  constructor(message: string, originalError?: Error) {
    super(`Connection failed: ${message}`, undefined, originalError, true)
    this.name = 'SDConnectionError'
  }
}

export class SDTimeoutError extends SDAPIError {
  constructor(timeout: number) {
    super(`Request timed out after ${timeout}ms`, 408, undefined, true)
    this.name = 'SDTimeoutError'
  }
}

export class SDValidationError extends SDAPIError {
  constructor(message: string, details?: any) {
    super(`Validation error: ${message}`, 400, details, false)
    this.name = 'SDValidationError'
  }
}

// Default retry conditions
export function defaultShouldRetry(error: Error, attempt: number): boolean {
  // Don't retry validation errors or non-retryable errors
  if (error instanceof SDAPIError && !error.isRetryable) {
    return false
  }

  // Retry network errors, timeouts, and 5xx status codes
  if (error instanceof SDConnectionError || error instanceof SDTimeoutError) {
    return true
  }

  if (error instanceof SDAPIError && error.statusCode) {
    // Retry server errors (5xx) and rate limiting (429)
    return error.statusCode >= 500 || error.statusCode === 429
  }

  // Retry generic network errors
  if (error.message.includes('fetch') || error.message.includes('network')) {
    return true
  }

  return false
}

// Calculate delay with backoff strategy
function calculateDelay(
  baseDelay: number,
  attempt: number,
  backoff: 'fixed' | 'exponential' | 'linear',
  maxDelay?: number
): number {
  let delay: number

  switch (backoff) {
    case 'exponential':
      delay = baseDelay * Math.pow(2, attempt - 1)
      break
    case 'linear':
      delay = baseDelay * attempt
      break
    case 'fixed':
    default:
      delay = baseDelay
      break
  }

  // Apply jitter to prevent thundering herd
  const jitter = Math.random() * 0.1 * delay
  delay += jitter

  // Cap at max delay if specified
  if (maxDelay && delay > maxDelay) {
    delay = maxDelay
  }

  return Math.floor(delay)
}

// Sleep utility
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

// Main retry function
export async function withRetry<T>(
  operation: () => Promise<T>,
  options: RetryOptions
): Promise<T> {
  const {
    maxAttempts,
    delay: baseDelay,
    backoff = 'exponential',
    maxDelay,
    shouldRetry = defaultShouldRetry,
    onRetry,
  } = options

  let lastError: Error

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await operation()
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error))

      // Don't retry if this is the last attempt or if we shouldn't retry
      if (attempt === maxAttempts || !shouldRetry(lastError, attempt)) {
        throw lastError
      }

      // Calculate delay and notify about retry
      const delay = calculateDelay(baseDelay, attempt, backoff, maxDelay)

      if (onRetry) {
        onRetry(lastError, attempt)
      }

      // Wait before retrying
      await sleep(delay)
    }
  }

  // This should never be reached, but just in case
  throw lastError!
}

// Specialized retry wrapper for fetch operations
export async function retryableFetch(
  url: string,
  options: RequestInit & { timeout?: number } = {},
  retryOptions: Partial<RetryOptions> = {}
): Promise<Response> {
  const { timeout, ...fetchOptions } = options

  const operation = async (): Promise<Response> => {
    // Create abort controller for timeout
    const controller = new AbortController()
    const timeoutId = timeout ? setTimeout(() => controller.abort(), timeout) : null

    try {
      const response = await fetch(url, {
        ...fetchOptions,
        signal: controller.signal,
      })

      if (timeoutId) {
        clearTimeout(timeoutId)
      }

      // Handle HTTP errors
      if (!response.ok) {
        const errorBody = await response.text().catch(() => 'Unknown error')
        throw new SDAPIError(
          `HTTP ${response.status}: ${response.statusText}`,
          response.status,
          errorBody,
          response.status >= 500 || response.status === 429
        )
      }

      return response
    } catch (error) {
      if (timeoutId) {
        clearTimeout(timeoutId)
      }

      // Handle abort/timeout
      if (error instanceof Error && error.name === 'AbortError') {
        throw new SDTimeoutError(timeout || 0)
      }

      // Handle fetch network errors
      if (error instanceof TypeError && error.message.includes('fetch')) {
        throw new SDConnectionError(error.message, error)
      }

      // Re-throw API errors as-is
      if (error instanceof SDAPIError) {
        throw error
      }

      // Wrap other errors
      throw new SDConnectionError(error instanceof Error ? error.message : String(error))
    }
  }

  const finalRetryOptions: RetryOptions = {
    maxAttempts: 3,
    delay: 1000,
    backoff: 'exponential',
    maxDelay: 10000,
    ...retryOptions,
  }

  return withRetry(operation, finalRetryOptions)
}

// Utility for logging retry attempts
export function createRetryLogger(prefix = 'SD API'): (error: Error, attempt: number) => void {
  return (error: Error, attempt: number) => {
    console.warn(`${prefix} retry attempt ${attempt}:`, {
      error: error.message,
      type: error.constructor.name,
      statusCode: error instanceof SDAPIError ? error.statusCode : undefined,
    })
  }
}
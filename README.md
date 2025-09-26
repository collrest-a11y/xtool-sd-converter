# xTool Stable Diffusion Art Converter

A TypeScript API client for integrating with Stable Diffusion WebUI to convert photos into laser-engraving-ready artwork for xTool machines.

## Features

- 🔌 **WebUI Integration**: Complete TypeScript API client for Stable Diffusion WebUI
- 🛡️ **Error Handling**: Robust retry logic with exponential backoff
- 🏥 **Health Checks**: Connection monitoring and status validation
- 🎯 **Type Safety**: Full TypeScript support with comprehensive type definitions
- ⚡ **Async/Await**: Modern Promise-based API
- 🔧 **Configurable**: Flexible configuration management
- 🧪 **Well Tested**: Comprehensive test suite with 75+ tests

## Prerequisites

- Stable Diffusion WebUI running with `--api` flag
- Node.js 18+
- TypeScript 5+

## Installation

```bash
npm install
```

## Usage

### Basic Example

```typescript
import { SDWebUIClient } from './src/lib/sd-client'

// Create client instance
const client = new SDWebUIClient({
  baseUrl: 'http://127.0.0.1:7860',
  timeout: 30000,
  retryAttempts: 3,
  enableLogging: true
})

// Check connection health
const health = await client.healthCheck()
if (health.isHealthy) {
  console.log(`Connected to SD WebUI v${health.version}`)
} else {
  console.error('Connection failed:', health.error)
}
```

### Text-to-Image Generation

```typescript
const txt2imgRequest = {
  prompt: 'a beautiful landscape, masterpiece, high quality',
  negative_prompt: 'blurry, low quality, distorted',
  steps: 20,
  cfg_scale: 7.5,
  width: 512,
  height: 512,
  batch_size: 1,
  sampler_name: 'Euler a'
}

const result = await client.txt2img(txt2imgRequest)
console.log('Generated images:', result.images.length)
```

### Image-to-Image Generation

```typescript
const img2imgRequest = {
  prompt: 'enhance this image, masterpiece quality',
  init_images: [base64ImageString], // Base64 encoded image
  denoising_strength: 0.7,
  steps: 20,
  cfg_scale: 7.5,
}

const result = await client.img2img(img2imgRequest)
console.log('Enhanced images:', result.images.length)
```

### Configuration

```typescript
// Environment variables (optional)
process.env.SD_WEBUI_URL = 'http://127.0.0.1:7860'
process.env.SD_WEBUI_TIMEOUT = '30000'
process.env.SD_WEBUI_RETRY_ATTEMPTS = '3'
process.env.SD_WEBUI_RETRY_DELAY = '1000'
process.env.SD_WEBUI_ENABLE_LOGGING = 'true'

// Or configure directly
const client = new SDWebUIClient({
  baseUrl: 'http://custom-host:8080',
  timeout: 45000,
  retryAttempts: 5,
  retryDelay: 2000,
  enableLogging: false
})
```

### Error Handling

```typescript
import {
  SDAPIError,
  SDConnectionError,
  SDTimeoutError,
  SDValidationError
} from './src/lib/utils/retry'

try {
  const result = await client.txt2img(request)
} catch (error) {
  if (error instanceof SDValidationError) {
    console.error('Invalid request parameters:', error.responseBody)
  } else if (error instanceof SDConnectionError) {
    console.error('Connection failed:', error.message)
  } else if (error instanceof SDTimeoutError) {
    console.error('Request timed out')
  } else if (error instanceof SDAPIError) {
    console.error('API error:', error.statusCode, error.message)
  }
}
```

### Advanced Usage

```typescript
// Get available models
const models = await client.getModels()
console.log('Available models:', models.map(m => m.title))

// Get available samplers
const samplers = await client.getSamplers()
console.log('Available samplers:', samplers.map(s => s.name))

// Monitor progress during generation
const progress = await client.getProgress()
console.log(`Progress: ${progress.progress * 100}%`)

// Get memory usage
const memory = await client.getMemory()
console.log(`RAM: ${memory.ram.used} / ${memory.ram.total}`)

// Wait for server to be ready
const isReady = await client.waitForReady(30000) // 30 seconds
if (isReady) {
  console.log('Server is ready!')
}
```

## API Reference

### SDWebUIClient

Main client class for interacting with Stable Diffusion WebUI.

#### Constructor Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `baseUrl` | string | `'http://127.0.0.1:7860'` | WebUI base URL |
| `timeout` | number | `30000` | Request timeout in milliseconds |
| `retryAttempts` | number | `3` | Number of retry attempts |
| `retryDelay` | number | `1000` | Base delay between retries |
| `enableLogging` | boolean | `development mode` | Enable retry logging |

#### Methods

##### Generation Methods
- `txt2img(request: Txt2ImgRequest): Promise<Txt2ImgResponse>`
- `img2img(request: Img2ImgRequest): Promise<Img2ImgResponse>`

##### Information Methods
- `getApiInfo(): Promise<APIInfo>`
- `getModels(): Promise<SDModel[]>`
- `getSamplers(): Promise<Sampler[]>`
- `getOptions(): Promise<WebUIOptions>`
- `getMemory(): Promise<MemoryInfo>`

##### Control Methods
- `getProgress(skipCurrentImage?: boolean): Promise<ProgressResponse>`
- `interrupt(): Promise<void>`
- `skip(): Promise<void>`
- `reload(): Promise<void>`

##### Configuration Methods
- `healthCheck(): Promise<HealthCheckResult>`
- `waitForReady(maxWaitTime?: number, pollInterval?: number): Promise<boolean>`
- `updateConfig(overrides: Partial<SDClientConfig>): void`
- `getConfig(): Required<SDClientConfig>`

## Testing

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run integration tests (requires SD WebUI running)
npm test -- --testPathPattern=integration.test.ts
```

## Project Structure

```
src/
├── lib/
│   ├── sd-client.ts           # Main API client
│   ├── types/
│   │   └── sd-api.ts         # TypeScript type definitions
│   ├── config/
│   │   └── sd-config.ts      # Configuration management
│   └── utils/
│       └── retry.ts          # Retry logic and error handling
├── __tests__/                # Test files
└── test-connection.ts        # Connection test utility
```

## Error Types

- `SDAPIError` - General API errors with status codes
- `SDConnectionError` - Network connection failures
- `SDTimeoutError` - Request timeout errors
- `SDValidationError` - Request validation errors

## Development

```bash
# Install dependencies
npm install

# Run tests
npm test

# Type check
npx tsc --noEmit

# Lint
npm run lint
```

## Requirements

- Stable Diffusion WebUI must be running with `--api` flag
- Example: `python launch.py --api --listen`
- WebUI should be accessible at the configured URL (default: http://127.0.0.1:7860)

## License

MIT
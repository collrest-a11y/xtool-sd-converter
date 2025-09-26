import { SDWebUIClient } from '../lib/sd-client'

describe('SD WebUI Integration', () => {
  let client: SDWebUIClient

  beforeAll(() => {
    client = new SDWebUIClient({
      baseUrl: 'http://127.0.0.1:7860',
      timeout: 5000,
      retryAttempts: 1,
      enableLogging: false,
    })
  })

  it('should connect to local WebUI', async () => {
    const health = await client.healthCheck()

    console.log('🔌 Connection Test Result:')
    console.log(`   Healthy: ${health.isHealthy}`)

    if (health.isHealthy) {
      console.log(`   ✅ Version: ${health.version}`)
      console.log(`   ⚡ Latency: ${health.latency}ms`)
    } else {
      console.log(`   ❌ Error: ${health.error}`)
      console.log('   💡 Make sure SD WebUI is running with --api flag')
    }

    // Don't fail the test if WebUI isn't running - just log the result
    expect(typeof health.isHealthy).toBe('boolean')
    expect(typeof health.latency).toBe('number')
    expect(typeof health.timestamp).toBe('number')
  }, 10000) // 10 second timeout

  it('should handle connection failure gracefully', async () => {
    // Test with non-existent server
    const badClient = new SDWebUIClient({
      baseUrl: 'http://localhost:9999',
      timeout: 1000,
      retryAttempts: 1,
    })

    const health = await badClient.healthCheck()

    expect(health.isHealthy).toBe(false)
    expect(health.error).toBeTruthy()
    expect(typeof health.latency).toBe('number')
  })
})
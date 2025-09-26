#!/usr/bin/env node

const { SDWebUIClient } = require('./lib/sd-client.js')

async function testConnection() {
  console.log('🔌 Testing connection to Stable Diffusion WebUI...')

  const client = new SDWebUIClient({
    baseUrl: 'http://127.0.0.1:7860',
    timeout: 10000, // 10 seconds
    retryAttempts: 1, // Don't retry for this test
    enableLogging: true
  })

  try {
    // Test health check
    console.log('⏱️  Performing health check...')
    const health = await client.healthCheck()

    if (health.isHealthy) {
      console.log('✅ Connection successful!')
      console.log(`   Version: ${health.version}`)
      console.log(`   Latency: ${health.latency}ms`)
    } else {
      console.log('❌ Health check failed:')
      console.log(`   Error: ${health.error}`)
      console.log(`   Latency: ${health.latency}ms`)
      return
    }

    // Get API info
    console.log('\n📋 Fetching API information...')
    const apiInfo = await client.getApiInfo()
    console.log(`   API Version: ${apiInfo.api_version}`)
    console.log(`   Build Hash: ${apiInfo.build_hash || 'N/A'}`)

    // Get models
    console.log('\n🎨 Fetching available models...')
    const models = await client.getModels()
    console.log(`   Available models: ${models.length}`)
    models.slice(0, 3).forEach((model, index) => {
      console.log(`   ${index + 1}. ${model.title} (${model.model_name})`)
    })
    if (models.length > 3) {
      console.log(`   ... and ${models.length - 3} more`)
    }

    // Get samplers
    console.log('\n🎲 Fetching available samplers...')
    const samplers = await client.getSamplers()
    console.log(`   Available samplers: ${samplers.length}`)
    samplers.slice(0, 3).forEach((sampler, index) => {
      console.log(`   ${index + 1}. ${sampler.name}`)
    })
    if (samplers.length > 3) {
      console.log(`   ... and ${samplers.length - 3} more`)
    }

    // Test memory info
    console.log('\n💾 Checking memory usage...')
    const memory = await client.getMemory()
    console.log(`   RAM: ${(memory.ram.used / 1024 / 1024 / 1024).toFixed(1)}GB / ${(memory.ram.total / 1024 / 1024 / 1024).toFixed(1)}GB`)
    if (memory.cuda) {
      console.log(`   GPU: ${(memory.cuda.system.used / 1024 / 1024 / 1024).toFixed(1)}GB / ${(memory.cuda.system.total / 1024 / 1024 / 1024).toFixed(1)}GB`)
    }

    console.log('\n🎉 All connection tests passed! The SD WebUI API is ready for use.')

  } catch (error) {
    if (error instanceof Error) {
      console.log('❌ Connection test failed:')
      console.log(`   Error: ${error.message}`)
      console.log(`   Type: ${error.constructor.name}`)

      if (error.message.includes('ECONNREFUSED') || error.message.includes('Connection refused')) {
        console.log('\n💡 Troubleshooting tips:')
        console.log('   • Make sure Stable Diffusion WebUI is running')
        console.log('   • Ensure WebUI was started with the --api flag')
        console.log('   • Verify WebUI is running on http://127.0.0.1:7860')
        console.log('   • Check if any firewall is blocking the connection')
      }
    } else {
      console.log('❌ Unexpected error:', error)
    }
  }
}

// Run the test if this script is executed directly
if (require.main === module) {
  testConnection().catch(console.error)
}

export { testConnection }
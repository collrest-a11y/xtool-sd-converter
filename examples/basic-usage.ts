/**
 * Basic usage examples for the SD WebUI API client
 *
 * Prerequisites:
 * - Stable Diffusion WebUI running with --api flag
 * - WebUI accessible at http://127.0.0.1:7860
 */

import { SDWebUIClient } from '../src/lib/sd-client'
import type { Txt2ImgRequest, Img2ImgRequest } from '../src/lib/types/sd-api'

async function basicExample() {
  console.log('🚀 Starting SD WebUI API client example...\n')

  // Create client with default configuration
  const client = new SDWebUIClient({
    enableLogging: true, // Enable logging for this example
  })

  try {
    // 1. Health Check
    console.log('1️⃣ Checking WebUI health...')
    const health = await client.healthCheck()

    if (!health.isHealthy) {
      console.error('❌ WebUI is not accessible:', health.error)
      console.log('💡 Make sure SD WebUI is running with --api flag')
      return
    }

    console.log(`✅ Connected to SD WebUI v${health.version} (${health.latency}ms)\n`)

    // 2. Get System Information
    console.log('2️⃣ Fetching system information...')
    const [models, samplers, memory] = await Promise.all([
      client.getModels(),
      client.getSamplers(),
      client.getMemory()
    ])

    console.log(`📦 Models available: ${models.length}`)
    console.log(`🎲 Samplers available: ${samplers.length}`)
    console.log(`💾 RAM usage: ${(memory.ram.used / 1024 / 1024 / 1024).toFixed(1)}GB / ${(memory.ram.total / 1024 / 1024 / 1024).toFixed(1)}GB`)
    if (memory.cuda) {
      console.log(`🖥️ GPU usage: ${(memory.cuda.system.used / 1024 / 1024 / 1024).toFixed(1)}GB / ${(memory.cuda.system.total / 1024 / 1024 / 1024).toFixed(1)}GB`)
    }
    console.log()

    // 3. Text-to-Image Generation
    console.log('3️⃣ Generating image with txt2img...')
    const txt2imgRequest: Txt2ImgRequest = {
      prompt: 'a serene mountain landscape at sunset, highly detailed, masterpiece',
      negative_prompt: 'blurry, low quality, distorted, ugly',
      steps: 20,
      cfg_scale: 7.5,
      width: 512,
      height: 512,
      batch_size: 1,
      sampler_name: 'Euler a',
      seed: -1, // Random seed
      restore_faces: false,
      tiling: false,
    }

    const startTime = Date.now()
    const txt2imgResult = await client.txt2img(txt2imgRequest)
    const generationTime = Date.now() - startTime

    console.log(`✅ Generated ${txt2imgResult.images.length} image(s) in ${(generationTime / 1000).toFixed(1)}s`)
    console.log(`📊 Image data size: ${(txt2imgResult.images[0].length / 1024).toFixed(1)}KB (base64)`)

    // The images are base64 encoded - you can save them or use them in your app
    // Example: fs.writeFileSync('generated.png', txt2imgResult.images[0], 'base64')
    console.log()

    // 4. Image-to-Image Generation (using the generated image)
    console.log('4️⃣ Enhancing image with img2img...')
    const img2imgRequest: Img2ImgRequest = {
      prompt: 'the same landscape but with dramatic lighting and enhanced details, photorealistic',
      negative_prompt: 'blurry, low quality, distorted',
      init_images: [txt2imgResult.images[0]], // Use the generated image
      denoising_strength: 0.5, // How much to change the image
      steps: 15,
      cfg_scale: 7.0,
      batch_size: 1,
      sampler_name: 'Euler a',
    }

    const img2imgResult = await client.img2img(img2imgRequest)
    console.log(`✅ Enhanced image generated`)
    console.log(`📊 Enhanced image data size: ${(img2imgResult.images[0].length / 1024).toFixed(1)}KB (base64)`)
    console.log()

    // 5. Monitor progress (for long-running operations)
    console.log('5️⃣ Progress monitoring example...')

    // Start a longer generation in the background
    const longGeneration = client.txt2img({
      ...txt2imgRequest,
      steps: 50, // More steps for longer generation
      width: 768,
      height: 768,
    })

    // Monitor progress
    let lastProgress = -1
    const progressInterval = setInterval(async () => {
      try {
        const progress = await client.getProgress()
        if (progress.progress !== lastProgress) {
          console.log(`🔄 Generation progress: ${(progress.progress * 100).toFixed(1)}%`)
          lastProgress = progress.progress
        }

        // Stop monitoring when complete
        if (progress.progress >= 1.0) {
          clearInterval(progressInterval)
        }
      } catch (error) {
        // Ignore progress check errors
      }
    }, 1000)

    // Wait for completion
    const longResult = await longGeneration
    clearInterval(progressInterval)
    console.log(`✅ Long generation completed: ${longResult.images.length} image(s)`)
    console.log()

    console.log('🎉 Example completed successfully!')
    console.log('💡 All generated images are returned as base64 strings')
    console.log('💡 You can save them or use them directly in your web application')

  } catch (error) {
    console.error('❌ Example failed:', error)

    if (error instanceof Error) {
      console.log(`Error type: ${error.constructor.name}`)
      console.log(`Error message: ${error.message}`)
    }
  }
}

// Helper function to save base64 image (Node.js environment)
function saveBase64Image(base64Data: string, filename: string) {
  const fs = require('fs')
  fs.writeFileSync(filename, base64Data, 'base64')
  console.log(`💾 Saved image: ${filename}`)
}

// Run the example
if (require.main === module) {
  basicExample().catch(console.error)
}

export { basicExample }
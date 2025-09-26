/**
 * Test script for extension detection with actual SD WebUI installation
 */

import { createExtensionDetector } from './detector';
import { extensionRegistry } from './registry';

/**
 * Test extension detection functionality
 */
export async function testExtensionDetection(): Promise<{
  success: boolean;
  results: any;
  errors: string[];
}> {
  const errors: string[] = [];
  const results: any = {};

  try {
    console.log('🔍 Testing Extension Detection System...');

    // Initialize detector
    const detector = createExtensionDetector();
    console.log('✅ Extension detector initialized');

    // Test 1: Detect SD WebUI Info
    console.log('\n📊 Testing SD WebUI Detection...');
    try {
      const sdInfo = await detector.detectSDWebUIInfo();
      results.sdInfo = sdInfo;
      console.log(`✅ SD WebUI Path: ${sdInfo.path}`);
      console.log(`✅ SD WebUI Version: ${sdInfo.version}`);
      console.log(`✅ Extensions Path: ${sdInfo.extensionsPath}`);
      console.log(`✅ Is Running: ${sdInfo.isRunning}`);
      console.log(`✅ Installed Extensions Count: ${sdInfo.installedExtensions.length}`);

      // Display installed extensions
      if (sdInfo.installedExtensions.length > 0) {
        console.log('\n📦 Installed Extensions:');
        sdInfo.installedExtensions.forEach(ext => {
          console.log(`  - ${ext.name} (${ext.id}) v${ext.version} [${ext.isEnabled ? 'Enabled' : 'Disabled'}]`);
        });
      } else {
        console.log('ℹ️  No extensions detected');
      }
    } catch (error) {
      const errorMsg = `SD WebUI detection failed: ${error instanceof Error ? error.message : 'Unknown error'}`;
      errors.push(errorMsg);
      console.error(`❌ ${errorMsg}`);
    }

    // Test 2: Test extension registry
    console.log('\n📚 Testing Extension Registry...');
    try {
      const allExtensions = extensionRegistry.getAllExtensions();
      results.registryStats = {
        totalExtensions: allExtensions.length,
        categories: {}
      };

      console.log(`✅ Registry loaded with ${allExtensions.length} extensions`);

      // Test featured extensions
      const featured = extensionRegistry.getFeaturedExtensions();
      console.log(`✅ Featured extensions: ${featured.length}`);

      // Test search functionality
      const searchResults = extensionRegistry.searchExtensions('controlnet');
      console.log(`✅ Search for 'controlnet': ${searchResults.length} results`);

      // Test recommendations
      const laserRecommendations = extensionRegistry.getRecommendedExtensions('laser-engraving');
      console.log(`✅ Laser engraving recommendations: ${laserRecommendations.length} extensions`);

      results.registryStats.featuredCount = featured.length;
      results.registryStats.searchResults = searchResults.length;
      results.registryStats.recommendations = laserRecommendations.length;

    } catch (error) {
      const errorMsg = `Extension registry test failed: ${error instanceof Error ? error.message : 'Unknown error'}`;
      errors.push(errorMsg);
      console.error(`❌ ${errorMsg}`);
    }

    // Test 3: Test compatibility checking
    console.log('\n🔍 Testing Compatibility Checking...');
    try {
      const testExtensionId = 'sd-webui-controlnet';
      const metadata = extensionRegistry.getExtension(testExtensionId);

      if (metadata) {
        // Test dependency chain
        const dependencies = extensionRegistry.getDependencyChain(testExtensionId);
        console.log(`✅ Dependency chain for ${testExtensionId}: ${dependencies.length} dependencies`);

        // Test conflict detection
        const conflicts = extensionRegistry.getConflicts([testExtensionId]);
        console.log(`✅ Conflict detection for ${testExtensionId}: ${conflicts.size} conflicts`);

        results.compatibilityTest = {
          extensionId: testExtensionId,
          dependencies: dependencies.length,
          conflicts: conflicts.size
        };
      } else {
        console.log(`ℹ️  Test extension ${testExtensionId} not found in registry`);
      }
    } catch (error) {
      const errorMsg = `Compatibility check failed: ${error instanceof Error ? error.message : 'Unknown error'}`;
      errors.push(errorMsg);
      console.error(`❌ ${errorMsg}`);
    }

    // Test 4: Test file system access
    console.log('\n📁 Testing File System Access...');
    try {
      const sdPath = 'C:\\Users\\Brendan\\Downloads\\Stable Test\\stable-diffusion-webui-master';

      // Check if SD path exists
      const pathExists = await testPathExists(sdPath);
      console.log(`${pathExists ? '✅' : '❌'} SD WebUI path exists: ${sdPath}`);

      // Check extensions directory
      const extensionsPath = `${sdPath}\\extensions`;
      const extensionsExists = await testPathExists(extensionsPath);
      console.log(`${extensionsExists ? '✅' : '❌'} Extensions directory exists: ${extensionsPath}`);

      results.fileSystemTest = {
        sdPathExists: pathExists,
        extensionsPathExists: extensionsExists
      };

      if (!pathExists) {
        errors.push('SD WebUI installation path not found - please verify the path is correct');
      }

    } catch (error) {
      const errorMsg = `File system test failed: ${error instanceof Error ? error.message : 'Unknown error'}`;
      errors.push(errorMsg);
      console.error(`❌ ${errorMsg}`);
    }

    // Test 5: Test API connectivity
    console.log('\n🌐 Testing API Connectivity...');
    try {
      const apiUrl = 'http://127.0.0.1:7860';
      const apiConnected = await testAPIConnection(apiUrl);
      console.log(`${apiConnected ? '✅' : 'ℹ️ '} SD WebUI API connection: ${apiConnected ? 'Connected' : 'Not running (normal if WebUI is not started)'}`);

      results.apiTest = {
        connected: apiConnected,
        url: apiUrl
      };
    } catch (error) {
      const errorMsg = `API connectivity test failed: ${error instanceof Error ? error.message : 'Unknown error'}`;
      console.log(`ℹ️  ${errorMsg} (This is normal if SD WebUI is not running)`);
    }

    // Summary
    console.log('\n📋 Test Summary:');
    console.log(`Total Errors: ${errors.length}`);
    if (errors.length === 0) {
      console.log('🎉 All tests passed successfully!');
    } else {
      console.log('⚠️  Some tests had issues:');
      errors.forEach(error => console.log(`  - ${error}`));
    }

    return {
      success: errors.length === 0,
      results,
      errors
    };

  } catch (error) {
    const errorMsg = `Test execution failed: ${error instanceof Error ? error.message : 'Unknown error'}`;
    errors.push(errorMsg);
    console.error(`💥 ${errorMsg}`);

    return {
      success: false,
      results,
      errors
    };
  }
}

/**
 * Test if a path exists (via API call)
 */
async function testPathExists(path: string): Promise<boolean> {
  try {
    const response = await fetch('/api/extensions/test-path', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ path })
    });

    if (response.ok) {
      const result = await response.json();
      return result.exists === true;
    }
    return false;
  } catch {
    return false;
  }
}

/**
 * Test API connection to SD WebUI
 */
async function testAPIConnection(apiUrl: string): Promise<boolean> {
  try {
    const response = await fetch(`${apiUrl}/internal/ping`, {
      signal: AbortSignal.timeout(3000) // 3 second timeout
    });
    return response.ok;
  } catch {
    return false;
  }
}

/**
 * Run comprehensive extension system test
 */
export async function runExtensionSystemTest(): Promise<void> {
  console.log('🚀 Starting Extension Management System Test...\n');

  const testResult = await testExtensionDetection();

  console.log('\n' + '='.repeat(60));
  console.log('EXTENSION MANAGEMENT SYSTEM TEST COMPLETED');
  console.log('='.repeat(60));

  if (testResult.success) {
    console.log('✅ RESULT: All systems operational');
    console.log('\nThe extension management system is ready for use!');
  } else {
    console.log('⚠️  RESULT: Some issues detected');
    console.log('\nThe system may work with limited functionality.');
    console.log('Please review the errors above and ensure:');
    console.log('1. SD WebUI is installed at the correct path');
    console.log('2. The extensions directory exists');
    console.log('3. File permissions allow read/write access');
  }

  console.log(`\n📊 Test Results Summary:`);
  console.log(`- Errors: ${testResult.errors.length}`);
  console.log(`- SD WebUI Detected: ${testResult.results.sdInfo ? 'Yes' : 'No'}`);
  console.log(`- Registry Extensions: ${testResult.results.registryStats?.totalExtensions || 0}`);
  console.log(`- File System Access: ${testResult.results.fileSystemTest?.sdPathExists ? 'OK' : 'Failed'}`);
  console.log(`- API Connection: ${testResult.results.apiTest?.connected ? 'Connected' : 'Not Connected'}`);
}

// Export test function for use in components
export { runExtensionSystemTest as default };
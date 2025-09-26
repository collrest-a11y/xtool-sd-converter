/**
 * Extension Management System - Main Export
 *
 * This module provides a complete extension management system for Stable Diffusion WebUI,
 * including automatic detection, dependency resolution, safe installation with rollback,
 * and compatibility checking.
 */

// Core types and interfaces
export * from './types';

// Extension detection and scanning
export { ExtensionDetector, ExtensionDetectorUtils, createExtensionDetector } from './detector';

// Extension registry and metadata database
export { extensionRegistry, ExtensionRegistryManager, EXTENSION_REGISTRY } from './registry';

// Main extension manager with dependency resolution
export { ExtensionManager } from './extension-manager';

// Safe installation with rollback capability
export { ExtensionInstaller, createExtensionInstaller } from './installer';
export type { InstallationContext, InstallationStep } from './installer';

// Testing utilities
export { testExtensionDetection, runExtensionSystemTest } from './test-detector';

/**
 * Quick start factory function to create a fully configured extension manager
 */
export function createExtensionManagementSystem(options?: {
  sdPath?: string;
  apiUrl?: string;
}) {
  return new ExtensionManager(options?.sdPath, options?.apiUrl);
}

/**
 * Extension Management System Information
 */
export const EXTENSION_SYSTEM_INFO = {
  name: 'SD WebUI Extension Manager',
  version: '1.0.0',
  description: 'Intelligent extension management system for Stable Diffusion WebUI',
  features: [
    'Automatic extension detection',
    'Dependency resolution and conflict detection',
    'Safe installation with rollback capability',
    'Extension registry with curated metadata',
    'Version compatibility checking',
    'One-click installation and updates',
    'Backup and restore functionality',
    'Extension recommendations by workflow'
  ],
  supportedInstallMethods: [
    'git_clone',
    'download_zip',
    'pip_install',
    'manual'
  ],
  supportedCategories: [
    'controlnet',
    'lora',
    'models',
    'scripts',
    'ui',
    'preprocessing',
    'postprocessing',
    'api',
    'training',
    'optimization',
    'utilities',
    'integration'
  ]
} as const;
/**
 * Extension detection utilities for scanning SD WebUI installation
 */

import { InstalledExtension, SDWebUIInfo, ExtensionMetadata } from './types';

export class ExtensionDetector {
  private sdPath: string;
  private extensionsPath: string;
  private apiUrl?: string;

  constructor(sdPath: string, apiUrl?: string) {
    this.sdPath = sdPath;
    this.extensionsPath = `${sdPath}/extensions`;
    this.apiUrl = apiUrl;
  }

  /**
   * Scan the SD WebUI installation for basic information
   */
  async detectSDWebUIInfo(): Promise<SDWebUIInfo> {
    const version = await this.detectSDVersion();
    const isRunning = await this.checkSDWebUIStatus();
    const installedExtensions = await this.scanInstalledExtensions();

    return {
      version,
      path: this.sdPath,
      extensionsPath: this.extensionsPath,
      isRunning,
      apiUrl: this.apiUrl,
      installedExtensions
    };
  }

  /**
   * Scan for installed extensions in the extensions directory
   */
  async scanInstalledExtensions(): Promise<InstalledExtension[]> {
    try {
      const response = await fetch('/api/extensions/scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          extensionsPath: this.extensionsPath,
          sdPath: this.sdPath
        })
      });

      if (!response.ok) {
        throw new Error(`Failed to scan extensions: ${response.statusText}`);
      }

      const result = await response.json();
      return result.extensions || [];
    } catch (error) {
      console.error('Failed to scan installed extensions:', error);
      return [];
    }
  }

  /**
   * Detect SD WebUI version
   */
  private async detectSDVersion(): Promise<string> {
    try {
      // First try to get version from API
      if (this.apiUrl) {
        const response = await fetch(`${this.apiUrl}/internal/version`);
        if (response.ok) {
          const data = await response.json();
          return data.version || 'unknown';
        }
      }

      // Fallback: check for version files
      const response = await fetch('/api/extensions/detect-version', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sdPath: this.sdPath })
      });

      if (response.ok) {
        const data = await response.json();
        return data.version || 'unknown';
      }

      return 'unknown';
    } catch (error) {
      console.warn('Could not detect SD version:', error);
      return 'unknown';
    }
  }

  /**
   * Check if SD WebUI is currently running
   */
  private async checkSDWebUIStatus(): Promise<boolean> {
    if (!this.apiUrl) {
      return false;
    }

    try {
      const response = await fetch(`${this.apiUrl}/internal/ping`, {
        signal: AbortSignal.timeout(5000) // 5 second timeout
      });
      return response.ok;
    } catch (error) {
      return false;
    }
  }

  /**
   * Parse extension metadata from various sources
   */
  async parseExtensionMetadata(extensionPath: string): Promise<Partial<ExtensionMetadata> | null> {
    try {
      const response = await fetch('/api/extensions/parse-metadata', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ extensionPath })
      });

      if (!response.ok) {
        return null;
      }

      const data = await response.json();
      return data.metadata;
    } catch (error) {
      console.warn(`Failed to parse metadata for ${extensionPath}:`, error);
      return null;
    }
  }

  /**
   * Validate extension installation
   */
  async validateExtensionInstallation(extensionId: string): Promise<{
    valid: boolean;
    issues: string[];
    dependencies: string[];
  }> {
    try {
      const response = await fetch('/api/extensions/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          extensionId,
          sdPath: this.sdPath
        })
      });

      if (!response.ok) {
        throw new Error(`Validation failed: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error(`Failed to validate extension ${extensionId}:`, error);
      return {
        valid: false,
        issues: [error instanceof Error ? error.message : 'Unknown validation error'],
        dependencies: []
      };
    }
  }

  /**
   * Check for extension updates
   */
  async checkForUpdates(extensionIds?: string[]): Promise<Map<string, string>> {
    try {
      const response = await fetch('/api/extensions/check-updates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          extensionIds,
          sdPath: this.sdPath
        })
      });

      if (!response.ok) {
        throw new Error(`Update check failed: ${response.statusText}`);
      }

      const result = await response.json();
      return new Map(Object.entries(result.updates || {}));
    } catch (error) {
      console.error('Failed to check for updates:', error);
      return new Map();
    }
  }

  /**
   * Get extension dependencies
   */
  async getDependencies(extensionId: string): Promise<string[]> {
    try {
      const response = await fetch('/api/extensions/dependencies', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          extensionId,
          sdPath: this.sdPath
        })
      });

      if (!response.ok) {
        return [];
      }

      const result = await response.json();
      return result.dependencies || [];
    } catch (error) {
      console.warn(`Failed to get dependencies for ${extensionId}:`, error);
      return [];
    }
  }

  /**
   * Detect extension conflicts
   */
  async detectConflicts(extensionIds: string[]): Promise<Map<string, string[]>> {
    try {
      const response = await fetch('/api/extensions/detect-conflicts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          extensionIds,
          sdPath: this.sdPath
        })
      });

      if (!response.ok) {
        return new Map();
      }

      const result = await response.json();
      return new Map(Object.entries(result.conflicts || {}));
    } catch (error) {
      console.error('Failed to detect conflicts:', error);
      return new Map();
    }
  }
}

/**
 * Utility functions for extension detection
 */
export const ExtensionDetectorUtils = {
  /**
   * Guess extension category from name and path
   */
  guessCategory(name: string, path: string): string {
    const nameLower = name.toLowerCase();
    const pathLower = path.toLowerCase();

    if (nameLower.includes('controlnet') || pathLower.includes('controlnet')) {
      return 'controlnet';
    }
    if (nameLower.includes('lora') || pathLower.includes('lora')) {
      return 'lora';
    }
    if (nameLower.includes('model') || pathLower.includes('model')) {
      return 'models';
    }
    if (nameLower.includes('script') || pathLower.includes('script')) {
      return 'scripts';
    }
    if (nameLower.includes('ui') || nameLower.includes('interface')) {
      return 'ui';
    }
    if (nameLower.includes('preprocess') || nameLower.includes('pre-process')) {
      return 'preprocessing';
    }
    if (nameLower.includes('postprocess') || nameLower.includes('post-process')) {
      return 'postprocessing';
    }
    if (nameLower.includes('api') || nameLower.includes('endpoint')) {
      return 'api';
    }
    if (nameLower.includes('train') || nameLower.includes('dreambooth')) {
      return 'training';
    }
    if (nameLower.includes('optim') || nameLower.includes('speed') || nameLower.includes('performance')) {
      return 'optimization';
    }
    if (nameLower.includes('tool') || nameLower.includes('util')) {
      return 'utilities';
    }

    return 'utilities'; // default category
  },

  /**
   * Extract version from git repository or files
   */
  async extractVersion(extensionPath: string): Promise<string> {
    try {
      // Try to get version from git tags first
      const response = await fetch('/api/extensions/extract-version', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ extensionPath })
      });

      if (response.ok) {
        const data = await response.json();
        return data.version || 'unknown';
      }

      return 'unknown';
    } catch (error) {
      return 'unknown';
    }
  },

  /**
   * Check if path contains a valid extension
   */
  async isValidExtension(extensionPath: string): Promise<boolean> {
    try {
      const response = await fetch('/api/extensions/validate-path', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ extensionPath })
      });

      if (response.ok) {
        const data = await response.json();
        return data.valid === true;
      }

      return false;
    } catch (error) {
      return false;
    }
  },

  /**
   * Calculate directory size for extension
   */
  async calculateSize(extensionPath: string): Promise<number> {
    try {
      const response = await fetch('/api/extensions/calculate-size', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ extensionPath })
      });

      if (response.ok) {
        const data = await response.json();
        return data.size || 0;
      }

      return 0;
    } catch (error) {
      return 0;
    }
  }
};

/**
 * Create extension detector instance with default SD WebUI path
 */
export function createExtensionDetector(
  sdPath?: string,
  apiUrl?: string
): ExtensionDetector {
  const defaultPath = sdPath || 'C:\\Users\\Brendan\\Downloads\\Stable Test\\stable-diffusion-webui-master';
  const defaultApiUrl = apiUrl || 'http://127.0.0.1:7860';

  return new ExtensionDetector(defaultPath, defaultApiUrl);
}
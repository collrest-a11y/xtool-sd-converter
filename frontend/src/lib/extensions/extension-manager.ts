/**
 * Main extension management system with dependency resolution
 */

import {
  ExtensionMetadata,
  InstalledExtension,
  ExtensionInstallRequest,
  ExtensionInstallResult,
  ExtensionDependencyGraph,
  ExtensionCompatibility,
  ExtensionBackup,
  BackupReason,
  SDWebUIInfo,
  ExtensionInstallProgress,
  InstallStage,
  CompatibilityIssue
} from './types';

import { ExtensionDetector } from './detector';
import { extensionRegistry } from './registry';

export class ExtensionManager {
  private detector: ExtensionDetector;
  private installQueue: Map<string, ExtensionInstallRequest> = new Map();
  private installProgress: Map<string, ExtensionInstallProgress> = new Map();
  private backups: Map<string, ExtensionBackup[]> = new Map();

  constructor(sdPath?: string, apiUrl?: string) {
    this.detector = new ExtensionDetector(
      sdPath || 'C:\\Users\\Brendan\\Downloads\\Stable Test\\stable-diffusion-webui-master',
      apiUrl || 'http://127.0.0.1:7860'
    );
  }

  /**
   * Get SD WebUI information including installed extensions
   */
  async getSDWebUIInfo(): Promise<SDWebUIInfo> {
    return await this.detector.detectSDWebUIInfo();
  }

  /**
   * Install an extension with dependency resolution
   */
  async installExtension(request: ExtensionInstallRequest): Promise<ExtensionInstallResult> {
    const extensionId = request.extensionId;

    try {
      // Check if extension exists in registry
      const metadata = extensionRegistry.getExtension(extensionId);
      if (!metadata) {
        return {
          success: false,
          extensionId,
          message: `Extension ${extensionId} not found in registry`
        };
      }

      // Check compatibility
      const compatibility = await this.checkCompatibility(extensionId);
      if (!compatibility.compatible && !request.force) {
        return {
          success: false,
          extensionId,
          message: 'Extension is not compatible',
          errors: compatibility.issues.map(issue => issue.message)
        };
      }

      // Resolve dependencies
      const dependencyChain = extensionRegistry.getDependencyChain(extensionId);
      const installOrder: string[] = [];

      if (request.installDependencies !== false) {
        // Add dependencies to install order
        for (const depId of dependencyChain) {
          const isInstalled = await this.isExtensionInstalled(depId);
          if (!isInstalled) {
            installOrder.push(depId);
          }
        }
      }

      // Add the main extension
      installOrder.push(extensionId);

      // Create backup before installation
      const backupId = await this.createBackup(extensionId, BackupReason.BEFORE_INSTALL);

      // Install extensions in dependency order
      const installedDependencies: string[] = [];
      for (const id of installOrder) {
        const result = await this.performInstallation(id, request.version);
        if (!result.success) {
          // Rollback on failure
          if (backupId) {
            await this.restoreBackup(backupId);
          }
          return {
            success: false,
            extensionId,
            message: `Failed to install dependency ${id}: ${result.message}`,
            errors: result.errors,
            rollbackId: backupId
          };
        }

        if (id !== extensionId) {
          installedDependencies.push(id);
        }
      }

      return {
        success: true,
        extensionId,
        version: metadata.version,
        message: `Successfully installed ${metadata.name}`,
        installedDependencies,
        rollbackId: backupId
      };

    } catch (error) {
      return {
        success: false,
        extensionId,
        message: `Installation failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        errors: [error instanceof Error ? error.message : 'Unknown error']
      };
    }
  }

  /**
   * Perform the actual installation of a single extension
   */
  private async performInstallation(extensionId: string, version?: string): Promise<ExtensionInstallResult> {
    const metadata = extensionRegistry.getExtension(extensionId);
    if (!metadata) {
      return {
        success: false,
        extensionId,
        message: 'Extension not found'
      };
    }

    // Update progress
    this.updateInstallProgress(extensionId, InstallStage.VALIDATING, 10, 'Validating extension...');

    try {
      // Start installation via API
      const response = await fetch('/api/extensions/install', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          extensionId,
          metadata,
          version: version || metadata.version
        })
      });

      if (!response.ok) {
        throw new Error(`Installation API failed: ${response.statusText}`);
      }

      // Monitor installation progress
      const result = await this.monitorInstallation(extensionId);

      return result;

    } catch (error) {
      this.updateInstallProgress(extensionId, InstallStage.FAILED, 100,
        `Installation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);

      return {
        success: false,
        extensionId,
        message: error instanceof Error ? error.message : 'Installation failed'
      };
    }
  }

  /**
   * Monitor installation progress
   */
  private async monitorInstallation(extensionId: string): Promise<ExtensionInstallResult> {
    return new Promise((resolve) => {
      const checkProgress = async () => {
        try {
          const response = await fetch(`/api/extensions/install-status/${extensionId}`);
          if (!response.ok) {
            throw new Error('Failed to get install status');
          }

          const status = await response.json();

          this.updateInstallProgress(
            extensionId,
            status.stage,
            status.progress,
            status.message,
            status.eta
          );

          if (status.stage === InstallStage.COMPLETED) {
            resolve({
              success: true,
              extensionId,
              version: status.version,
              message: 'Installation completed successfully'
            });
          } else if (status.stage === InstallStage.FAILED) {
            resolve({
              success: false,
              extensionId,
              message: status.message || 'Installation failed',
              errors: status.errors
            });
          } else {
            // Continue monitoring
            setTimeout(checkProgress, 1000);
          }
        } catch (error) {
          resolve({
            success: false,
            extensionId,
            message: `Monitoring failed: ${error instanceof Error ? error.message : 'Unknown error'}`
          });
        }
      };

      checkProgress();
    });
  }

  /**
   * Uninstall an extension
   */
  async uninstallExtension(extensionId: string): Promise<boolean> {
    try {
      // Create backup before uninstalling
      await this.createBackup(extensionId, BackupReason.BEFORE_UNINSTALL);

      const response = await fetch('/api/extensions/uninstall', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ extensionId })
      });

      return response.ok;
    } catch (error) {
      console.error(`Failed to uninstall extension ${extensionId}:`, error);
      return false;
    }
  }

  /**
   * Enable/disable extension
   */
  async toggleExtension(extensionId: string, enabled: boolean): Promise<boolean> {
    try {
      const response = await fetch('/api/extensions/toggle', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ extensionId, enabled })
      });

      return response.ok;
    } catch (error) {
      console.error(`Failed to ${enabled ? 'enable' : 'disable'} extension ${extensionId}:`, error);
      return false;
    }
  }

  /**
   * Check extension compatibility
   */
  async checkCompatibility(extensionId: string): Promise<ExtensionCompatibility> {
    const metadata = extensionRegistry.getExtension(extensionId);
    if (!metadata) {
      return {
        compatible: false,
        issues: [{
          type: 'dependency',
          severity: 'error',
          message: 'Extension not found in registry',
          affectedExtensions: [extensionId]
        }]
      };
    }

    const issues: CompatibilityIssue[] = [];
    const sdInfo = await this.getSDWebUIInfo();

    // Check SD version compatibility
    if (sdInfo.version !== 'unknown' && !metadata.sdVersions.includes(sdInfo.version)) {
      issues.push({
        type: 'version',
        severity: 'warning',
        message: `Extension may not be compatible with SD WebUI version ${sdInfo.version}`,
        affectedExtensions: [extensionId],
        solutions: ['Try installing anyway', 'Update SD WebUI', 'Check for extension updates']
      });
    }

    // Check for missing dependencies
    const missingDeps = await this.getMissingDependencies(extensionId);
    if (missingDeps.length > 0) {
      issues.push({
        type: 'dependency',
        severity: 'error',
        message: `Missing required dependencies: ${missingDeps.join(', ')}`,
        affectedExtensions: missingDeps,
        solutions: ['Install dependencies automatically', 'Install dependencies manually']
      });
    }

    // Check for conflicts
    const conflicts = await this.getExtensionConflicts([extensionId]);
    if (conflicts.has(extensionId)) {
      const conflictList = conflicts.get(extensionId)!;
      issues.push({
        type: 'conflict',
        severity: 'warning',
        message: `Conflicts with installed extensions: ${conflictList.join(', ')}`,
        affectedExtensions: conflictList,
        solutions: ['Disable conflicting extensions', 'Use alternative extensions']
      });
    }

    return {
      compatible: issues.filter(issue => issue.severity === 'error').length === 0,
      issues,
      recommendations: this.getCompatibilityRecommendations(extensionId, issues)
    };
  }

  /**
   * Get missing dependencies for an extension
   */
  async getMissingDependencies(extensionId: string): Promise<string[]> {
    const dependencyChain = extensionRegistry.getDependencyChain(extensionId);
    const missing: string[] = [];

    for (const depId of dependencyChain) {
      const isInstalled = await this.isExtensionInstalled(depId);
      if (!isInstalled) {
        missing.push(depId);
      }
    }

    return missing;
  }

  /**
   * Get extension conflicts
   */
  async getExtensionConflicts(extensionIds: string[]): Promise<Map<string, string[]>> {
    const installedExtensions = (await this.getSDWebUIInfo()).installedExtensions;
    const installedIds = installedExtensions.map(ext => ext.id);

    // Add currently installed extensions to the check
    const allIds = [...new Set([...extensionIds, ...installedIds])];

    return extensionRegistry.getConflicts(allIds);
  }

  /**
   * Check if extension is installed
   */
  async isExtensionInstalled(extensionId: string): Promise<boolean> {
    const sdInfo = await this.getSDWebUIInfo();
    return sdInfo.installedExtensions.some(ext => ext.id === extensionId);
  }

  /**
   * Create backup of extension
   */
  async createBackup(extensionId: string, reason: BackupReason): Promise<string | null> {
    try {
      const response = await fetch('/api/extensions/backup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ extensionId, reason })
      });

      if (!response.ok) return null;

      const result = await response.json();
      const backup: ExtensionBackup = {
        id: result.backupId,
        timestamp: new Date().toISOString(),
        extensionId,
        version: result.version,
        path: result.path,
        reason
      };

      // Store backup info
      if (!this.backups.has(extensionId)) {
        this.backups.set(extensionId, []);
      }
      this.backups.get(extensionId)!.push(backup);

      return backup.id;
    } catch (error) {
      console.error(`Failed to create backup for ${extensionId}:`, error);
      return null;
    }
  }

  /**
   * Restore from backup
   */
  async restoreBackup(backupId: string): Promise<boolean> {
    try {
      const response = await fetch('/api/extensions/restore', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ backupId })
      });

      return response.ok;
    } catch (error) {
      console.error(`Failed to restore backup ${backupId}:`, error);
      return false;
    }
  }

  /**
   * Get extension backups
   */
  getBackups(extensionId: string): ExtensionBackup[] {
    return this.backups.get(extensionId) || [];
  }

  /**
   * Build dependency graph
   */
  buildDependencyGraph(extensionIds: string[]): ExtensionDependencyGraph {
    const extensions = new Map<string, Set<string>>();
    const conflicts = new Map<string, Set<string>>();
    const visited = new Set<string>();
    const circular: string[][] = [];

    const buildGraph = (id: string, path: string[] = []) => {
      if (path.includes(id)) {
        circular.push([...path, id]);
        return;
      }

      if (visited.has(id)) return;
      visited.add(id);

      const metadata = extensionRegistry.getExtension(id);
      if (!metadata) return;

      const deps = new Set(metadata.dependencies);
      const conflicts_set = new Set(metadata.conflicts);

      extensions.set(id, deps);
      conflicts.set(id, conflicts_set);

      // Recursively build graph for dependencies
      metadata.dependencies.forEach(depId => {
        buildGraph(depId, [...path, id]);
      });
    };

    extensionIds.forEach(id => buildGraph(id));

    return { extensions, conflicts, circular };
  }

  /**
   * Update install progress
   */
  private updateInstallProgress(
    extensionId: string,
    stage: InstallStage,
    progress: number,
    message: string,
    eta?: number
  ): void {
    this.installProgress.set(extensionId, {
      extensionId,
      stage,
      progress,
      message,
      eta
    });
  }

  /**
   * Get install progress
   */
  getInstallProgress(extensionId: string): ExtensionInstallProgress | undefined {
    return this.installProgress.get(extensionId);
  }

  /**
   * Clear install progress
   */
  clearInstallProgress(extensionId: string): void {
    this.installProgress.delete(extensionId);
  }

  /**
   * Get compatibility recommendations
   */
  private getCompatibilityRecommendations(extensionId: string, issues: CompatibilityIssue[]): string[] {
    const recommendations: string[] = [];

    if (issues.some(issue => issue.type === 'version')) {
      recommendations.push('Consider updating SD WebUI to the latest version');
    }

    if (issues.some(issue => issue.type === 'dependency')) {
      recommendations.push('Install required dependencies before proceeding');
    }

    if (issues.some(issue => issue.type === 'conflict')) {
      recommendations.push('Review conflicting extensions and consider alternatives');
    }

    return recommendations;
  }

  /**
   * Check for extension updates
   */
  async checkForUpdates(): Promise<Map<string, string>> {
    return await this.detector.checkForUpdates();
  }

  /**
   * Search available extensions
   */
  searchExtensions(query: string, options?: any): ExtensionMetadata[] {
    return extensionRegistry.searchExtensions(query, options);
  }

  /**
   * Get featured extensions
   */
  getFeaturedExtensions(): ExtensionMetadata[] {
    return extensionRegistry.getFeaturedExtensions();
  }

  /**
   * Get recommended extensions for workflow
   */
  getRecommendedExtensions(workflow: string): ExtensionMetadata[] {
    return extensionRegistry.getRecommendedExtensions(workflow);
  }
}
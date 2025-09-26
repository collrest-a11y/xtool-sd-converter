/**
 * Safe installation logic with rollback capability for SD WebUI extensions
 */

import {
  ExtensionMetadata,
  ExtensionInstallResult,
  InstallMethod,
  InstallStage,
  BackupReason,
  ExtensionInstallProgress
} from './types';

export interface InstallationContext {
  extensionId: string;
  metadata: ExtensionMetadata;
  targetPath: string;
  backupPath?: string;
  tempPath?: string;
  version?: string;
}

export interface InstallationStep {
  name: string;
  stage: InstallStage;
  execute: (context: InstallationContext) => Promise<void>;
  rollback?: (context: InstallationContext) => Promise<void>;
  weight: number; // For progress calculation
}

export class ExtensionInstaller {
  private sdPath: string;
  private extensionsPath: string;
  private tempPath: string;
  private backupPath: string;

  constructor(sdPath: string) {
    this.sdPath = sdPath;
    this.extensionsPath = `${sdPath}/extensions`;
    this.tempPath = `${sdPath}/temp/extensions`;
    this.backupPath = `${sdPath}/backups/extensions`;
  }

  /**
   * Install extension with full rollback capability
   */
  async installExtension(
    metadata: ExtensionMetadata,
    options: {
      version?: string;
      onProgress?: (progress: ExtensionInstallProgress) => void;
    } = {}
  ): Promise<ExtensionInstallResult> {
    const context: InstallationContext = {
      extensionId: metadata.id,
      metadata,
      targetPath: `${this.extensionsPath}/${metadata.id}`,
      version: options.version || metadata.version
    };

    const steps = this.buildInstallationSteps(metadata);
    const executedSteps: InstallationStep[] = [];
    let currentProgress = 0;
    const totalWeight = steps.reduce((sum, step) => sum + step.weight, 0);

    try {
      for (const step of steps) {
        // Update progress
        const progress: ExtensionInstallProgress = {
          extensionId: metadata.id,
          stage: step.stage,
          progress: Math.round((currentProgress / totalWeight) * 100),
          message: `${step.name}...`
        };

        options.onProgress?.(progress);

        // Execute step
        await step.execute(context);
        executedSteps.push(step);
        currentProgress += step.weight;
      }

      // Final success update
      options.onProgress?.({
        extensionId: metadata.id,
        stage: InstallStage.COMPLETED,
        progress: 100,
        message: 'Installation completed successfully'
      });

      return {
        success: true,
        extensionId: metadata.id,
        version: context.version,
        message: `Successfully installed ${metadata.name}`
      };

    } catch (error) {
      // Rollback executed steps in reverse order
      const rollbackError = await this.rollbackInstallation(executedSteps.reverse(), context);

      options.onProgress?.({
        extensionId: metadata.id,
        stage: InstallStage.FAILED,
        progress: 100,
        message: `Installation failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      });

      return {
        success: false,
        extensionId: metadata.id,
        message: `Installation failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        errors: rollbackError ? [`Rollback also failed: ${rollbackError}`] : undefined
      };
    }
  }

  /**
   * Build installation steps based on install method
   */
  private buildInstallationSteps(metadata: ExtensionMetadata): InstallationStep[] {
    const commonSteps: InstallationStep[] = [
      {
        name: 'Preparing installation',
        stage: InstallStage.VALIDATING,
        weight: 5,
        execute: async (context) => {
          await this.validateInstallation(context);
        }
      },
      {
        name: 'Creating backup',
        stage: InstallStage.VALIDATING,
        weight: 10,
        execute: async (context) => {
          context.backupPath = await this.createPreInstallBackup(context);
        },
        rollback: async (context) => {
          if (context.backupPath) {
            await this.restoreFromBackup(context);
          }
        }
      }
    ];

    const methodSteps = this.getMethodSpecificSteps(metadata.installMethod);
    const postInstallSteps: InstallationStep[] = [
      {
        name: 'Installing dependencies',
        stage: InstallStage.CONFIGURING,
        weight: 15,
        execute: async (context) => {
          await this.installDependencies(context);
        }
      },
      {
        name: 'Configuring extension',
        stage: InstallStage.CONFIGURING,
        weight: 10,
        execute: async (context) => {
          await this.configureExtension(context);
        }
      },
      {
        name: 'Validating installation',
        stage: InstallStage.TESTING,
        weight: 10,
        execute: async (context) => {
          await this.validatePostInstall(context);
        }
      }
    ];

    return [...commonSteps, ...methodSteps, ...postInstallSteps];
  }

  /**
   * Get installation steps specific to install method
   */
  private getMethodSpecificSteps(method: InstallMethod): InstallationStep[] {
    switch (method) {
      case InstallMethod.GIT_CLONE:
        return [
          {
            name: 'Cloning repository',
            stage: InstallStage.DOWNLOADING,
            weight: 40,
            execute: async (context) => {
              await this.cloneRepository(context);
            },
            rollback: async (context) => {
              await this.removeDirectory(context.targetPath);
            }
          }
        ];

      case InstallMethod.DOWNLOAD_ZIP:
        return [
          {
            name: 'Downloading archive',
            stage: InstallStage.DOWNLOADING,
            weight: 30,
            execute: async (context) => {
              context.tempPath = await this.downloadArchive(context);
            }
          },
          {
            name: 'Extracting archive',
            stage: InstallStage.EXTRACTING,
            weight: 20,
            execute: async (context) => {
              if (!context.tempPath) throw new Error('No archive to extract');
              await this.extractArchive(context);
            },
            rollback: async (context) => {
              await this.removeDirectory(context.targetPath);
              if (context.tempPath) {
                await this.removeFile(context.tempPath);
              }
            }
          }
        ];

      case InstallMethod.PIP_INSTALL:
        return [
          {
            name: 'Installing via pip',
            stage: InstallStage.INSTALLING,
            weight: 50,
            execute: async (context) => {
              await this.pipInstall(context);
            }
          }
        ];

      default:
        return [
          {
            name: 'Manual installation placeholder',
            stage: InstallStage.INSTALLING,
            weight: 50,
            execute: async () => {
              throw new Error('Manual installation method requires user intervention');
            }
          }
        ];
    }
  }

  /**
   * Validate installation prerequisites
   */
  private async validateInstallation(context: InstallationContext): Promise<void> {
    const response = await fetch('/api/extensions/validate-install', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        extensionId: context.extensionId,
        targetPath: context.targetPath,
        metadata: context.metadata
      })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Installation validation failed');
    }
  }

  /**
   * Create pre-installation backup
   */
  private async createPreInstallBackup(context: InstallationContext): Promise<string> {
    const response = await fetch('/api/extensions/create-backup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        extensionId: context.extensionId,
        reason: BackupReason.BEFORE_INSTALL,
        sourcePath: context.targetPath
      })
    });

    if (!response.ok) {
      throw new Error('Failed to create backup');
    }

    const result = await response.json();
    return result.backupPath;
  }

  /**
   * Clone Git repository
   */
  private async cloneRepository(context: InstallationContext): Promise<void> {
    const response = await fetch('/api/extensions/git-clone', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        repositoryUrl: context.metadata.repository,
        targetPath: context.targetPath,
        version: context.version
      })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Git clone failed');
    }
  }

  /**
   * Download ZIP archive
   */
  private async downloadArchive(context: InstallationContext): Promise<string> {
    const response = await fetch('/api/extensions/download-archive', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        downloadUrl: context.metadata.installUrl,
        extensionId: context.extensionId
      })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Download failed');
    }

    const result = await response.json();
    return result.tempPath;
  }

  /**
   * Extract downloaded archive
   */
  private async extractArchive(context: InstallationContext): Promise<void> {
    if (!context.tempPath) {
      throw new Error('No archive path provided');
    }

    const response = await fetch('/api/extensions/extract-archive', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        archivePath: context.tempPath,
        targetPath: context.targetPath
      })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Archive extraction failed');
    }
  }

  /**
   * Install via pip
   */
  private async pipInstall(context: InstallationContext): Promise<void> {
    const response = await fetch('/api/extensions/pip-install', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        packageName: context.metadata.installUrl,
        version: context.version
      })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Pip installation failed');
    }
  }

  /**
   * Install extension dependencies
   */
  private async installDependencies(context: InstallationContext): Promise<void> {
    if (context.metadata.dependencies.length === 0) {
      return;
    }

    const response = await fetch('/api/extensions/install-dependencies', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        extensionPath: context.targetPath,
        dependencies: context.metadata.dependencies
      })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Dependency installation failed');
    }
  }

  /**
   * Configure extension after installation
   */
  private async configureExtension(context: InstallationContext): Promise<void> {
    const response = await fetch('/api/extensions/configure', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        extensionId: context.extensionId,
        extensionPath: context.targetPath,
        metadata: context.metadata
      })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Extension configuration failed');
    }
  }

  /**
   * Validate installation after completion
   */
  private async validatePostInstall(context: InstallationContext): Promise<void> {
    const response = await fetch('/api/extensions/validate-post-install', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        extensionId: context.extensionId,
        extensionPath: context.targetPath
      })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Post-installation validation failed');
    }
  }

  /**
   * Rollback installation steps
   */
  private async rollbackInstallation(
    steps: InstallationStep[],
    context: InstallationContext
  ): Promise<string | null> {
    for (const step of steps) {
      if (step.rollback) {
        try {
          await step.rollback(context);
        } catch (error) {
          return `Rollback step "${step.name}" failed: ${error instanceof Error ? error.message : 'Unknown error'}`;
        }
      }
    }
    return null;
  }

  /**
   * Restore from backup
   */
  private async restoreFromBackup(context: InstallationContext): Promise<void> {
    if (!context.backupPath) return;

    const response = await fetch('/api/extensions/restore-backup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        backupPath: context.backupPath,
        targetPath: context.targetPath
      })
    });

    if (!response.ok) {
      throw new Error('Backup restoration failed');
    }
  }

  /**
   * Remove directory
   */
  private async removeDirectory(path: string): Promise<void> {
    const response = await fetch('/api/extensions/remove-directory', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ path })
    });

    if (!response.ok) {
      throw new Error(`Failed to remove directory: ${path}`);
    }
  }

  /**
   * Remove file
   */
  private async removeFile(path: string): Promise<void> {
    const response = await fetch('/api/extensions/remove-file', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ path })
    });

    if (!response.ok) {
      throw new Error(`Failed to remove file: ${path}`);
    }
  }

  /**
   * Uninstall extension with backup
   */
  async uninstallExtension(extensionId: string): Promise<ExtensionInstallResult> {
    try {
      const extensionPath = `${this.extensionsPath}/${extensionId}`;

      // Create backup before uninstalling
      const backupResponse = await fetch('/api/extensions/create-backup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          extensionId,
          reason: BackupReason.BEFORE_UNINSTALL,
          sourcePath: extensionPath
        })
      });

      let backupPath: string | undefined;
      if (backupResponse.ok) {
        const backupResult = await backupResponse.json();
        backupPath = backupResult.backupPath;
      }

      // Perform uninstallation
      const response = await fetch('/api/extensions/uninstall', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ extensionId, extensionPath })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Uninstallation failed');
      }

      return {
        success: true,
        extensionId,
        message: 'Extension uninstalled successfully',
        rollbackId: backupPath
      };

    } catch (error) {
      return {
        success: false,
        extensionId,
        message: `Uninstallation failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  /**
   * Update extension
   */
  async updateExtension(
    extensionId: string,
    targetVersion?: string
  ): Promise<ExtensionInstallResult> {
    try {
      const extensionPath = `${this.extensionsPath}/${extensionId}`;

      // Create backup before updating
      const backupResponse = await fetch('/api/extensions/create-backup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          extensionId,
          reason: BackupReason.BEFORE_UPDATE,
          sourcePath: extensionPath
        })
      });

      let backupPath: string | undefined;
      if (backupResponse.ok) {
        const backupResult = await backupResponse.json();
        backupPath = backupResult.backupPath;
      }

      // Perform update
      const response = await fetch('/api/extensions/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          extensionId,
          extensionPath,
          targetVersion
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Update failed');
      }

      const result = await response.json();

      return {
        success: true,
        extensionId,
        version: result.version,
        message: 'Extension updated successfully',
        rollbackId: backupPath
      };

    } catch (error) {
      return {
        success: false,
        extensionId,
        message: `Update failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }
}

/**
 * Create installer instance
 */
export function createExtensionInstaller(sdPath?: string): ExtensionInstaller {
  const defaultPath = sdPath || 'C:\\Users\\Brendan\\Downloads\\Stable Test\\stable-diffusion-webui-master';
  return new ExtensionInstaller(defaultPath);
}
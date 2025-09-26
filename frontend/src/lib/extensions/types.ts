/**
 * TypeScript interfaces and types for Stable Diffusion extension management
 */

export interface ExtensionMetadata {
  id: string;
  name: string;
  description: string;
  author: string;
  version: string;
  homepage: string;
  repository: string;
  tags: string[];
  category: ExtensionCategory;
  sdVersions: string[];
  dependencies: string[];
  conflicts: string[];
  installUrl: string;
  installMethod: InstallMethod;
  isOfficial: boolean;
  downloadSize?: number;
  lastUpdated: string;
  rating?: number;
  downloadCount?: number;
}

export interface InstalledExtension {
  id: string;
  name: string;
  version: string;
  path: string;
  isEnabled: boolean;
  installedDate: string;
  lastUsed?: string;
  hasUpdates: boolean;
  metadata?: ExtensionMetadata;
}

export interface ExtensionInstallRequest {
  extensionId: string;
  version?: string;
  force?: boolean;
  installDependencies?: boolean;
}

export interface ExtensionInstallResult {
  success: boolean;
  extensionId: string;
  version?: string;
  message: string;
  errors?: string[];
  installedDependencies?: string[];
  rollbackId?: string;
}

export interface ExtensionDependencyGraph {
  extensions: Map<string, Set<string>>;
  conflicts: Map<string, Set<string>>;
  circular: string[][];
}

export interface ExtensionCompatibility {
  compatible: boolean;
  issues: CompatibilityIssue[];
  recommendations?: string[];
}

export interface CompatibilityIssue {
  type: 'version' | 'dependency' | 'conflict' | 'platform';
  severity: 'error' | 'warning' | 'info';
  message: string;
  affectedExtensions: string[];
  solutions?: string[];
}

export interface ExtensionBackup {
  id: string;
  timestamp: string;
  extensionId: string;
  version: string;
  path: string;
  reason: BackupReason;
}

export interface ExtensionInstallProgress {
  extensionId: string;
  stage: InstallStage;
  progress: number;
  message: string;
  eta?: number;
}

export interface ExtensionRegistry {
  lastUpdated: string;
  extensions: ExtensionMetadata[];
  categories: ExtensionCategory[];
  featuredExtensions: string[];
}

export interface SDWebUIInfo {
  version: string;
  path: string;
  extensionsPath: string;
  isRunning: boolean;
  apiUrl?: string;
  installedExtensions: InstalledExtension[];
}

// Enums
export enum ExtensionCategory {
  CONTROLNET = 'controlnet',
  LORA = 'lora',
  MODELS = 'models',
  SCRIPTS = 'scripts',
  UI = 'ui',
  PREPROCESSING = 'preprocessing',
  POSTPROCESSING = 'postprocessing',
  API = 'api',
  TRAINING = 'training',
  OPTIMIZATION = 'optimization',
  UTILITIES = 'utilities',
  INTEGRATION = 'integration'
}

export enum InstallMethod {
  GIT_CLONE = 'git_clone',
  DOWNLOAD_ZIP = 'download_zip',
  PIP_INSTALL = 'pip_install',
  MANUAL = 'manual'
}

export enum InstallStage {
  VALIDATING = 'validating',
  DOWNLOADING = 'downloading',
  EXTRACTING = 'extracting',
  INSTALLING = 'installing',
  CONFIGURING = 'configuring',
  TESTING = 'testing',
  COMPLETED = 'completed',
  FAILED = 'failed'
}

export enum BackupReason {
  BEFORE_INSTALL = 'before_install',
  BEFORE_UPDATE = 'before_update',
  BEFORE_UNINSTALL = 'before_uninstall',
  MANUAL = 'manual'
}

// API Response Types
export interface ExtensionApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  timestamp: string;
}

export interface ExtensionSearchParams {
  query?: string;
  category?: ExtensionCategory;
  tags?: string[];
  compatible?: boolean;
  official?: boolean;
  limit?: number;
  offset?: number;
  sortBy?: 'name' | 'rating' | 'downloads' | 'updated';
  sortOrder?: 'asc' | 'desc';
}

export interface ExtensionUpdateInfo {
  available: boolean;
  currentVersion: string;
  latestVersion: string;
  changelog?: string;
  breaking: boolean;
  size?: number;
}

// Context and State Types
export interface ExtensionManagerState {
  isLoading: boolean;
  installedExtensions: InstalledExtension[];
  availableExtensions: ExtensionMetadata[];
  searchResults: ExtensionMetadata[];
  selectedExtension?: ExtensionMetadata;
  installQueue: ExtensionInstallRequest[];
  installProgress: Map<string, ExtensionInstallProgress>;
  error?: string;
  sdWebUIInfo?: SDWebUIInfo;
  lastRefresh?: string;
}

export type ExtensionManagerAction =
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_INSTALLED_EXTENSIONS'; payload: InstalledExtension[] }
  | { type: 'SET_AVAILABLE_EXTENSIONS'; payload: ExtensionMetadata[] }
  | { type: 'SET_SEARCH_RESULTS'; payload: ExtensionMetadata[] }
  | { type: 'SET_SELECTED_EXTENSION'; payload: ExtensionMetadata | undefined }
  | { type: 'ADD_TO_INSTALL_QUEUE'; payload: ExtensionInstallRequest }
  | { type: 'REMOVE_FROM_INSTALL_QUEUE'; payload: string }
  | { type: 'UPDATE_INSTALL_PROGRESS'; payload: ExtensionInstallProgress }
  | { type: 'SET_ERROR'; payload: string | undefined }
  | { type: 'SET_SDWEBUI_INFO'; payload: SDWebUIInfo }
  | { type: 'REFRESH_DATA' };

// Hook Return Types
export interface UseExtensionManager {
  state: ExtensionManagerState;
  actions: {
    refreshExtensions: () => Promise<void>;
    searchExtensions: (params: ExtensionSearchParams) => Promise<void>;
    installExtension: (request: ExtensionInstallRequest) => Promise<ExtensionInstallResult>;
    uninstallExtension: (extensionId: string) => Promise<boolean>;
    enableExtension: (extensionId: string) => Promise<boolean>;
    disableExtension: (extensionId: string) => Promise<boolean>;
    checkForUpdates: (extensionId?: string) => Promise<ExtensionUpdateInfo[]>;
    checkCompatibility: (extensionId: string) => Promise<ExtensionCompatibility>;
    createBackup: (extensionId: string, reason: BackupReason) => Promise<string>;
    restoreBackup: (backupId: string) => Promise<boolean>;
  };
}
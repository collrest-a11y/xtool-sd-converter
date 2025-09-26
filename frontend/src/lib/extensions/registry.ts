/**
 * Extension registry and metadata database for popular SD WebUI extensions
 */

import { ExtensionMetadata, ExtensionCategory, InstallMethod, ExtensionRegistry } from './types';

/**
 * Curated list of popular and recommended SD WebUI extensions
 */
export const EXTENSION_REGISTRY: ExtensionMetadata[] = [
  // ControlNet Extensions
  {
    id: 'sd-webui-controlnet',
    name: 'ControlNet',
    description: 'ControlNet for Stable Diffusion WebUI - precise control over image generation',
    author: 'Mikubill',
    version: '1.1.440',
    homepage: 'https://github.com/Mikubill/sd-webui-controlnet',
    repository: 'https://github.com/Mikubill/sd-webui-controlnet.git',
    tags: ['controlnet', 'control', 'precision', 'essential'],
    category: ExtensionCategory.CONTROLNET,
    sdVersions: ['1.6.0', '1.7.0', '1.8.0'],
    dependencies: [],
    conflicts: [],
    installUrl: 'https://github.com/Mikubill/sd-webui-controlnet.git',
    installMethod: InstallMethod.GIT_CLONE,
    isOfficial: false,
    downloadSize: 45000000, // ~45MB
    lastUpdated: '2024-01-15',
    rating: 4.9,
    downloadCount: 500000
  },
  {
    id: 'sd-webui-openpose-editor',
    name: 'OpenPose Editor',
    description: 'Extension for editing OpenPose keypoints',
    author: 'fkunn1326',
    version: '1.0.0',
    homepage: 'https://github.com/fkunn1326/openpose-editor',
    repository: 'https://github.com/fkunn1326/openpose-editor.git',
    tags: ['openpose', 'editor', 'controlnet', 'pose'],
    category: ExtensionCategory.CONTROLNET,
    sdVersions: ['1.6.0', '1.7.0', '1.8.0'],
    dependencies: ['sd-webui-controlnet'],
    conflicts: [],
    installUrl: 'https://github.com/fkunn1326/openpose-editor.git',
    installMethod: InstallMethod.GIT_CLONE,
    isOfficial: false,
    downloadSize: 5000000,
    lastUpdated: '2024-01-10',
    rating: 4.5,
    downloadCount: 50000
  },

  // LoRA Extensions
  {
    id: 'a1111-sd-webui-locon',
    name: 'LoCon',
    description: 'LoRA for convolution layers extension',
    author: 'KohakuBlueleaf',
    version: '1.5.0',
    homepage: 'https://github.com/KohakuBlueleaf/a1111-sd-webui-locon',
    repository: 'https://github.com/KohakuBlueleaf/a1111-sd-webui-locon.git',
    tags: ['lora', 'locon', 'training', 'models'],
    category: ExtensionCategory.LORA,
    sdVersions: ['1.6.0', '1.7.0', '1.8.0'],
    dependencies: [],
    conflicts: [],
    installUrl: 'https://github.com/KohakuBlueleaf/a1111-sd-webui-locon.git',
    installMethod: InstallMethod.GIT_CLONE,
    isOfficial: false,
    downloadSize: 15000000,
    lastUpdated: '2024-01-12',
    rating: 4.6,
    downloadCount: 75000
  },

  // Model Management
  {
    id: 'sd-webui-additional-networks',
    name: 'Additional Networks',
    description: 'Support for additional network types including LoRA',
    author: 'kohya-ss',
    version: '1.4.2',
    homepage: 'https://github.com/kohya-ss/sd-webui-additional-networks',
    repository: 'https://github.com/kohya-ss/sd-webui-additional-networks.git',
    tags: ['lora', 'networks', 'models', 'additional'],
    category: ExtensionCategory.MODELS,
    sdVersions: ['1.6.0', '1.7.0', '1.8.0'],
    dependencies: [],
    conflicts: [],
    installUrl: 'https://github.com/kohya-ss/sd-webui-additional-networks.git',
    installMethod: InstallMethod.GIT_CLONE,
    isOfficial: false,
    downloadSize: 20000000,
    lastUpdated: '2024-01-08',
    rating: 4.7,
    downloadCount: 100000
  },

  // Scripts and Utilities
  {
    id: 'sd-dynamic-prompts',
    name: 'Dynamic Prompts',
    description: 'A custom script for AUTOMATIC1111/stable-diffusion-webui to implement a tiny template language for random prompt generation',
    author: 'adieyal',
    version: '1.17.0',
    homepage: 'https://github.com/adieyal/sd-dynamic-prompts',
    repository: 'https://github.com/adieyal/sd-dynamic-prompts.git',
    tags: ['prompts', 'dynamic', 'random', 'templates'],
    category: ExtensionCategory.SCRIPTS,
    sdVersions: ['1.6.0', '1.7.0', '1.8.0'],
    dependencies: [],
    conflicts: [],
    installUrl: 'https://github.com/adieyal/sd-dynamic-prompts.git',
    installMethod: InstallMethod.GIT_CLONE,
    isOfficial: false,
    downloadSize: 8000000,
    lastUpdated: '2024-01-20',
    rating: 4.8,
    downloadCount: 150000
  },
  {
    id: 'ultimate-upscale-for-automatic1111',
    name: 'Ultimate SD Upscale',
    description: 'More advanced upscaling script using SD',
    author: 'Coyote-A',
    version: '1.2.0',
    homepage: 'https://github.com/Coyote-A/ultimate-upscale-for-automatic1111',
    repository: 'https://github.com/Coyote-A/ultimate-upscale-for-automatic1111.git',
    tags: ['upscale', 'upscaling', 'enhancement', 'quality'],
    category: ExtensionCategory.POSTPROCESSING,
    sdVersions: ['1.6.0', '1.7.0', '1.8.0'],
    dependencies: [],
    conflicts: [],
    installUrl: 'https://github.com/Coyote-A/ultimate-upscale-for-automatic1111.git',
    installMethod: InstallMethod.GIT_CLONE,
    isOfficial: false,
    downloadSize: 12000000,
    lastUpdated: '2024-01-05',
    rating: 4.4,
    downloadCount: 80000
  },

  // UI Extensions
  {
    id: 'stable-diffusion-webui-images-browser',
    name: 'Images Browser',
    description: 'Browse and search generated images with enhanced functionality',
    author: 'yfszzx',
    version: '1.6.0',
    homepage: 'https://github.com/yfszzx/stable-diffusion-webui-images-browser',
    repository: 'https://github.com/yfszzx/stable-diffusion-webui-images-browser.git',
    tags: ['ui', 'browser', 'images', 'search', 'management'],
    category: ExtensionCategory.UI,
    sdVersions: ['1.6.0', '1.7.0', '1.8.0'],
    dependencies: [],
    conflicts: [],
    installUrl: 'https://github.com/yfszzx/stable-diffusion-webui-images-browser.git',
    installMethod: InstallMethod.GIT_CLONE,
    isOfficial: false,
    downloadSize: 3000000,
    lastUpdated: '2024-01-18',
    rating: 4.3,
    downloadCount: 120000
  },

  // API Extensions
  {
    id: 'sd-webui-api',
    name: 'Enhanced API',
    description: 'Enhanced API functionality for SD WebUI',
    author: 'mix1009',
    version: '1.3.0',
    homepage: 'https://github.com/mix1009/sdwebuiapi',
    repository: 'https://github.com/mix1009/sdwebuiapi.git',
    tags: ['api', 'rest', 'integration', 'endpoints'],
    category: ExtensionCategory.API,
    sdVersions: ['1.6.0', '1.7.0', '1.8.0'],
    dependencies: [],
    conflicts: [],
    installUrl: 'https://github.com/mix1009/sdwebuiapi.git',
    installMethod: InstallMethod.GIT_CLONE,
    isOfficial: false,
    downloadSize: 2000000,
    lastUpdated: '2024-01-14',
    rating: 4.2,
    downloadCount: 30000
  },

  // Training Extensions
  {
    id: 'sd-webui-dreambooth-extension',
    name: 'DreamBooth Extension',
    description: 'Implementation of Google\'s DreamBooth with Stable Diffusion',
    author: 'd8ahazard',
    version: '1.0.14',
    homepage: 'https://github.com/d8ahazard/sd_dreambooth_extension',
    repository: 'https://github.com/d8ahazard/sd_dreambooth_extension.git',
    tags: ['dreambooth', 'training', 'fine-tuning', 'models'],
    category: ExtensionCategory.TRAINING,
    sdVersions: ['1.6.0', '1.7.0'],
    dependencies: [],
    conflicts: ['kohya-ss-training'],
    installUrl: 'https://github.com/d8ahazard/sd_dreambooth_extension.git',
    installMethod: InstallMethod.GIT_CLONE,
    isOfficial: false,
    downloadSize: 100000000, // ~100MB
    lastUpdated: '2024-01-03',
    rating: 4.1,
    downloadCount: 45000
  },

  // Optimization Extensions
  {
    id: 'sd-webui-memory-release',
    name: 'Memory Release',
    description: 'Automatic memory release for better performance',
    author: 'hnmr293',
    version: '1.0.0',
    homepage: 'https://github.com/hnmr293/sd-webui-memory-release',
    repository: 'https://github.com/hnmr293/sd-webui-memory-release.git',
    tags: ['memory', 'optimization', 'performance', 'release'],
    category: ExtensionCategory.OPTIMIZATION,
    sdVersions: ['1.6.0', '1.7.0', '1.8.0'],
    dependencies: [],
    conflicts: [],
    installUrl: 'https://github.com/hnmr293/sd-webui-memory-release.git',
    installMethod: InstallMethod.GIT_CLONE,
    isOfficial: false,
    downloadSize: 500000,
    lastUpdated: '2024-01-11',
    rating: 4.0,
    downloadCount: 25000
  }
];

/**
 * Extension registry manager class
 */
export class ExtensionRegistryManager {
  private registry: Map<string, ExtensionMetadata>;
  private categories: Map<ExtensionCategory, ExtensionMetadata[]>;
  private lastUpdated: string;

  constructor() {
    this.registry = new Map();
    this.categories = new Map();
    this.lastUpdated = new Date().toISOString();
    this.initializeRegistry();
  }

  /**
   * Initialize registry with built-in extensions
   */
  private initializeRegistry(): void {
    EXTENSION_REGISTRY.forEach(ext => {
      this.registry.set(ext.id, ext);

      if (!this.categories.has(ext.category)) {
        this.categories.set(ext.category, []);
      }
      this.categories.get(ext.category)!.push(ext);
    });
  }

  /**
   * Get extension by ID
   */
  getExtension(id: string): ExtensionMetadata | undefined {
    return this.registry.get(id);
  }

  /**
   * Get all extensions
   */
  getAllExtensions(): ExtensionMetadata[] {
    return Array.from(this.registry.values());
  }

  /**
   * Get extensions by category
   */
  getExtensionsByCategory(category: ExtensionCategory): ExtensionMetadata[] {
    return this.categories.get(category) || [];
  }

  /**
   * Search extensions
   */
  searchExtensions(query: string, options?: {
    category?: ExtensionCategory;
    tags?: string[];
    officialOnly?: boolean;
    compatibleWith?: string; // SD version
  }): ExtensionMetadata[] {
    const queryLower = query.toLowerCase();
    let results = this.getAllExtensions();

    // Filter by search query
    if (query) {
      results = results.filter(ext =>
        ext.name.toLowerCase().includes(queryLower) ||
        ext.description.toLowerCase().includes(queryLower) ||
        ext.tags.some(tag => tag.toLowerCase().includes(queryLower)) ||
        ext.author.toLowerCase().includes(queryLower)
      );
    }

    // Filter by category
    if (options?.category) {
      results = results.filter(ext => ext.category === options.category);
    }

    // Filter by tags
    if (options?.tags && options.tags.length > 0) {
      results = results.filter(ext =>
        options.tags!.some(tag => ext.tags.includes(tag))
      );
    }

    // Filter by official status
    if (options?.officialOnly) {
      results = results.filter(ext => ext.isOfficial);
    }

    // Filter by compatibility
    if (options?.compatibleWith) {
      results = results.filter(ext =>
        ext.sdVersions.includes(options.compatibleWith!)
      );
    }

    return results;
  }

  /**
   * Get featured extensions
   */
  getFeaturedExtensions(): ExtensionMetadata[] {
    // Return top-rated, most downloaded, or essential extensions
    return this.getAllExtensions()
      .filter(ext => ext.rating && ext.rating >= 4.5)
      .sort((a, b) => (b.downloadCount || 0) - (a.downloadCount || 0))
      .slice(0, 6);
  }

  /**
   * Get recommended extensions for a workflow
   */
  getRecommendedExtensions(workflow: string): ExtensionMetadata[] {
    const recommendations: { [key: string]: string[] } = {
      'laser-engraving': [
        'sd-webui-controlnet',
        'sd-dynamic-prompts',
        'ultimate-upscale-for-automatic1111'
      ],
      'art-creation': [
        'sd-webui-controlnet',
        'sd-webui-additional-networks',
        'stable-diffusion-webui-images-browser'
      ],
      'training': [
        'sd-webui-dreambooth-extension',
        'a1111-sd-webui-locon',
        'sd-webui-additional-networks'
      ],
      'api-integration': [
        'sd-webui-api',
        'sd-webui-controlnet'
      ]
    };

    const extensionIds = recommendations[workflow] || [];
    return extensionIds
      .map(id => this.getExtension(id))
      .filter(ext => ext !== undefined) as ExtensionMetadata[];
  }

  /**
   * Check for extension dependencies
   */
  getDependencyChain(extensionId: string): string[] {
    const extension = this.getExtension(extensionId);
    if (!extension) return [];

    const chain: string[] = [];
    const visited = new Set<string>();

    const resolveDependencies = (id: string) => {
      if (visited.has(id)) return; // Avoid circular dependencies
      visited.add(id);

      const ext = this.getExtension(id);
      if (!ext) return;

      ext.dependencies.forEach(depId => {
        resolveDependencies(depId);
        if (!chain.includes(depId)) {
          chain.push(depId);
        }
      });
    };

    resolveDependencies(extensionId);
    return chain;
  }

  /**
   * Check for extension conflicts
   */
  getConflicts(extensionIds: string[]): Map<string, string[]> {
    const conflicts = new Map<string, string[]>();

    extensionIds.forEach(id => {
      const extension = this.getExtension(id);
      if (!extension) return;

      const conflicting = extension.conflicts.filter(conflictId =>
        extensionIds.includes(conflictId)
      );

      if (conflicting.length > 0) {
        conflicts.set(id, conflicting);
      }
    });

    return conflicts;
  }

  /**
   * Update registry from remote source
   */
  async updateRegistry(): Promise<boolean> {
    try {
      const response = await fetch('/api/extensions/registry-update');
      if (!response.ok) return false;

      const remoteRegistry: ExtensionRegistry = await response.json();

      // Merge remote extensions with local ones
      remoteRegistry.extensions.forEach(ext => {
        this.registry.set(ext.id, ext);
      });

      this.lastUpdated = remoteRegistry.lastUpdated;
      this.rebuildCategories();

      return true;
    } catch (error) {
      console.error('Failed to update registry:', error);
      return false;
    }
  }

  /**
   * Rebuild category mappings
   */
  private rebuildCategories(): void {
    this.categories.clear();
    this.registry.forEach(ext => {
      if (!this.categories.has(ext.category)) {
        this.categories.set(ext.category, []);
      }
      this.categories.get(ext.category)!.push(ext);
    });
  }

  /**
   * Get registry statistics
   */
  getStats(): {
    totalExtensions: number;
    categoryCounts: Map<ExtensionCategory, number>;
    averageRating: number;
    totalDownloads: number;
    lastUpdated: string;
  } {
    const extensions = this.getAllExtensions();
    const categoryCounts = new Map<ExtensionCategory, number>();

    let totalRating = 0;
    let ratedExtensions = 0;
    let totalDownloads = 0;

    extensions.forEach(ext => {
      // Count by category
      const count = categoryCounts.get(ext.category) || 0;
      categoryCounts.set(ext.category, count + 1);

      // Calculate average rating
      if (ext.rating) {
        totalRating += ext.rating;
        ratedExtensions++;
      }

      // Sum downloads
      totalDownloads += ext.downloadCount || 0;
    });

    return {
      totalExtensions: extensions.length,
      categoryCounts,
      averageRating: ratedExtensions > 0 ? totalRating / ratedExtensions : 0,
      totalDownloads,
      lastUpdated: this.lastUpdated
    };
  }
}

// Export singleton instance
export const extensionRegistry = new ExtensionRegistryManager();
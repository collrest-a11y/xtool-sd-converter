/**
 * Advanced Prompt Builder for xTool SD Converter
 * Provides intelligent prompt generation and enhancement capabilities
 */

import {
  getPromptTemplate,
  buildPrompt,
  buildNegativePrompt,
  COMMON_LASER_TAGS,
  QUALITY_MODIFIERS
} from '../styles/prompts';
import type { StylePromptTemplate } from '../styles/types';

export interface PromptBuilderOptions {
  baseStyle: string;
  customModifiers?: string[];
  materialOptimization?: string;
  qualityLevel?: 'draft' | 'normal' | 'high' | 'ultra';
  laserCompatibility?: boolean;
  customPrompt?: string;
  promptWeight?: number;
}

export interface PromptBuildResult {
  fullPrompt: string;
  negativePrompt: string;
  styleTemplate: StylePromptTemplate;
  appliedModifiers: string[];
  estimatedTokens: number;
  optimizations: string[];
}

export class PromptBuilder {
  private materialPrompts: Map<string, string[]> = new Map([
    ['wood', ['wood grain texture', 'natural material', 'organic surface']],
    ['acrylic', ['smooth surface', 'plastic material', 'clean finish']],
    ['leather', ['textured surface', 'flexible material', 'natural hide']],
    ['metal', ['metallic surface', 'reflective material', 'industrial finish']],
    ['cardboard', ['paper material', 'corrugated texture', 'recyclable surface']],
    ['fabric', ['textile surface', 'woven material', 'flexible fabric']],
  ]);

  private qualityPrompts: Map<string, string[]> = new Map([
    ['draft', ['quick render', 'preview quality']],
    ['normal', ['standard quality', 'balanced detail']],
    ['high', ['high quality', 'detailed render', 'professional result']],
    ['ultra', ['ultra high quality', 'maximum detail', 'masterpiece quality', 'photorealistic']]
  ]);

  /**
   * Build an optimized prompt for laser engraving conversion
   */
  buildPrompt(options: PromptBuilderOptions): PromptBuildResult {
    const template = getPromptTemplate(options.baseStyle);
    const appliedModifiers: string[] = [];
    const optimizations: string[] = [];

    // Start with base style prompt
    let promptParts = [template.basePrompt];

    // Add quality modifiers based on level
    const qualityLevel = options.qualityLevel || 'normal';
    const qualityMods = this.qualityPrompts.get(qualityLevel) || [];
    if (qualityMods.length > 0) {
      promptParts.push(...qualityMods);
      appliedModifiers.push(...qualityMods);
      optimizations.push(`Applied ${qualityLevel} quality enhancement`);
    }

    // Add material-specific optimizations
    if (options.materialOptimization) {
      const materialMods = this.materialPrompts.get(options.materialOptimization) || [];
      if (materialMods.length > 0) {
        promptParts.push(...materialMods);
        appliedModifiers.push(...materialMods);
        optimizations.push(`Optimized for ${options.materialOptimization} material`);
      }
    }

    // Add laser compatibility tags if requested
    if (options.laserCompatibility !== false) {
      promptParts.push(...COMMON_LASER_TAGS);
      appliedModifiers.push(...COMMON_LASER_TAGS);
      optimizations.push('Added laser engraving compatibility tags');
    }

    // Add custom modifiers
    if (options.customModifiers && options.customModifiers.length > 0) {
      promptParts.push(...options.customModifiers);
      appliedModifiers.push(...options.customModifiers);
      optimizations.push(`Added ${options.customModifiers.length} custom modifiers`);
    }

    // Add custom prompt if provided
    if (options.customPrompt) {
      promptParts.push(options.customPrompt);
      optimizations.push('Integrated custom prompt elements');
    }

    // Build final prompt
    const fullPrompt = promptParts.join(', ');

    // Apply prompt weighting if specified
    const weightedPrompt = options.promptWeight && options.promptWeight !== 1.0
      ? `(${fullPrompt}:${options.promptWeight})`
      : fullPrompt;

    // Build negative prompt
    const negativePrompt = buildNegativePrompt(template);

    // Estimate token count (rough approximation)
    const estimatedTokens = this.estimateTokenCount(weightedPrompt + negativePrompt);

    return {
      fullPrompt: weightedPrompt,
      negativePrompt,
      styleTemplate: template,
      appliedModifiers,
      estimatedTokens,
      optimizations
    };
  }

  /**
   * Enhance an existing prompt with AI-suggested improvements
   */
  enhancePrompt(basePrompt: string, styleId: string, targetMaterial?: string): PromptBuildResult {
    const suggestions = this.generateEnhancements(basePrompt, styleId, targetMaterial);

    return this.buildPrompt({
      baseStyle: styleId,
      customPrompt: basePrompt,
      customModifiers: suggestions,
      materialOptimization: targetMaterial,
      qualityLevel: 'high'
    });
  }

  /**
   * Generate smart prompt enhancements based on content analysis
   */
  private generateEnhancements(prompt: string, styleId: string, material?: string): string[] {
    const enhancements: string[] = [];
    const promptLower = prompt.toLowerCase();

    // Analyze prompt content and suggest improvements
    if (promptLower.includes('portrait') || promptLower.includes('face')) {
      enhancements.push('facial detail optimization', 'portrait lighting');
    }

    if (promptLower.includes('landscape') || promptLower.includes('nature')) {
      enhancements.push('landscape composition', 'natural elements');
    }

    if (promptLower.includes('text') || promptLower.includes('writing')) {
      enhancements.push('text clarity', 'readable typography');
    }

    // Style-specific enhancements
    switch (styleId) {
      case 'line-art':
        if (!promptLower.includes('vector')) {
          enhancements.push('vector-style clarity');
        }
        break;
      case 'halftone':
        if (!promptLower.includes('dot')) {
          enhancements.push('dot pattern optimization');
        }
        break;
      case 'geometric':
        if (!promptLower.includes('symmetr')) {
          enhancements.push('geometric symmetry');
        }
        break;
    }

    // Material-specific enhancements
    if (material === 'wood' && !promptLower.includes('engrav')) {
      enhancements.push('wood engraving optimized');
    }

    return enhancements;
  }

  /**
   * Validate prompt for common issues
   */
  validatePrompt(prompt: string): { valid: boolean; issues: string[]; suggestions: string[] } {
    const issues: string[] = [];
    const suggestions: string[] = [];

    // Check prompt length
    if (prompt.length < 10) {
      issues.push('Prompt is too short');
      suggestions.push('Add more descriptive terms');
    }

    if (prompt.length > 1000) {
      issues.push('Prompt may be too long');
      suggestions.push('Consider reducing prompt complexity');
    }

    // Check for conflicting terms
    const conflictingPairs = [
      ['color', 'monochrome'],
      ['soft', 'sharp'],
      ['blurry', 'detailed'],
      ['simple', 'complex']
    ];

    const promptLower = prompt.toLowerCase();
    for (const [term1, term2] of conflictingPairs) {
      if (promptLower.includes(term1) && promptLower.includes(term2)) {
        issues.push(`Conflicting terms found: "${term1}" and "${term2}"`);
        suggestions.push(`Remove either "${term1}" or "${term2}" to avoid conflicts`);
      }
    }

    // Check for laser-specific optimizations
    const hasLaserTerms = COMMON_LASER_TAGS.some(tag =>
      promptLower.includes(tag.toLowerCase())
    );

    if (!hasLaserTerms) {
      suggestions.push('Consider adding laser engraving optimization terms');
    }

    return {
      valid: issues.length === 0,
      issues,
      suggestions
    };
  }

  /**
   * Generate multiple prompt variations for A/B testing
   */
  generateVariations(baseOptions: PromptBuilderOptions, count: number = 3): PromptBuildResult[] {
    const variations: PromptBuildResult[] = [];

    // Original version
    variations.push(this.buildPrompt(baseOptions));

    // High quality variation
    if (count > 1) {
      variations.push(this.buildPrompt({
        ...baseOptions,
        qualityLevel: 'ultra',
        customModifiers: [...(baseOptions.customModifiers || []), 'premium quality']
      }));
    }

    // Simplified variation
    if (count > 2) {
      variations.push(this.buildPrompt({
        ...baseOptions,
        qualityLevel: 'normal',
        customModifiers: (baseOptions.customModifiers || []).slice(0, 2)
      }));
    }

    // Style-enhanced variation
    if (count > 3) {
      const styleEnhancements = this.getStyleEnhancements(baseOptions.baseStyle);
      variations.push(this.buildPrompt({
        ...baseOptions,
        customModifiers: [...(baseOptions.customModifiers || []), ...styleEnhancements]
      }));
    }

    return variations.slice(0, count);
  }

  /**
   * Get style-specific enhancement suggestions
   */
  private getStyleEnhancements(styleId: string): string[] {
    const enhancements = {
      'line-art': ['technical precision', 'architectural quality', 'blueprint style'],
      'halftone': ['retro printing', 'newspaper quality', 'screen printing'],
      'stipple': ['hand engraved', 'classical technique', 'Victorian style'],
      'geometric': ['mathematical precision', 'crystalline structure', 'tessellation'],
      'minimalist': ['zen aesthetics', 'negative space', 'essential forms']
    };

    return enhancements[styleId as keyof typeof enhancements] || [];
  }

  /**
   * Estimate token count for prompt length optimization
   */
  private estimateTokenCount(text: string): number {
    // Rough estimation: average of 4 characters per token
    // This is a simplified calculation
    const words = text.split(/\s+/).length;
    const characters = text.length;

    // Use a weighted average between word count and character-based estimation
    const wordBasedTokens = words * 1.3; // Most words are 1-2 tokens
    const charBasedTokens = characters / 4; // Average 4 chars per token

    return Math.round((wordBasedTokens + charBasedTokens) / 2);
  }

  /**
   * Export prompt configuration for reuse
   */
  exportPromptConfig(result: PromptBuildResult): string {
    return JSON.stringify({
      fullPrompt: result.fullPrompt,
      negativePrompt: result.negativePrompt,
      appliedModifiers: result.appliedModifiers,
      estimatedTokens: result.estimatedTokens,
      optimizations: result.optimizations,
      timestamp: new Date().toISOString()
    }, null, 2);
  }

  /**
   * Import prompt configuration from saved data
   */
  importPromptConfig(configJson: string): Partial<PromptBuildResult> {
    try {
      return JSON.parse(configJson);
    } catch (error) {
      throw new Error('Invalid prompt configuration format');
    }
  }

  /**
   * Get available material types for optimization
   */
  getAvailableMaterials(): string[] {
    return Array.from(this.materialPrompts.keys());
  }

  /**
   * Get available quality levels
   */
  getQualityLevels(): Array<{ id: string; name: string; description: string }> {
    return [
      { id: 'draft', name: 'Draft', description: 'Quick preview quality' },
      { id: 'normal', name: 'Normal', description: 'Standard balanced quality' },
      { id: 'high', name: 'High', description: 'Professional high quality' },
      { id: 'ultra', name: 'Ultra', description: 'Maximum quality masterpiece' }
    ];
  }
}
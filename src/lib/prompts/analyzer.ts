import type {
  PromptComponent,
  PromptValidationResult,
  PromptWarning,
  PromptSuggestion,
  PromptAnalysis,
  PromptContextSuggestion,
  PromptComponentType,
  StyleModifier,
} from './types'

// Advanced prompt analysis and optimization engine
export class PromptAnalyzer {
  private readonly MAX_TOKENS = 75 // Standard SD token limit per chunk
  private readonly OPTIMAL_TOKEN_RANGE = [40, 70]
  private readonly CONTRADICTION_PAIRS = [
    ['realistic', 'cartoon'],
    ['photorealistic', 'illustration'],
    ['dark', 'bright'],
    ['simple', 'complex'],
    ['minimal', 'detailed'],
    ['modern', 'vintage'],
    ['abstract', 'realistic'],
    ['blurry', 'sharp'],
  ]

  // Quality keywords that enhance generation
  private readonly QUALITY_ENHANCERS = [
    'masterpiece',
    'best quality',
    'high quality',
    'ultra detailed',
    'extremely detailed',
    '8k',
    '4k',
    'professional',
    'award winning',
    'trending on artstation',
  ]

  // Common problematic terms
  private readonly PROBLEMATIC_TERMS = [
    'naked',
    'nude',
    'nsfw',
    'explicit',
    'gore',
    'violence',
    'blood',
    'weapon',
    'gun',
    'knife',
  ]

  // Style-specific keyword mappings
  private readonly STYLE_KEYWORDS = {
    photography: ['camera', 'lens', 'aperture', 'iso', 'exposure', 'bokeh', 'depth of field'],
    painting: ['brushstroke', 'canvas', 'oil', 'watercolor', 'acrylic', 'palette'],
    digital: ['digital art', 'concept art', 'matte painting', 'cgi', '3d render'],
    anime: ['anime', 'manga', 'cel shading', 'kawaii', 'chibi'],
    realistic: ['photorealistic', 'hyperrealistic', 'lifelike', 'natural'],
  }

  public analyzePrompt(
    components: PromptComponent[],
    negativeComponents: PromptComponent[],
    modifiers: StyleModifier[] = []
  ): PromptValidationResult {
    const warnings: PromptWarning[] = []
    const suggestions: PromptSuggestion[] = []

    // Generate the actual prompt text for analysis
    const promptText = this.generatePromptText(components, modifiers)
    const negativePromptText = this.generatePromptText(negativeComponents, [])

    // Perform various analyses
    const lengthAnalysis = this.analyzeLengthAndTokens(promptText)
    const contradictionAnalysis = this.analyzeContradictions(components)
    const duplicateAnalysis = this.analyzeDuplicates(components)
    const qualityAnalysis = this.analyzeQuality(components, promptText)
    const structureAnalysis = this.analyzeStructure(components)
    const contentAnalysis = this.analyzeContent(components, promptText)

    // Collect warnings
    warnings.push(...lengthAnalysis.warnings)
    warnings.push(...contradictionAnalysis.warnings)
    warnings.push(...duplicateAnalysis.warnings)
    warnings.push(...qualityAnalysis.warnings)
    warnings.push(...structureAnalysis.warnings)
    warnings.push(...contentAnalysis.warnings)

    // Collect suggestions
    suggestions.push(...lengthAnalysis.suggestions)
    suggestions.push(...contradictionAnalysis.suggestions)
    suggestions.push(...duplicateAnalysis.suggestions)
    suggestions.push(...qualityAnalysis.suggestions)
    suggestions.push(...structureAnalysis.suggestions)
    suggestions.push(...contentAnalysis.suggestions)

    // Calculate overall score
    const score = this.calculateOverallScore(warnings, suggestions, components)

    // Generate detailed analysis
    const analysis = this.generateDetailedAnalysis(
      components,
      negativeComponents,
      promptText,
      negativePromptText
    )

    // Empty prompts or prompts without subjects should be invalid
    const hasEnabledComponents = components.filter(c => c.enabled).length > 0
    const hasSubject = components.filter(c => c.enabled && c.type === 'subject').length > 0
    const hasHighSeverityWarnings = warnings.filter(w => w.severity === 'high').length > 0

    const isValid = hasEnabledComponents && hasSubject && !hasHighSeverityWarnings

    return {
      is_valid: isValid,
      warnings,
      suggestions,
      score,
      analysis,
    }
  }

  public optimizePrompt(components: PromptComponent[]): PromptComponent[] {
    let optimized = [...components]

    // Remove duplicates
    optimized = this.removeDuplicateComponents(optimized)

    // Reorder for better structure
    optimized = this.reorderComponents(optimized)

    // Optimize weights
    optimized = this.optimizeWeights(optimized)

    // Add missing essential components
    optimized = this.addMissingEssentials(optimized)

    return optimized
  }

  public suggestContextualPrompts(
    currentPrompt: string,
    category?: string
  ): PromptContextSuggestion[] {
    const suggestions: PromptContextSuggestion[] = []
    const keywords = this.extractKeywords(currentPrompt)

    // Subject suggestions
    const subjectSuggestions = this.generateSubjectSuggestions(keywords)
    if (subjectSuggestions.length > 0) {
      suggestions.push({
        type: 'subject',
        suggestions: subjectSuggestions,
        confidence: 0.8,
        context_keywords: keywords.slice(0, 3),
      })
    }

    // Style suggestions
    const styleSuggestions = this.generateStyleSuggestions(keywords, category)
    if (styleSuggestions.length > 0) {
      suggestions.push({
        type: 'style',
        suggestions: styleSuggestions,
        confidence: 0.7,
        context_keywords: keywords.slice(0, 3),
      })
    }

    // Technical suggestions
    const technicalSuggestions = this.generateTechnicalSuggestions(keywords)
    if (technicalSuggestions.length > 0) {
      suggestions.push({
        type: 'technical',
        suggestions: technicalSuggestions,
        confidence: 0.6,
        context_keywords: keywords.slice(0, 3),
      })
    }

    return suggestions
  }

  public validateComponentSyntax(component: PromptComponent): PromptWarning[] {
    const warnings: PromptWarning[] = []
    const content = component.content.trim()

    // Check for common syntax issues
    if (content.includes('((((') || content.includes('))))')) {
      warnings.push({
        type: 'syntax',
        message: 'Excessive emphasis brackets detected - may cause parsing issues',
        severity: 'medium',
        component_id: component.id,
      })
    }

    if (content.includes('[[[') || content.includes(']]]')) {
      warnings.push({
        type: 'syntax',
        message: 'Excessive de-emphasis brackets detected',
        severity: 'low',
        component_id: component.id,
      })
    }

    // Check for problematic content
    const hasProblematicTerms = this.PROBLEMATIC_TERMS.some(term =>
      content.toLowerCase().includes(term.toLowerCase())
    )

    if (hasProblematicTerms) {
      warnings.push({
        type: 'quality',
        message: 'Component contains potentially problematic content',
        severity: 'high',
        component_id: component.id,
      })
    }

    return warnings
  }

  private generatePromptText(components: PromptComponent[], modifiers: StyleModifier[]): string {
    const enabledComponents = components.filter(c => c.enabled)
    const componentTexts = enabledComponents.map(c => this.formatComponentText(c))
    const modifierTexts = modifiers.map(m => m.prompt_addition)

    return [...componentTexts, ...modifierTexts].join(', ')
  }

  private formatComponentText(component: PromptComponent): string {
    let text = component.content

    // Apply weight-based emphasis
    if (component.weight && component.weight !== 1.0) {
      if (component.weight > 1.0) {
        const emphasis = Math.min(Math.ceil((component.weight - 1.0) * 3), 3)
        text = `(${'('.repeat(emphasis - 1)}${text}${')'.repeat(emphasis - 1)})`
      } else if (component.weight < 1.0) {
        const deEmphasis = Math.min(Math.ceil((1.0 - component.weight) * 3), 3)
        text = `[${'['.repeat(deEmphasis - 1)}${text}${']'.repeat(deEmphasis - 1)}]`
      }
    }

    return text
  }

  private analyzeLengthAndTokens(promptText: string): {
    warnings: PromptWarning[]
    suggestions: PromptSuggestion[]
  } {
    const warnings: PromptWarning[] = []
    const suggestions: PromptSuggestion[] = []

    const estimatedTokens = this.estimateTokenCount(promptText)

    if (estimatedTokens > this.MAX_TOKENS) {
      warnings.push({
        type: 'length',
        message: `Prompt may be too long (${estimatedTokens} estimated tokens, max ${this.MAX_TOKENS})`,
        severity: 'high',
      })

      suggestions.push({
        type: 'optimization',
        message: 'Consider removing less important components or reducing emphasis',
        action: 'trim_prompt',
      })
    } else if (estimatedTokens < this.OPTIMAL_TOKEN_RANGE[0]) {
      suggestions.push({
        type: 'enhancement',
        message: 'Prompt might benefit from more descriptive details',
        action: 'add_details',
      })
    }

    return { warnings, suggestions }
  }

  private analyzeContradictions(components: PromptComponent[]): {
    warnings: PromptWarning[]
    suggestions: PromptSuggestion[]
  } {
    const warnings: PromptWarning[] = []
    const suggestions: PromptSuggestion[] = []

    const allText = components.map(c => c.content.toLowerCase()).join(' ')

    this.CONTRADICTION_PAIRS.forEach(([term1, term2]) => {
      if (allText.includes(term1) && allText.includes(term2)) {
        const component1 = components.find(c => c.content.toLowerCase().includes(term1))
        const component2 = components.find(c => c.content.toLowerCase().includes(term2))

        warnings.push({
          type: 'contradiction',
          message: `Potential contradiction detected: "${term1}" and "${term2}"`,
          severity: 'medium',
          component_id: component1?.id || component2?.id,
        })

        suggestions.push({
          type: 'removal',
          message: `Consider removing conflicting terms: "${term1}" or "${term2}"`,
          action: 'resolve_contradiction',
          component_id: component1?.id || component2?.id,
        })
      }
    })

    return { warnings, suggestions }
  }

  private analyzeDuplicates(components: PromptComponent[]): {
    warnings: PromptWarning[]
    suggestions: PromptSuggestion[]
  } {
    const warnings: PromptWarning[] = []
    const suggestions: PromptSuggestion[] = []

    const seen = new Set<string>()
    const duplicates = new Set<string>()

    components.forEach(component => {
      const normalized = component.content.toLowerCase().trim()
      if (seen.has(normalized)) {
        duplicates.add(normalized)
        warnings.push({
          type: 'duplicate',
          message: `Duplicate content detected: "${component.content}"`,
          severity: 'low',
          component_id: component.id,
        })
      } else {
        seen.add(normalized)
      }
    })

    if (duplicates.size > 0) {
      suggestions.push({
        type: 'removal',
        message: 'Consider removing duplicate components to improve efficiency',
        action: 'remove_duplicates',
      })
    }

    return { warnings, suggestions }
  }

  private analyzeQuality(
    components: PromptComponent[],
    promptText: string
  ): {
    warnings: PromptWarning[]
    suggestions: PromptSuggestion[]
  } {
    const warnings: PromptWarning[] = []
    const suggestions: PromptSuggestion[] = []

    const lowerPrompt = promptText.toLowerCase()

    // Check for quality enhancers
    const hasQualityEnhancers = this.QUALITY_ENHANCERS.some(enhancer =>
      lowerPrompt.includes(enhancer.toLowerCase())
    )

    if (!hasQualityEnhancers) {
      suggestions.push({
        type: 'enhancement',
        message: 'Consider adding quality enhancing terms like "high quality", "detailed", or "masterpiece"',
        action: 'add_quality_terms',
        suggested_content: 'high quality, detailed',
      })
    }

    // Check for overly generic terms
    const genericTerms = ['image', 'picture', 'photo', 'art', 'drawing']
    const genericCount = genericTerms.filter(term =>
      lowerPrompt.includes(term)
    ).length

    if (genericCount > 2) {
      suggestions.push({
        type: 'replacement',
        message: 'Prompt contains many generic terms - consider being more specific',
        action: 'be_more_specific',
      })
    }

    return { warnings, suggestions }
  }

  private analyzeStructure(components: PromptComponent[]): {
    warnings: PromptWarning[]
    suggestions: PromptSuggestion[]
  } {
    const warnings: PromptWarning[] = []
    const suggestions: PromptSuggestion[] = []

    const enabledComponents = components.filter(c => c.enabled)
    const componentTypes = enabledComponents.map(c => c.type)
    const typeCount = new Map<PromptComponentType, number>()

    componentTypes.forEach(type => {
      typeCount.set(type, (typeCount.get(type) || 0) + 1)
    })

    // Check for essential components
    if (!componentTypes.includes('subject')) {
      warnings.push({
        type: 'quality',
        message: 'No subject component detected - prompt may lack focus',
        severity: 'medium',
      })

      suggestions.push({
        type: 'addition',
        message: 'Consider adding a clear subject component',
        action: 'add_subject',
        suggested_content: 'portrait of a person',
      })
    }

    // Check component balance
    const detailComponentCount = typeCount.get('detail') || 0
    if (detailComponentCount > 5) {
      warnings.push({
        type: 'quality',
        message: 'Too many detail components may cause confusion',
        severity: 'low',
      })
    }

    return { warnings, suggestions }
  }

  private analyzeContent(
    components: PromptComponent[],
    promptText: string
  ): {
    warnings: PromptWarning[]
    suggestions: PromptSuggestion[]
  } {
    const warnings: PromptWarning[] = []
    const suggestions: PromptSuggestion[] = []

    // Analyze for specific style consistency
    const hasPhotographyTerms = this.STYLE_KEYWORDS.photography.some(keyword =>
      promptText.toLowerCase().includes(keyword)
    )
    const hasPaintingTerms = this.STYLE_KEYWORDS.painting.some(keyword =>
      promptText.toLowerCase().includes(keyword)
    )

    if (hasPhotographyTerms && hasPaintingTerms) {
      warnings.push({
        type: 'contradiction',
        message: 'Mixed photography and painting terms detected - may cause style confusion',
        severity: 'medium',
      })
    }

    return { warnings, suggestions }
  }

  private calculateOverallScore(
    warnings: PromptWarning[],
    suggestions: PromptSuggestion[],
    components: PromptComponent[]
  ): number {
    let score = 100

    // Deduct points for warnings
    warnings.forEach(warning => {
      switch (warning.severity) {
        case 'high':
          score -= 15
          break
        case 'medium':
          score -= 8
          break
        case 'low':
          score -= 3
          break
      }
    })

    // Factor in component quality
    const hasSubject = components.some(c => c.type === 'subject')
    const hasStyle = components.some(c => c.type === 'style')

    if (!hasSubject) score -= 10
    if (!hasStyle) score -= 5

    // Bonus for good structure
    if (components.length >= 3 && components.length <= 8) {
      score += 5
    }

    return Math.max(0, Math.min(100, score))
  }

  private generateDetailedAnalysis(
    components: PromptComponent[],
    negativeComponents: PromptComponent[],
    promptText: string,
    negativePromptText: string
  ): PromptAnalysis {
    const estimatedTokens = this.estimateTokenCount(promptText)
    const componentTypes = components.map(c => c.type)
    const typeFrequency = new Map<PromptComponentType, number>()

    componentTypes.forEach(type => {
      typeFrequency.set(type, (typeFrequency.get(type) || 0) + 1)
    })

    const dominantCategories = Array.from(typeFrequency.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([type]) => type)

    const allTypes: PromptComponentType[] = [
      'subject', 'style', 'medium', 'lighting', 'camera', 'mood', 'color', 'composition', 'detail'
    ]
    const missingComponents = allTypes.filter(type => !componentTypes.includes(type))

    return {
      complexity_score: Math.min((components.length / 8) * 100, 100),
      coherence_score: this.calculateCoherenceScore(components),
      specificity_score: this.calculateSpecificityScore(promptText),
      creativity_score: this.calculateCreativityScore(components),
      technical_score: this.calculateTechnicalScore(components),
      estimated_tokens: estimatedTokens,
      dominant_categories: dominantCategories,
      missing_components: missingComponents.slice(0, 5), // Limit to 5 most important
    }
  }

  private estimateTokenCount(text: string): number {
    // Rough estimation: average 4 characters per token
    // Account for commas and special characters
    const cleaned = text.replace(/[^\w\s]/g, ' ').replace(/\s+/g, ' ')
    return Math.ceil(cleaned.length / 4)
  }

  private calculateCoherenceScore(components: PromptComponent[]): number {
    // Simple coherence calculation based on component relationships
    let score = 85 // Base score

    // Check for style consistency
    const styles = components.filter(c => c.type === 'style')
    if (styles.length > 3) score -= 15

    return Math.max(0, Math.min(100, score))
  }

  private calculateSpecificityScore(promptText: string): number {
    const words = promptText.split(/\s+/)
    const specificWords = words.filter(word => word.length > 4).length
    return Math.min((specificWords / words.length) * 100, 100)
  }

  private calculateCreativityScore(components: PromptComponent[]): number {
    // Base creativity on variety of component types and uniqueness
    const uniqueTypes = new Set(components.map(c => c.type)).size
    const maxTypes = 9 // Total available types
    return (uniqueTypes / maxTypes) * 100
  }

  private calculateTechnicalScore(components: PromptComponent[]): number {
    let score = 70 // Base technical score

    // Check for technical components
    const hasTechnical = components.some(c =>
      ['camera', 'lighting', 'composition'].includes(c.type)
    )

    if (hasTechnical) score += 20

    return Math.min(100, score)
  }

  private extractKeywords(text: string): string[] {
    return text
      .toLowerCase()
      .split(/[,\s]+/)
      .filter(word => word.length > 2)
      .slice(0, 10)
  }

  private generateSubjectSuggestions(keywords: string[]): string[] {
    // Implementation would analyze keywords and suggest relevant subjects
    // For now, return common suggestions
    return [
      'portrait of a person',
      'landscape scene',
      'still life composition',
      'architectural structure',
      'abstract concept',
    ]
  }

  private generateStyleSuggestions(keywords: string[], category?: string): string[] {
    // Implementation would analyze context and suggest appropriate styles
    return [
      'photorealistic style',
      'artistic illustration',
      'minimalist design',
      'vintage aesthetic',
      'modern composition',
    ]
  }

  private generateTechnicalSuggestions(keywords: string[]): string[] {
    return [
      'high quality, detailed',
      '8k resolution',
      'professional lighting',
      'sharp focus',
      'masterpiece quality',
    ]
  }

  private removeDuplicateComponents(components: PromptComponent[]): PromptComponent[] {
    const seen = new Set<string>()
    return components.filter(component => {
      const normalized = component.content.toLowerCase().trim()
      if (seen.has(normalized)) {
        return false
      }
      seen.add(normalized)
      return true
    })
  }

  private reorderComponents(components: PromptComponent[]): PromptComponent[] {
    const order: PromptComponentType[] = [
      'subject', 'style', 'medium', 'lighting', 'camera', 'mood', 'color', 'composition', 'detail', 'custom'
    ]

    return components.sort((a, b) => {
      const aIndex = order.indexOf(a.type)
      const bIndex = order.indexOf(b.type)
      return (aIndex === -1 ? 999 : aIndex) - (bIndex === -1 ? 999 : bIndex)
    })
  }

  private optimizeWeights(components: PromptComponent[]): PromptComponent[] {
    return components.map(component => {
      // Normalize extreme weights
      if (component.weight && component.weight > 1.5) {
        return { ...component, weight: 1.5 }
      }
      if (component.weight && component.weight < 0.5) {
        return { ...component, weight: 0.5 }
      }
      return component
    })
  }

  private addMissingEssentials(components: PromptComponent[]): PromptComponent[] {
    const result = [...components]
    const types = new Set(components.map(c => c.type))

    // Add essential quality component if missing
    if (!types.has('detail') && !components.some(c =>
      c.content.toLowerCase().includes('quality') ||
      c.content.toLowerCase().includes('detailed')
    )) {
      result.push({
        id: `auto_quality_${Date.now()}`,
        type: 'detail',
        content: 'high quality, detailed',
        weight: 0.8,
        enabled: true,
        metadata: { auto_added: true },
      })
    }

    return result
  }
}
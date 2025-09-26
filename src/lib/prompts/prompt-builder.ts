import type {
  PromptComponent,
  PromptBuilder,
  PromptBuilderState,
  PromptGenerationOptions,
  PromptValidationResult,
  StyleModifier,
  PromptTemplate,
  PromptSystemConfig,
  PromptEvent,
} from './types'
import { PromptAnalyzer } from './analyzer'

// Default configuration for the prompt system
const DEFAULT_CONFIG: PromptSystemConfig = {
  max_prompt_length: 1500,
  max_components: 50,
  auto_validation: true,
  suggestion_threshold: 0.7,
  enable_history: true,
  max_history_items: 100,
  enable_analytics: true,
  default_generation_options: {
    include_negative: true,
    apply_emphasis: true,
    optimize_for_sd: true,
    target_token_count: 150,
    creativity_level: 'balanced',
    quality_focus: 'balanced',
  },
}

export class PromptBuilderEngine {
  private state: PromptBuilderState
  private config: PromptSystemConfig
  private eventListeners: Map<string, ((event: PromptEvent) => void)[]>
  private analyzer: PromptAnalyzer

  constructor(config?: Partial<PromptSystemConfig>) {
    this.config = { ...DEFAULT_CONFIG, ...config }
    this.state = {
      components: [],
      negative_components: [],
      active_modifiers: [],
      generation_options: this.config.default_generation_options,
      validation_enabled: this.config.auto_validation,
      auto_optimize: true,
    }
    this.eventListeners = new Map()
    this.analyzer = new PromptAnalyzer()
  }

  // Event system
  public on(eventType: string, listener: (event: PromptEvent) => void): void {
    if (!this.eventListeners.has(eventType)) {
      this.eventListeners.set(eventType, [])
    }
    this.eventListeners.get(eventType)!.push(listener)
  }

  public off(eventType: string, listener: (event: PromptEvent) => void): void {
    const listeners = this.eventListeners.get(eventType)
    if (listeners) {
      const index = listeners.indexOf(listener)
      if (index > -1) {
        listeners.splice(index, 1)
      }
    }
  }

  private emit(event: PromptEvent): void {
    const listeners = this.eventListeners.get(event.type)
    if (listeners) {
      listeners.forEach(listener => listener(event))
    }
  }

  // Component management
  public addComponent(component: Omit<PromptComponent, 'id'>): PromptComponent {
    if (this.state.components.length >= this.config.max_components) {
      throw new Error(`Maximum number of components (${this.config.max_components}) reached`)
    }

    const newComponent: PromptComponent = {
      ...component,
      id: this.generateId(),
    }

    if (component.type === 'negative') {
      this.state.negative_components.push(newComponent)
    } else {
      this.state.components.push(newComponent)
    }

    this.emit({ type: 'component_added', component: newComponent })

    if (this.state.auto_optimize) {
      this.optimizePrompt()
    }

    return newComponent
  }

  public removeComponent(componentId: string): boolean {
    const componentIndex = this.state.components.findIndex(c => c.id === componentId)
    const negativeIndex = this.state.negative_components.findIndex(c => c.id === componentId)

    if (componentIndex > -1) {
      this.state.components.splice(componentIndex, 1)
      this.emit({ type: 'component_removed', component_id: componentId })
      return true
    } else if (negativeIndex > -1) {
      this.state.negative_components.splice(negativeIndex, 1)
      this.emit({ type: 'component_removed', component_id: componentId })
      return true
    }

    return false
  }

  public updateComponent(component: PromptComponent): boolean {
    const componentIndex = this.state.components.findIndex(c => c.id === component.id)
    const negativeIndex = this.state.negative_components.findIndex(c => c.id === component.id)

    if (componentIndex > -1) {
      this.state.components[componentIndex] = component
      this.emit({ type: 'component_updated', component })
      return true
    } else if (negativeIndex > -1) {
      this.state.negative_components[negativeIndex] = component
      this.emit({ type: 'component_updated', component })
      return true
    }

    return false
  }

  public moveComponent(componentId: string, newIndex: number): boolean {
    const componentIndex = this.state.components.findIndex(c => c.id === componentId)

    if (componentIndex > -1 && newIndex >= 0 && newIndex < this.state.components.length) {
      const [component] = this.state.components.splice(componentIndex, 1)
      this.state.components.splice(newIndex, 0, component)
      return true
    }

    return false
  }

  // Style modifier management
  public applyModifier(modifier: StyleModifier): void {
    const existingIndex = this.state.active_modifiers.findIndex(m => m.id === modifier.id)

    if (existingIndex === -1) {
      this.state.active_modifiers.push(modifier)
      this.emit({ type: 'modifier_applied', modifier })

      if (this.state.auto_optimize) {
        this.optimizePrompt()
      }
    }
  }

  public removeModifier(modifierId: string): boolean {
    const index = this.state.active_modifiers.findIndex(m => m.id === modifierId)

    if (index > -1) {
      this.state.active_modifiers.splice(index, 1)
      this.emit({ type: 'modifier_removed', modifier_id: modifierId })
      return true
    }

    return false
  }

  // Template management
  public loadTemplate(template: PromptTemplate): void {
    // Clear existing components
    this.state.components = []
    this.state.negative_components = []
    this.state.active_modifiers = []

    // Load template components
    template.components.forEach(component => {
      if (component.type === 'negative') {
        this.state.negative_components.push({ ...component, id: this.generateId() })
      } else {
        this.state.components.push({ ...component, id: this.generateId() })
      }
    })

    this.state.current_template = template
    this.emit({ type: 'template_loaded', template })

    if (this.state.auto_optimize) {
      this.optimizePrompt()
    }
  }

  public saveAsTemplate(name: string, description: string, category: any, tags: string[]): PromptTemplate {
    const template: PromptTemplate = {
      id: this.generateId(),
      name,
      description,
      category,
      tags,
      components: [...this.state.components, ...this.state.negative_components],
      created_at: new Date(),
      updated_at: new Date(),
      public: false,
    }

    return template
  }

  // Prompt generation
  public generatePrompt(): { prompt: string; negative_prompt: string } {
    const enabledComponents = this.state.components.filter(c => c.enabled)
    const enabledNegativeComponents = this.state.negative_components.filter(c => c.enabled)

    // Sort components by type priority for better prompt structure
    const sortedComponents = this.sortComponentsByPriority(enabledComponents)

    // Apply style modifiers
    const modifierPrompts = this.state.active_modifiers
      .map(m => m.prompt_addition)
      .filter(p => p.trim().length > 0)

    const modifierNegativePrompts = this.state.active_modifiers
      .map(m => m.negative_prompt_addition)
      .filter(p => p && p.trim().length > 0)

    // Build main prompt
    const componentPrompts = sortedComponents.map(c => this.formatComponent(c))
    const prompt = [...componentPrompts, ...modifierPrompts].join(', ')

    // Build negative prompt
    const negativeComponentPrompts = enabledNegativeComponents.map(c => this.formatComponent(c))
    const negative_prompt = [...negativeComponentPrompts, ...modifierNegativePrompts].join(', ')

    // Apply optimizations if enabled
    let finalPrompt = prompt
    let finalNegativePrompt = negative_prompt

    if (this.state.generation_options.optimize_for_sd) {
      finalPrompt = this.optimizeForStableDiffusion(finalPrompt)
      finalNegativePrompt = this.optimizeForStableDiffusion(finalNegativePrompt)
    }

    if (this.state.generation_options.apply_emphasis) {
      finalPrompt = this.applyEmphasis(finalPrompt)
    }

    // Trim to target token count if specified
    if (this.state.generation_options.target_token_count) {
      finalPrompt = this.trimToTokenCount(finalPrompt, this.state.generation_options.target_token_count)
    }

    this.emit({
      type: 'prompt_generated',
      prompt: finalPrompt,
      negative_prompt: finalNegativePrompt,
    })

    return {
      prompt: finalPrompt,
      negative_prompt: finalNegativePrompt,
    }
  }

  // Validation and analysis
  public validatePrompt(): PromptValidationResult {
    const result = this.analyzer.analyzePrompt(
      this.state.components,
      this.state.negative_components,
      this.state.active_modifiers
    )

    if (this.state.validation_enabled) {
      this.emit({ type: 'validation_completed', result })
    }

    return result
  }

  // Utility methods
  public getState(): PromptBuilderState {
    return { ...this.state }
  }

  public setState(newState: Partial<PromptBuilderState>): void {
    this.state = { ...this.state, ...newState }
  }

  public reset(): void {
    this.state = {
      components: [],
      negative_components: [],
      active_modifiers: [],
      generation_options: this.config.default_generation_options,
      validation_enabled: this.config.auto_validation,
      auto_optimize: true,
    }
  }

  public clone(): PromptBuilderEngine {
    const cloned = new PromptBuilderEngine(this.config)
    cloned.state = JSON.parse(JSON.stringify(this.state))
    return cloned
  }

  // Private helper methods
  private generateId(): string {
    return `prompt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  private sortComponentsByPriority(components: PromptComponent[]): PromptComponent[] {
    const priorityOrder = ['subject', 'style', 'medium', 'lighting', 'camera', 'mood', 'color', 'composition', 'detail', 'custom']

    return components.sort((a, b) => {
      const aPriority = priorityOrder.indexOf(a.type)
      const bPriority = priorityOrder.indexOf(b.type)
      return (aPriority === -1 ? 999 : aPriority) - (bPriority === -1 ? 999 : bPriority)
    })
  }

  private formatComponent(component: PromptComponent): string {
    let formatted = component.content

    // Apply emphasis based on weight
    if (component.weight && component.weight !== 1.0) {
      if (component.weight > 1.0) {
        const emphasis = Math.min(Math.floor((component.weight - 1.0) * 10), 5)
        formatted = `(${'('.repeat(emphasis)}${formatted}${')'.repeat(emphasis)})`
      } else if (component.weight < 1.0) {
        const reduction = Math.min(Math.floor((1.0 - component.weight) * 10), 5)
        formatted = `[${'['.repeat(reduction)}${formatted}${']'.repeat(reduction)}]`
      }
    }

    return formatted
  }

  private optimizeForStableDiffusion(prompt: string): string {
    // Remove redundant commas and spaces
    let optimized = prompt.replace(/,\s*,/g, ',').replace(/\s+/g, ' ').trim()

    // Ensure proper comma separation
    optimized = optimized.replace(/,\s*/g, ', ')

    // Remove trailing comma
    optimized = optimized.replace(/,\s*$/, '')

    return optimized
  }

  private applyEmphasis(prompt: string): string {
    // This would apply emphasis syntax based on the creativity level
    // For now, just return the prompt as-is
    return prompt
  }

  private trimToTokenCount(prompt: string, targetTokens: number): string {
    // Rough estimation: 1 token ≈ 4 characters
    const targetLength = targetTokens * 4

    if (prompt.length <= targetLength) {
      return prompt
    }

    // Split by commas and gradually remove less important parts
    const parts = prompt.split(', ')
    let result = prompt

    for (let i = parts.length - 1; i >= 0 && result.length > targetLength; i--) {
      const withoutPart = parts.slice(0, i).join(', ')
      if (withoutPart.length <= targetLength) {
        result = withoutPart
        break
      }
    }

    return result
  }

  private optimizePrompt(): void {
    // Automatic optimization based on current settings
    if (this.state.validation_enabled) {
      const validation = this.validatePrompt()
      // Apply automatic fixes for common issues
    }
  }
}
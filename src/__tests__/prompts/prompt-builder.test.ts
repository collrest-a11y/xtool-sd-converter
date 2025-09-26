import { PromptBuilderEngine } from '../../lib/prompts/prompt-builder'
import type { PromptComponent, StyleModifier, PromptTemplate } from '../../lib/prompts/types'

describe('PromptBuilderEngine', () => {
  let engine: PromptBuilderEngine

  beforeEach(() => {
    engine = new PromptBuilderEngine()
  })

  afterEach(() => {
    // Clean up any event listeners
    engine.reset()
  })

  describe('Component Management', () => {
    it('should add components correctly', () => {
      const component = engine.addComponent({
        type: 'subject',
        content: 'beautiful woman',
        weight: 1.2,
        enabled: true,
      })

      expect(component.id).toBeDefined()
      expect(component.type).toBe('subject')
      expect(component.content).toBe('beautiful woman')
      expect(component.weight).toBe(1.2)
      expect(component.enabled).toBe(true)

      const state = engine.getState()
      expect(state.components).toHaveLength(1)
      expect(state.components[0]).toBe(component)
    })

    it('should add negative components to separate array', () => {
      const negativeComponent = engine.addComponent({
        type: 'negative',
        content: 'low quality, blurry',
        weight: 1.0,
        enabled: true,
      })

      const state = engine.getState()
      expect(state.components).toHaveLength(0)
      expect(state.negative_components).toHaveLength(1)
      expect(state.negative_components[0]).toBe(negativeComponent)
    })

    it('should remove components correctly', () => {
      const component = engine.addComponent({
        type: 'subject',
        content: 'test',
        weight: 1.0,
        enabled: true,
      })

      expect(engine.getState().components).toHaveLength(1)

      const removed = engine.removeComponent(component.id)
      expect(removed).toBe(true)
      expect(engine.getState().components).toHaveLength(0)
    })

    it('should return false when removing non-existent component', () => {
      const removed = engine.removeComponent('non-existent-id')
      expect(removed).toBe(false)
    })

    it('should update components correctly', () => {
      const component = engine.addComponent({
        type: 'subject',
        content: 'original content',
        weight: 1.0,
        enabled: true,
      })

      const updated = { ...component, content: 'updated content', weight: 1.5 }
      const success = engine.updateComponent(updated)

      expect(success).toBe(true)
      const state = engine.getState()
      expect(state.components[0].content).toBe('updated content')
      expect(state.components[0].weight).toBe(1.5)
    })

    it('should move components correctly', () => {
      const component1 = engine.addComponent({ type: 'subject', content: 'first', weight: 1.0, enabled: true })
      const component2 = engine.addComponent({ type: 'style', content: 'second', weight: 1.0, enabled: true })
      const component3 = engine.addComponent({ type: 'lighting', content: 'third', weight: 1.0, enabled: true })

      const moved = engine.moveComponent(component1.id, 2)
      expect(moved).toBe(true)

      const state = engine.getState()
      expect(state.components[0].content).toBe('second')
      expect(state.components[1].content).toBe('third')
      expect(state.components[2].content).toBe('first')
    })

    it('should enforce maximum component limit', () => {
      const config = { max_components: 2 }
      const limitedEngine = new PromptBuilderEngine(config)

      // Add two components successfully
      limitedEngine.addComponent({ type: 'subject', content: '1', weight: 1.0, enabled: true })
      limitedEngine.addComponent({ type: 'style', content: '2', weight: 1.0, enabled: true })

      // Third component should throw error
      expect(() => {
        limitedEngine.addComponent({ type: 'lighting', content: '3', weight: 1.0, enabled: true })
      }).toThrow('Maximum number of components (2) reached')
    })
  })

  describe('Style Modifier Management', () => {
    const testModifier: StyleModifier = {
      id: 'test-modifier',
      name: 'Test Modifier',
      category: 'quality',
      prompt_addition: 'high quality, detailed',
      negative_prompt_addition: 'low quality',
      strength: 0.8,
    }

    it('should apply modifiers correctly', () => {
      engine.applyModifier(testModifier)

      const state = engine.getState()
      expect(state.active_modifiers).toHaveLength(1)
      expect(state.active_modifiers[0]).toBe(testModifier)
    })

    it('should not duplicate modifiers', () => {
      engine.applyModifier(testModifier)
      engine.applyModifier(testModifier) // Apply again

      const state = engine.getState()
      expect(state.active_modifiers).toHaveLength(1)
    })

    it('should remove modifiers correctly', () => {
      engine.applyModifier(testModifier)
      expect(engine.getState().active_modifiers).toHaveLength(1)

      const removed = engine.removeModifier(testModifier.id)
      expect(removed).toBe(true)
      expect(engine.getState().active_modifiers).toHaveLength(0)
    })

    it('should return false when removing non-existent modifier', () => {
      const removed = engine.removeModifier('non-existent-id')
      expect(removed).toBe(false)
    })
  })

  describe('Template Management', () => {
    const testTemplate: PromptTemplate = {
      id: 'test-template',
      name: 'Test Template',
      description: 'A test template',
      category: 'art_styles',
      tags: ['test', 'art'],
      components: [
        { id: 'comp1', type: 'subject', content: 'portrait', weight: 1.2, enabled: true },
        { id: 'comp2', type: 'style', content: 'oil painting', weight: 1.0, enabled: true },
        { id: 'comp3', type: 'negative', content: 'low quality', weight: 1.0, enabled: true },
      ],
      created_at: new Date(),
      updated_at: new Date(),
      public: true,
    }

    it('should load templates correctly', () => {
      engine.loadTemplate(testTemplate)

      const state = engine.getState()
      expect(state.components).toHaveLength(2) // Two positive components
      expect(state.negative_components).toHaveLength(1) // One negative component
      expect(state.current_template).toBe(testTemplate)
    })

    it('should clear existing components when loading template', () => {
      // Add some components first
      engine.addComponent({ type: 'subject', content: 'existing', weight: 1.0, enabled: true })
      expect(engine.getState().components).toHaveLength(1)

      // Load template should clear existing
      engine.loadTemplate(testTemplate)
      const state = engine.getState()
      expect(state.components).toHaveLength(2)
      expect(state.components[0].content).toBe('portrait')
      expect(state.components[1].content).toBe('oil painting')
    })

    it('should save current state as template', () => {
      engine.addComponent({ type: 'subject', content: 'test subject', weight: 1.0, enabled: true })
      engine.addComponent({ type: 'style', content: 'test style', weight: 1.0, enabled: true })

      const savedTemplate = engine.saveAsTemplate(
        'Saved Template',
        'Template from current state',
        'custom',
        ['saved', 'test']
      )

      expect(savedTemplate.id).toBeDefined()
      expect(savedTemplate.name).toBe('Saved Template')
      expect(savedTemplate.description).toBe('Template from current state')
      expect(savedTemplate.category).toBe('custom')
      expect(savedTemplate.tags).toEqual(['saved', 'test'])
      expect(savedTemplate.components).toHaveLength(2)
      expect(savedTemplate.public).toBe(false)
      expect(savedTemplate.created_at).toBeInstanceOf(Date)
      expect(savedTemplate.updated_at).toBeInstanceOf(Date)
    })
  })

  describe('Prompt Generation', () => {
    beforeEach(() => {
      engine.addComponent({ type: 'subject', content: 'beautiful woman', weight: 1.2, enabled: true })
      engine.addComponent({ type: 'style', content: 'oil painting', weight: 1.0, enabled: true })
      engine.addComponent({ type: 'lighting', content: 'soft lighting', weight: 0.8, enabled: true })
      engine.addComponent({ type: 'negative', content: 'low quality, blurry', weight: 1.0, enabled: true })
    })

    it('should generate basic prompt correctly', () => {
      const result = engine.generatePrompt()

      expect(result.prompt).toContain('beautiful woman')
      expect(result.prompt).toContain('oil painting')
      expect(result.prompt).toContain('soft lighting')
      expect(result.negative_prompt).toContain('low quality, blurry')
    })

    it('should respect component order in prompt', () => {
      const result = engine.generatePrompt()
      const promptParts = result.prompt.split(', ')

      // Should be ordered by priority: subject, style, lighting
      expect(promptParts[0]).toContain('beautiful woman')
      expect(promptParts[1]).toContain('oil painting')
      expect(promptParts[2]).toContain('soft lighting')
    })

    it('should exclude disabled components', () => {
      const state = engine.getState()
      const disabledComponent = { ...state.components[0], enabled: false }
      engine.updateComponent(disabledComponent)

      const result = engine.generatePrompt()
      expect(result.prompt).not.toContain('beautiful woman')
      expect(result.prompt).toContain('oil painting')
    })

    it('should apply weight-based emphasis', () => {
      const result = engine.generatePrompt()

      // Component with weight 1.2 should have emphasis
      expect(result.prompt).toMatch(/\(.*beautiful woman.*\)/)

      // Component with weight 0.8 should have de-emphasis
      expect(result.prompt).toMatch(/\[.*soft lighting.*\]/)
    })

    it('should include style modifiers in prompt', () => {
      const modifier: StyleModifier = {
        id: 'quality-mod',
        name: 'Quality',
        category: 'quality',
        prompt_addition: 'masterpiece, high quality',
        negative_prompt_addition: 'worst quality',
      }

      engine.applyModifier(modifier)
      const result = engine.generatePrompt()

      expect(result.prompt).toContain('masterpiece, high quality')
      expect(result.negative_prompt).toContain('worst quality')
    })

    it('should optimize prompt for stable diffusion', () => {
      engine.setState({
        ...engine.getState(),
        generation_options: {
          ...engine.getState().generation_options,
          optimize_for_sd: true,
        }
      })

      const result = engine.generatePrompt()

      // Should not have double commas or trailing commas
      expect(result.prompt).not.toMatch(/,,/)
      expect(result.prompt).not.toMatch(/,$/)
      expect(result.negative_prompt).not.toMatch(/,,/)
      expect(result.negative_prompt).not.toMatch(/,$/)
    })
  })

  describe('Validation', () => {
    beforeEach(() => {
      engine.addComponent({ type: 'subject', content: 'test subject', weight: 1.0, enabled: true })
    })

    it('should validate basic prompt structure', () => {
      const validation = engine.validatePrompt()

      expect(validation.is_valid).toBe(true)
      expect(validation.score).toBeGreaterThan(0)
      expect(validation.warnings).toBeDefined()
      expect(validation.suggestions).toBeDefined()
      expect(validation.analysis).toBeDefined()
    })

    it('should detect when prompt is too long', () => {
      // Add a subject first (required for validation)
      engine.addComponent({ type: 'subject', content: 'test subject', weight: 1.0, enabled: true })

      // Create a very long prompt
      const longContent = 'a'.repeat(2000)
      engine.addComponent({ type: 'detail', content: longContent, weight: 1.0, enabled: true })

      const validation = engine.validatePrompt()
      const lengthWarning = validation.warnings.find(w => w.type === 'length')
      expect(lengthWarning).toBeDefined()
      expect(lengthWarning?.severity).toBe('high')
    })

    it('should provide analysis metrics', () => {
      const validation = engine.validatePrompt()

      expect(validation.analysis.complexity_score).toBeGreaterThanOrEqual(0)
      expect(validation.analysis.coherence_score).toBeGreaterThanOrEqual(0)
      expect(validation.analysis.specificity_score).toBeGreaterThanOrEqual(0)
      expect(validation.analysis.creativity_score).toBeGreaterThanOrEqual(0)
      expect(validation.analysis.technical_score).toBeGreaterThanOrEqual(0)
      expect(validation.analysis.estimated_tokens).toBeGreaterThan(0)
      expect(validation.analysis.dominant_categories).toBeInstanceOf(Array)
      expect(validation.analysis.missing_components).toBeInstanceOf(Array)
    })
  })

  describe('Event System', () => {
    it('should emit events when components are added', (done) => {
      engine.on('component_added', (event) => {
        expect(event.type).toBe('component_added')
        expect(event.component).toBeDefined()
        expect(event.component.content).toBe('test content')
        done()
      })

      engine.addComponent({
        type: 'subject',
        content: 'test content',
        weight: 1.0,
        enabled: true,
      })
    })

    it('should emit events when components are removed', (done) => {
      const component = engine.addComponent({
        type: 'subject',
        content: 'test content',
        weight: 1.0,
        enabled: true,
      })

      engine.on('component_removed', (event) => {
        expect(event.type).toBe('component_removed')
        expect(event.component_id).toBe(component.id)
        done()
      })

      engine.removeComponent(component.id)
    })

    it('should emit events when modifiers are applied', (done) => {
      const modifier: StyleModifier = {
        id: 'test-mod',
        name: 'Test',
        category: 'quality',
        prompt_addition: 'test',
      }

      engine.on('modifier_applied', (event) => {
        expect(event.type).toBe('modifier_applied')
        expect(event.modifier).toBe(modifier)
        done()
      })

      engine.applyModifier(modifier)
    })

    it('should remove event listeners correctly', () => {
      let callCount = 0
      const listener = () => { callCount++ }

      engine.on('component_added', listener)
      engine.addComponent({ type: 'subject', content: 'test', weight: 1.0, enabled: true })
      expect(callCount).toBe(1)

      engine.off('component_added', listener)
      engine.addComponent({ type: 'style', content: 'test', weight: 1.0, enabled: true })
      expect(callCount).toBe(1) // Should not increment
    })
  })

  describe('State Management', () => {
    it('should get current state correctly', () => {
      engine.addComponent({ type: 'subject', content: 'test', weight: 1.0, enabled: true })

      const state = engine.getState()
      expect(state.components).toHaveLength(1)
      expect(state.negative_components).toHaveLength(0)
      expect(state.active_modifiers).toHaveLength(0)
      expect(state.generation_options).toBeDefined()
      expect(state.validation_enabled).toBe(true)
      expect(state.auto_optimize).toBe(true)
    })

    it('should set state correctly', () => {
      const newState = {
        ...engine.getState(),
        validation_enabled: false,
        auto_optimize: false,
      }

      engine.setState(newState)
      const updatedState = engine.getState()
      expect(updatedState.validation_enabled).toBe(false)
      expect(updatedState.auto_optimize).toBe(false)
    })

    it('should reset state correctly', () => {
      engine.addComponent({ type: 'subject', content: 'test', weight: 1.0, enabled: true })
      engine.applyModifier({
        id: 'test-mod',
        name: 'Test',
        category: 'quality',
        prompt_addition: 'test',
      })

      expect(engine.getState().components).toHaveLength(1)
      expect(engine.getState().active_modifiers).toHaveLength(1)

      engine.reset()

      const resetState = engine.getState()
      expect(resetState.components).toHaveLength(0)
      expect(resetState.negative_components).toHaveLength(0)
      expect(resetState.active_modifiers).toHaveLength(0)
    })

    it('should clone engine correctly', () => {
      engine.addComponent({ type: 'subject', content: 'original', weight: 1.0, enabled: true })

      const cloned = engine.clone()
      expect(cloned.getState().components).toHaveLength(1)
      expect(cloned.getState().components[0].content).toBe('original')

      // Modify clone should not affect original
      cloned.addComponent({ type: 'style', content: 'cloned only', weight: 1.0, enabled: true })
      expect(cloned.getState().components).toHaveLength(2)
      expect(engine.getState().components).toHaveLength(1)
    })
  })

  describe('Configuration', () => {
    it('should use custom configuration', () => {
      const customConfig = {
        max_components: 5,
        auto_validation: false,
        max_history_items: 50,
      }

      const customEngine = new PromptBuilderEngine(customConfig)
      const state = customEngine.getState()

      expect(state.validation_enabled).toBe(false)

      // Test max components limit
      for (let i = 0; i < 5; i++) {
        customEngine.addComponent({
          type: 'detail',
          content: `component ${i}`,
          weight: 1.0,
          enabled: true,
        })
      }

      expect(() => {
        customEngine.addComponent({
          type: 'detail',
          content: 'should fail',
          weight: 1.0,
          enabled: true,
        })
      }).toThrow('Maximum number of components (5) reached')
    })

    it('should merge configuration with defaults', () => {
      const partialConfig = { max_components: 10 }
      const engine = new PromptBuilderEngine(partialConfig)

      // Should use custom max_components
      for (let i = 0; i < 10; i++) {
        engine.addComponent({
          type: 'detail',
          content: `component ${i}`,
          weight: 1.0,
          enabled: true,
        })
      }

      expect(() => {
        engine.addComponent({
          type: 'detail',
          content: 'should fail',
          weight: 1.0,
          enabled: true,
        })
      }).toThrow('Maximum number of components (10) reached')

      // Should still use default auto_validation
      expect(engine.getState().validation_enabled).toBe(true)
    })
  })
})
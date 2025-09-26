import { PromptAnalyzer } from '../../lib/prompts/analyzer'
import type { PromptComponent, StyleModifier } from '../../lib/prompts/types'

describe('PromptAnalyzer', () => {
  let analyzer: PromptAnalyzer

  beforeEach(() => {
    analyzer = new PromptAnalyzer()
  })

  const createComponent = (
    type: PromptComponent['type'],
    content: string,
    weight: number = 1.0,
    enabled: boolean = true
  ): PromptComponent => ({
    id: `test-${Math.random()}`,
    type,
    content,
    weight,
    enabled,
  })

  const createModifier = (
    id: string,
    promptAddition: string,
    negativeAddition?: string
  ): StyleModifier => ({
    id,
    name: id,
    category: 'quality',
    prompt_addition: promptAddition,
    negative_prompt_addition: negativeAddition,
  })

  describe('Basic Analysis', () => {
    it('should analyze empty prompt correctly', () => {
      const result = analyzer.analyzePrompt([], [])

      expect(result.is_valid).toBe(false) // No subject component
      expect(result.score).toBeGreaterThanOrEqual(0)
      expect(result.warnings).toBeDefined()
      expect(result.suggestions).toBeDefined()
      expect(result.analysis).toBeDefined()
    })

    it('should analyze simple prompt correctly', () => {
      const components = [
        createComponent('subject', 'beautiful woman'),
        createComponent('style', 'oil painting'),
      ]

      const result = analyzer.analyzePrompt(components, [])

      expect(result.is_valid).toBe(true)
      expect(result.score).toBeGreaterThan(50)
      expect(result.analysis.estimated_tokens).toBeGreaterThan(0)
      expect(result.analysis.dominant_categories).toContain('subject')
      expect(result.analysis.dominant_categories).toContain('style')
    })

    it('should handle disabled components correctly', () => {
      const components = [
        createComponent('subject', 'test subject', 1.0, true),
        createComponent('style', 'disabled style', 1.0, false),
      ]

      const result = analyzer.analyzePrompt(components, [])

      // Should not include disabled component in analysis
      expect(result.analysis.estimated_tokens).toBeLessThan(20) // Only subject should count
    })
  })

  describe('Length and Token Analysis', () => {
    it('should detect overly long prompts', () => {
      const longContent = 'a'.repeat(1000) // Very long content
      const components = [createComponent('detail', longContent)]

      const result = analyzer.analyzePrompt(components, [])

      const lengthWarning = result.warnings.find(w => w.type === 'length')
      expect(lengthWarning).toBeDefined()
      expect(lengthWarning?.severity).toBe('high')
    })

    it('should suggest more details for short prompts', () => {
      const components = [createComponent('subject', 'cat')]

      const result = analyzer.analyzePrompt(components, [])

      const enhancementSuggestion = result.suggestions.find(s => s.type === 'enhancement')
      expect(enhancementSuggestion).toBeDefined()
    })

    it('should estimate token count reasonably', () => {
      const components = [
        createComponent('subject', 'beautiful woman'),
        createComponent('style', 'oil painting'),
        createComponent('lighting', 'soft lighting'),
      ]

      const result = analyzer.analyzePrompt(components, [])

      // Should be roughly 6-12 tokens for these components
      expect(result.analysis.estimated_tokens).toBeGreaterThan(5)
      expect(result.analysis.estimated_tokens).toBeLessThan(20)
    })
  })

  describe('Contradiction Detection', () => {
    it('should detect contradictory terms', () => {
      const components = [
        createComponent('style', 'realistic photography'),
        createComponent('style', 'cartoon illustration'),
      ]

      const result = analyzer.analyzePrompt(components, [])

      const contradictionWarning = result.warnings.find(w => w.type === 'contradiction')
      expect(contradictionWarning).toBeDefined()
      expect(contradictionWarning?.message).toContain('realistic')
      expect(contradictionWarning?.message).toContain('cartoon')
    })

    it('should detect lighting contradictions', () => {
      const components = [
        createComponent('lighting', 'dark moody lighting'),
        createComponent('lighting', 'bright sunny day'),
      ]

      const result = analyzer.analyzePrompt(components, [])

      const contradictionWarning = result.warnings.find(w => w.type === 'contradiction')
      expect(contradictionWarning).toBeDefined()
    })

    it('should suggest resolving contradictions', () => {
      const components = [
        createComponent('style', 'simple design'),
        createComponent('detail', 'complex detailed artwork'),
      ]

      const result = analyzer.analyzePrompt(components, [])

      const contradictionSuggestion = result.suggestions.find(s => s.type === 'removal')
      expect(contradictionSuggestion).toBeDefined()
      expect(contradictionSuggestion?.action).toBe('resolve_contradiction')
    })
  })

  describe('Duplicate Detection', () => {
    it('should detect duplicate content', () => {
      const components = [
        createComponent('subject', 'beautiful woman'),
        createComponent('detail', 'beautiful woman'), // Duplicate
      ]

      const result = analyzer.analyzePrompt(components, [])

      const duplicateWarning = result.warnings.find(w => w.type === 'duplicate')
      expect(duplicateWarning).toBeDefined()
      expect(duplicateWarning?.message).toContain('beautiful woman')
    })

    it('should be case-insensitive for duplicates', () => {
      const components = [
        createComponent('subject', 'Beautiful Woman'),
        createComponent('detail', 'beautiful woman'),
      ]

      const result = analyzer.analyzePrompt(components, [])

      const duplicateWarning = result.warnings.find(w => w.type === 'duplicate')
      expect(duplicateWarning).toBeDefined()
    })

    it('should suggest removing duplicates', () => {
      const components = [
        createComponent('subject', 'test'),
        createComponent('detail', 'test'),
      ]

      const result = analyzer.analyzePrompt(components, [])

      const removeDuplicateSuggestion = result.suggestions.find(s => s.action === 'remove_duplicates')
      expect(removeDuplicateSuggestion).toBeDefined()
    })
  })

  describe('Quality Analysis', () => {
    it('should detect missing quality enhancers', () => {
      const components = [
        createComponent('subject', 'portrait'),
        createComponent('style', 'painting'),
      ]

      const result = analyzer.analyzePrompt(components, [])

      const qualitySuggestion = result.suggestions.find(s => s.action === 'add_quality_terms')
      expect(qualitySuggestion).toBeDefined()
      expect(qualitySuggestion?.suggested_content).toContain('quality')
    })

    it('should recognize existing quality enhancers', () => {
      const components = [
        createComponent('subject', 'portrait'),
        createComponent('detail', 'high quality, masterpiece, detailed'),
      ]

      const result = analyzer.analyzePrompt(components, [])

      const qualitySuggestion = result.suggestions.find(s => s.action === 'add_quality_terms')
      expect(qualitySuggestion).toBeUndefined()
    })

    it('should detect overly generic terms', () => {
      const components = [
        createComponent('subject', 'image of a picture showing art drawing photo'),
      ]

      const result = analyzer.analyzePrompt(components, [])

      const genericSuggestion = result.suggestions.find(s => s.action === 'be_more_specific')
      expect(genericSuggestion).toBeDefined()
    })
  })

  describe('Structure Analysis', () => {
    it('should warn about missing subject', () => {
      const components = [
        createComponent('style', 'oil painting'),
        createComponent('lighting', 'soft light'),
      ]

      const result = analyzer.analyzePrompt(components, [])

      const subjectWarning = result.warnings.find(w => w.message.includes('subject'))
      expect(subjectWarning).toBeDefined()
      expect(subjectWarning?.severity).toBe('medium')
    })

    it('should suggest adding subject component', () => {
      const components = [
        createComponent('style', 'abstract art'),
      ]

      const result = analyzer.analyzePrompt(components, [])

      const subjectSuggestion = result.suggestions.find(s => s.action === 'add_subject')
      expect(subjectSuggestion).toBeDefined()
      expect(subjectSuggestion?.suggested_content).toBeTruthy()
    })

    it('should warn about too many detail components', () => {
      const components = []
      // Add 6 detail components
      for (let i = 0; i < 6; i++) {
        components.push(createComponent('detail', `detail ${i}`))
      }

      const result = analyzer.analyzePrompt(components, [])

      const detailWarning = result.warnings.find(w => w.message.includes('Too many detail'))
      expect(detailWarning).toBeDefined()
    })
  })

  describe('Content Analysis', () => {
    it('should detect style mixing issues', () => {
      const components = [
        createComponent('camera', '85mm lens, bokeh'),
        createComponent('medium', 'oil painting, canvas'),
      ]

      const result = analyzer.analyzePrompt(components, [])

      const mixingWarning = result.warnings.find(w =>
        w.message.includes('photography') && w.message.includes('painting')
      )
      expect(mixingWarning).toBeDefined()
      expect(mixingWarning?.severity).toBe('medium')
    })

    it('should handle pure photography terms correctly', () => {
      const components = [
        createComponent('camera', '85mm lens'),
        createComponent('lighting', 'natural light'),
        createComponent('detail', 'shallow depth of field'),
      ]

      const result = analyzer.analyzePrompt(components, [])

      // Should not warn about style mixing for pure photography
      const mixingWarning = result.warnings.find(w =>
        w.message.includes('photography') && w.message.includes('painting')
      )
      expect(mixingWarning).toBeUndefined()
    })
  })

  describe('Score Calculation', () => {
    it('should penalize high-severity warnings more', () => {
      const componentsWithHighWarning = [
        createComponent('detail', 'a'.repeat(2000)), // Very long, should cause high warning
      ]

      const componentsWithLowWarning = [
        createComponent('subject', 'test'),
        createComponent('subject', 'test'), // Duplicate, should cause low warning
      ]

      const highWarningResult = analyzer.analyzePrompt(componentsWithHighWarning, [])
      const lowWarningResult = analyzer.analyzePrompt(componentsWithLowWarning, [])

      expect(highWarningResult.score).toBeLessThan(lowWarningResult.score)
    })

    it('should give bonus for good structure', () => {
      const wellStructuredComponents = [
        createComponent('subject', 'portrait of a woman'),
        createComponent('style', 'oil painting'),
        createComponent('lighting', 'soft lighting'),
        createComponent('mood', 'serene'),
      ]

      const poorlyStructuredComponents = [
        createComponent('detail', 'random detail'),
      ]

      const wellStructuredResult = analyzer.analyzePrompt(wellStructuredComponents, [])
      const poorlyStructuredResult = analyzer.analyzePrompt(poorlyStructuredComponents, [])

      expect(wellStructuredResult.score).toBeGreaterThan(poorlyStructuredResult.score)
    })

    it('should never return negative scores', () => {
      // Create a prompt with many issues
      const problematicComponents = [
        createComponent('detail', 'a'.repeat(3000)), // Too long
        createComponent('style', 'realistic'),
        createComponent('style', 'cartoon'), // Contradiction
        createComponent('subject', 'test'),
        createComponent('subject', 'test'), // Duplicate
      ]

      const result = analyzer.analyzePrompt(problematicComponents, [])

      expect(result.score).toBeGreaterThanOrEqual(0)
      expect(result.score).toBeLessThanOrEqual(100)
    })
  })

  describe('Analysis Metrics', () => {
    it('should calculate complexity score based on component count', () => {
      const simpleComponents = [
        createComponent('subject', 'cat'),
      ]

      const complexComponents = []
      for (let i = 0; i < 8; i++) {
        complexComponents.push(createComponent('detail', `detail ${i}`))
      }

      const simpleResult = analyzer.analyzePrompt(simpleComponents, [])
      const complexResult = analyzer.analyzePrompt(complexComponents, [])

      expect(complexResult.analysis.complexity_score).toBeGreaterThan(
        simpleResult.analysis.complexity_score
      )
    })

    it('should identify dominant categories correctly', () => {
      const components = [
        createComponent('detail', 'detail 1'),
        createComponent('detail', 'detail 2'),
        createComponent('detail', 'detail 3'),
        createComponent('style', 'style 1'),
        createComponent('subject', 'subject 1'),
      ]

      const result = analyzer.analyzePrompt(components, [])

      expect(result.analysis.dominant_categories).toContain('detail')
      expect(result.analysis.dominant_categories[0]).toBe('detail') // Should be first
    })

    it('should identify missing essential components', () => {
      const components = [
        createComponent('detail', 'some detail'),
        createComponent('lighting', 'lighting'),
      ]

      const result = analyzer.analyzePrompt(components, [])

      expect(result.analysis.missing_components).toContain('subject')
      expect(result.analysis.missing_components).toContain('style')
    })

    it('should calculate specificity based on word length', () => {
      const genericComponents = [
        createComponent('subject', 'art'),
        createComponent('style', 'nice'),
      ]

      const specificComponents = [
        createComponent('subject', 'Renaissance portrait painting'),
        createComponent('style', 'chiaroscuro lighting technique'),
      ]

      const genericResult = analyzer.analyzePrompt(genericComponents, [])
      const specificResult = analyzer.analyzePrompt(specificComponents, [])

      expect(specificResult.analysis.specificity_score).toBeGreaterThan(
        genericResult.analysis.specificity_score
      )
    })
  })

  describe('Component Validation', () => {
    it('should validate component syntax', () => {
      const componentWithExcessiveBrackets = createComponent(
        'detail',
        '((((overly emphasized))))'
      )

      const warnings = analyzer.validateComponentSyntax(componentWithExcessiveBrackets)

      const syntaxWarning = warnings.find(w => w.type === 'syntax')
      expect(syntaxWarning).toBeDefined()
      expect(syntaxWarning?.message).toContain('emphasis brackets')
    })

    it('should detect problematic content', () => {
      const problematicComponent = createComponent(
        'subject',
        'nude explicit content'
      )

      const warnings = analyzer.validateComponentSyntax(problematicComponent)

      const contentWarning = warnings.find(w => w.type === 'quality')
      expect(contentWarning).toBeDefined()
      expect(contentWarning?.severity).toBe('high')
    })

    it('should validate clean content without warnings', () => {
      const cleanComponent = createComponent(
        'subject',
        'beautiful landscape photography'
      )

      const warnings = analyzer.validateComponentSyntax(cleanComponent)

      expect(warnings).toHaveLength(0)
    })
  })

  describe('Contextual Suggestions', () => {
    it('should generate contextual suggestions', () => {
      const suggestions = analyzer.suggestContextualPrompts('portrait photography woman')

      expect(suggestions).toBeDefined()
      expect(suggestions.length).toBeGreaterThan(0)

      const subjectSuggestions = suggestions.find(s => s.type === 'subject')
      expect(subjectSuggestions).toBeDefined()
      expect(subjectSuggestions?.suggestions.length).toBeGreaterThan(0)
    })

    it('should provide category-specific suggestions', () => {
      const suggestions = analyzer.suggestContextualPrompts(
        'landscape mountain',
        'photography'
      )

      expect(suggestions).toBeDefined()
      expect(suggestions.length).toBeGreaterThan(0)
    })

    it('should return suggestions with confidence scores', () => {
      const suggestions = analyzer.suggestContextualPrompts('abstract art colorful')

      suggestions.forEach(suggestion => {
        expect(suggestion.confidence).toBeGreaterThanOrEqual(0)
        expect(suggestion.confidence).toBeLessThanOrEqual(1)
        expect(suggestion.context_keywords).toBeDefined()
        expect(suggestion.suggestions).toBeDefined()
        expect(suggestion.suggestions.length).toBeGreaterThan(0)
      })
    })
  })

  describe('Prompt Optimization', () => {
    it('should remove duplicate components', () => {
      const components = [
        createComponent('subject', 'woman'),
        createComponent('subject', 'woman'), // Duplicate
        createComponent('style', 'painting'),
      ]

      const optimized = analyzer.optimizePrompt(components)

      // The optimizer may add quality components, so check that duplicates are removed
      expect(optimized.filter(c => c.content === 'woman')).toHaveLength(1)
      expect(optimized.some(c => c.content === 'painting')).toBe(true)
    })

    it('should reorder components by priority', () => {
      const components = [
        createComponent('detail', 'high quality'),
        createComponent('subject', 'woman'),
        createComponent('style', 'painting'),
      ]

      const optimized = analyzer.optimizePrompt(components)

      expect(optimized[0].type).toBe('subject')
      expect(optimized[1].type).toBe('style')
      expect(optimized[2].type).toBe('detail')
    })

    it('should optimize extreme weights', () => {
      const components = [
        createComponent('subject', 'woman', 3.0), // Too high
        createComponent('style', 'painting', 0.1), // Too low
      ]

      const optimized = analyzer.optimizePrompt(components)

      expect(optimized[0].weight).toBeLessThanOrEqual(1.5)
      expect(optimized[1].weight).toBeGreaterThanOrEqual(0.5)
    })

    it('should add missing essential components', () => {
      const components = [
        createComponent('lighting', 'soft light'),
        createComponent('mood', 'peaceful'),
      ]

      const optimized = analyzer.optimizePrompt(components)

      // Should add a quality component
      const hasQualityComponent = optimized.some(c =>
        c.content.includes('quality') || c.content.includes('detailed')
      )
      expect(hasQualityComponent).toBe(true)

      // Check auto-added metadata
      const autoAddedComponent = optimized.find(c => c.metadata?.auto_added)
      expect(autoAddedComponent).toBeDefined()
    })
  })

  describe('Style Modifiers Integration', () => {
    it('should include style modifiers in analysis', () => {
      const components = [createComponent('subject', 'portrait')]
      const modifiers = [createModifier('quality', 'high quality, masterpiece')]

      const result = analyzer.analyzePrompt(components, [], modifiers)

      expect(result.analysis.estimated_tokens).toBeGreaterThan(5) // Should include modifier tokens
    })

    it('should handle negative modifiers', () => {
      const components = [createComponent('subject', 'portrait')]
      const negativeComponents = [createComponent('negative', 'blurry')]
      const modifiers = [createModifier('quality', 'high quality', 'low quality')]

      const result = analyzer.analyzePrompt(components, negativeComponents, modifiers)

      // Should analyze both positive and negative additions from modifiers
      expect(result.analysis.estimated_tokens).toBeGreaterThan(3)
    })
  })
})
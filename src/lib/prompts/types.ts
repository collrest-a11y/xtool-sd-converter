// Core prompt system types and interfaces

export interface PromptComponent {
  id: string
  type: PromptComponentType
  content: string
  weight?: number
  enabled: boolean
  metadata?: Record<string, any>
}

export type PromptComponentType =
  | 'subject'
  | 'style'
  | 'medium'
  | 'lighting'
  | 'camera'
  | 'mood'
  | 'color'
  | 'composition'
  | 'detail'
  | 'negative'
  | 'custom'

export interface PromptTemplate {
  id: string
  name: string
  description: string
  category: PromptCategory
  tags: string[]
  components: PromptComponent[]
  thumbnail?: string
  rating?: number
  usage_count?: number
  created_at: Date
  updated_at: Date
  author?: string
  public: boolean
}

export type PromptCategory =
  | 'art_styles'
  | 'photography'
  | 'illustrations'
  | 'portraits'
  | 'landscapes'
  | 'abstract'
  | 'anime_manga'
  | 'realistic'
  | 'fantasy'
  | 'sci_fi'
  | 'historical'
  | 'minimalist'
  | 'experimental'
  | 'custom'

export interface StyleModifier {
  id: string
  name: string
  category: StyleCategory
  prompt_addition: string
  negative_prompt_addition?: string
  strength?: number
  compatible_with?: PromptCategory[]
  examples?: string[]
}

export type StyleCategory =
  | 'art_movement'
  | 'medium_type'
  | 'camera_settings'
  | 'lighting_type'
  | 'mood_tone'
  | 'color_palette'
  | 'texture'
  | 'perspective'
  | 'quality'

export interface PromptBuilder {
  components: PromptComponent[]
  negative_components: PromptComponent[]
  style_modifiers: StyleModifier[]
  final_prompt: string
  final_negative_prompt: string
  validation_results?: PromptValidationResult
}

export interface PromptValidationResult {
  is_valid: boolean
  warnings: PromptWarning[]
  suggestions: PromptSuggestion[]
  score: number
  analysis: PromptAnalysis
}

export interface PromptWarning {
  type: 'length' | 'contradiction' | 'duplicate' | 'syntax' | 'quality'
  message: string
  severity: 'low' | 'medium' | 'high'
  component_id?: string
}

export interface PromptSuggestion {
  type: 'enhancement' | 'replacement' | 'addition' | 'removal' | 'optimization'
  message: string
  action?: string
  component_id?: string
  suggested_content?: string
}

export interface PromptAnalysis {
  complexity_score: number
  coherence_score: number
  specificity_score: number
  creativity_score: number
  technical_score: number
  estimated_tokens: number
  dominant_categories: PromptComponentType[]
  missing_components: PromptComponentType[]
}

export interface PromptHistory {
  id: string
  prompt: string
  negative_prompt?: string
  components: PromptComponent[]
  style_modifiers: StyleModifier[]
  generated_images?: string[]
  rating?: number
  favorited: boolean
  created_at: Date
  generation_params?: Record<string, any>
  notes?: string
}

export interface PromptCollection {
  id: string
  name: string
  description: string
  templates: PromptTemplate[]
  shared: boolean
  created_at: Date
  updated_at: Date
  author?: string
  tags: string[]
}

export interface PromptSearchFilter {
  category?: PromptCategory[]
  tags?: string[]
  rating_min?: number
  public_only?: boolean
  author?: string
  search_text?: string
  sort_by?: 'rating' | 'usage' | 'recent' | 'name'
  sort_order?: 'asc' | 'desc'
}

export interface PromptGenerationOptions {
  include_negative: boolean
  apply_emphasis: boolean
  optimize_for_sd: boolean
  target_token_count?: number
  creativity_level: 'conservative' | 'balanced' | 'creative' | 'experimental'
  quality_focus: 'speed' | 'balanced' | 'quality'
}

export interface DragDropItem {
  id: string
  type: string
  component?: PromptComponent
  template?: PromptTemplate
  modifier?: StyleModifier
}

export interface PromptBuilderState {
  components: PromptComponent[]
  negative_components: PromptComponent[]
  active_modifiers: StyleModifier[]
  current_template?: PromptTemplate
  generation_options: PromptGenerationOptions
  validation_enabled: boolean
  auto_optimize: boolean
}

export interface PromptContextSuggestion {
  type: 'subject' | 'style' | 'mood' | 'technical'
  suggestions: string[]
  confidence: number
  context_keywords: string[]
}

export interface PromptExportFormat {
  format: 'json' | 'text' | 'csv' | 'yaml'
  include_metadata: boolean
  include_history: boolean
  include_templates: boolean
}

export interface PromptImportResult {
  successful_count: number
  failed_count: number
  warnings: string[]
  imported_templates: PromptTemplate[]
  imported_history: PromptHistory[]
}

// Events for the prompt system
export type PromptEvent =
  | { type: 'component_added'; component: PromptComponent }
  | { type: 'component_removed'; component_id: string }
  | { type: 'component_updated'; component: PromptComponent }
  | { type: 'modifier_applied'; modifier: StyleModifier }
  | { type: 'modifier_removed'; modifier_id: string }
  | { type: 'template_loaded'; template: PromptTemplate }
  | { type: 'prompt_generated'; prompt: string; negative_prompt?: string }
  | { type: 'validation_completed'; result: PromptValidationResult }

// Configuration for the prompt system
export interface PromptSystemConfig {
  max_prompt_length: number
  max_components: number
  auto_validation: boolean
  suggestion_threshold: number
  enable_history: boolean
  max_history_items: number
  enable_analytics: boolean
  default_generation_options: PromptGenerationOptions
}
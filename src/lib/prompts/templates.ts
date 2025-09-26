import type {
  PromptTemplate,
  PromptComponent,
  PromptCategory,
  StyleModifier,
  StyleCategory,
} from './types'

// Comprehensive style modifiers library
export const STYLE_MODIFIERS: StyleModifier[] = [
  // Art Movements
  {
    id: 'impressionist',
    name: 'Impressionist',
    category: 'art_movement',
    prompt_addition: 'impressionist painting, loose brushstrokes, light and color focus',
    strength: 0.8,
    compatible_with: ['art_styles', 'portraits', 'landscapes'],
    examples: ['Monet style', 'Renoir style', 'soft lighting'],
  },
  {
    id: 'expressionist',
    name: 'Expressionist',
    category: 'art_movement',
    prompt_addition: 'expressionist art, bold colors, emotional intensity, distorted forms',
    strength: 0.9,
    compatible_with: ['art_styles', 'portraits', 'abstract'],
    examples: ['Van Gogh style', 'Munch style', 'bold brushwork'],
  },
  {
    id: 'surrealist',
    name: 'Surrealist',
    category: 'art_movement',
    prompt_addition: 'surrealist, dreamlike, bizarre juxtaposition, fantasy elements',
    strength: 0.9,
    compatible_with: ['art_styles', 'fantasy', 'abstract'],
    examples: ['Dali style', 'Magritte style', 'dream imagery'],
  },
  {
    id: 'art_nouveau',
    name: 'Art Nouveau',
    category: 'art_movement',
    prompt_addition: 'art nouveau, organic forms, flowing lines, decorative patterns',
    strength: 0.8,
    compatible_with: ['art_styles', 'illustrations', 'portraits'],
    examples: ['Mucha style', 'ornamental design', 'natural motifs'],
  },

  // Medium Types
  {
    id: 'oil_painting',
    name: 'Oil Painting',
    category: 'medium_type',
    prompt_addition: 'oil painting, rich textures, layered brushwork, classical technique',
    strength: 0.8,
    compatible_with: ['art_styles', 'portraits', 'landscapes'],
    examples: ['canvas texture', 'paint thickness', 'masterwork quality'],
  },
  {
    id: 'watercolor',
    name: 'Watercolor',
    category: 'medium_type',
    prompt_addition: 'watercolor painting, transparent washes, wet-on-wet, soft edges',
    strength: 0.7,
    compatible_with: ['art_styles', 'landscapes', 'illustrations'],
    examples: ['flowing colors', 'paper texture', 'delicate technique'],
  },
  {
    id: 'digital_art',
    name: 'Digital Art',
    category: 'medium_type',
    prompt_addition: 'digital art, clean lines, vibrant colors, modern technique',
    strength: 0.8,
    compatible_with: ['illustrations', 'fantasy', 'sci_fi'],
    examples: ['Photoshop art', 'digital painting', 'concept art'],
  },
  {
    id: 'pencil_sketch',
    name: 'Pencil Sketch',
    category: 'medium_type',
    prompt_addition: 'pencil sketch, graphite drawing, detailed shading, monochrome',
    strength: 0.7,
    compatible_with: ['portraits', 'realistic', 'illustrations'],
    examples: ['pencil texture', 'sketch lines', 'realistic drawing'],
  },

  // Camera Settings
  {
    id: 'portrait_lens',
    name: 'Portrait Lens (85mm)',
    category: 'camera_settings',
    prompt_addition: '85mm lens, shallow depth of field, bokeh background',
    strength: 0.6,
    compatible_with: ['photography', 'portraits'],
    examples: ['professional portrait', 'blurred background', 'sharp focus'],
  },
  {
    id: 'wide_angle',
    name: 'Wide Angle (24mm)',
    category: 'camera_settings',
    prompt_addition: '24mm wide angle lens, expansive view, slight distortion',
    strength: 0.6,
    compatible_with: ['photography', 'landscapes', 'architectural'],
    examples: ['landscape photography', 'dramatic perspective', 'wide view'],
  },
  {
    id: 'macro_lens',
    name: 'Macro (100mm)',
    category: 'camera_settings',
    prompt_addition: 'macro photography, 100mm macro lens, extreme close-up, fine detail',
    strength: 0.7,
    compatible_with: ['photography', 'realistic'],
    examples: ['extreme detail', 'close-up photography', 'texture focus'],
  },

  // Lighting Types
  {
    id: 'golden_hour',
    name: 'Golden Hour',
    category: 'lighting_type',
    prompt_addition: 'golden hour lighting, warm sunset glow, soft shadows',
    strength: 0.8,
    compatible_with: ['photography', 'landscapes', 'portraits'],
    examples: ['sunset light', 'warm tones', 'cinematic lighting'],
  },
  {
    id: 'studio_lighting',
    name: 'Studio Lighting',
    category: 'lighting_type',
    prompt_addition: 'professional studio lighting, controlled illumination, clean shadows',
    strength: 0.7,
    compatible_with: ['photography', 'portraits', 'realistic'],
    examples: ['professional photo', 'clean lighting', 'studio setup'],
  },
  {
    id: 'dramatic_lighting',
    name: 'Dramatic Lighting',
    category: 'lighting_type',
    prompt_addition: 'dramatic lighting, strong contrast, chiaroscuro, deep shadows',
    strength: 0.9,
    compatible_with: ['art_styles', 'portraits', 'fantasy'],
    examples: ['film noir', 'theatrical lighting', 'high contrast'],
  },

  // Quality Enhancers
  {
    id: 'high_quality',
    name: 'High Quality',
    category: 'quality',
    prompt_addition: 'high quality, detailed, masterpiece, best quality, ultra detailed',
    strength: 0.6,
    compatible_with: ['art_styles', 'photography', 'realistic'],
    examples: ['professional quality', 'detailed work', 'masterpiece'],
  },
  {
    id: 'photorealistic',
    name: 'Photorealistic',
    category: 'quality',
    prompt_addition: 'photorealistic, hyperrealistic, lifelike, extremely detailed',
    strength: 0.8,
    compatible_with: ['photography', 'realistic', 'portraits'],
    examples: ['photo quality', 'realistic detail', 'lifelike'],
  },
]

// Comprehensive template library
export const PROMPT_TEMPLATES: PromptTemplate[] = [
  // Art Styles
  {
    id: 'impressionist_portrait',
    name: 'Impressionist Portrait',
    description: 'Classic impressionist style portrait with soft brushstrokes and natural lighting',
    category: 'art_styles',
    tags: ['impressionist', 'portrait', 'classical', 'soft'],
    components: [
      {
        id: 'subject_1',
        type: 'subject',
        content: 'elegant woman',
        weight: 1.2,
        enabled: true,
      },
      {
        id: 'style_1',
        type: 'style',
        content: 'impressionist painting, loose brushstrokes',
        weight: 1.0,
        enabled: true,
      },
      {
        id: 'lighting_1',
        type: 'lighting',
        content: 'natural lighting, soft shadows',
        weight: 0.8,
        enabled: true,
      },
      {
        id: 'detail_1',
        type: 'detail',
        content: 'delicate features, gentle expression',
        weight: 0.7,
        enabled: true,
      },
    ],
    created_at: new Date('2024-01-01'),
    updated_at: new Date('2024-01-01'),
    public: true,
    rating: 4.5,
    usage_count: 245,
  },
  {
    id: 'cyberpunk_character',
    name: 'Cyberpunk Character',
    description: 'Futuristic cyberpunk character with neon lighting and technological elements',
    category: 'sci_fi',
    tags: ['cyberpunk', 'futuristic', 'neon', 'technology'],
    components: [
      {
        id: 'subject_2',
        type: 'subject',
        content: 'cyberpunk warrior, augmented human',
        weight: 1.2,
        enabled: true,
      },
      {
        id: 'style_2',
        type: 'style',
        content: 'cyberpunk art style, neon aesthetics',
        weight: 1.1,
        enabled: true,
      },
      {
        id: 'lighting_2',
        type: 'lighting',
        content: 'neon lighting, electric blue and purple',
        weight: 1.0,
        enabled: true,
      },
      {
        id: 'mood_2',
        type: 'mood',
        content: 'dark, gritty, futuristic atmosphere',
        weight: 0.9,
        enabled: true,
      },
      {
        id: 'detail_2',
        type: 'detail',
        content: 'cybernetic implants, high-tech clothing',
        weight: 0.8,
        enabled: true,
      },
    ],
    created_at: new Date('2024-01-02'),
    updated_at: new Date('2024-01-02'),
    public: true,
    rating: 4.8,
    usage_count: 189,
  },

  // Photography Templates
  {
    id: 'portrait_photography',
    name: 'Professional Portrait',
    description: 'High-quality professional portrait photography setup',
    category: 'photography',
    tags: ['portrait', 'professional', 'studio', 'headshot'],
    components: [
      {
        id: 'subject_3',
        type: 'subject',
        content: 'professional headshot, business portrait',
        weight: 1.2,
        enabled: true,
      },
      {
        id: 'camera_3',
        type: 'camera',
        content: '85mm lens, shallow depth of field',
        weight: 0.8,
        enabled: true,
      },
      {
        id: 'lighting_3',
        type: 'lighting',
        content: 'studio lighting, soft box, professional setup',
        weight: 1.0,
        enabled: true,
      },
      {
        id: 'detail_3',
        type: 'detail',
        content: 'sharp focus, clean background, high quality',
        weight: 0.7,
        enabled: true,
      },
    ],
    created_at: new Date('2024-01-03'),
    updated_at: new Date('2024-01-03'),
    public: true,
    rating: 4.6,
    usage_count: 324,
  },
  {
    id: 'landscape_photography',
    name: 'Landscape Photography',
    description: 'Stunning natural landscape with dramatic lighting',
    category: 'landscapes',
    tags: ['landscape', 'nature', 'outdoor', 'scenic'],
    components: [
      {
        id: 'subject_4',
        type: 'subject',
        content: 'mountain landscape, pristine wilderness',
        weight: 1.2,
        enabled: true,
      },
      {
        id: 'camera_4',
        type: 'camera',
        content: 'wide angle lens, landscape photography',
        weight: 0.8,
        enabled: true,
      },
      {
        id: 'lighting_4',
        type: 'lighting',
        content: 'golden hour, dramatic sky, natural lighting',
        weight: 1.0,
        enabled: true,
      },
      {
        id: 'composition_4',
        type: 'composition',
        content: 'rule of thirds, leading lines, foreground detail',
        weight: 0.7,
        enabled: true,
      },
    ],
    created_at: new Date('2024-01-04'),
    updated_at: new Date('2024-01-04'),
    public: true,
    rating: 4.7,
    usage_count: 198,
  },

  // Fantasy Templates
  {
    id: 'fantasy_dragon',
    name: 'Fantasy Dragon',
    description: 'Majestic dragon in a fantasy setting with magical elements',
    category: 'fantasy',
    tags: ['dragon', 'fantasy', 'magical', 'mythical'],
    components: [
      {
        id: 'subject_5',
        type: 'subject',
        content: 'majestic dragon, ancient creature',
        weight: 1.3,
        enabled: true,
      },
      {
        id: 'style_5',
        type: 'style',
        content: 'fantasy art, detailed illustration',
        weight: 1.0,
        enabled: true,
      },
      {
        id: 'mood_5',
        type: 'mood',
        content: 'epic, mystical, awe-inspiring',
        weight: 0.9,
        enabled: true,
      },
      {
        id: 'detail_5',
        type: 'detail',
        content: 'scales, wings, fire breathing, magical aura',
        weight: 0.8,
        enabled: true,
      },
      {
        id: 'composition_5',
        type: 'composition',
        content: 'dramatic pose, mountain backdrop',
        weight: 0.7,
        enabled: true,
      },
    ],
    created_at: new Date('2024-01-05'),
    updated_at: new Date('2024-01-05'),
    public: true,
    rating: 4.9,
    usage_count: 412,
  },

  // Anime/Manga Templates
  {
    id: 'anime_character',
    name: 'Anime Character',
    description: 'Modern anime style character with vibrant colors',
    category: 'anime_manga',
    tags: ['anime', 'character', 'manga', 'japanese'],
    components: [
      {
        id: 'subject_6',
        type: 'subject',
        content: 'anime girl, cute character',
        weight: 1.2,
        enabled: true,
      },
      {
        id: 'style_6',
        type: 'style',
        content: 'anime art style, manga illustration',
        weight: 1.1,
        enabled: true,
      },
      {
        id: 'color_6',
        type: 'color',
        content: 'vibrant colors, bright palette',
        weight: 0.8,
        enabled: true,
      },
      {
        id: 'detail_6',
        type: 'detail',
        content: 'large eyes, detailed hair, expressive face',
        weight: 0.9,
        enabled: true,
      },
    ],
    created_at: new Date('2024-01-06'),
    updated_at: new Date('2024-01-06'),
    public: true,
    rating: 4.4,
    usage_count: 567,
  },

  // Abstract Templates
  {
    id: 'abstract_geometric',
    name: 'Abstract Geometric',
    description: 'Modern abstract composition with geometric shapes and bold colors',
    category: 'abstract',
    tags: ['abstract', 'geometric', 'modern', 'shapes'],
    components: [
      {
        id: 'subject_7',
        type: 'subject',
        content: 'geometric abstract composition',
        weight: 1.2,
        enabled: true,
      },
      {
        id: 'style_7',
        type: 'style',
        content: 'abstract art, modernist design',
        weight: 1.0,
        enabled: true,
      },
      {
        id: 'color_7',
        type: 'color',
        content: 'bold primary colors, high contrast',
        weight: 1.0,
        enabled: true,
      },
      {
        id: 'composition_7',
        type: 'composition',
        content: 'balanced composition, geometric harmony',
        weight: 0.8,
        enabled: true,
      },
    ],
    created_at: new Date('2024-01-07'),
    updated_at: new Date('2024-01-07'),
    public: true,
    rating: 4.2,
    usage_count: 156,
  },

  // Minimalist Templates
  {
    id: 'minimalist_design',
    name: 'Minimalist Design',
    description: 'Clean, minimalist design with simple forms and limited colors',
    category: 'minimalist',
    tags: ['minimalist', 'clean', 'simple', 'modern'],
    components: [
      {
        id: 'subject_8',
        type: 'subject',
        content: 'simple geometric form',
        weight: 1.0,
        enabled: true,
      },
      {
        id: 'style_8',
        type: 'style',
        content: 'minimalist design, clean aesthetics',
        weight: 1.1,
        enabled: true,
      },
      {
        id: 'color_8',
        type: 'color',
        content: 'monochrome, limited color palette',
        weight: 0.9,
        enabled: true,
      },
      {
        id: 'composition_8',
        type: 'composition',
        content: 'negative space, balanced composition',
        weight: 0.8,
        enabled: true,
      },
    ],
    created_at: new Date('2024-01-08'),
    updated_at: new Date('2024-01-08'),
    public: true,
    rating: 4.3,
    usage_count: 203,
  },

  // Historical Templates
  {
    id: 'renaissance_painting',
    name: 'Renaissance Painting',
    description: 'Classical Renaissance style painting with religious or mythological themes',
    category: 'historical',
    tags: ['renaissance', 'classical', 'historical', 'religious'],
    components: [
      {
        id: 'subject_9',
        type: 'subject',
        content: 'religious scene, classical figures',
        weight: 1.2,
        enabled: true,
      },
      {
        id: 'style_9',
        type: 'style',
        content: 'Renaissance painting, classical technique',
        weight: 1.1,
        enabled: true,
      },
      {
        id: 'medium_9',
        type: 'medium',
        content: 'oil on canvas, masterwork quality',
        weight: 0.9,
        enabled: true,
      },
      {
        id: 'lighting_9',
        type: 'lighting',
        content: 'dramatic chiaroscuro, divine lighting',
        weight: 1.0,
        enabled: true,
      },
    ],
    created_at: new Date('2024-01-09'),
    updated_at: new Date('2024-01-09'),
    public: true,
    rating: 4.6,
    usage_count: 178,
  },

  // Illustration Templates
  {
    id: 'childrens_book',
    name: 'Children\'s Book Illustration',
    description: 'Whimsical children\'s book style illustration with bright colors',
    category: 'illustrations',
    tags: ['children', 'illustration', 'whimsical', 'colorful'],
    components: [
      {
        id: 'subject_10',
        type: 'subject',
        content: 'cute animal characters, storybook scene',
        weight: 1.2,
        enabled: true,
      },
      {
        id: 'style_10',
        type: 'style',
        content: 'children\'s book illustration, whimsical art',
        weight: 1.1,
        enabled: true,
      },
      {
        id: 'color_10',
        type: 'color',
        content: 'bright cheerful colors, warm palette',
        weight: 1.0,
        enabled: true,
      },
      {
        id: 'mood_10',
        type: 'mood',
        content: 'happy, playful, innocent',
        weight: 0.8,
        enabled: true,
      },
    ],
    created_at: new Date('2024-01-10'),
    updated_at: new Date('2024-01-10'),
    public: true,
    rating: 4.5,
    usage_count: 289,
  },
]

// Common negative prompt components
export const NEGATIVE_PROMPT_SUGGESTIONS = [
  'low quality',
  'blurry',
  'pixelated',
  'distorted',
  'deformed',
  'ugly',
  'bad anatomy',
  'extra limbs',
  'missing limbs',
  'cropped',
  'worst quality',
  'jpeg artifacts',
  'watermark',
  'signature',
  'username',
  'text',
  'logo',
  'error',
  'mutation',
  'duplicate',
  'morbid',
  'mutilated',
  'poorly drawn',
  'bad proportions',
  'cloned face',
  'malformed',
  'gross proportions',
  'missing arms',
  'missing legs',
  'extra arms',
  'extra legs',
  'fused fingers',
  'too many fingers',
  'long neck',
  'cross-eyed',
]

// Utility functions for template management
export class PromptTemplateManager {
  private templates: Map<string, PromptTemplate> = new Map()
  private modifiers: Map<string, StyleModifier> = new Map()

  constructor() {
    this.loadDefaultTemplates()
    this.loadDefaultModifiers()
  }

  private loadDefaultTemplates(): void {
    PROMPT_TEMPLATES.forEach(template => {
      this.templates.set(template.id, template)
    })
  }

  private loadDefaultModifiers(): void {
    STYLE_MODIFIERS.forEach(modifier => {
      this.modifiers.set(modifier.id, modifier)
    })
  }

  public getTemplatesByCategory(category: PromptCategory): PromptTemplate[] {
    return Array.from(this.templates.values()).filter(
      template => template.category === category
    )
  }

  public getTemplatesByTags(tags: string[]): PromptTemplate[] {
    return Array.from(this.templates.values()).filter(template =>
      tags.some(tag => template.tags.includes(tag))
    )
  }

  public searchTemplates(query: string): PromptTemplate[] {
    const lowerQuery = query.toLowerCase()
    return Array.from(this.templates.values()).filter(
      template =>
        template.name.toLowerCase().includes(lowerQuery) ||
        template.description.toLowerCase().includes(lowerQuery) ||
        template.tags.some(tag => tag.toLowerCase().includes(lowerQuery))
    )
  }

  public getPopularTemplates(limit: number = 10): PromptTemplate[] {
    return Array.from(this.templates.values())
      .sort((a, b) => (b.usage_count || 0) - (a.usage_count || 0))
      .slice(0, limit)
  }

  public getTopRatedTemplates(limit: number = 10): PromptTemplate[] {
    return Array.from(this.templates.values())
      .filter(template => template.rating !== undefined)
      .sort((a, b) => (b.rating || 0) - (a.rating || 0))
      .slice(0, limit)
  }

  public getModifiersByCategory(category: StyleCategory): StyleModifier[] {
    return Array.from(this.modifiers.values()).filter(
      modifier => modifier.category === category
    )
  }

  public getCompatibleModifiers(templateCategory: PromptCategory): StyleModifier[] {
    return Array.from(this.modifiers.values()).filter(
      modifier =>
        !modifier.compatible_with ||
        modifier.compatible_with.includes(templateCategory)
    )
  }

  public addTemplate(template: PromptTemplate): void {
    this.templates.set(template.id, template)
  }

  public removeTemplate(templateId: string): boolean {
    return this.templates.delete(templateId)
  }

  public updateTemplate(template: PromptTemplate): void {
    template.updated_at = new Date()
    this.templates.set(template.id, template)
  }

  public getTemplate(templateId: string): PromptTemplate | undefined {
    return this.templates.get(templateId)
  }

  public getAllTemplates(): PromptTemplate[] {
    return Array.from(this.templates.values())
  }

  public getAllModifiers(): StyleModifier[] {
    return Array.from(this.modifiers.values())
  }

  public exportTemplates(): string {
    return JSON.stringify(Array.from(this.templates.values()), null, 2)
  }

  public importTemplates(jsonData: string): { success: number; failed: number } {
    let success = 0
    let failed = 0

    try {
      const templates = JSON.parse(jsonData) as PromptTemplate[]
      templates.forEach(template => {
        try {
          // Validate required fields
          if (!template.id || !template.name || !template.description || !template.category) {
            failed++
            return
          }

          this.addTemplate(template)
          success++
        } catch (error) {
          failed++
        }
      })
    } catch (error) {
      failed = 1
    }

    return { success, failed }
  }
}
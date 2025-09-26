/**
 * Style Prompt Templates
 * Optimized prompts for laser engraving conversion styles using Stable Diffusion
 */

import type { StylePromptTemplate } from './types';

export const COMMON_LASER_TAGS = [
  'laser engraving optimized',
  'high contrast',
  'sharp edges',
  'clean lines',
  'black and white',
  'monochrome',
  'precise details',
  'vector compatible',
];

export const COMMON_NEGATIVE_PROMPT = [
  'blurry',
  'soft edges',
  'gradient',
  'color',
  'realistic shading',
  'photographic',
  'low contrast',
  'noise',
  'artifacts',
  'watermark',
  'text',
  'signature',
].join(', ');

export const QUALITY_MODIFIERS = [
  'masterpiece',
  'best quality',
  'ultra detailed',
  'sharp focus',
  'professional',
  'clean composition',
];

/**
 * Line Art Style Prompts
 * Clean vector-like outlines perfect for laser cutting
 */
export const LINE_ART_PROMPTS: StylePromptTemplate = {
  basePrompt: [
    'line art drawing',
    'clean vector outlines',
    'minimalist line work',
    'continuous lines',
    'no fill',
    'outline only',
    'technical drawing style',
    'architectural lines',
    ...COMMON_LASER_TAGS,
    ...QUALITY_MODIFIERS,
  ].join(', '),

  negativePrompt: [
    COMMON_NEGATIVE_PROMPT,
    'filled shapes',
    'solid areas',
    'crosshatching',
    'sketchy lines',
    'rough textures',
  ].join(', '),

  styleModifiers: [
    'single weight lines',
    'geometric precision',
    'CAD style',
    'blueprint aesthetic',
    'technical illustration',
  ],

  qualityTags: [
    'precise linework',
    'vector perfect',
    'laser cutting ready',
    'scalable graphics',
  ],
};

/**
 * Halftone Style Prompts
 * Dot pattern for grayscale representation
 */
export const HALFTONE_PROMPTS: StylePromptTemplate = {
  basePrompt: [
    'halftone pattern',
    'dot matrix screen',
    'newspaper print style',
    'Ben Day dots',
    'retro printing technique',
    'uniform dot spacing',
    'mechanical reproduction',
    ...COMMON_LASER_TAGS,
    ...QUALITY_MODIFIERS,
  ].join(', '),

  negativePrompt: [
    COMMON_NEGATIVE_PROMPT,
    'continuous tones',
    'smooth gradients',
    'irregular patterns',
    'random dots',
  ].join(', '),

  styleModifiers: [
    'precise dot placement',
    'consistent screen angle',
    'vintage print aesthetic',
    'pop art influence',
    'comic book style',
  ],

  qualityTags: [
    'perfect dot formation',
    'uniform spacing',
    'print production ready',
    'mechanical precision',
  ],
};

/**
 * Stipple Style Prompts
 * Pointillism texture effect for detailed engraving
 */
export const STIPPLE_PROMPTS: StylePromptTemplate = {
  basePrompt: [
    'stippling technique',
    'pointillism dots',
    'engraving stipple',
    'pen and ink dots',
    'classical engraving style',
    'hand stippled effect',
    'Victorian illustration',
    'crosshatch alternative',
    ...COMMON_LASER_TAGS,
    ...QUALITY_MODIFIERS,
  ].join(', '),

  negativePrompt: [
    COMMON_NEGATIVE_PROMPT,
    'solid lines',
    'continuous strokes',
    'filled areas',
    'smooth shading',
  ].join(', '),

  styleModifiers: [
    'varying dot density',
    'organic point placement',
    'traditional engraving',
    'detailed stippling',
    'artistic pointwork',
  ],

  qualityTags: [
    'masterful stippling',
    'precision dotwork',
    'engraving quality',
    'fine art technique',
  ],
};

/**
 * Geometric Style Prompts
 * Angular pattern interpretation for modern aesthetics
 */
export const GEOMETRIC_PROMPTS: StylePromptTemplate = {
  basePrompt: [
    'geometric pattern design',
    'angular interpretation',
    'polygonal style',
    'crystalline structure',
    'faceted representation',
    'low poly aesthetic',
    'mathematical precision',
    'tessellated pattern',
    ...COMMON_LASER_TAGS,
    ...QUALITY_MODIFIERS,
  ].join(', '),

  negativePrompt: [
    COMMON_NEGATIVE_PROMPT,
    'curved lines',
    'organic shapes',
    'irregular patterns',
    'chaotic arrangement',
  ].join(', '),

  styleModifiers: [
    'perfect symmetry',
    'modular design',
    'contemporary art style',
    'digital art aesthetic',
    'minimal color palette',
  ],

  qualityTags: [
    'mathematical beauty',
    'perfect geometry',
    'modern design',
    'parametric precision',
  ],
};

/**
 * Minimalist Style Prompts
 * Simplified high-contrast output for clean results
 */
export const MINIMALIST_PROMPTS: StylePromptTemplate = {
  basePrompt: [
    'minimalist design',
    'essential elements only',
    'maximum contrast',
    'simple composition',
    'reduced complexity',
    'clean aesthetic',
    'modern minimalism',
    'pure form',
    ...COMMON_LASER_TAGS,
    ...QUALITY_MODIFIERS,
  ].join(', '),

  negativePrompt: [
    COMMON_NEGATIVE_PROMPT,
    'complex details',
    'busy composition',
    'decorative elements',
    'ornamental features',
    'excessive detail',
  ].join(', '),

  styleModifiers: [
    'stark simplicity',
    'bold contrasts',
    'negative space usage',
    'essential forms only',
    'contemporary clean style',
  ],

  qualityTags: [
    'elegant simplicity',
    'perfect balance',
    'timeless design',
    'functional beauty',
  ],
};

/**
 * Get prompt template by style ID
 */
export function getPromptTemplate(styleId: string): StylePromptTemplate {
  switch (styleId) {
    case 'line-art':
      return LINE_ART_PROMPTS;
    case 'halftone':
      return HALFTONE_PROMPTS;
    case 'stipple':
      return STIPPLE_PROMPTS;
    case 'geometric':
      return GEOMETRIC_PROMPTS;
    case 'minimalist':
      return MINIMALIST_PROMPTS;
    default:
      throw new Error(`Unknown style ID: ${styleId}`);
  }
}

/**
 * Combine base prompt with style-specific modifiers
 */
export function buildPrompt(
  template: StylePromptTemplate,
  additionalModifiers: string[] = []
): string {
  return [
    template.basePrompt,
    ...template.styleModifiers,
    ...additionalModifiers,
  ].join(', ');
}

/**
 * Build negative prompt with optional additions
 */
export function buildNegativePrompt(
  template: StylePromptTemplate,
  additionalNegatives: string[] = []
): string {
  return [
    template.negativePrompt,
    ...additionalNegatives,
  ].join(', ');
}
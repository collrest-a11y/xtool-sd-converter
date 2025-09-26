import { useAppContext } from '../contexts/AppContext';
import type { ConversionStyle } from '../types';

const MOCK_STYLES: ConversionStyle[] = [
  {
    id: 'line-art',
    name: 'Line Art',
    description: 'Clean vector-like outlines perfect for laser cutting',
    thumbnail: '/api/placeholder/150/150',
    prompt: 'line art, clean outlines, vector style, black and white, no shading',
    settings: { strength: 0.8, steps: 20 },
  },
  {
    id: 'halftone',
    name: 'Halftone',
    description: 'Dot pattern for grayscale representation',
    thumbnail: '/api/placeholder/150/150',
    prompt: 'halftone pattern, dot matrix, newspaper style, black and white',
    settings: { strength: 0.7, steps: 25 },
  },
  {
    id: 'stipple',
    name: 'Stipple',
    description: 'Stippled/pointillism effect for texture',
    thumbnail: '/api/placeholder/150/150',
    prompt: 'stippling, pointillism, dots, texture, engraving style',
    settings: { strength: 0.6, steps: 30 },
  },
  {
    id: 'geometric',
    name: 'Geometric',
    description: 'Geometric pattern interpretation',
    thumbnail: '/api/placeholder/150/150',
    prompt: 'geometric patterns, angular, modern, abstract shapes',
    settings: { strength: 0.9, steps: 20 },
  },
  {
    id: 'minimalist',
    name: 'Minimalist',
    description: 'Simplified high-contrast output',
    thumbnail: '/api/placeholder/150/150',
    prompt: 'minimalist, simple, high contrast, clean, modern',
    settings: { strength: 0.8, steps: 15 },
  },
];

interface StyleSelectorProps {
  className?: string;
}

export default function StyleSelector({ className = '' }: StyleSelectorProps) {
  const { state, setSelectedStyle } = useAppContext();
  const { selectedStyle, uploadedImage } = state;

  const handleStyleSelect = (style: ConversionStyle) => {
    setSelectedStyle(style);
  };

  if (!uploadedImage) {
    return (
      <div className={`${className}`}>
        <div className="bg-gray-100 dark:bg-gray-800 rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-600 p-8">
          <div className="text-center">
            <svg
              className="w-12 h-12 text-gray-400 mx-auto mb-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M9.53 16.122a3 3 0 0 0-5.78 1.128 2.25 2.25 0 0 1-2.4 2.245 4.5 4.5 0 0 0 8.4-2.245c0-.399-.078-.78-.22-1.128Zm0 0a15.998 15.998 0 0 0 3.388-1.62m-5.043-.025a15.994 15.994 0 0 1 1.622-3.395m3.42 3.42a15.995 15.995 0 0 0 4.764-4.648l3.876-5.814a1.151 1.151 0 0 0-1.597-1.597L14.146 6.32a15.996 15.996 0 0 0-4.649 4.763m3.42 3.42a6.776 6.776 0 0 0-3.42-3.42"
              />
            </svg>
            <p className="text-gray-500 dark:text-gray-400">Upload an image to select styles</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`${className}`}>
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
          Choose Conversion Style
        </h3>
        <p className="text-gray-600 dark:text-gray-400">
          Select a style optimized for laser engraving and cutting
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
        {MOCK_STYLES.map((style) => (
          <div
            key={style.id}
            onClick={() => handleStyleSelect(style)}
            className={`
              relative cursor-pointer rounded-lg overflow-hidden transition-all duration-200
              border-2 ${
                selectedStyle?.id === style.id
                  ? 'border-primary-500 ring-2 ring-primary-200 dark:ring-primary-800'
                  : 'border-gray-200 dark:border-gray-700 hover:border-primary-300'
              }
              bg-white dark:bg-gray-800 hover:shadow-md transform hover:scale-[1.02]
            `}
          >
            {/* Placeholder Thumbnail */}
            <div className="aspect-square bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-800 flex items-center justify-center">
              <svg
                className="w-12 h-12 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="m2.25 15.75 5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 0 0 1.5-1.5V6a1.5 1.5 0 0 0-1.5-1.5H3.75A1.5 1.5 0 0 0 2.25 6v12a1.5 1.5 0 0 0 1.5 1.5Zm10.5-11.25h.008v.008h-.008V8.25Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z"
                />
              </svg>
            </div>

            {/* Style Info */}
            <div className="p-3">
              <h4 className="font-medium text-gray-900 dark:text-white text-sm mb-1">
                {style.name}
              </h4>
              <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-2">
                {style.description}
              </p>
            </div>

            {/* Selected Indicator */}
            {selectedStyle?.id === style.id && (
              <div className="absolute top-2 right-2 bg-primary-500 text-white rounded-full p-1">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              </div>
            )}
          </div>
        ))}
      </div>

      {selectedStyle && (
        <div className="mt-6 p-4 bg-primary-50 dark:bg-primary-900/20 border border-primary-200 dark:border-primary-800 rounded-lg">
          <div className="flex items-start space-x-3">
            <div className="bg-primary-500 text-white rounded-full p-2 flex-shrink-0">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>
            <div>
              <h4 className="font-medium text-primary-900 dark:text-primary-100 mb-1">
                {selectedStyle.name} Selected
              </h4>
              <p className="text-sm text-primary-700 dark:text-primary-300">
                {selectedStyle.description}
              </p>
              <div className="mt-2 text-xs text-primary-600 dark:text-primary-400">
                Settings: Strength {selectedStyle.settings.strength} • Steps {selectedStyle.settings.steps}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
import { useState, useEffect } from 'react';
import { useAppContext } from '../contexts/AppContext';
import { StyleEngine } from '../lib/styles';
import type { ConversionStyle } from '../types';
import type { LaserConversionStyle } from '../lib/styles/types';

interface StyleSelectorProps {
  className?: string;
}

export default function StyleSelector({ className = '' }: StyleSelectorProps) {
  const { state, setSelectedStyle } = useAppContext();
  const { selectedStyle, uploadedImage } = state;
  const [availableStyles, setAvailableStyles] = useState<LaserConversionStyle[]>([]);
  const [styleEngine, setStyleEngine] = useState<StyleEngine | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Initialize style engine and load available styles
  useEffect(() => {
    const initializeStyles = async () => {
      try {
        setIsLoading(true);
        setError(null);

        const engine = new StyleEngine();
        setStyleEngine(engine);

        // Get available styles from the engine
        const styles = engine.getAvailableStyles();
        setAvailableStyles(styles);
      } catch (err) {
        console.error('Failed to initialize style engine:', err);
        setError('Failed to load styles. Please check if the SD WebUI is running.');
      } finally {
        setIsLoading(false);
      }
    };

    initializeStyles();
  }, []);

  const handleStyleSelect = (style: LaserConversionStyle) => {
    // Convert LaserConversionStyle to ConversionStyle for compatibility
    const compatibleStyle: ConversionStyle = {
      id: style.id,
      name: style.name,
      description: style.description,
      thumbnail: style.thumbnail,
      category: style.category,
      // Keep legacy fields for backward compatibility
      prompt: '', // Deprecated
      settings: style.defaultSettings, // Deprecated
    };
    setSelectedStyle(compatibleStyle);
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

  // Loading state
  if (isLoading) {
    return (
      <div className={`${className}`}>
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            Choose Conversion Style
          </h3>
          <p className="text-gray-600 dark:text-gray-400">
            Loading available styles...
          </p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
          {[1, 2, 3, 4, 5].map((index) => (
            <div
              key={index}
              className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden animate-pulse"
            >
              <div className="aspect-square bg-gray-200 dark:bg-gray-700"></div>
              <div className="p-3">
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded mb-2"></div>
                <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className={`${className}`}>
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            Choose Conversion Style
          </h3>
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
            <div className="flex items-center">
              <svg
                className="w-5 h-5 text-red-400 mr-2"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.664-.833-2.464 0L4.35 16.5c-.77.833.192 2.5 1.732 2.5z"
                />
              </svg>
              <p className="text-red-700 dark:text-red-300 text-sm">{error}</p>
            </div>
            <button
              onClick={() => window.location.reload()}
              className="mt-2 px-3 py-1 text-sm bg-red-100 dark:bg-red-800 text-red-700 dark:text-red-300 rounded hover:bg-red-200 dark:hover:bg-red-700 transition-colors"
            >
              Retry
            </button>
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
        {availableStyles.map((style) => (
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
            {/* Category Badge */}
            <div className="absolute top-2 left-2 z-10">
              <span
                className={`
                  px-2 py-1 text-xs font-medium rounded-full text-white
                  ${
                    style.category === 'vector'
                      ? 'bg-blue-500'
                      : style.category === 'raster'
                      ? 'bg-green-500'
                      : 'bg-purple-500'
                  }
                `}
              >
                {style.category}
              </span>
            </div>

            {/* Placeholder Thumbnail */}
            <div className="aspect-square bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-800 flex items-center justify-center">
              {/* Style-specific icons */}
              {style.id === 'line-art' && (
                <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              )}
              {style.id === 'halftone' && (
                <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                </svg>
              )}
              {style.id === 'stipple' && (
                <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              )}
              {style.id === 'geometric' && (
                <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                </svg>
              )}
              {style.id === 'minimalist' && (
                <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              )}
              {!['line-art', 'halftone', 'stipple', 'geometric', 'minimalist'].includes(style.id) && (
                <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="m2.25 15.75 5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 0 0 1.5-1.5V6a1.5 1.5 0 0 0-1.5-1.5H3.75A1.5 1.5 0 0 0 2.25 6v12a1.5 1.5 0 0 0 1.5 1.5Zm10.5-11.25h.008v.008h-.008V8.25Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z" />
                </svg>
              )}
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
            <div className="flex-1">
              <div className="flex items-center space-x-2 mb-1">
                <h4 className="font-medium text-primary-900 dark:text-primary-100">
                  {selectedStyle.name} Selected
                </h4>
                {selectedStyle.category && (
                  <span
                    className={`
                      px-2 py-1 text-xs font-medium rounded-full text-white
                      ${
                        selectedStyle.category === 'vector'
                          ? 'bg-blue-500'
                          : selectedStyle.category === 'raster'
                          ? 'bg-green-500'
                          : 'bg-purple-500'
                      }
                    `}
                  >
                    {selectedStyle.category}
                  </span>
                )}
              </div>
              <p className="text-sm text-primary-700 dark:text-primary-300 mb-2">
                {selectedStyle.description}
              </p>
              <div className="text-xs text-primary-600 dark:text-primary-400">
                <p>Optimized for laser {selectedStyle.category === 'vector' ? 'cutting' : selectedStyle.category === 'raster' ? 'engraving' : 'cutting and engraving'}</p>
                {selectedStyle.settings && (
                  <p className="mt-1">
                    Default settings: Strength {selectedStyle.settings.strength} • Steps {selectedStyle.settings.steps}
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
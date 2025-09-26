/**
 * StylePreview Component
 * Real-time preview of style application for laser engraving conversion
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { StyleEngine } from '../lib/styles/style-engine';
import type {
  LaserConversionStyle,
  StyleParameters,
  ProcessingResult,
  ProcessingQueue,
} from '../lib/styles/types';

interface StylePreviewProps {
  image: string;
  style: LaserConversionStyle;
  parameters: Partial<StyleParameters>;
  className?: string;
  onPreviewUpdate?: (result: ProcessingResult) => void;
  onError?: (error: string) => void;
}

interface PreviewState {
  result: ProcessingResult | null;
  isGenerating: boolean;
  progress: number;
  error: string | null;
  lastUpdateTime: number;
}

export default function StylePreview({
  image,
  style,
  parameters,
  className = '',
  onPreviewUpdate,
  onError,
}: StylePreviewProps) {
  const [previewState, setPreviewState] = useState<PreviewState>({
    result: null,
    isGenerating: false,
    progress: 0,
    error: null,
    lastUpdateTime: 0,
  });

  const styleEngineRef = useRef<StyleEngine | null>(null);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const currentJobIdRef = useRef<string | null>(null);

  // Initialize style engine
  useEffect(() => {
    const initializeEngine = async () => {
      try {
        styleEngineRef.current = new StyleEngine();
        await styleEngineRef.current.initialize();
      } catch (error) {
        console.error('Failed to initialize style engine:', error);
        setPreviewState(prev => ({
          ...prev,
          error: 'Failed to initialize style engine',
        }));
        onError?.('Failed to initialize style engine');
      }
    };

    initializeEngine();

    return () => {
      if (styleEngineRef.current) {
        // Clean up any ongoing processing
        if (currentJobIdRef.current) {
          styleEngineRef.current.cancelProcessing(currentJobIdRef.current).catch(console.error);
        }
      }
    };
  }, [onError]);

  // Generate preview with debouncing
  const generatePreview = useCallback(async () => {
    if (!styleEngineRef.current || !image || !style) {
      return;
    }

    // Clear existing debounce timer
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    // Cancel any ongoing processing
    if (currentJobIdRef.current) {
      try {
        await styleEngineRef.current.cancelProcessing(currentJobIdRef.current);
      } catch (error) {
        console.warn('Failed to cancel previous processing:', error);
      }
    }

    // Debounce the preview generation
    debounceTimerRef.current = setTimeout(async () => {
      setPreviewState(prev => ({
        ...prev,
        isGenerating: true,
        progress: 0,
        error: null,
        lastUpdateTime: Date.now(),
      }));

      try {
        const result = await styleEngineRef.current!.generatePreview(
          image,
          style.id,
          parameters
        );

        setPreviewState(prev => ({
          ...prev,
          result,
          isGenerating: false,
          progress: 100,
          error: result.success ? null : result.error || 'Unknown error',
        }));

        onPreviewUpdate?.(result);

        if (!result.success) {
          onError?.(result.error || 'Preview generation failed');
        }

      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        setPreviewState(prev => ({
          ...prev,
          isGenerating: false,
          error: errorMessage,
        }));

        onError?.(errorMessage);
      } finally {
        currentJobIdRef.current = null;
      }
    }, style.previewOptions.updateDelay);

  }, [image, style, parameters, onPreviewUpdate, onError]);

  // Trigger preview generation when inputs change
  useEffect(() => {
    generatePreview();
  }, [generatePreview]);

  // Cleanup timers on unmount
  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, []);

  const handleRetryPreview = () => {
    generatePreview();
  };

  const handleCancelPreview = async () => {
    if (currentJobIdRef.current && styleEngineRef.current) {
      try {
        await styleEngineRef.current.cancelProcessing(currentJobIdRef.current);
        setPreviewState(prev => ({
          ...prev,
          isGenerating: false,
          error: 'Preview cancelled',
        }));
      } catch (error) {
        console.error('Failed to cancel preview:', error);
      }
    }
  };

  return (
    <div className={`bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden ${className}`}>
      {/* Header */}
      <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Preview: {style.name}
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {style.description}
            </p>
          </div>
          <div className="flex items-center space-x-2">
            {previewState.isGenerating && (
              <button
                onClick={handleCancelPreview}
                className="px-3 py-1 text-sm bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300 rounded-md hover:bg-red-200 dark:hover:bg-red-800 transition-colors"
              >
                Cancel
              </button>
            )}
            {previewState.error && !previewState.isGenerating && (
              <button
                onClick={handleRetryPreview}
                className="px-3 py-1 text-sm bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 rounded-md hover:bg-blue-200 dark:hover:bg-blue-800 transition-colors"
              >
                Retry
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Preview Content */}
      <div className="p-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Original Image */}
          <div className="space-y-2">
            <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Original
            </h4>
            <div className="aspect-square bg-gray-100 dark:bg-gray-700 rounded-lg overflow-hidden">
              <img
                src={image}
                alt="Original image"
                className="w-full h-full object-cover"
              />
            </div>
          </div>

          {/* Preview Image */}
          <div className="space-y-2">
            <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">
              {style.name} Preview
            </h4>
            <div className="aspect-square bg-gray-100 dark:bg-gray-700 rounded-lg overflow-hidden relative">
              {previewState.isGenerating ? (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500 mx-auto mb-2"></div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Generating preview...
                    </p>
                    {previewState.progress > 0 && (
                      <div className="mt-2 w-32 bg-gray-200 dark:bg-gray-600 rounded-full h-2 mx-auto">
                        <div
                          className="bg-primary-500 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${previewState.progress}%` }}
                        ></div>
                      </div>
                    )}
                  </div>
                </div>
              ) : previewState.error ? (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center p-4">
                    <svg
                      className="w-12 h-12 text-red-400 mx-auto mb-2"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={1.5}
                        d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.664-.833-2.464 0L4.35 16.5c-.77.833.192 2.5 1.732 2.5z"
                      />
                    </svg>
                    <p className="text-sm text-red-600 dark:text-red-400 mb-2">
                      Preview failed
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 max-w-48">
                      {previewState.error}
                    </p>
                  </div>
                </div>
              ) : previewState.result?.success && previewState.result.imageUrl ? (
                <img
                  src={previewState.result.imageUrl}
                  alt={`${style.name} preview`}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center">
                    <svg
                      className="w-12 h-12 text-gray-400 mx-auto mb-2"
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
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      No preview available
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Preview Metadata */}
        {previewState.result?.metadata && (
          <div className="mt-4 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
            <h5 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Processing Details
            </h5>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
              <div>
                <span className="text-gray-500 dark:text-gray-400">Time:</span>
                <span className="ml-1 text-gray-900 dark:text-white">
                  {(previewState.result.metadata.processingTime / 1000).toFixed(1)}s
                </span>
              </div>
              <div>
                <span className="text-gray-500 dark:text-gray-400">Steps:</span>
                <span className="ml-1 text-gray-900 dark:text-white">
                  {previewState.result.metadata.settings.steps}
                </span>
              </div>
              <div>
                <span className="text-gray-500 dark:text-gray-400">Size:</span>
                <span className="ml-1 text-gray-900 dark:text-white">
                  {previewState.result.metadata.settings.width}×{previewState.result.metadata.settings.height}
                </span>
              </div>
              <div>
                <span className="text-gray-500 dark:text-gray-400">Strength:</span>
                <span className="ml-1 text-gray-900 dark:text-white">
                  {previewState.result.metadata.settings.strength}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
/**
 * StylePreview Component Tests
 */

import React from 'react';
import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import StylePreview from './StylePreview';
import type { LaserConversionStyle } from '../lib/styles/types';

// Mock the StyleEngine
const mockStyleEngine = {
  initialize: vi.fn().mockResolvedValue(undefined),
  generatePreview: vi.fn().mockResolvedValue({
    success: true,
    imageUrl: 'data:image/png;base64,preview-result',
    metadata: {
      processingTime: 2000,
      settings: { width: 256, height: 256, steps: 10, strength: 0.6 },
      parameters: { contrast: 1.0, brightness: 1.0, sharpness: 1.0 },
    },
  }),
  cancelProcessing: vi.fn().mockResolvedValue(undefined),
};

vi.mock('../lib/styles/style-engine', () => ({
  StyleEngine: vi.fn(() => mockStyleEngine),
}));

describe('StylePreview', () => {
  const mockImage = 'data:image/png;base64,original-image';
  const mockStyle: LaserConversionStyle = {
    id: 'line-art',
    name: 'Line Art',
    description: 'Clean vector-like outlines',
    thumbnail: '/test-thumbnail.png',
    category: 'vector',
    processor: {} as any,
    defaultSettings: { strength: 0.8, steps: 20 },
    defaultParameters: { contrast: 1.0, brightness: 1.0, sharpness: 1.0 },
    parameterControls: [],
    previewOptions: {
      showRealTime: true,
      updateDelay: 500,
      thumbnailSize: 256,
      showParameters: true,
    },
  };

  const defaultProps = {
    image: mockImage,
    style: mockStyle,
    parameters: {},
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.clearAllTimers();
  });

  describe('Rendering', () => {
    it('should render preview component with header', () => {
      render(<StylePreview {...defaultProps} />);

      expect(screen.getByText('Preview: Line Art')).toBeInTheDocument();
      expect(screen.getByText('Clean vector-like outlines')).toBeInTheDocument();
    });

    it('should show original and preview image sections', () => {
      render(<StylePreview {...defaultProps} />);

      expect(screen.getByText('Original')).toBeInTheDocument();
      expect(screen.getByText('Line Art Preview')).toBeInTheDocument();
    });

    it('should display original image', () => {
      render(<StylePreview {...defaultProps} />);

      const originalImage = screen.getByAltText('Original image');
      expect(originalImage).toBeInTheDocument();
      expect(originalImage).toHaveAttribute('src', mockImage);
    });
  });

  describe('Loading State', () => {
    it('should show loading state initially', () => {
      render(<StylePreview {...defaultProps} />);

      expect(screen.getByText('Generating preview...')).toBeInTheDocument();
      expect(screen.getByRole('progressbar', { hidden: true })).toBeInTheDocument();
    });

    it('should show cancel button during generation', () => {
      render(<StylePreview {...defaultProps} />);

      expect(screen.getByText('Cancel')).toBeInTheDocument();
    });
  });

  describe('Successful Preview Generation', () => {
    it('should display preview image after successful generation', async () => {
      render(<StylePreview {...defaultProps} />);

      await waitFor(() => {
        const previewImage = screen.getByAltText('Line Art preview');
        expect(previewImage).toBeInTheDocument();
        expect(previewImage).toHaveAttribute('src', 'data:image/png;base64,preview-result');
      });
    });

    it('should show processing metadata', async () => {
      render(<StylePreview {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByText('Processing Details')).toBeInTheDocument();
        expect(screen.getByText('2.0s')).toBeInTheDocument(); // Processing time
        expect(screen.getByText('10')).toBeInTheDocument(); // Steps
        expect(screen.getByText('256×256')).toBeInTheDocument(); // Size
        expect(screen.getByText('0.6')).toBeInTheDocument(); // Strength
      });
    });

    it('should call onPreviewUpdate callback', async () => {
      const onPreviewUpdate = vi.fn();
      render(<StylePreview {...defaultProps} onPreviewUpdate={onPreviewUpdate} />);

      await waitFor(() => {
        expect(onPreviewUpdate).toHaveBeenCalledWith({
          success: true,
          imageUrl: 'data:image/png;base64,preview-result',
          metadata: expect.any(Object),
        });
      });
    });
  });

  describe('Error Handling', () => {
    it('should show error state when preview fails', async () => {
      mockStyleEngine.generatePreview.mockResolvedValueOnce({
        success: false,
        error: 'Preview generation failed',
      });

      const onError = vi.fn();
      render(<StylePreview {...defaultProps} onError={onError} />);

      await waitFor(() => {
        expect(screen.getByText('Preview failed')).toBeInTheDocument();
        expect(screen.getByText('Preview generation failed')).toBeInTheDocument();
        expect(screen.getByText('Retry')).toBeInTheDocument();
      });

      expect(onError).toHaveBeenCalledWith('Preview generation failed');
    });

    it('should show error state when engine initialization fails', async () => {
      mockStyleEngine.initialize.mockRejectedValueOnce(new Error('Initialization failed'));

      const onError = vi.fn();
      render(<StylePreview {...defaultProps} onError={onError} />);

      await waitFor(() => {
        expect(onError).toHaveBeenCalledWith('Failed to initialize style engine');
      });
    });

    it('should handle retry button click', async () => {
      mockStyleEngine.generatePreview.mockResolvedValueOnce({
        success: false,
        error: 'First attempt failed',
      });

      render(<StylePreview {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByText('Retry')).toBeInTheDocument();
      });

      // Reset mock to succeed on retry
      mockStyleEngine.generatePreview.mockResolvedValueOnce({
        success: true,
        imageUrl: 'data:image/png;base64,retry-success',
        metadata: {
          processingTime: 1500,
          settings: { width: 256, height: 256, steps: 10, strength: 0.6 },
          parameters: { contrast: 1.0, brightness: 1.0, sharpness: 1.0 },
        },
      });

      fireEvent.click(screen.getByText('Retry'));

      await waitFor(() => {
        expect(mockStyleEngine.generatePreview).toHaveBeenCalledTimes(2);
      });
    });
  });

  describe('Cancellation', () => {
    it('should handle cancel button click', async () => {
      render(<StylePreview {...defaultProps} />);

      const cancelButton = screen.getByText('Cancel');
      fireEvent.click(cancelButton);

      expect(mockStyleEngine.cancelProcessing).toHaveBeenCalled();
    });
  });

  describe('Parameter Updates', () => {
    it('should regenerate preview when parameters change', async () => {
      const { rerender } = render(<StylePreview {...defaultProps} />);

      await waitFor(() => {
        expect(mockStyleEngine.generatePreview).toHaveBeenCalledTimes(1);
      });

      // Change parameters
      const newParameters = { contrast: 1.5, brightness: 1.2 };
      rerender(<StylePreview {...defaultProps} parameters={newParameters} />);

      await waitFor(() => {
        expect(mockStyleEngine.generatePreview).toHaveBeenCalledTimes(2);
      }, { timeout: 1000 });

      expect(mockStyleEngine.generatePreview).toHaveBeenLastCalledWith(
        mockImage,
        'line-art',
        newParameters
      );
    });

    it('should regenerate preview when style changes', async () => {
      const { rerender } = render(<StylePreview {...defaultProps} />);

      await waitFor(() => {
        expect(mockStyleEngine.generatePreview).toHaveBeenCalledTimes(1);
      });

      // Change style
      const newStyle = { ...mockStyle, id: 'halftone', name: 'Halftone' };
      rerender(<StylePreview {...defaultProps} style={newStyle} />);

      await waitFor(() => {
        expect(mockStyleEngine.generatePreview).toHaveBeenCalledTimes(2);
      }, { timeout: 1000 });

      expect(mockStyleEngine.generatePreview).toHaveBeenLastCalledWith(
        mockImage,
        'halftone',
        {}
      );
    });

    it('should regenerate preview when image changes', async () => {
      const { rerender } = render(<StylePreview {...defaultProps} />);

      await waitFor(() => {
        expect(mockStyleEngine.generatePreview).toHaveBeenCalledTimes(1);
      });

      // Change image
      const newImage = 'data:image/png;base64,new-image';
      rerender(<StylePreview {...defaultProps} image={newImage} />);

      await waitFor(() => {
        expect(mockStyleEngine.generatePreview).toHaveBeenCalledTimes(2);
      }, { timeout: 1000 });

      expect(mockStyleEngine.generatePreview).toHaveBeenLastCalledWith(
        newImage,
        'line-art',
        {}
      );
    });
  });

  describe('Debouncing', () => {
    it('should debounce rapid parameter changes', async () => {
      vi.useFakeTimers();

      const { rerender } = render(<StylePreview {...defaultProps} />);

      // Make rapid changes
      rerender(<StylePreview {...defaultProps} parameters={{ contrast: 1.1 }} />);
      rerender(<StylePreview {...defaultProps} parameters={{ contrast: 1.2 }} />);
      rerender(<StylePreview {...defaultProps} parameters={{ contrast: 1.3 }} />);

      // Fast-forward past debounce delay
      vi.advanceTimersByTime(600);

      await waitFor(() => {
        // Should only generate preview twice: initial + final
        expect(mockStyleEngine.generatePreview).toHaveBeenCalledTimes(2);
      });

      vi.useRealTimers();
    });
  });

  describe('Cleanup', () => {
    it('should cleanup on unmount', () => {
      const { unmount } = render(<StylePreview {...defaultProps} />);

      unmount();

      // Component should handle cleanup gracefully
      expect(() => unmount()).not.toThrow();
    });
  });

  describe('Accessibility', () => {
    it('should have proper alt text for images', async () => {
      render(<StylePreview {...defaultProps} />);

      expect(screen.getByAltText('Original image')).toBeInTheDocument();

      await waitFor(() => {
        expect(screen.getByAltText('Line Art preview')).toBeInTheDocument();
      });
    });

    it('should have proper button labels', () => {
      render(<StylePreview {...defaultProps} />);

      expect(screen.getByRole('button', { name: /cancel/i })).toBeInTheDocument();
    });
  });
});
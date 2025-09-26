export interface UploadedImage {
  id: string;
  file: File;
  url: string;
  name: string;
  size: number;
  type: string;
  width?: number;
  height?: number;
}

export interface ConversionStyle {
  id: string;
  name: string;
  description: string;
  thumbnail: string;
  prompt: string;
  settings: Record<string, any>;
}

export interface AppState {
  uploadedImage: UploadedImage | null;
  selectedStyle: ConversionStyle | null;
  isProcessing: boolean;
  error: string | null;
}

export type AppAction =
  | { type: 'SET_UPLOADED_IMAGE'; payload: UploadedImage | null }
  | { type: 'SET_SELECTED_STYLE'; payload: ConversionStyle | null }
  | { type: 'SET_PROCESSING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'RESET_STATE' };

// Export extension management types
export * from '../lib/extensions/types';
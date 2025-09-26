import { createContext, useContext, useReducer } from 'react';
import type { ReactNode } from 'react';
import type { AppState, AppAction, UploadedImage, ConversionStyle } from '../types';

const initialState: AppState = {
  uploadedImage: null,
  selectedStyle: null,
  isProcessing: false,
  error: null,
};

function appReducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case 'SET_UPLOADED_IMAGE':
      return {
        ...state,
        uploadedImage: action.payload,
        error: null,
      };
    case 'SET_SELECTED_STYLE':
      return {
        ...state,
        selectedStyle: action.payload,
      };
    case 'SET_PROCESSING':
      return {
        ...state,
        isProcessing: action.payload,
      };
    case 'SET_ERROR':
      return {
        ...state,
        error: action.payload,
        isProcessing: false,
      };
    case 'RESET_STATE':
      return initialState;
    default:
      return state;
  }
}

interface AppContextType {
  state: AppState;
  setUploadedImage: (image: UploadedImage | null) => void;
  setSelectedStyle: (style: ConversionStyle | null) => void;
  setProcessing: (isProcessing: boolean) => void;
  setError: (error: string | null) => void;
  resetState: () => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(appReducer, initialState);

  const contextValue: AppContextType = {
    state,
    setUploadedImage: (image) => dispatch({ type: 'SET_UPLOADED_IMAGE', payload: image }),
    setSelectedStyle: (style) => dispatch({ type: 'SET_SELECTED_STYLE', payload: style }),
    setProcessing: (isProcessing) => dispatch({ type: 'SET_PROCESSING', payload: isProcessing }),
    setError: (error) => dispatch({ type: 'SET_ERROR', payload: error }),
    resetState: () => dispatch({ type: 'RESET_STATE' }),
  };

  return <AppContext.Provider value={contextValue}>{children}</AppContext.Provider>;
}

export function useAppContext() {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  return context;
}
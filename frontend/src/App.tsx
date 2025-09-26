import { AppProvider } from './contexts/AppContext';
import { useAppContext } from './contexts/AppContext';
import Layout from './components/Layout';
import ErrorBoundary from './components/ErrorBoundary';
import ImageUpload from './components/ImageUpload';
import ImagePreview from './components/ImagePreview';
import StyleSelector from './components/StyleSelector';

function MainConverter() {
  const { state } = useAppContext();
  const { uploadedImage, selectedStyle, isProcessing, error } = state;

  return (
    <div className="space-y-8">
      {/* Error Display */}
      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
          <div className="flex items-start">
            <svg
              className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800 dark:text-red-200">Error</h3>
              <p className="mt-1 text-sm text-red-700 dark:text-red-300">{error}</p>
            </div>
          </div>
        </div>
      )}

      {/* Progress Indicator */}
      {isProcessing && (
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
          <div className="flex items-center">
            <div className="animate-spin rounded-full h-5 w-5 border-2 border-blue-500 border-t-transparent"></div>
            <span className="ml-3 text-blue-800 dark:text-blue-200">Processing image...</span>
          </div>
        </div>
      )}

      {/* Main Content Grid */}
      <div className="grid lg:grid-cols-2 gap-8">
        {/* Left Column - Upload and Preview */}
        <div className="space-y-6">
          {!uploadedImage ? (
            <ImageUpload className="col-span-full" />
          ) : (
            <ImagePreview />
          )}
        </div>

        {/* Right Column - Style Selection */}
        <div>
          <StyleSelector />
        </div>
      </div>

      {/* Conversion Controls */}
      {uploadedImage && selectedStyle && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 border-t-4 border-primary-500">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                Ready to Convert
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                Convert "{uploadedImage.name}" using "{selectedStyle.name}" style
              </p>
            </div>
            <div className="flex space-x-3">
              <button
                className="px-4 py-2 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-md transition-colors"
                onClick={() => {
                  // Future: Reset and start over
                }}
              >
                Start Over
              </button>
              <button
                className="px-6 py-2 bg-primary-600 hover:bg-primary-700 text-white font-medium rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={isProcessing}
              >
                {isProcessing ? 'Converting...' : 'Convert Image'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Instructions */}
      <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
          How to Use
        </h3>
        <div className="grid md:grid-cols-3 gap-4 text-sm">
          <div className="flex items-start space-x-3">
            <div className="bg-primary-100 dark:bg-primary-900 rounded-full w-8 h-8 flex items-center justify-center flex-shrink-0">
              <span className="text-primary-600 dark:text-primary-400 font-semibold">1</span>
            </div>
            <div>
              <p className="font-medium text-gray-900 dark:text-white mb-1">Upload Image</p>
              <p className="text-gray-600 dark:text-gray-400">
                Drag and drop or click to select an image file (JPEG, PNG, WebP, etc.)
              </p>
            </div>
          </div>
          <div className="flex items-start space-x-3">
            <div className="bg-primary-100 dark:bg-primary-900 rounded-full w-8 h-8 flex items-center justify-center flex-shrink-0">
              <span className="text-primary-600 dark:text-primary-400 font-semibold">2</span>
            </div>
            <div>
              <p className="font-medium text-gray-900 dark:text-white mb-1">Choose Style</p>
              <p className="text-gray-600 dark:text-gray-400">
                Select a conversion style optimized for laser engraving and cutting
              </p>
            </div>
          </div>
          <div className="flex items-start space-x-3">
            <div className="bg-primary-100 dark:bg-primary-900 rounded-full w-8 h-8 flex items-center justify-center flex-shrink-0">
              <span className="text-primary-600 dark:text-primary-400 font-semibold">3</span>
            </div>
            <div>
              <p className="font-medium text-gray-900 dark:text-white mb-1">Convert</p>
              <p className="text-gray-600 dark:text-gray-400">
                Process your image and download the laser-ready result
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <AppProvider>
        <Layout>
          <MainConverter />
        </Layout>
      </AppProvider>
    </ErrorBoundary>
  );
}

export default App;

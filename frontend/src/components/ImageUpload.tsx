import { useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { useAppContext } from '../contexts/AppContext';
import type { UploadedImage } from '../types';

const ACCEPTED_IMAGE_TYPES = {
  'image/jpeg': ['.jpg', '.jpeg'],
  'image/png': ['.png'],
  'image/webp': ['.webp'],
  'image/gif': ['.gif'],
  'image/bmp': ['.bmp'],
};

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

interface ImageUploadProps {
  className?: string;
}

export default function ImageUpload({ className = '' }: ImageUploadProps) {
  const { setUploadedImage, setError } = useAppContext();

  const createImageObject = useCallback((file: File): Promise<UploadedImage> => {
    return new Promise((resolve, reject) => {
      const url = URL.createObjectURL(file);
      const img = new Image();

      img.onload = () => {
        const uploadedImage: UploadedImage = {
          id: Date.now().toString() + Math.random().toString(36).substring(7),
          file,
          url,
          name: file.name,
          size: file.size,
          type: file.type,
          width: img.naturalWidth,
          height: img.naturalHeight,
        };
        resolve(uploadedImage);
      };

      img.onerror = () => {
        URL.revokeObjectURL(url);
        reject(new Error('Failed to load image'));
      };

      img.src = url;
    });
  }, []);

  const onDrop = useCallback(
    async (acceptedFiles: File[], rejectedFiles: any[]) => {
      setError(null);

      // Handle rejected files
      if (rejectedFiles.length > 0) {
        const errors = rejectedFiles.map(({ file, errors }) => {
          const errorMessages = errors.map((e: any) => {
            switch (e.code) {
              case 'file-too-large':
                return `${file.name} is too large (max ${MAX_FILE_SIZE / 1024 / 1024}MB)`;
              case 'file-invalid-type':
                return `${file.name} is not a supported image format`;
              default:
                return `${file.name}: ${e.message}`;
            }
          });
          return errorMessages.join(', ');
        });
        setError(errors.join('; '));
        return;
      }

      if (acceptedFiles.length === 0) {
        setError('No valid files selected');
        return;
      }

      // Process the first file (we only support single file upload for now)
      const file = acceptedFiles[0];

      try {
        const uploadedImage = await createImageObject(file);
        setUploadedImage(uploadedImage);
      } catch (error) {
        setError(error instanceof Error ? error.message : 'Failed to process image');
      }
    },
    [createImageObject, setUploadedImage, setError]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: ACCEPTED_IMAGE_TYPES,
    maxSize: MAX_FILE_SIZE,
    multiple: false,
  });

  return (
    <div className={`w-full ${className}`}>
      <div
        {...getRootProps()}
        className={`
          relative border-2 border-dashed rounded-lg p-8 text-center cursor-pointer
          transition-all duration-200 ease-in-out
          ${
            isDragActive
              ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20 scale-[1.02]'
              : 'border-gray-300 dark:border-gray-600 hover:border-primary-400 hover:bg-gray-50 dark:hover:bg-gray-800'
          }
          focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2
        `}
      >
        <input {...getInputProps()} />

        <div className="flex flex-col items-center space-y-4">
          <div className={`
            p-4 rounded-full transition-colors
            ${isDragActive
              ? 'bg-primary-100 dark:bg-primary-800'
              : 'bg-gray-100 dark:bg-gray-700'
            }
          `}>
            <svg
              className={`w-8 h-8 ${
                isDragActive ? 'text-primary-600' : 'text-gray-400'
              }`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
              />
            </svg>
          </div>

          <div className="text-center">
            <p className={`text-lg font-medium ${
              isDragActive ? 'text-primary-600' : 'text-gray-700 dark:text-gray-300'
            }`}>
              {isDragActive ? 'Drop your image here' : 'Upload an image'}
            </p>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Drag and drop or click to select
            </p>
            <p className="mt-2 text-xs text-gray-400 dark:text-gray-500">
              Supports: JPEG, PNG, WebP, GIF, BMP (max {MAX_FILE_SIZE / 1024 / 1024}MB)
            </p>
          </div>

          <button
            type="button"
            className="bg-primary-600 hover:bg-primary-700 text-white font-medium py-2 px-6 rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
          >
            Choose Image
          </button>
        </div>
      </div>
    </div>
  );
}
import React, { useState, useRef, DragEvent, ChangeEvent, useEffect } from 'react';
import { ALLOWED_FILE_TYPES, MAX_FILE_SIZE, formatFileSize } from '../lib/fileTypes';
import { uploadFile } from '../lib/supabaseStorage';
import { checkStorageQuota, getStorageQuota } from '../lib/database';
import type { FileAttachment } from '../lib/fileTypes';

interface FileUploadProps {
  projectId?: string;
  taskId?: string;
  userId: string;
  onFileUploaded: (file: FileAttachment) => void;
  onError?: (error: string) => void;
  disabled?: boolean;
  showQuotaInfo?: boolean;
}

const FileUpload: React.FC<FileUploadProps> = ({
  projectId,
  taskId,
  userId,
  onFileUploaded,
  onError,
  disabled = false,
  showQuotaInfo = true
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [quotaInfo, setQuotaInfo] = useState<{ used: number; limit: number } | null>(null);
  const [uploadSpeed, setUploadSpeed] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const startTimeRef = useRef<number>(0);

  // Load quota info on mount
  useEffect(() => {
    const loadQuota = async () => {
      if (projectId && showQuotaInfo) {
        const quota = await getStorageQuota(projectId, userId);
        setQuotaInfo(quota);
      }
    };
    loadQuota();
  }, [projectId, userId, showQuotaInfo]);

  const validateFile = async (file: File): Promise<string | null> => {
    // Check file size
    if (file.size > MAX_FILE_SIZE) {
      return `File size exceeds ${formatFileSize(MAX_FILE_SIZE)} limit`;
    }

    // Check file type by MIME type and file extension
    const allowedTypes = Object.keys(ALLOWED_FILE_TYPES);
    const fileExtension = '.' + file.name.split('.').pop()?.toLowerCase();

    let isAllowed = false;

    // Check if MIME type is allowed
    if (allowedTypes.includes(file.type)) {
      isAllowed = true;
    } else {
      // Check if file extension matches any allowed types
      for (const [mimeType, extensions] of Object.entries(ALLOWED_FILE_TYPES)) {
        if (extensions.some(ext => ext.toLowerCase() === fileExtension)) {
          isAllowed = true;
          break;
        }
      }
    }

    if (!isAllowed) {
      return `File type not allowed. Supported: PDF, images, Word, Excel, PowerPoint, CSV, TXT`;
    }

    // Check storage quota
    if (projectId) {
      const quotaCheck = await checkStorageQuota(projectId, userId, file.size);
      if (!quotaCheck.allowed) {
        return quotaCheck.message;
      }
      if (quotaCheck.message !== 'OK') {
        // Warning but still allow upload
        console.warn(quotaCheck.message);
      }
    }

    return null;
  };

  const handleFileUpload = async (file: File) => {
    const validationError = await validateFile(file);
    if (validationError) {
      onError?.(validationError);
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);
    startTimeRef.current = Date.now();

    try {
      // Simulate realistic progress with better estimate
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev < 30) return prev + Math.random() * 10;
          if (prev < 70) return prev + Math.random() * 5;
          if (prev < 90) return prev + Math.random() * 2;
          return 90;
        });

        // Calculate upload speed
        if (startTimeRef.current) {
          const elapsedSeconds = (Date.now() - startTimeRef.current) / 1000;
          const bytesPerSecond = file.size / elapsedSeconds;
          setUploadSpeed(formatFileSize(bytesPerSecond) + '/s');
        }
      }, 300);

      const attachment = await uploadFile(file, userId, projectId, taskId);

      if (attachment) {
        setUploadProgress(100);
        onFileUploaded(attachment);

        // Reload quota after successful upload
        if (projectId) {
          const newQuota = await getStorageQuota(projectId, userId);
          setQuotaInfo(newQuota);
        }

        // Reset after short delay
        setTimeout(() => {
          setIsUploading(false);
          setUploadProgress(0);
          setUploadSpeed('');
        }, 500);
      } else {
        throw new Error('Upload failed');
      }

      clearInterval(progressInterval);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to upload file';
      onError?.(errorMessage);
      setIsUploading(false);
      setUploadProgress(0);
      setUploadSpeed('');
    }
  };

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (!disabled && !isUploading) {
      setIsDragging(true);
    }
  };

  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    if (disabled || isUploading) return;

    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      handleFileUpload(files[0]); // Upload first file only
    }
  };

  const handleFileInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFileUpload(files[0]);
    }
    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleClick = () => {
    if (!disabled && !isUploading) {
      fileInputRef.current?.click();
    }
  };

  return (
    <div className="w-full">
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={handleClick}
        className={`
          relative border-2 border-dashed rounded-lg p-6 text-center transition-all cursor-pointer
          ${isDragging 
            ? 'border-[var(--accent-primary)] bg-[var(--accent-primary)]/10' 
            : 'border-[var(--border-primary)] hover:border-[var(--accent-primary)]/50'
          }
          ${disabled || isUploading ? 'opacity-50 cursor-not-allowed' : 'hover:bg-[var(--bg-tertiary)]'}
        `}
      >
        <input
          ref={fileInputRef}
          type="file"
          onChange={handleFileInputChange}
          accept={Object.values(ALLOWED_FILE_TYPES).flat().join(',')}
          className="hidden"
          disabled={disabled || isUploading}
        />

        {isUploading ? (
          <div className="space-y-3">
            <div className="flex items-center justify-center">
              <svg className="animate-spin h-8 w-8 text-[var(--accent-primary)]" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            </div>
            <div className="text-sm text-[var(--text-secondary)]">
              Uploading... {Math.round(uploadProgress)}%
            </div>
            <div className="w-full bg-[var(--bg-tertiary)] rounded-full h-2">
              <div
                className="bg-[var(--accent-primary)] h-2 rounded-full transition-all duration-300"
                style={{ width: `${uploadProgress}%` }}
              />
            </div>
            {uploadSpeed && (
              <div className="text-xs text-[var(--text-tertiary)] text-center">
                Speed: {uploadSpeed}
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            <div className="flex justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-[var(--text-tertiary)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
            </div>
            <div>
              <p className="text-sm text-[var(--text-primary)] font-medium">
                {isDragging ? 'Drop file here' : 'Drag & drop or click to upload'}
              </p>
              <p className="text-xs text-[var(--text-tertiary)] mt-1">
                PDF, images, docs up to {formatFileSize(MAX_FILE_SIZE)}
              </p>
            </div>

            {/* Storage Quota Info */}
            {showQuotaInfo && quotaInfo && (
              <div className="pt-2 border-t border-[var(--border-primary)]">
                <div className="text-xs text-[var(--text-tertiary)] mb-2">
                  Storage: {formatFileSize(quotaInfo.used)} / {formatFileSize(quotaInfo.limit)}
                </div>
                <div className="w-full bg-[var(--bg-tertiary)] rounded-full h-1.5">
                  <div
                    className={`h-1.5 rounded-full transition-all ${
                      (quotaInfo.used / quotaInfo.limit) * 100 > 90
                        ? 'bg-red-500'
                        : 'bg-[var(--accent-primary)]'
                    }`}
                    style={{ width: `${(quotaInfo.used / quotaInfo.limit) * 100}%` }}
                  />
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default FileUpload;
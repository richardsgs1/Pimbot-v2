import React, { useState } from 'react';
import type { FileAttachment } from '../lib/fileTypes';
import { formatFileSize, getFileIcon } from '../lib/fileTypes';
import { deleteFile, downloadFile } from '../lib/supabaseStorage';

interface FileListProps {
  files: FileAttachment[];
  onFileDeleted: (fileId: string) => void;
  canDelete?: boolean;
  showUploader?: boolean;
}

const FileList: React.FC<FileListProps> = ({ 
  files, 
  onFileDeleted, 
  canDelete = true,
  showUploader = true 
}) => {
  const [deletingFileId, setDeletingFileId] = useState<string | null>(null);
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  const handleDelete = async (file: FileAttachment) => {
    if (!window.confirm(`Delete "${file.name}"?`)) return;

    setDeletingFileId(file.id);
    const success = await deleteFile(file.url);
    
    if (success) {
      onFileDeleted(file.id);
    } else {
      alert('Failed to delete file. Please try again.');
    }
    
    setDeletingFileId(null);
  };

  const handleDownload = (file: FileAttachment) => {
    downloadFile(file.url, file.name);
  };

  const handlePreview = (file: FileAttachment) => {
    if (file.type.startsWith('image/')) {
      setPreviewImage(file.url);
    } else {
      // For non-images, just open in new tab
      window.open(file.url, '_blank');
    }
  };

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  if (files.length === 0) {
    return (
      <div className="text-center py-8 text-[var(--text-tertiary)] text-sm">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto mb-2 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
        </svg>
        No files attached
      </div>
    );
  }

  return (
    <>
      <div className="space-y-2">
        {files.map(file => (
          <div
            key={file.id}
            className="flex items-center gap-3 p-3 bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-lg hover:bg-[var(--bg-tertiary)] transition-colors"
          >
            {/* File Icon */}
            <div className="text-3xl flex-shrink-0">
              {getFileIcon(file.type)}
            </div>

            {/* File Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handlePreview(file)}
                  className="text-sm font-medium text-[var(--text-primary)] hover:text-[var(--accent-primary)] truncate transition-colors text-left"
                  title={file.name}
                >
                  {file.name}
                </button>
                {file.type.startsWith('image/') && (
                  <span className="text-xs px-2 py-0.5 bg-[var(--accent-primary)]/20 text-[var(--accent-primary)] rounded">
                    Preview
                  </span>
                )}
              </div>
              <div className="flex items-center gap-3 mt-1 text-xs text-[var(--text-tertiary)]">
                <span>{formatFileSize(file.size)}</span>
                <span>•</span>
                {showUploader && (
                  <>
                    <span>{file.uploadedBy}</span>
                    <span>•</span>
                  </>
                )}
                <span>{formatDate(file.uploadedAt)}</span>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2 flex-shrink-0">
              <button
                onClick={() => handleDownload(file)}
                className="p-2 hover:bg-[var(--bg-primary)] rounded transition-colors"
                title="Download"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-[var(--text-secondary)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
              </button>

              {canDelete && (
                <button
                  onClick={() => handleDelete(file)}
                  disabled={deletingFileId === file.id}
                  className="p-2 hover:bg-red-500/10 rounded transition-colors disabled:opacity-50"
                  title="Delete"
                >
                  {deletingFileId === file.id ? (
                    <svg className="animate-spin h-5 w-5 text-red-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                  ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  )}
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Image Preview Modal */}
      {previewImage && (
        <div 
          className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4"
          onClick={() => setPreviewImage(null)}
        >
          <div className="relative max-w-4xl max-h-[90vh]">
            <button
              onClick={() => setPreviewImage(null)}
              className="absolute -top-10 right-0 text-white hover:text-gray-300 transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            <img
              src={previewImage}
              alt="Preview"
              className="max-w-full max-h-[90vh] object-contain rounded-lg"
              onClick={(e) => e.stopPropagation()}
            />
          </div>
        </div>
      )}
    </>
  );
};

export default FileList;
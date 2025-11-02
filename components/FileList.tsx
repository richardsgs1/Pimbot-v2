import React, { useState, useMemo } from 'react';
import type { FileAttachment } from '../lib/fileTypes';
import { formatFileSize, getFileIcon } from '../lib/fileTypes';
import { deleteFile, downloadFile } from '../lib/supabaseStorage';

type SortBy = 'name' | 'size' | 'date';
type SortOrder = 'asc' | 'desc';

interface FileListProps {
  files: FileAttachment[];
  onFileDeleted: (fileId: string) => void;
  canDelete?: boolean;
  showUploader?: boolean;
  enableSearch?: boolean;
}

const FileList: React.FC<FileListProps> = ({
  files,
  onFileDeleted,
  canDelete = true,
  showUploader = true,
  enableSearch = true
}) => {
  const [deletingFileId, setDeletingFileId] = useState<string | null>(null);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [sortBy, setSortBy] = useState<SortBy>('date');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
  const [selectedFiles, setSelectedFiles] = useState<Set<string>>(new Set());

  // Get unique file types for filter dropdown
  const fileTypes = useMemo(() => {
    const types = new Set(files.map(f => f.type));
    return Array.from(types).sort();
  }, [files]);

  // Filter and sort files
  const filteredFiles = useMemo(() => {
    let result = [...files];

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(f => f.name.toLowerCase().includes(query));
    }

    // Apply type filter
    if (selectedType !== 'all') {
      result = result.filter(f => f.type === selectedType);
    }

    // Apply sorting
    result.sort((a, b) => {
      let comparison = 0;

      if (sortBy === 'name') {
        comparison = a.name.localeCompare(b.name);
      } else if (sortBy === 'size') {
        comparison = a.size - b.size;
      } else if (sortBy === 'date') {
        comparison = new Date(a.uploadedAt).getTime() - new Date(b.uploadedAt).getTime();
      }

      return sortOrder === 'asc' ? comparison : -comparison;
    });

    return result;
  }, [files, searchQuery, selectedType, sortBy, sortOrder]);

  const handleDelete = async (file: FileAttachment) => {
    if (!window.confirm(`Delete "${file.name}"?`)) return;

    setDeletingFileId(file.id);
    const success = await deleteFile(file.url);

    if (success) {
      onFileDeleted(file.id);
      setSelectedFiles(prev => {
        const updated = new Set(prev);
        updated.delete(file.id);
        return updated;
      });
    } else {
      alert('Failed to delete file. Please try again.');
    }

    setDeletingFileId(null);
  };

  const handleBulkDelete = async () => {
    if (selectedFiles.size === 0) return;

    const fileCount = selectedFiles.size;
    if (!window.confirm(`Delete ${fileCount} file(s)?`)) return;

    for (const fileId of selectedFiles) {
      const file = files.find(f => f.id === fileId);
      if (file) {
        setDeletingFileId(fileId);
        const success = await deleteFile(file.url);
        if (success) {
          onFileDeleted(fileId);
        }
      }
    }

    setDeletingFileId(null);
    setSelectedFiles(new Set());
  };

  const handleBulkDownload = () => {
    if (selectedFiles.size === 0) return;

    for (const fileId of selectedFiles) {
      const file = files.find(f => f.id === fileId);
      if (file) {
        downloadFile(file.url, file.name);
      }
    }
  };

  const toggleFileSelection = (fileId: string) => {
    const updated = new Set(selectedFiles);
    if (updated.has(fileId)) {
      updated.delete(fileId);
    } else {
      updated.add(fileId);
    }
    setSelectedFiles(updated);
  };

  const toggleSelectAll = () => {
    if (selectedFiles.size === filteredFiles.length) {
      setSelectedFiles(new Set());
    } else {
      setSelectedFiles(new Set(filteredFiles.map(f => f.id)));
    }
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

  const getTypeCategory = (type: string): string => {
    if (type.startsWith('image/')) return 'Images';
    if (type === 'application/pdf') return 'Documents';
    if (type.includes('word')) return 'Documents';
    if (type.includes('sheet')) return 'Spreadsheets';
    if (type.includes('presentation')) return 'Presentations';
    if (type === 'text/csv') return 'Data';
    if (type === 'text/plain') return 'Text';
    return 'Other';
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
      {/* Search and Filter Controls */}
      {enableSearch && (
        <div className="space-y-3 mb-4">
          {/* Search Bar */}
          <div className="flex gap-2">
            <div className="flex-1 relative">
              <svg xmlns="http://www.w3.org/2000/svg" className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-[var(--text-tertiary)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                placeholder="Search files..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-lg text-sm text-[var(--text-primary)] placeholder-[var(--text-tertiary)] focus:outline-none focus:border-[var(--accent-primary)]"
              />
            </div>
          </div>

          {/* Filters Row */}
          <div className="flex flex-wrap gap-2">
            {/* Type Filter */}
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="px-3 py-2 bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded text-sm text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-primary)]"
            >
              <option value="all">All Types</option>
              {fileTypes.map(type => (
                <option key={type} value={type}>
                  {getTypeCategory(type)}
                </option>
              ))}
            </select>

            {/* Sort By */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortBy)}
              className="px-3 py-2 bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded text-sm text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-primary)]"
            >
              <option value="date">Sort by Date</option>
              <option value="name">Sort by Name</option>
              <option value="size">Sort by Size</option>
            </select>

            {/* Sort Order Toggle */}
            <button
              onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
              className="px-3 py-2 bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded text-sm text-[var(--text-primary)] hover:bg-[var(--bg-tertiary)] transition-colors"
              title={sortOrder === 'asc' ? 'Ascending' : 'Descending'}
            >
              {sortOrder === 'asc' ? '↑' : '↓'}
            </button>

            {/* Bulk Actions */}
            {selectedFiles.size > 0 && (
              <>
                <div className="flex-1" />
                <button
                  onClick={handleBulkDownload}
                  className="px-3 py-2 bg-[var(--accent-primary)] text-white rounded text-sm hover:opacity-90 transition-opacity"
                >
                  Download ({selectedFiles.size})
                </button>
                {canDelete && (
                  <button
                    onClick={handleBulkDelete}
                    className="px-3 py-2 bg-red-500/20 text-red-500 rounded text-sm hover:bg-red-500/30 transition-colors"
                  >
                    Delete ({selectedFiles.size})
                  </button>
                )}
              </>
            )}
          </div>

          {/* Results Info */}
          <div className="text-xs text-[var(--text-tertiary)]">
            {filteredFiles.length} of {files.length} files
            {searchQuery && ` matching "${searchQuery}"`}
            {selectedType !== 'all' && ` (${getTypeCategory(selectedType)})`}
          </div>
        </div>
      )}

      {/* File List */}
      {filteredFiles.length === 0 ? (
        <div className="text-center py-8 text-[var(--text-tertiary)] text-sm">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto mb-2 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
          </svg>
          No files found
        </div>
      ) : (
        <div className="space-y-2">
          {filteredFiles.map(file => (
            <div
              key={file.id}
              className={`flex items-center gap-3 p-3 bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-lg hover:bg-[var(--bg-tertiary)] transition-colors ${
                selectedFiles.has(file.id) ? 'border-[var(--accent-primary)]' : ''
              }`}
            >
              {/* Checkbox */}
              <input
                type="checkbox"
                checked={selectedFiles.has(file.id)}
                onChange={() => toggleFileSelection(file.id)}
                className="w-4 h-4 rounded cursor-pointer"
              />

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
      )}

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
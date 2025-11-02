// File attachment types for projects and tasks

export interface FileAttachment {
  id: string;
  name: string;
  size: number; // in bytes
  type: string; // MIME type
  url: string; // Supabase storage URL
  uploadedAt: string; // ISO date string
  uploadedBy: string; // user ID or name
  projectId?: string; // if attached to project
  taskId?: string; // if attached to task
}

export const ALLOWED_FILE_TYPES = {
  'application/pdf': ['.pdf'],
  'image/jpeg': ['.jpg', '.jpeg'],
  'image/png': ['.png'],
  'image/gif': ['.gif'],
  'image/webp': ['.webp'],
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
  'application/vnd.ms-excel': ['.xls'],
  'application/vnd.openxmlformats-officedocument.presentationml.presentation': ['.pptx'],
  'application/vnd.ms-powerpoint': ['.ppt'],
  'text/plain': ['.txt'],
  'text/csv': ['.csv'],
  // Fallback for files with unclear MIME types
  'application/octet-stream': ['.xlsx', '.xls', '.docx', '.pptx'],
};

export const MAX_FILE_SIZE = 25 * 1024 * 1024; // 25MB in bytes
export const MAX_TASK_STORAGE = 100 * 1024 * 1024; // 100MB
export const MAX_PROJECT_STORAGE = 500 * 1024 * 1024; // 500MB

export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
};

export const getFileIcon = (type: string): string => {
  if (type.startsWith('image/')) return '🖼️';
  if (type === 'application/pdf') return '📄';
  if (type.includes('word')) return '📝';
  if (type.includes('sheet')) return '📊';
  if (type.includes('presentation')) return '📽️';
  if (type === 'text/csv') return '📋';
  return '📎';
};
import { createClient } from '@supabase/supabase-js';
import type { FileAttachment } from './fileTypes';
import { MAX_FILE_SIZE } from './fileTypes';

// Initialize Supabase client
// Use Vite environment variables (not Next.js process.env)
let supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
let supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

// Fallback to hardcoded values if env vars are not set
if (!supabaseUrl || supabaseUrl.trim() === '') {
  supabaseUrl = 'https://qfkhxrcbtgllzffnnxhp.supabase.co'
}

if (!supabaseAnonKey || supabaseAnonKey.trim() === '') {
  supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFma2h4cmNidGdsbHpmZm5ueGhwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTkwODczNTYsImV4cCI6MjA3NDY2MzM1Nn0.49ZEbRyFRfYew-JRq4tRj_6P7nv6vPrvmQ-IDKc1g5s'
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Storage bucket name - you'll need to create this in Supabase dashboard
const STORAGE_BUCKET = 'pimbot-attachments';

/**
 * Upload a file to Supabase Storage
 * @param file - The file to upload
 * @param projectId - Optional project ID
 * @param taskId - Optional task ID
 * @param userId - User uploading the file
 * @returns FileAttachment object or null if failed
 */
export const uploadFile = async (
  file: File,
  userId: string,
  projectId?: string,
  taskId?: string
): Promise<FileAttachment | null> => {
  try {
    // IMPORTANT: Get the authenticated user's UID for RLS policies
    // The storage bucket RLS uses auth.uid() which must be in the file path
    const authUser = await supabase.auth.getUser();
    const authUid = authUser.data.user?.id;

    if (!authUid) {
      throw new Error('No authenticated user found. Please log in again.');
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      throw new Error(`File size exceeds ${MAX_FILE_SIZE / 1024 / 1024}MB limit`);
    }

    // Create unique file path
    // Format: {authUid}/{projectId}/{taskId}/{timestamp}-{filename}
    // RLS policies expect auth.uid() to match the first folder level
    const timestamp = Date.now();
    const sanitizedName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
    const filePath = `${authUid}/${projectId || 'general'}/${taskId || 'project'}/${timestamp}-${sanitizedName}`;

    // Upload to Supabase Storage
    const { data, error } = await supabase.storage
      .from(STORAGE_BUCKET)
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false
      });

    if (error) {
      console.error('Upload error:', error);
      throw error;
    }

    // Get signed URL (valid for 1 year for RLS)
    // For private buckets, we'll store the path and generate signed URLs when needed
    const { data: urlData, error: urlError } = await supabase.storage
      .from(STORAGE_BUCKET)
      .createSignedUrl(filePath, 31536000); // 1 year in seconds

    if (urlError || !urlData) {
      throw new Error('Failed to generate signed URL');
    }

    // Create attachment object
    const attachment: FileAttachment = {
      id: `${timestamp}-${Math.random().toString(36).substr(2, 9)}`,
      name: file.name,
      size: file.size,
      type: file.type,
      url: urlData.signedUrl, // Use signed URL for secure access
      uploadedAt: new Date().toISOString(),
      uploadedBy: userId,
      projectId,
      taskId
    };

    return attachment;
  } catch (error) {
    console.error('Error uploading file:', error);
    return null;
  }
};

/**
 * Delete a file from Supabase Storage
 * @param fileUrl - The public URL of the file
 * @returns boolean indicating success
 */
export const deleteFile = async (fileUrl: string): Promise<boolean> => {
  try {
    // Extract file path from URL
    const urlParts = fileUrl.split(`/${STORAGE_BUCKET}/`);
    if (urlParts.length < 2) {
      throw new Error('Invalid file URL');
    }
    const filePath = urlParts[1];

    const { error } = await supabase.storage
      .from(STORAGE_BUCKET)
      .remove([filePath]);

    if (error) {
      console.error('Delete error:', error);
      throw error;
    }

    return true;
  } catch (error) {
    console.error('Error deleting file:', error);
    return false;
  }
};

/**
 * Download a file (opens in new tab)
 * @param fileUrl - The public URL of the file
 * @param fileName - The name to use when downloading
 */
export const downloadFile = (fileUrl: string, fileName: string): void => {
  const link = document.createElement('a');
  link.href = fileUrl;
  link.download = fileName;
  link.target = '_blank';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

/**
 * Get total storage used by project or task
 * @param attachments - Array of file attachments
 * @returns Total size in bytes
 */
export const getTotalStorageUsed = (attachments: FileAttachment[]): number => {
  return attachments.reduce((total, file) => total + file.size, 0);
};
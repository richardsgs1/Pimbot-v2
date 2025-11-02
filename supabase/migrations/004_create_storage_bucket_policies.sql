-- Storage bucket RLS policies for pimbot-attachments bucket
-- These policies control who can upload, download, and delete files in the storage bucket

-- First, check if bucket exists. If not, it needs to be created in Supabase dashboard:
-- 1. Go to Supabase dashboard
-- 2. Storage > New Bucket
-- 3. Name: pimbot-attachments
-- 4. Privacy: Private (RLS enabled)

-- Enable RLS on storage.objects for the bucket (if it exists)
-- Note: Storage bucket policies are managed separately from table RLS

-- Policy 1: Users can upload files to their project folders
-- File path format: {projectId}/{taskId}/{timestamp}-{filename}
CREATE POLICY "Users can upload files to their projects"
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'pimbot-attachments'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

-- Policy 2: Users can read files from their projects or shared projects
CREATE POLICY "Users can view files from their projects"
  ON storage.objects
  FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'pimbot-attachments'
    AND (
      auth.uid()::text = (storage.foldername(name))[1]
      OR
      auth.uid()::text IN (
        SELECT user_id::text FROM projects WHERE id::text = (storage.foldername(name))[1]
        UNION
        SELECT jsonb_array_elements(team_members)->>'id' FROM projects WHERE id::text = (storage.foldername(name))[1]
      )
    )
  );

-- Policy 3: Users can delete their own files
CREATE POLICY "Users can delete their own files"
  ON storage.objects
  FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'pimbot-attachments'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

-- Policy 4: Users can update file metadata
CREATE POLICY "Users can update file metadata"
  ON storage.objects
  FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'pimbot-attachments'
    AND auth.uid()::text = (storage.foldername(name))[1]
  )
  WITH CHECK (
    bucket_id = 'pimbot-attachments'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

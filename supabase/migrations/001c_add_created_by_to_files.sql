-- Add created_by column to files table if it doesn't exist
-- This fixes RLS policies that depend on created_by

ALTER TABLE files ADD COLUMN IF NOT EXISTS created_by UUID;

-- Create index for created_by if not exists
CREATE INDEX IF NOT EXISTS idx_files_created_by ON files(created_by);

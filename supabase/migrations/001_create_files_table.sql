-- Create files table for storing file metadata
-- Note: Removed foreign key constraints to projects/tasks tables
-- These will be added via RLS policies instead
CREATE TABLE files (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  size INTEGER NOT NULL,
  type TEXT NOT NULL,
  file_path TEXT NOT NULL,
  project_id UUID,
  task_id UUID,
  created_by UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE INDEX idx_files_project_id ON files(project_id);
CREATE INDEX idx_files_task_id ON files(task_id);
CREATE INDEX idx_files_created_by ON files(created_by);
CREATE INDEX idx_files_created_at ON files(created_at);
CREATE INDEX idx_files_name ON files(name);
CREATE INDEX idx_files_type ON files(type);

-- Create file_storage_quota table
CREATE TABLE file_storage_quota (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL,
  user_id UUID NOT NULL,
  total_size_bytes INTEGER DEFAULT 0,
  quota_limit_bytes INTEGER NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(project_id, user_id)
);

CREATE INDEX idx_quota_project_id ON file_storage_quota(project_id);
CREATE INDEX idx_quota_user_id ON file_storage_quota(user_id);

-- Create file_access_log table
CREATE TABLE file_access_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  file_id UUID NOT NULL,
  user_id UUID,
  action TEXT NOT NULL,
  accessed_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE INDEX idx_access_log_file_id ON file_access_log(file_id);
CREATE INDEX idx_access_log_user_id ON file_access_log(user_id);
CREATE INDEX idx_access_log_accessed_at ON file_access_log(accessed_at);

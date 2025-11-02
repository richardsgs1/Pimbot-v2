-- Create file_storage_quota table if it doesn't exist
-- This migration creates tables that may have been skipped in 001

CREATE TABLE IF NOT EXISTS file_storage_quota (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL,
  user_id UUID NOT NULL,
  total_size_bytes INTEGER DEFAULT 0,
  quota_limit_bytes INTEGER NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(project_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_quota_project_id ON file_storage_quota(project_id);
CREATE INDEX IF NOT EXISTS idx_quota_user_id ON file_storage_quota(user_id);

-- Create file_access_log table if it doesn't exist
CREATE TABLE IF NOT EXISTS file_access_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  file_id UUID NOT NULL,
  user_id UUID,
  action TEXT NOT NULL,
  accessed_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_access_log_file_id ON file_access_log(file_id);
CREATE INDEX IF NOT EXISTS idx_access_log_user_id ON file_access_log(user_id);
CREATE INDEX IF NOT EXISTS idx_access_log_accessed_at ON file_access_log(accessed_at);

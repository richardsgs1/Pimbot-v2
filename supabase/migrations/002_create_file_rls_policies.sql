-- Enable Row Level Security on files tables
ALTER TABLE files ENABLE ROW LEVEL SECURITY;
ALTER TABLE file_storage_quota ENABLE ROW LEVEL SECURITY;
ALTER TABLE file_access_log ENABLE ROW LEVEL SECURITY;

-- Files table RLS policies
-- Policy 1: Users can view files in projects they have access to
CREATE POLICY "Users can view project files"
  ON files FOR SELECT
  USING (
    -- Users can view files if:
    -- 1. They created the file, OR
    -- 2. They are a member of the project team, OR
    -- 3. They are the project owner
    created_by = auth.uid()
    OR
    project_id IN (
      SELECT id FROM projects WHERE user_id = auth.uid()
      UNION
      SELECT id FROM projects WHERE team_members @> jsonb_build_array(
        jsonb_build_object('id', auth.uid()::text)
      )
    )
  );

-- Policy 2: Users can insert files they created in their projects
CREATE POLICY "Users can upload files to their projects"
  ON files FOR INSERT
  WITH CHECK (
    -- Can only insert if uploading to own project
    auth.uid() = created_by
    AND project_id IN (
      SELECT id FROM projects WHERE user_id = auth.uid()
      OR team_members @> jsonb_build_array(
        jsonb_build_object('id', auth.uid()::text)
      )
    )
  );

-- Policy 3: Users can delete only their own files or if they're project manager
CREATE POLICY "Users can delete their own files"
  ON files FOR DELETE
  USING (
    auth.uid() = created_by
    OR
    project_id IN (
      SELECT id FROM projects WHERE user_id = auth.uid()
    )
  );

-- Policy 4: Users can update file metadata (name, etc.)
CREATE POLICY "Users can update their files"
  ON files FOR UPDATE
  USING (
    auth.uid() = created_by
    OR
    project_id IN (
      SELECT id FROM projects WHERE user_id = auth.uid()
    )
  )
  WITH CHECK (
    auth.uid() = created_by
    OR
    project_id IN (
      SELECT id FROM projects WHERE user_id = auth.uid()
    )
  );

-- File storage quota RLS policies
CREATE POLICY "Users can view quota for their projects"
  ON file_storage_quota FOR SELECT
  USING (
    auth.uid() = user_id
    OR
    project_id IN (
      SELECT id FROM projects WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "System can manage quotas"
  ON file_storage_quota FOR INSERT
  WITH CHECK (
    auth.uid() = user_id
  );

CREATE POLICY "System can update quotas"
  ON file_storage_quota FOR UPDATE
  USING (
    auth.uid() = user_id
    OR
    project_id IN (
      SELECT id FROM projects WHERE user_id = auth.uid()
    )
  )
  WITH CHECK (
    auth.uid() = user_id
    OR
    project_id IN (
      SELECT id FROM projects WHERE user_id = auth.uid()
    )
  );

-- File access log RLS policies
CREATE POLICY "Users can view access logs for their files"
  ON file_access_log FOR SELECT
  USING (
    file_id IN (
      SELECT id FROM files WHERE
      auth.uid() = created_by
      OR project_id IN (
        SELECT id FROM projects WHERE user_id = auth.uid()
      )
    )
  );

CREATE POLICY "System can insert access logs"
  ON file_access_log FOR INSERT
  WITH CHECK (
    auth.uid() = user_id
    OR user_id IS NULL
  );

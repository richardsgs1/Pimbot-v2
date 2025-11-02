-- Enable Row Level Security on files tables
ALTER TABLE files ENABLE ROW LEVEL SECURITY;
ALTER TABLE file_storage_quota ENABLE ROW LEVEL SECURITY;
ALTER TABLE file_access_log ENABLE ROW LEVEL SECURITY;

-- Files table RLS policies
-- Policy 1: Users can view files they created or in their projects
CREATE POLICY "Users can view files"
  ON files FOR SELECT
  USING (
    created_by = auth.uid()
    OR
    project_id IN (
      SELECT id FROM projects WHERE user_id = auth.uid()
    )
  );

-- Policy 2: Users can insert files they created
CREATE POLICY "Users can upload files"
  ON files FOR INSERT
  WITH CHECK (
    auth.uid() = created_by
  );

-- Policy 3: Users can delete their own files or project owner can delete
CREATE POLICY "Users can delete files"
  ON files FOR DELETE
  USING (
    auth.uid() = created_by
    OR
    project_id IN (
      SELECT id FROM projects WHERE user_id = auth.uid()
    )
  );

-- Policy 4: Users can update their own files
CREATE POLICY "Users can update files"
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
CREATE POLICY "Users can view quota"
  ON file_storage_quota FOR SELECT
  USING (
    auth.uid() = user_id
    OR
    project_id IN (
      SELECT id FROM projects WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can manage quota"
  ON file_storage_quota FOR INSERT
  WITH CHECK (
    auth.uid() = user_id
  );

CREATE POLICY "Users can update quota"
  ON file_storage_quota FOR UPDATE
  USING (
    auth.uid() = user_id
  )
  WITH CHECK (
    auth.uid() = user_id
  );

-- File access log RLS policies
CREATE POLICY "Users can view access logs"
  ON file_access_log FOR SELECT
  USING (
    file_id IN (
      SELECT id FROM files WHERE created_by = auth.uid()
    )
  );

CREATE POLICY "System can insert access logs"
  ON file_access_log FOR INSERT
  WITH CHECK (
    user_id = auth.uid() OR user_id IS NULL
  );

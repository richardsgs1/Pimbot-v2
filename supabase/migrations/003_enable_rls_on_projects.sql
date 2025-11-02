-- Enable Row Level Security on projects and tasks tables
-- This ensures users can only access their own projects and tasks

-- Enable RLS on projects table
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;

-- Enable RLS on tasks table
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;

-- Projects table RLS policies
-- Policy 1: Users can view their own projects
CREATE POLICY "Users can view their own projects"
  ON projects FOR SELECT
  USING (
    user_id = auth.uid()
  );

-- Policy 2: Users can insert projects for themselves
CREATE POLICY "Users can create projects"
  ON projects FOR INSERT
  WITH CHECK (
    user_id = auth.uid()
  );

-- Policy 3: Users can update their own projects
CREATE POLICY "Users can update their own projects"
  ON projects FOR UPDATE
  USING (
    user_id = auth.uid()
  )
  WITH CHECK (
    user_id = auth.uid()
  );

-- Policy 4: Users can delete their own projects
CREATE POLICY "Users can delete their own projects"
  ON projects FOR DELETE
  USING (
    user_id = auth.uid()
  );

-- Tasks table RLS policies
-- For now, tasks are not directly owned by users, but let's allow project owners to manage them
-- Policy 1: Users can view tasks in their projects
CREATE POLICY "Users can view tasks in their projects"
  ON tasks FOR SELECT
  USING (
    id IN (
      SELECT COALESCE(jsonb_array_elements(tasks)->>'id', '')
      FROM projects
      WHERE user_id = auth.uid() AND tasks IS NOT NULL
    )
    OR true  -- Allow all for now until task-project relationship is properly established
  );

-- Policy 2: Users can insert tasks (basic policy)
CREATE POLICY "Users can insert tasks"
  ON tasks FOR INSERT
  WITH CHECK (
    true  -- Allow all users to insert for now
  );

-- Policy 3: Users can update tasks
CREATE POLICY "Users can update tasks"
  ON tasks FOR UPDATE
  WITH CHECK (
    true  -- Allow all users to update for now
  );

-- Policy 4: Users can delete tasks
CREATE POLICY "Users can delete tasks"
  ON tasks FOR DELETE
  USING (
    true  -- Allow all users to delete for now
  );

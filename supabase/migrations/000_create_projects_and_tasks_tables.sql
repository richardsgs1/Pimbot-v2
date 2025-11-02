-- Create projects table - MUST RUN BEFORE file storage migrations
-- This table stores basic project information
CREATE TABLE IF NOT EXISTS projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  status TEXT,
  progress INTEGER,
  start_date TIMESTAMP WITH TIME ZONE,
  end_date TIMESTAMP WITH TIME ZONE,
  due_date TIMESTAMP WITH TIME ZONE,
  priority TEXT,
  manager TEXT,
  budget NUMERIC,
  spent NUMERIC,
  tasks JSONB,
  team_members JSONB,
  attachments JSONB,
  tags JSONB,
  journal JSONB,
  archived BOOLEAN,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create index for user_id (most common query)
CREATE INDEX IF NOT EXISTS idx_projects_user_id ON projects(user_id);

-- Create tasks table - MUST RUN BEFORE file storage migrations
-- This table stores basic task information
CREATE TABLE IF NOT EXISTS tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  completed BOOLEAN,
  status TEXT,
  priority TEXT,
  due_date TIMESTAMP WITH TIME ZONE,
  start_date TIMESTAMP WITH TIME ZONE,
  assignees JSONB,
  tags JSONB,
  estimated_hours INTEGER,
  actual_hours INTEGER,
  attachments JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create index for created_at (sorting queries)
CREATE INDEX IF NOT EXISTS idx_tasks_created_at ON tasks(created_at);

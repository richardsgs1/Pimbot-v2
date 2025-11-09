-- Create task_templates table for multi-device sync
-- This table stores task templates created by users for reuse

CREATE TABLE IF NOT EXISTS public.task_templates (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  category VARCHAR(100),
  default_priority VARCHAR(20),
  default_estimated_hours NUMERIC(5,2),
  subtasks JSONB DEFAULT '[]'::jsonb,
  default_assignees JSONB DEFAULT '[]'::jsonb,
  tags JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT task_templates_user_id_name_unique UNIQUE(user_id, name)
);

-- Enable Row Level Security (RLS)
ALTER TABLE public.task_templates ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for task_templates table
-- Policy 1: Users can view their own templates
CREATE POLICY "Users can view their own templates"
  ON public.task_templates
  FOR SELECT
  USING (auth.uid() = user_id);

-- Policy 2: Users can create their own templates
CREATE POLICY "Users can create their own templates"
  ON public.task_templates
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Policy 3: Users can update their own templates
CREATE POLICY "Users can update their own templates"
  ON public.task_templates
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Policy 4: Users can delete their own templates
CREATE POLICY "Users can delete their own templates"
  ON public.task_templates
  FOR DELETE
  USING (auth.uid() = user_id);

-- Create indexes for better query performance (if they don't exist)
CREATE INDEX IF NOT EXISTS idx_task_templates_user_id ON public.task_templates(user_id);
CREATE INDEX IF NOT EXISTS idx_task_templates_category ON public.task_templates(user_id, category);
CREATE INDEX IF NOT EXISTS idx_task_templates_created_at ON public.task_templates(user_id, created_at DESC);

-- Create trigger to auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_task_templates_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_task_templates_updated_at
BEFORE UPDATE ON public.task_templates
FOR EACH ROW
EXECUTE FUNCTION public.update_task_templates_updated_at();

-- Add comments for documentation
COMMENT ON TABLE public.task_templates IS 'Stores task templates for users to reuse across projects';
COMMENT ON COLUMN public.task_templates.id IS 'Unique template identifier';
COMMENT ON COLUMN public.task_templates.user_id IS 'Foreign key to auth.users, ensures data isolation';
COMMENT ON COLUMN public.task_templates.name IS 'Template name, must be unique per user';
COMMENT ON COLUMN public.task_templates.category IS 'Category for organizing templates';
COMMENT ON COLUMN public.task_templates.subtasks IS 'JSON array of subtask objects to be applied when template is used';
COMMENT ON COLUMN public.task_templates.default_assignees IS 'JSON array of user IDs to assign when template is used';
COMMENT ON COLUMN public.task_templates.tags IS 'JSON array of tags for the template';

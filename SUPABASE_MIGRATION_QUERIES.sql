-- ============================================
-- SUPABASE DATABASE MIGRATION QUERIES
-- Run these in Supabase SQL Editor to add advanced task features
-- ============================================

-- Step 1: Add new columns to existing tasks table
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS dependencies JSONB DEFAULT '[]'::jsonb;
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS dependent_task_ids JSONB DEFAULT '[]'::jsonb;
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS is_blocked BOOLEAN DEFAULT false;
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS subtasks JSONB DEFAULT '[]'::jsonb;
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS subtask_progress INTEGER DEFAULT 0;
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS is_recurring BOOLEAN DEFAULT false;
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS recurrence_pattern JSONB;
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS original_task_id UUID;
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS occurrence_number INTEGER;
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS is_template BOOLEAN DEFAULT false;
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS template_category TEXT;

-- Step 2: Create task_dependencies table
CREATE TABLE IF NOT EXISTS task_dependencies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  dependent_task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  blocking_task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(dependent_task_id, blocking_task_id)
);

CREATE INDEX IF NOT EXISTS idx_task_dependencies_dependent ON task_dependencies(dependent_task_id);
CREATE INDEX IF NOT EXISTS idx_task_dependencies_blocking ON task_dependencies(blocking_task_id);

-- Step 3: Create recurring_task_instances table
CREATE TABLE IF NOT EXISTS recurring_task_instances (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  original_task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  generated_task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  occurrence_number INTEGER NOT NULL,
  scheduled_date TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(original_task_id, occurrence_number)
);

CREATE INDEX IF NOT EXISTS idx_recurring_task_instances_original ON recurring_task_instances(original_task_id);
CREATE INDEX IF NOT EXISTS idx_recurring_task_instances_scheduled ON recurring_task_instances(scheduled_date);

-- Step 4: Create task_templates table
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

-- Step 5: Enable Row Level Security on task_templates
ALTER TABLE public.task_templates ENABLE ROW LEVEL SECURITY;

-- Step 6: Create RLS policies for task_templates
CREATE POLICY "Users can view their own templates"
  ON public.task_templates
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own templates"
  ON public.task_templates
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own templates"
  ON public.task_templates
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own templates"
  ON public.task_templates
  FOR DELETE
  USING (auth.uid() = user_id);

-- Step 7: Create indexes for task_templates
CREATE INDEX IF NOT EXISTS idx_task_templates_user_id ON public.task_templates(user_id);
CREATE INDEX IF NOT EXISTS idx_task_templates_category ON public.task_templates(user_id, category);
CREATE INDEX IF NOT EXISTS idx_task_templates_created_at ON public.task_templates(user_id, created_at DESC);

-- Step 8: Create trigger for auto-updating updated_at
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

-- Step 9: Add helpful comments
COMMENT ON COLUMN tasks.dependencies IS 'Array of task IDs that this task depends on (prerequisites)';
COMMENT ON COLUMN tasks.dependent_task_ids IS 'Array of task IDs that depend on this task';
COMMENT ON COLUMN tasks.is_blocked IS 'True if any dependency is incomplete, preventing task start';
COMMENT ON COLUMN tasks.subtasks IS 'JSONB array of subtask objects for task decomposition';
COMMENT ON COLUMN tasks.subtask_progress IS 'Percentage (0-100) of subtasks that are completed';
COMMENT ON COLUMN tasks.is_recurring IS 'True if this task is a recurring task template';
COMMENT ON COLUMN tasks.recurrence_pattern IS 'JSONB object defining recurrence frequency, days, end date, etc.';
COMMENT ON COLUMN tasks.original_task_id IS 'UUID of original task template for recurring task instances';
COMMENT ON COLUMN tasks.occurrence_number IS 'Which instance this is (1st, 2nd, 3rd occurrence)';
COMMENT ON COLUMN tasks.is_template IS 'True if this task is saved as a reusable template';
COMMENT ON COLUMN tasks.template_category IS 'Category for organizing task templates (e.g., "Weekly Review")';
COMMENT ON TABLE task_dependencies IS 'Explicit dependency relationships for efficient queries';
COMMENT ON TABLE recurring_task_instances IS 'Tracking of generated instances from recurring tasks';
COMMENT ON TABLE public.task_templates IS 'Stores task templates for users to reuse across projects';

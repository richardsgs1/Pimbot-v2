-- Migration: Add Advanced Task Features (Task Dependencies, Subtasks, Recurring Tasks, Templates)
-- This migration extends the existing projects and tasks tables with new columns for:
-- 1. Task Dependencies - Track which tasks block other tasks
-- 2. Subtasks - Break tasks into smaller work units
-- 3. Recurring Tasks - Auto-generate task instances on schedule
-- 4. Task Templates - Save and reuse task configurations

-- ============================================
-- ADD COLUMNS TO EXISTING TASKS TABLE
-- ============================================

-- Add task dependency columns
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS dependencies JSONB DEFAULT '[]'::jsonb;
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS dependent_task_ids JSONB DEFAULT '[]'::jsonb;
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS is_blocked BOOLEAN DEFAULT false;

-- Add subtasks column
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS subtasks JSONB DEFAULT '[]'::jsonb;
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS subtask_progress INTEGER DEFAULT 0;

-- Add recurring task columns
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS is_recurring BOOLEAN DEFAULT false;
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS recurrence_pattern JSONB;
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS original_task_id UUID;
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS occurrence_number INTEGER;

-- Add template columns
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS is_template BOOLEAN DEFAULT false;
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS template_category TEXT;

-- ============================================
-- CREATE TASK TEMPLATES TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS task_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL,
  default_priority TEXT,
  default_estimated_hours INTEGER,
  subtasks JSONB DEFAULT '[]'::jsonb,
  default_assignees JSONB DEFAULT '[]'::jsonb,
  tags JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create index for user_id and category
CREATE INDEX IF NOT EXISTS idx_task_templates_user_id ON task_templates(user_id);
CREATE INDEX IF NOT EXISTS idx_task_templates_category ON task_templates(category);

-- ============================================
-- CREATE TASK DEPENDENCIES TRACKING TABLE
-- (Optional - for explicit dependency queries)
-- ============================================

CREATE TABLE IF NOT EXISTS task_dependencies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  dependent_task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  blocking_task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(dependent_task_id, blocking_task_id)
);

-- Create indexes for efficient queries
CREATE INDEX IF NOT EXISTS idx_task_dependencies_dependent ON task_dependencies(dependent_task_id);
CREATE INDEX IF NOT EXISTS idx_task_dependencies_blocking ON task_dependencies(blocking_task_id);

-- ============================================
-- CREATE RECURRING TASK INSTANCES TABLE
-- (Optional - for tracking generated instances)
-- ============================================

CREATE TABLE IF NOT EXISTS recurring_task_instances (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  original_task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  generated_task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  occurrence_number INTEGER NOT NULL,
  scheduled_date TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(original_task_id, occurrence_number)
);

-- Create index for querying instances
CREATE INDEX IF NOT EXISTS idx_recurring_task_instances_original ON recurring_task_instances(original_task_id);
CREATE INDEX IF NOT EXISTS idx_recurring_task_instances_scheduled ON recurring_task_instances(scheduled_date);

-- ============================================
-- ADD COMMENT ANNOTATIONS FOR CLARITY
-- ============================================

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

COMMENT ON TABLE task_templates IS 'Saved task templates for reuse across projects';
COMMENT ON TABLE task_dependencies IS 'Explicit dependency relationships for efficient queries';
COMMENT ON TABLE recurring_task_instances IS 'Tracking of generated instances from recurring tasks';

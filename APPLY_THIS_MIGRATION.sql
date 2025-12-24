-- ============================================
-- MIGRATION: Add Advanced Task Features
-- ============================================
-- This adds support for:
-- - Task Dependencies
-- - Subtasks
-- - Recurring Tasks
-- - Task Templates
--
-- INSTRUCTIONS:
-- 1. Go to https://supabase.com/dashboard
-- 2. Select your project
-- 3. Click "SQL Editor" in left sidebar
-- 4. Click "New Query"
-- 5. Copy and paste this entire file
-- 6. Click "Run" or press Ctrl+Enter
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

-- Create task dependencies tracking table
CREATE TABLE IF NOT EXISTS task_dependencies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  dependent_task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  blocking_task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(dependent_task_id, blocking_task_id)
);

CREATE INDEX IF NOT EXISTS idx_task_dependencies_dependent ON task_dependencies(dependent_task_id);
CREATE INDEX IF NOT EXISTS idx_task_dependencies_blocking ON task_dependencies(blocking_task_id);

-- Create recurring task instances table
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

-- Success message
SELECT 'Migration completed successfully! Advanced task features are now enabled.' AS status;

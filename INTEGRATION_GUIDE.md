# Advanced Task Features - Integration Guide

This guide explains how to integrate the newly created advanced task feature components into your existing application.

## Components Created

### 1. Business Logic Services (lib/)
- **TaskDependencyService.ts** - Dependency management with circular detection
- **SubtaskService.ts** - Subtask CRUD and progress tracking
- **RecurringTaskService.ts** - Enhanced with database integration
- **TaskTemplateService.ts** - Template management

### 2. Database Functions (lib/database.ts)
- Task dependency CRUD operations (lines 737-872)
- Recurring task instance tracking (lines 874-1047)

### 3. TypeScript Types (types.ts)
- Database table types (lines 293-341)
- Helper types (lines 343-415)
- Database layer types (lines 417-482)

### 4. UI Components (components/)
- **TaskDependencyManager.tsx** - NEW comprehensive dependency UI
- **SubtaskManager.tsx** - EXISTING (already in your project)
- **RecurringTaskManager.tsx** - NEW comprehensive recurring task UI
- **TaskTemplateSelector.tsx** - NEW template selector UI

## Integration Steps

### Step 1: Update TaskDetailModal.tsx

Replace the existing component imports with the new ones:

```typescript
// OLD imports (lines 4-7):
import TaskDependencies from './TaskDependencies';
import SubtaskManager from './SubtaskManager';
import RecurringTaskSetup from './RecurringTaskSetup';
import TaskTemplateManager from './TaskTemplateManager';

// NEW imports - ADD THESE:
import { TaskDependencyManager } from './TaskDependencyManager';
import { RecurringTaskManager } from './RecurringTaskManager';
import { TaskTemplateSelector } from './TaskTemplateSelector';
// Keep SubtaskManager as is (it's already good)
```

### Step 2: Update the Tab Content Rendering

Find the section where tabs render their content (around line 150-200) and update:

```typescript
{/* Dependencies Tab */}
{activeTab === 'dependencies' && project && (
  <TaskDependencyManager
    task={task}
    project={project}
    onUpdate={(updatedTask) => {
      // Call your existing update handler
      onUpdateTask?.(updatedTask);
      // Or use onEdit if that's your pattern
      onEdit?.(updatedTask, project.id);
    }}
  />
)}

{/* Subtasks Tab - Keep existing */}
{activeTab === 'subtasks' && onUpdateTask && (
  <SubtaskManager
    task={task}
    teamMembers={teamMembers}
    onUpdateTask={onUpdateTask}
  />
)}

{/* Recurring Tab */}
{activeTab === 'recurring' && (
  <RecurringTaskManager
    task={task}
    onUpdate={(updatedTask) => {
      onUpdateTask?.(updatedTask);
      onEdit?.(updatedTask, project.id);
    }}
  />
)}

{/* Templates Tab */}
{activeTab === 'templates' && userId && (
  <TaskTemplateSelector
    task={task}
    templates={templates}
    userId={userId}
    onSaveAsTemplate={(template) => {
      onSaveTemplate?.(template);
    }}
    onCreateFromTemplate={(newTask) => {
      onLoadTemplate?.(newTask as any); // Adjust type as needed
    }}
  />
)}
```

### Step 3: Run the Migration

Make sure you've run the database migration:

```bash
# Apply the migration to your Supabase database
supabase migration up
```

Or if using the Supabase dashboard:
1. Go to SQL Editor
2. Copy the contents of `supabase/migrations/005_add_advanced_task_features.sql`
3. Execute the SQL

### Step 4: Update Task Update Handlers

Ensure your task update handlers in App.tsx or wherever you manage state handle the new fields:

```typescript
const handleUpdateTask = (taskId: string, projectId: string, updates: Partial<Task>) => {
  setProjects(prev => prev.map(p => {
    if (p.id !== projectId) return p;

    return {
      ...p,
      tasks: p.tasks.map(t => {
        if (t.id !== taskId) return t;

        return {
          ...t,
          ...updates,
          updatedAt: new Date().toISOString()
        };
      })
    };
  }));
};
```

## Testing the Integration

### Test Dependency Features
1. Open a task in TaskDetailModal
2. Go to "Dependencies" tab
3. Try adding a dependency between tasks
4. Verify circular dependency detection works
5. Check blocked status updates correctly

### Test Subtasks
1. Go to "Subtasks" tab
2. Add, edit, reorder subtasks
3. Verify progress calculation updates
4. Test bulk operations

### Test Recurring Tasks
1. Go to "Recurring" tab
2. Enable recurring and set a pattern
3. Preview upcoming instances
4. Save and verify pattern description

### Test Templates
1. Go to "Templates" tab
2. Save current task as template
3. Create a new task from template
4. Verify all properties copied correctly

## New Features Available

### TaskDependencyManager
- ✅ Visual dependency graph
- ✅ Circular dependency detection
- ✅ Blocked status indicators
- ✅ Dependency chain visualization
- ✅ Critical path calculation (service available)

### RecurringTaskManager
- ✅ Pattern builder (daily/weekly/monthly/yearly)
- ✅ Custom intervals
- ✅ Day of week/month selection
- ✅ End by date or max occurrences
- ✅ Upcoming instances preview
- ✅ Manual instance generation

### TaskTemplateSelector
- ✅ Save task as template
- ✅ Category organization
- ✅ Search templates
- ✅ Apply template to task
- ✅ Template statistics

## Service Methods Available

### TaskDependencyService
```typescript
// Add/remove dependencies
await TaskDependencyService.addDependency(taskId, blockingTaskId, allTasks);
await TaskDependencyService.removeDependency(taskId, blockingTaskId);

// Get status
const status = await TaskDependencyService.getDependencyStatus(task, allTasks);
// Returns: { isBlocked, blockingTasks, dependentTasks, canStart }

// Validation
const validation = await TaskDependencyService.validateDependency(taskId, blockingTaskId, allTasks);

// Graph operations
const topologicalOrder = TaskDependencyService.getTopologicalOrder(tasks);
const criticalPath = TaskDependencyService.getCriticalPath(tasks);
```

### SubtaskService
```typescript
// CRUD operations
const updated = SubtaskService.addSubtask(task, name, options);
const updated = SubtaskService.toggleSubtask(task, subtaskId);
const updated = SubtaskService.deleteSubtask(task, subtaskId);

// Bulk operations
const updated = SubtaskService.completeAllSubtasks(task);
const updated = SubtaskService.bulkCreateSubtasks(task, names);

// Progress
const progress = SubtaskService.calculateProgress(task.subtasks);
// Returns: { total, completed, percentage, remaining }
```

### RecurringTaskService
```typescript
// Generate instances
const result = await RecurringTaskService.generateTaskInstance(
  templateTask,
  scheduledDate,
  occurrenceNumber
);

// Get instances
const instances = await RecurringTaskService.getTaskInstances(templateTaskId);

// Calculate next occurrence
const next = RecurringTaskService.calculateNextOccurrence(pattern, fromDate);

// Check if should generate
const should = RecurringTaskService.shouldGenerateInstance(pattern, lastDate);
```

### TaskTemplateService
```typescript
// Create template
const template = TaskTemplateService.createTemplateFromTask(task, userId, category);

// Create task from template
const result = TaskTemplateService.createTaskFromTemplate(template, options);

// Organization
const categories = TaskTemplateService.getCategories(templates);
const filtered = TaskTemplateService.filterByCategory(templates, category);
const results = TaskTemplateService.searchTemplates(templates, query);
```

## Next Steps

1. **API Endpoints** (Optional) - If you want REST/GraphQL endpoints:
   - Create endpoint for task dependency operations
   - Create endpoint for recurring task generation
   - Create endpoint for template management

2. **Scheduled Jobs** (Optional) - Auto-generate recurring tasks:
   - Create cron job to check recurring tasks
   - Auto-generate instances when due
   - Send notifications for new instances

3. **Analytics** (Optional) - Add metrics:
   - Track template usage
   - Measure dependency complexity
   - Monitor recurring task compliance

4. **UI Enhancements** (Optional):
   - Add dependency graph visualization (D3.js or similar)
   - Add Gantt chart for dependencies
   - Add drag-and-drop for dependencies

## Troubleshooting

### "Module not found" errors
- Make sure all new service files are in `lib/` directory
- Check import paths are correct
- Verify TypeScript compilation passes

### Database errors
- Ensure migration was applied successfully
- Check RLS policies allow your operations
- Verify user authentication is working

### Type errors
- Update your imports to include new types from types.ts
- Check TaskDB vs Task usage (DB layer vs app layer)
- Ensure proper type conversions between snake_case and camelCase

## Support

If you encounter issues:
1. Check browser console for errors
2. Check database logs in Supabase dashboard
3. Verify service method calls are working
4. Test components in isolation first

---

**You now have a complete advanced task management system!**

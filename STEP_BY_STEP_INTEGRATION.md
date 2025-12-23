# Step-by-Step Integration Instructions

This guide shows **exactly** where to make changes in TaskDetailModal.tsx with 2 lines of context before and after each change.

## Change 1: Update Imports (Lines 1-9)

### FIND these lines (1-9):
```typescript
import React, { useState } from 'react';
import type { Task, Project, TaskStatus, TeamMember, TaskTemplate } from '../types';
import { PRIORITY_VALUES, TaskStatus as TaskStatusEnum } from '../types';
import TaskDependencies from './TaskDependencies';
import SubtaskManager from './SubtaskManager';
import RecurringTaskSetup from './RecurringTaskSetup';
import TaskTemplateManager from './TaskTemplateManager';
import { dependencyResolver } from '../lib/DependencyResolver';
import { subtaskCalculator } from '../lib/SubtaskCalculator';
```

### REPLACE with:
```typescript
import React, { useState } from 'react';
import type { Task, Project, TaskStatus, TeamMember, TaskTemplate } from '../types';
import { PRIORITY_VALUES, TaskStatus as TaskStatusEnum } from '../types';
import { TaskDependencyManager } from './TaskDependencyManager';
import SubtaskManager from './SubtaskManager';
import { RecurringTaskManager } from './RecurringTaskManager';
import { TaskTemplateSelector } from './TaskTemplateSelector';
import { dependencyResolver } from '../lib/DependencyResolver';
import { subtaskCalculator } from '../lib/SubtaskCalculator';
```

**What changed:**
- Line 4: `import TaskDependencies from './TaskDependencies';` → `import { TaskDependencyManager } from './TaskDependencyManager';`
- Line 6: `import RecurringTaskSetup from './RecurringTaskSetup';` → `import { RecurringTaskManager } from './RecurringTaskManager';`
- Line 7: `import TaskTemplateManager from './TaskTemplateManager';` → `import { TaskTemplateSelector } from './TaskTemplateSelector';`

---

## Change 2: Update Dependencies Tab (Lines 280-288)

### FIND these lines (280-288):
```typescript
          )}

          {activeTab === 'dependencies' && onUpdateTask && (
            <TaskDependencies
              task={task}
              project={project}
              onUpdateTask={onUpdateTask}
            />
          )}

          {activeTab === 'subtasks' && onUpdateTask && (
```

### REPLACE with:
```typescript
          )}

          {activeTab === 'dependencies' && project && (
            <TaskDependencyManager
              task={task}
              project={project}
              onUpdate={(updatedTask) => {
                onUpdateTask?.(updatedTask);
                onEdit?.(updatedTask, project.id);
              }}
            />
          )}

          {activeTab === 'subtasks' && onUpdateTask && (
```

**What changed:**
- Line 282: Changed condition from `onUpdateTask &&` to `project &&`
- Line 283: `<TaskDependencies` → `<TaskDependencyManager`
- Lines 286-289: Added `onUpdate` handler with full task object update

---

## Change 3: Update Recurring Tab (Lines 296-300)

### FIND these lines (296-300):
```typescript
          )}

          {activeTab === 'recurring' && onUpdateTask && (
            <RecurringTaskSetup task={task} onUpdateTask={onUpdateTask} />
          )}

          {activeTab === 'templates' && onSaveTemplate && onLoadTemplate && onDeleteTemplate && (
```

### REPLACE with:
```typescript
          )}

          {activeTab === 'recurring' && (
            <RecurringTaskManager
              task={task}
              onUpdate={(updatedTask) => {
                onUpdateTask?.(updatedTask);
                onEdit?.(updatedTask, project.id);
              }}
            />
          )}

          {activeTab === 'templates' && onSaveTemplate && onLoadTemplate && onDeleteTemplate && (
```

**What changed:**
- Line 298: Removed `onUpdateTask &&` condition
- Line 299: `<RecurringTaskSetup` → `<RecurringTaskManager`
- Lines 299-304: Changed from simple prop pass to full handler with update logic

---

## Change 4: Update Templates Tab (Lines 300-325)

### FIND these lines (300-325):
```typescript
          )}

          {activeTab === 'templates' && onSaveTemplate && onLoadTemplate && onDeleteTemplate && (
            <TaskTemplateManager
              task={task}
              templates={templates}
              userId={userId || ''}
              onSaveTemplate={onSaveTemplate}
              onLoadTemplate={(template) => {
                if (onLoadTemplate && onUpdateTask) {
                  onLoadTemplate(template);
                  onUpdateTask({
                    name: template.name,
                    description: template.description,
                    priority: template.defaultPriority || task.priority,
                    estimatedHours: template.defaultEstimatedHours || task.estimatedHours,
                    subtasks: template.subtasks || task.subtasks,
                    assignees: template.defaultAssignees || task.assignees,
                    tags: template.tags || task.tags,
                    updatedAt: new Date().toISOString(),
                  });
                }
              }}
              onDeleteTemplate={onDeleteTemplate}
            />
          )}
        </div>
```

### REPLACE with:
```typescript
          )}

          {activeTab === 'templates' && userId && (
            <TaskTemplateSelector
              task={task}
              templates={templates}
              userId={userId}
              onSaveAsTemplate={(template) => {
                onSaveTemplate?.(template);
              }}
              onCreateFromTemplate={(newTask) => {
                // Apply template properties to current task
                onUpdateTask?.({
                  name: newTask.name,
                  description: newTask.description,
                  priority: newTask.priority,
                  estimatedHours: newTask.estimatedHours,
                  subtasks: newTask.subtasks,
                  assignees: newTask.assignees,
                  tags: newTask.tags,
                  updatedAt: new Date().toISOString(),
                });
                onLoadTemplate?.(newTask as any);
              }}
            />
          )}
        </div>
```

**What changed:**
- Line 302: Changed condition to check `userId` instead of all three callbacks
- Line 303: `<TaskTemplateManager` → `<TaskTemplateSelector`
- Lines 306-307: Removed `userId || ''` (now required)
- Lines 308-311: Renamed callback from `onLoadTemplate` to `onSaveAsTemplate`
- Lines 312-324: New `onCreateFromTemplate` handler with direct task updates

---

## Summary of Changes

| File Section | Old Component | New Component | Lines Changed |
|--------------|---------------|---------------|---------------|
| Imports (Line 4) | `TaskDependencies` | `TaskDependencyManager` | 1 |
| Imports (Line 6) | `RecurringTaskSetup` | `RecurringTaskManager` | 1 |
| Imports (Line 7) | `TaskTemplateManager` | `TaskTemplateSelector` | 1 |
| Dependencies Tab (282-288) | `TaskDependencies` component | `TaskDependencyManager` component | 7 |
| Recurring Tab (298-300) | `RecurringTaskSetup` component | `RecurringTaskManager` component | 6 |
| Templates Tab (302-325) | `TaskTemplateManager` component | `TaskTemplateSelector` component | 24 |
| **Total** | | | **40 lines** |

---

## Quick Copy-Paste Alternative

If you prefer, here's the complete updated file content. You can replace the entire file:

### Option A: Manual Changes (Recommended)
Follow the 4 changes above to understand what's changing.

### Option B: Full File Replacement
Create a backup of your current TaskDetailModal.tsx, then I can provide the complete updated file.

---

## Verification Checklist

After making changes:

- [ ] Import statements updated (3 imports changed)
- [ ] Dependencies tab uses `TaskDependencyManager`
- [ ] Subtasks tab still uses `SubtaskManager` (no change)
- [ ] Recurring tab uses `RecurringTaskManager`
- [ ] Templates tab uses `TaskTemplateSelector`
- [ ] All handlers pass `onUpdate` or `onUpdateTask` correctly
- [ ] No TypeScript errors in the file
- [ ] File saves without linter errors

---

## Testing After Integration

1. **Test Dependencies Tab**:
   - Open any task in a project with multiple tasks
   - Go to Dependencies tab
   - Try adding a dependency
   - Verify blocked status shows correctly

2. **Test Subtasks Tab**:
   - Should work as before (no changes needed)

3. **Test Recurring Tab**:
   - Enable recurring toggle
   - Set a pattern (weekly, Monday/Wednesday/Friday)
   - Preview upcoming dates
   - Save changes

4. **Test Templates Tab**:
   - Switch to "Save as Template" mode
   - Create a template from current task
   - Switch to "Load Template" mode
   - Apply template to task

---

## Troubleshooting

### "Module not found" errors
- Verify new component files exist in `components/` directory:
  - `TaskDependencyManager.tsx`
  - `RecurringTaskManager.tsx`
  - `TaskTemplateSelector.tsx`

### TypeScript errors about props
- Make sure you have the latest `types.ts` with new type definitions
- Check that `onUpdate` handlers are correctly typed

### Components not rendering
- Check browser console for errors
- Verify conditional logic (project, userId checks)
- Ensure props are being passed correctly

---

## Need Help?

If you encounter issues:
1. Check the specific line numbers in the error
2. Verify you copied the exact code from the REPLACE sections
3. Make sure new component files are in the right location
4. Check that imports use correct syntax (named vs default exports)

The new components use **named exports** (`export const`) while old ones used **default exports** (`export default`), which is why the import syntax changed!
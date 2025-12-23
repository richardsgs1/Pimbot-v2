import React, { useState } from 'react';
import type { Task, Project } from '../types';
import { dependencyResolver } from '../lib/DependencyResolver';

interface TaskDependenciesProps {
  task: Task;
  project: Project;
  onUpdateTask: (updates: Partial<Task>) => void;
}

const TaskDependencies: React.FC<TaskDependenciesProps> = ({
  task,
  project,
  onUpdateTask,
}) => {
  const [isAddingDependency, setIsAddingDependency] = useState(false);
  const [selectedTaskId, setSelectedTaskId] = useState<string>('');

  // Get blocking tasks (tasks that prevent this one from starting)
  const blockingTasks = dependencyResolver.getBlockingTasks(task.id, project);

  // Get dependent tasks (tasks that depend on this one)
  const dependentTasks = dependencyResolver.getDependentTasks(task.id, project);

  const handleAddDependency = () => {
    if (!selectedTaskId) return;

    // Validate the dependency
    const validation = dependencyResolver.validateDependencies(
      task.id,
      [...(task.dependencies || []), selectedTaskId],
      project
    );

    if (!validation.valid) {
      alert(validation.error);
      return;
    }

    const newDependencies = [...(task.dependencies || []), selectedTaskId];
    onUpdateTask({
      dependencies: newDependencies,
      updatedAt: new Date().toISOString(),
    });

    setSelectedTaskId('');
    setIsAddingDependency(false);
  };

  const handleRemoveDependency = (depId: string) => {
    const newDependencies = (task.dependencies || []).filter(id => id !== depId);
    onUpdateTask({
      dependencies: newDependencies,
      updatedAt: new Date().toISOString(),
    });
  };

  // Get available tasks to depend on (exclude self and already added dependencies)
  const availableTasks = project.tasks.filter(
    t => t.id !== task.id && !task.dependencies?.includes(t.id)
  );

  return (
    <div className="space-y-4">
      {/* Blocked Status */}
      {task.isBlocked && blockingTasks.length > 0 && (
        <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
          <div className="flex items-center gap-2 text-red-600 dark:text-red-400 mb-2">
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M13.477 14.89A6 6 0 113.89 2.523a.75.75 0 00-1.06 1.061 4.5 4.5 0 1010.36 3.83.75.75 0 00-1.06 1.06h-.002a6 6 0 01-8.54 8.54.75.75 0 001.06 1.06A6.002 6.002 0 0013.477 14.89zM10 10.5a.75.75 0 11-1.5 0 .75.75 0 011.5 0z" clipRule="evenodd" />
            </svg>
            <span className="font-medium text-sm">Task is blocked</span>
          </div>
          <p className="text-sm text-red-600 dark:text-red-400">
            Complete the following tasks before starting this one:
          </p>
        </div>
      )}

      {/* Dependencies this task blocks by */}
      {blockingTasks.length > 0 && (
        <div>
          <h4 className="text-sm font-medium text-[var(--text-primary)] mb-2">
            Blocked by {blockingTasks.length} task{blockingTasks.length !== 1 ? 's' : ''}
          </h4>
          <div className="space-y-2">
            {blockingTasks.map(blockingTask => (
              <div
                key={blockingTask.id}
                className="flex items-center justify-between p-2 bg-[var(--bg-tertiary)] rounded-lg border border-red-500/20"
              >
                <div className="flex-1">
                  <p className="text-sm font-medium text-[var(--text-primary)]">
                    {blockingTask.name}
                  </p>
                  <p className="text-xs text-[var(--text-tertiary)]">
                    Status: {blockingTask.status}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {blockingTask.completed ? (
                    <span className="text-green-500 text-sm">✓ Done</span>
                  ) : (
                    <span className="text-yellow-600 dark:text-yellow-400 text-sm">
                      Incomplete
                    </span>
                  )}
                  <button
                    onClick={() => handleRemoveDependency(blockingTask.id)}
                    className="text-red-500 hover:text-red-400 text-sm px-2 py-1"
                  >
                    Remove
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tasks that depend on this one */}
      {dependentTasks.length > 0 && (
        <div>
          <h4 className="text-sm font-medium text-[var(--text-primary)] mb-2">
            Blocking {dependentTasks.length} task{dependentTasks.length !== 1 ? 's' : ''}
          </h4>
          <div className="space-y-2">
            {dependentTasks.map(depTask => (
              <div
                key={depTask.id}
                className="flex items-center justify-between p-2 bg-[var(--bg-tertiary)] rounded-lg border border-blue-500/20"
              >
                <div className="flex-1">
                  <p className="text-sm font-medium text-[var(--text-primary)]">
                    {depTask.name}
                  </p>
                  <p className="text-xs text-[var(--text-tertiary)]">
                    Status: {depTask.status}
                  </p>
                </div>
                <span className="text-blue-600 dark:text-blue-400 text-sm">
                  Depends on this
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Add dependency section */}
      {!isAddingDependency ? (
        <button
          onClick={() => setIsAddingDependency(true)}
          className="w-full px-3 py-2 text-sm bg-[var(--accent-primary)]/10 text-[var(--accent-primary)] border border-[var(--accent-primary)]/30 rounded-lg hover:bg-[var(--accent-primary)]/20 transition-colors"
        >
          + Add Dependency
        </button>
      ) : (
        <div className="space-y-2 p-3 bg-[var(--bg-tertiary)] rounded-lg border border-[var(--border-primary)]">
          <label className="block text-sm font-medium text-[var(--text-primary)]">
            Select task this depends on:
          </label>
          <select
            value={selectedTaskId}
            onChange={(e) => setSelectedTaskId(e.target.value)}
            className="w-full px-2 py-1 bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded text-[var(--text-primary)] text-sm"
          >
            <option value="">Choose a task...</option>
            {availableTasks.map(t => (
              <option key={t.id} value={t.id}>
                {t.name} {t.completed ? '✓' : ''}
              </option>
            ))}
          </select>

          {selectedTaskId && (
            <div className="text-xs text-[var(--text-tertiary)] p-2 bg-[var(--bg-secondary)] rounded">
              <p>This task will be blocked until the selected task is complete.</p>
            </div>
          )}

          <div className="flex gap-2">
            <button
              onClick={handleAddDependency}
              disabled={!selectedTaskId}
              className="flex-1 px-2 py-1 text-sm bg-[var(--accent-primary)] text-white rounded hover:opacity-80 disabled:opacity-50 disabled:cursor-not-allowed transition-opacity"
            >
              Add
            </button>
            <button
              onClick={() => {
                setIsAddingDependency(false);
                setSelectedTaskId('');
              }}
              className="flex-1 px-2 py-1 text-sm bg-[var(--bg-secondary)] text-[var(--text-primary)] border border-[var(--border-primary)] rounded hover:opacity-80 transition-opacity"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* No dependencies message */}
      {blockingTasks.length === 0 && dependentTasks.length === 0 && !isAddingDependency && (
        <div className="text-center py-4 text-[var(--text-tertiary)] text-sm">
          <p>No dependencies set</p>
          <p className="text-xs mt-1">This task is not blocked by or blocking any other tasks.</p>
        </div>
      )}

      {/* Dependency statistics */}
      {(blockingTasks.length > 0 || dependentTasks.length > 0) && (
        <div className="flex gap-2 text-xs">
          {blockingTasks.length > 0 && (
            <div className="flex-1 p-2 bg-red-500/10 rounded">
              <p className="text-red-600 dark:text-red-400 font-medium">
                {blockingTasks.length} blocking
              </p>
            </div>
          )}
          {dependentTasks.length > 0 && (
            <div className="flex-1 p-2 bg-blue-500/10 rounded">
              <p className="text-blue-600 dark:text-blue-400 font-medium">
                {dependentTasks.length} dependent
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default TaskDependencies;

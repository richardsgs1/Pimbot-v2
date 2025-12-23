/**
 * TaskDependencyManager Component
 *
 * Manages task dependencies with visual dependency graph,
 * circular dependency detection, and blocked status indicators.
 */

import React, { useState, useEffect } from 'react';
import type { Task, Project, DependencyStatus } from '../types';
import { TaskDependencyService } from '../lib/TaskDependencyService';

interface TaskDependencyManagerProps {
  task: Task;
  project: Project;
  onUpdate: (updatedTask: Task) => void;
  onClose?: () => void;
}

export const TaskDependencyManager: React.FC<TaskDependencyManagerProps> = ({
  task,
  project,
  onUpdate,
  onClose
}) => {
  const [selectedDependency, setSelectedDependency] = useState<string>('');
  const [dependencyStatus, setDependencyStatus] = useState<DependencyStatus | null>(null);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Get available tasks (exclude current task and completed tasks)
  const availableTasks = project.tasks.filter(
    t => t.id !== task.id && !t.completed
  );

  // Calculate dependency status on mount and when dependencies change
  useEffect(() => {
    const calculateStatus = async () => {
      const status = await TaskDependencyService.getDependencyStatus(task, project.tasks);
      setDependencyStatus(status);
    };
    calculateStatus();
  }, [task, project.tasks]);

  const handleAddDependency = async () => {
    if (!selectedDependency) {
      setValidationError('Please select a task');
      return;
    }

    setIsLoading(true);
    setValidationError(null);

    // Add dependency
    const result = await TaskDependencyService.addDependency(
      task.id,
      selectedDependency,
      project.tasks
    );

    if (!result.success) {
      setValidationError(result.error || 'Failed to add dependency');
      setIsLoading(false);
      return;
    }

    // Update task with new dependency
    const updatedDependencies = [...(task.dependencies || []), selectedDependency];
    const isBlocked = TaskDependencyService.calculateBlockedStatus(
      { ...task, dependencies: updatedDependencies },
      project.tasks
    );

    const updatedTask: Task = {
      ...task,
      dependencies: updatedDependencies,
      isBlocked,
      updatedAt: new Date().toISOString()
    };

    onUpdate(updatedTask);
    setSelectedDependency('');
    setIsLoading(false);
  };

  const handleRemoveDependency = async (dependencyId: string) => {
    setIsLoading(true);

    await TaskDependencyService.removeDependency(task.id, dependencyId);

    // Update task
    const updatedDependencies = (task.dependencies || []).filter(id => id !== dependencyId);
    const isBlocked = TaskDependencyService.calculateBlockedStatus(
      { ...task, dependencies: updatedDependencies },
      project.tasks
    );

    const updatedTask: Task = {
      ...task,
      dependencies: updatedDependencies,
      isBlocked,
      updatedAt: new Date().toISOString()
    };

    onUpdate(updatedTask);
    setIsLoading(false);
  };

  const getDependencyChain = () => {
    return TaskDependencyService.getDependencyChain(task, project.tasks);
  };

  const getTaskById = (taskId: string): Task | undefined => {
    return project.tasks.find(t => t.id === taskId);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-[var(--text-primary)]">
          Task Dependencies
        </h3>
        {onClose && (
          <button
            onClick={onClose}
            className="text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
          >
            ✕
          </button>
        )}
      </div>

      {/* Blocked Status Alert */}
      {dependencyStatus?.isBlocked && (
        <div className="p-4 bg-yellow-500/20 border border-yellow-500/50 rounded-lg">
          <div className="flex items-start gap-3">
            <span className="text-2xl">⚠️</span>
            <div>
              <h4 className="font-semibold text-yellow-300 mb-1">Task is Blocked</h4>
              <p className="text-sm text-yellow-200">
                This task is waiting on {dependencyStatus.blockingTasks.length} incomplete{' '}
                {dependencyStatus.blockingTasks.length === 1 ? 'task' : 'tasks'}.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Can Start Status */}
      {dependencyStatus && !dependencyStatus.isBlocked && task.dependencies && task.dependencies.length > 0 && (
        <div className="p-4 bg-green-500/20 border border-green-500/50 rounded-lg">
          <div className="flex items-start gap-3">
            <span className="text-2xl">✅</span>
            <div>
              <h4 className="font-semibold text-green-300 mb-1">Ready to Start</h4>
              <p className="text-sm text-green-200">
                All dependencies are complete. This task can be started.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Add Dependency Form */}
      <div className="bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-lg p-4">
        <h4 className="font-medium text-[var(--text-primary)] mb-3">Add Dependency</h4>

        {validationError && (
          <div className="mb-3 p-3 bg-red-500/20 border border-red-500/50 rounded-lg">
            <p className="text-red-400 text-sm">{validationError}</p>
          </div>
        )}

        <div className="flex gap-2">
          <select
            value={selectedDependency}
            onChange={(e) => setSelectedDependency(e.target.value)}
            className="flex-1 px-3 py-2 bg-[var(--bg-primary)] border border-[var(--border-primary)] rounded-lg text-[var(--text-primary)]"
            disabled={isLoading}
          >
            <option value="">Select a task this depends on...</option>
            {availableTasks.map(t => (
              <option
                key={t.id}
                value={t.id}
                disabled={task.dependencies?.includes(t.id)}
              >
                {t.name} {task.dependencies?.includes(t.id) ? '(already added)' : ''}
              </option>
            ))}
          </select>

          <button
            onClick={handleAddDependency}
            disabled={!selectedDependency || isLoading}
            className="px-4 py-2 bg-[var(--accent-primary)] hover:opacity-90 text-white rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? '...' : 'Add'}
          </button>
        </div>

        <p className="mt-2 text-xs text-[var(--text-secondary)]">
          This task will be blocked until the selected task is completed.
        </p>
      </div>

      {/* Current Dependencies (Blocking Tasks) */}
      {dependencyStatus && dependencyStatus.blockingTasks.length > 0 && (
        <div className="bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-lg p-4">
          <h4 className="font-medium text-[var(--text-primary)] mb-3">
            🔒 Waiting On ({dependencyStatus.blockingTasks.length})
          </h4>

          <div className="space-y-2">
            {dependencyStatus.blockingTasks.map(depTask => (
              <div
                key={depTask.id}
                className="flex items-center justify-between p-3 bg-[var(--bg-primary)] border border-[var(--border-primary)] rounded-lg"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className={depTask.completed ? 'text-green-400' : 'text-yellow-400'}>
                      {depTask.completed ? '✓' : '⏳'}
                    </span>
                    <span className="font-medium text-[var(--text-primary)]">
                      {depTask.name}
                    </span>
                  </div>
                  <p className="text-xs text-[var(--text-secondary)] mt-1">
                    {depTask.completed ? 'Completed' : `Status: ${depTask.status}`}
                  </p>
                </div>

                <button
                  onClick={() => handleRemoveDependency(depTask.id)}
                  disabled={isLoading}
                  className="px-3 py-1 text-sm text-red-400 hover:bg-red-500/20 rounded disabled:opacity-50"
                >
                  Remove
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Dependent Tasks (Tasks Waiting on This) */}
      {dependencyStatus && dependencyStatus.dependentTasks.length > 0 && (
        <div className="bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-lg p-4">
          <h4 className="font-medium text-[var(--text-primary)] mb-3">
            🔗 Tasks Blocked by This ({dependencyStatus.dependentTasks.length})
          </h4>

          <div className="space-y-2">
            {dependencyStatus.dependentTasks.map(depTask => (
              <div
                key={depTask.id}
                className="p-3 bg-[var(--bg-primary)] border border-[var(--border-primary)] rounded-lg"
              >
                <div className="flex items-center gap-2">
                  <span className="text-blue-400">📌</span>
                  <span className="font-medium text-[var(--text-primary)]">
                    {depTask.name}
                  </span>
                </div>
                <p className="text-xs text-[var(--text-secondary)] mt-1">
                  This task will unblock when current task is completed
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* No Dependencies Message */}
      {(!task.dependencies || task.dependencies.length === 0) && (
        <div className="text-center py-8 text-[var(--text-secondary)]">
          <div className="text-4xl mb-2">🔗</div>
          <p>No dependencies yet</p>
          <p className="text-sm mt-1">Add tasks this one depends on to manage workflow</p>
        </div>
      )}

      {/* Dependency Chain Visualization */}
      {task.dependencies && task.dependencies.length > 0 && (
        <div className="bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-lg p-4">
          <h4 className="font-medium text-[var(--text-primary)] mb-3">
            📊 Dependency Chain
          </h4>
          <div className="text-sm text-[var(--text-secondary)]">
            {getDependencyChain().length > 0 ? (
              <div className="space-y-2">
                {getDependencyChain().map((chainTask, index) => (
                  <div key={chainTask.id} className="flex items-center gap-2">
                    <span className="text-[var(--text-tertiary)]">
                      {'  '.repeat(index)}└─
                    </span>
                    <span className={chainTask.completed ? 'text-green-400' : 'text-yellow-400'}>
                      {chainTask.name}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p>No dependency chain</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

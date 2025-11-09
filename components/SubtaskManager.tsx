import React, { useState } from 'react';
import type { Task, Subtask, TeamMember } from '../types';
import { subtaskCalculator } from '../lib/SubtaskCalculator';
import { generateUUID } from '../lib/utils';

interface SubtaskManagerProps {
  task: Task;
  teamMembers?: TeamMember[];
  onUpdateTask: (updates: Partial<Task>) => void;
}

const SubtaskManager: React.FC<SubtaskManagerProps> = ({
  task,
  teamMembers = [],
  onUpdateTask,
}) => {
  const [isAddingSubtask, setIsAddingSubtask] = useState(false);
  const [newSubtaskName, setNewSubtaskName] = useState('');
  const [editingSubtaskId, setEditingSubtaskId] = useState<string | null>(null);

  const progress = subtaskCalculator.getProgressPercentage(task);
  const completed = subtaskCalculator.getCompletedCount(task);
  const total = subtaskCalculator.getTotalCount(task);

  const handleAddSubtask = () => {
    if (!newSubtaskName.trim()) return;

    const newSubtask: Subtask = {
      id: generateUUID(),
      name: newSubtaskName,
      completed: false,
      order: total,
    };

    const updatedTask = subtaskCalculator.addSubtask(task, newSubtask);
    onUpdateTask({
      subtasks: updatedTask.subtasks,
      subtaskProgress: updatedTask.subtaskProgress,
      updatedAt: new Date().toISOString(),
    });

    setNewSubtaskName('');
    setIsAddingSubtask(false);
  };

  const handleToggleSubtask = (subtaskId: string) => {
    const updatedTask = subtaskCalculator.toggleSubtask(task, subtaskId);
    onUpdateTask({
      subtasks: updatedTask.subtasks,
      subtaskProgress: updatedTask.subtaskProgress,
      updatedAt: new Date().toISOString(),
    });
  };

  const handleDeleteSubtask = (subtaskId: string) => {
    if (!confirm('Delete this subtask?')) return;

    const updatedTask = subtaskCalculator.deleteSubtask(task, subtaskId);
    onUpdateTask({
      subtasks: updatedTask.subtasks,
      subtaskProgress: updatedTask.subtaskProgress,
      updatedAt: new Date().toISOString(),
    });
  };

  const handleUpdateSubtask = (subtaskId: string, updates: Partial<Subtask>) => {
    const updatedTask = subtaskCalculator.updateSubtask(task, subtaskId, updates);
    onUpdateTask({
      subtasks: updatedTask.subtasks,
      subtaskProgress: updatedTask.subtaskProgress,
      updatedAt: new Date().toISOString(),
    });
  };

  const handleReorderSubtask = (subtaskId: string, direction: 'up' | 'down') => {
    if (!task.subtasks) return;

    const currentIndex = task.subtasks.findIndex(st => st.id === subtaskId);
    if (currentIndex === -1) return;

    const newIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;

    if (newIndex < 0 || newIndex >= task.subtasks.length) return;

    const updatedTask = subtaskCalculator.reorderSubtask(task, subtaskId, newIndex);
    onUpdateTask({
      subtasks: updatedTask.subtasks,
      updatedAt: new Date().toISOString(),
    });
  };

  return (
    <div className="space-y-4">
      {/* Progress Bar */}
      {total > 0 && (
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="font-medium text-[var(--text-primary)]">
              Progress: {completed}/{total}
            </span>
            <span className="text-[var(--text-tertiary)]">{progress}%</span>
          </div>
          <div className="w-full bg-[var(--bg-tertiary)] rounded-full h-2">
            <div
              className="bg-[var(--accent-primary)] h-2 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      )}

      {/* Subtasks List */}
      {task.subtasks && task.subtasks.length > 0 && (
        <div className="space-y-2">
          {task.subtasks
            .sort((a, b) => (a.order || 0) - (b.order || 0))
            .map((subtask, index) => (
              <div
                key={subtask.id}
                className="flex items-start gap-2 p-3 bg-[var(--bg-tertiary)] rounded-lg border border-[var(--border-primary)] hover:border-[var(--accent-primary)] transition-colors"
              >
                {/* Checkbox */}
                <input
                  type="checkbox"
                  checked={subtask.completed}
                  onChange={() => handleToggleSubtask(subtask.id)}
                  className="w-4 h-4 mt-1 rounded border-[var(--border-primary)] bg-[var(--bg-secondary)] cursor-pointer accent-[var(--accent-primary)]"
                />

                {/* Subtask Content */}
                {editingSubtaskId === subtask.id ? (
                  <div className="flex-1 space-y-2">
                    <input
                      type="text"
                      value={subtask.name}
                      onChange={(e) =>
                        handleUpdateSubtask(subtask.id, { name: e.target.value })
                      }
                      className="w-full px-2 py-1 bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded text-[var(--text-primary)] text-sm"
                    />
                    <button
                      onClick={() => setEditingSubtaskId(null)}
                      className="text-xs px-2 py-1 bg-[var(--accent-primary)] text-white rounded hover:opacity-80"
                    >
                      Done
                    </button>
                  </div>
                ) : (
                  <div className="flex-1">
                    <p
                      className={`text-sm font-medium ${
                        subtask.completed
                          ? 'line-through text-[var(--text-tertiary)]'
                          : 'text-[var(--text-primary)]'
                      }`}
                    >
                      {subtask.name}
                    </p>
                    {subtask.estimatedHours && (
                      <p className="text-xs text-[var(--text-tertiary)]">
                        {subtask.estimatedHours}h estimated
                      </p>
                    )}
                    {subtask.assignees && subtask.assignees.length > 0 && (
                      <div className="flex gap-1 mt-1">
                        {subtask.assignees.map(assigneeId => {
                          const member = teamMembers.find(m => m.id === assigneeId);
                          return (
                            <span
                              key={assigneeId}
                              className="text-xs px-1.5 py-0.5 bg-[var(--accent-primary)]/20 text-[var(--accent-primary)] rounded"
                            >
                              {member?.name || 'Unknown'}
                            </span>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}

                {/* Actions */}
                <div className="flex gap-1">
                  {index > 0 && (
                    <button
                      onClick={() => handleReorderSubtask(subtask.id, 'up')}
                      className="p-1 text-[var(--text-tertiary)] hover:text-[var(--accent-primary)] transition-colors"
                      title="Move up"
                    >
                      ↑
                    </button>
                  )}
                  {index < total - 1 && (
                    <button
                      onClick={() => handleReorderSubtask(subtask.id, 'down')}
                      className="p-1 text-[var(--text-tertiary)] hover:text-[var(--accent-primary)] transition-colors"
                      title="Move down"
                    >
                      ↓
                    </button>
                  )}
                  <button
                    onClick={() => setEditingSubtaskId(subtask.id)}
                    className="p-1 text-[var(--text-tertiary)] hover:text-[var(--accent-primary)] transition-colors"
                    title="Edit"
                  >
                    ✎
                  </button>
                  <button
                    onClick={() => handleDeleteSubtask(subtask.id)}
                    className="p-1 text-red-500 hover:text-red-400 transition-colors"
                    title="Delete"
                  >
                    ✕
                  </button>
                </div>
              </div>
            ))}
        </div>
      )}

      {/* Add Subtask */}
      {!isAddingSubtask ? (
        <button
          onClick={() => setIsAddingSubtask(true)}
          className="w-full px-3 py-2 text-sm bg-[var(--accent-primary)]/10 text-[var(--accent-primary)] border border-[var(--accent-primary)]/30 rounded-lg hover:bg-[var(--accent-primary)]/20 transition-colors"
        >
          + Add Subtask
        </button>
      ) : (
        <div className="space-y-2 p-3 bg-[var(--bg-tertiary)] rounded-lg border border-[var(--border-primary)]">
          <input
            type="text"
            placeholder="Subtask name..."
            value={newSubtaskName}
            onChange={(e) => setNewSubtaskName(e.target.value)}
            onKeyPress={(e) => {
              if (e.key === 'Enter') {
                handleAddSubtask();
              }
            }}
            className="w-full px-2 py-1 bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded text-[var(--text-primary)] text-sm"
            autoFocus
          />
          <div className="flex gap-2">
            <button
              onClick={handleAddSubtask}
              disabled={!newSubtaskName.trim()}
              className="flex-1 px-2 py-1 text-sm bg-[var(--accent-primary)] text-white rounded hover:opacity-80 disabled:opacity-50 disabled:cursor-not-allowed transition-opacity"
            >
              Add
            </button>
            <button
              onClick={() => {
                setIsAddingSubtask(false);
                setNewSubtaskName('');
              }}
              className="flex-1 px-2 py-1 text-sm bg-[var(--bg-secondary)] text-[var(--text-primary)] border border-[var(--border-primary)] rounded hover:opacity-80 transition-opacity"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Empty State */}
      {total === 0 && !isAddingSubtask && (
        <div className="text-center py-4 text-[var(--text-tertiary)] text-sm">
          <p>No subtasks yet</p>
          <p className="text-xs mt-1">Break this task into smaller steps to track progress.</p>
        </div>
      )}
    </div>
  );
};

export default SubtaskManager;

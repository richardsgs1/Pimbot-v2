import React from 'react';
import type { Task, Project, TaskStatus } from '../types';
import { PRIORITY_VALUES, TaskStatus as TaskStatusEnum } from '../types';

interface TaskDetailModalProps {
  task: Task | null;
  project: Project | null;
  isOpen: boolean;
  onClose: () => void;
  onEdit?: (task: Task, projectId: string) => void;
  onDelete?: (taskId: string, projectId: string) => void;
  onToggleComplete?: (taskId: string, projectId: string, completed: boolean) => void;
}

const TaskDetailModal: React.FC<TaskDetailModalProps> = ({
  task,
  project,
  isOpen,
  onClose,
  onEdit,
  onDelete,
  onToggleComplete
}) => {
  if (!isOpen || !task || !project) return null;

  const isOverdue = task.dueDate && new Date(task.dueDate) < new Date() && !task.completed;

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case PRIORITY_VALUES.High:
        return 'text-orange-500 bg-orange-500/20';
      case PRIORITY_VALUES.Medium:
        return 'text-blue-500 bg-blue-500/20';
      case PRIORITY_VALUES.Low:
        return 'text-gray-500 bg-gray-500/20';
      default:
        return 'text-gray-500 bg-gray-500/20';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case TaskStatusEnum.ToDo:
        return 'text-slate-400 bg-slate-500/20';
      case TaskStatusEnum.InProgress:
        return 'text-blue-400 bg-blue-500/20';
      case TaskStatusEnum.Done:
        return 'text-green-400 bg-green-500/20';
      default:
        return 'text-slate-400 bg-slate-500/20';
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="p-6 border-b border-[var(--border-primary)]">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                {task.completed ? (
                  <span className="text-2xl">✅</span>
                ) : isOverdue ? (
                  <span className="text-2xl">🔴</span>
                ) : (
                  <span className="text-2xl">📋</span>
                )}
                <h2 className="text-2xl font-bold text-[var(--text-primary)]">{task.name}</h2>
              </div>
              <p className="text-sm text-[var(--text-tertiary)]">
                From: <span className="text-[var(--accent-primary)] font-medium">{project.name}</span>
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-[var(--text-tertiary)] hover:text-[var(--text-primary)] p-2"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Status Badges */}
          <div className="flex flex-wrap gap-2 mt-4">
            <span className={`px-3 py-1 rounded-full text-xs font-medium ${getPriorityColor(task.priority)}`}>
              {task.priority} Priority
            </span>
            <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(task.status)}`}>
              {task.status}
            </span>
            {isOverdue && (
              <span className="px-3 py-1 rounded-full text-xs font-medium text-red-500 bg-red-500/20">
                Overdue
              </span>
            )}
            {task.completed && (
              <span className="px-3 py-1 rounded-full text-xs font-medium text-green-500 bg-green-500/20">
                Completed
              </span>
            )}
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Description */}
          {task.description && (
            <div>
              <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-2">Description</h3>
              <p className="text-[var(--text-secondary)] whitespace-pre-wrap">{task.description}</p>
            </div>
          )}

          {/* Details Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Due Date */}
            {task.dueDate && (
              <div>
                <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-1">Due Date</h3>
                <p className={`text-[var(--text-secondary)] ${isOverdue ? 'text-red-500 font-semibold' : ''}`}>
                  {new Date(task.dueDate).toLocaleDateString('en-US', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </p>
              </div>
            )}

            {/* Start Date */}
            {task.startDate && (
              <div>
                <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-1">Start Date</h3>
                <p className="text-[var(--text-secondary)]">
                  {new Date(task.startDate).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </p>
              </div>
            )}

            {/* Assignees */}
            {task.assignees && task.assignees.length > 0 && (
              <div>
                <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-1">Assigned To</h3>
                <div className="flex flex-wrap gap-2">
                  {task.assignees.map((assignee, idx) => (
                    <span key={idx} className="px-2 py-1 bg-[var(--bg-tertiary)] rounded text-xs text-[var(--text-secondary)]">
                      {assignee}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Estimated Hours */}
            {task.estimatedHours && (
              <div>
                <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-1">Estimated Time</h3>
                <p className="text-[var(--text-secondary)]">{task.estimatedHours} hours</p>
              </div>
            )}
          </div>

          {/* Attachments */}
          {task.attachments && task.attachments.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-2">Attachments</h3>
              <div className="space-y-2">
                {task.attachments.map((attachment, idx) => {
                  // Handle both string and FileAttachment types
                  const attachmentUrl = typeof attachment === 'string' ? attachment : attachment.url;
                  const attachmentName = typeof attachment === 'string' ? attachment : attachment.name;
                  
                  return (
                    <a
                      key={idx}
                      href={attachmentUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 p-2 bg-[var(--bg-tertiary)] rounded hover:bg-[var(--bg-tertiary)] transition-colors"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-[var(--accent-primary)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                      </svg>
                      <span className="text-sm text-[var(--text-secondary)] flex-1 truncate">{attachmentName}</span>
                    </a>
                  );
                })}
              </div>
            </div>
          )}

          {/* Timestamps */}
          <div className="flex flex-wrap gap-4 text-xs text-[var(--text-tertiary)] pt-4 border-t border-[var(--border-primary)]">
            {task.createdAt && (
              <div>
                Created: {new Date(task.createdAt).toLocaleDateString()}
              </div>
            )}
            {task.updatedAt && (
              <div>
                Updated: {new Date(task.updatedAt).toLocaleDateString()}
              </div>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="p-6 border-t border-[var(--border-primary)] flex flex-wrap gap-3">
          {onToggleComplete && (
            <button
              onClick={() => onToggleComplete(task.id, project.id, !task.completed)}
              className={`flex-1 min-w-[150px] py-2 px-4 rounded-lg font-medium transition-colors ${
                task.completed
                  ? 'bg-gray-500 hover:bg-gray-600 text-white'
                  : 'bg-green-500 hover:bg-green-600 text-white'
              }`}
            >
              {task.completed ? '↩️ Mark Incomplete' : '✓ Mark Complete'}
            </button>
          )}

          {onEdit && (
            <button
              onClick={() => {
                onEdit(task, project.id);
                onClose();
              }}
              className="flex-1 min-w-[120px] bg-[var(--accent-primary)] hover:bg-[var(--accent-secondary)] text-white py-2 px-4 rounded-lg font-medium transition-colors"
            >
              ✏️ Edit
            </button>
          )}

          {onDelete && (
            <button
              onClick={() => {
                if (window.confirm('Are you sure you want to delete this task?')) {
                  onDelete(task.id, project.id);
                  onClose();
                }
              }}
              className="bg-red-500 hover:bg-red-600 text-white py-2 px-4 rounded-lg font-medium transition-colors"
            >
              🗑️ Delete
            </button>
          )}

          <button
            onClick={onClose}
            className="bg-gray-500 hover:bg-gray-600 text-white py-2 px-4 rounded-lg font-medium transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default TaskDetailModal;
import React, { useState } from 'react';
import type { Task, Project, TaskStatus, TeamMember, TaskTemplate } from '../types';
import { PRIORITY_VALUES, TaskStatus as TaskStatusEnum } from '../types';
import TaskDependencies from './TaskDependencies';
import SubtaskManager from './SubtaskManager';
import RecurringTaskSetup from './RecurringTaskSetup';
import TaskTemplateManager from './TaskTemplateManager';
import { dependencyResolver } from '../lib/DependencyResolver';
import { subtaskCalculator } from '../lib/SubtaskCalculator';

interface TaskDetailModalProps {
  task: Task | null;
  project: Project | null;
  isOpen: boolean;
  onClose: () => void;
  onEdit?: (task: Task, projectId: string) => void;
  onDelete?: (taskId: string, projectId: string) => void;
  onToggleComplete?: (taskId: string, projectId: string, completed: boolean) => void;
  teamMembers?: TeamMember[];
  templates?: TaskTemplate[];
  onUpdateTask?: (updates: Partial<Task>) => void;
  onSaveTemplate?: (template: TaskTemplate) => void;
  onLoadTemplate?: (template: TaskTemplate) => void;
  onDeleteTemplate?: (templateId: string) => void;
}

type TabType = 'overview' | 'dependencies' | 'subtasks' | 'recurring' | 'templates';

const TaskDetailModal: React.FC<TaskDetailModalProps> = ({
  task,
  project,
  isOpen,
  onClose,
  onEdit,
  onDelete,
  onToggleComplete,
  teamMembers = [],
  templates = [],
  onUpdateTask,
  onSaveTemplate,
  onLoadTemplate,
  onDeleteTemplate,
}) => {
  const [activeTab, setActiveTab] = useState<TabType>('overview');

  if (!isOpen || !task || !project) return null;

  // Get advanced task info
  const blockingTasks = dependencyResolver.getBlockingTasks(task.id, project);
  const dependentTasks = dependencyResolver.getDependentTasks(task.id, project);
  const subtaskStats = subtaskCalculator.getProgressStats(task);

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
      <div className="bg-[var(--bg-primary)] border border-[var(--border-primary)] rounded-xl max-w-3xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex-shrink-0 p-6 border-b border-[var(--border-primary)] bg-[var(--bg-secondary)]">
          <div className="flex items-start justify-between mb-4">
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
              {task.isBlocked && blockingTasks.length > 0 && (
                <p className="text-sm text-red-600 dark:text-red-400 mt-1">
                  ⛔ Blocked by {blockingTasks.length} task{blockingTasks.length !== 1 ? 's' : ''}
                </p>
              )}
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

          {/* Tab Navigation */}
          <div className="flex gap-1 overflow-x-auto pb-2 -mx-6 px-6">
            <button
              onClick={() => setActiveTab('overview')}
              className={`px-3 py-2 rounded-lg transition-colors whitespace-nowrap flex items-center gap-1 text-sm ${
                activeTab === 'overview'
                  ? 'bg-[var(--accent-primary)] text-white'
                  : 'bg-[var(--bg-tertiary)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
              }`}
            >
              <span>📋</span> Overview
            </button>
            <button
              onClick={() => setActiveTab('dependencies')}
              className={`px-3 py-2 rounded-lg transition-colors whitespace-nowrap flex items-center gap-1 text-sm ${
                activeTab === 'dependencies'
                  ? 'bg-[var(--accent-primary)] text-white'
                  : 'bg-[var(--bg-tertiary)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
              } ${(blockingTasks.length > 0 || dependentTasks.length > 0) ? 'ring-2 ring-orange-500' : ''}`}
            >
              <span>⛓️</span> Dependencies
              {(blockingTasks.length > 0 || dependentTasks.length > 0) && (
                <span className="ml-1 w-2 h-2 bg-orange-500 rounded-full"></span>
              )}
            </button>
            <button
              onClick={() => setActiveTab('subtasks')}
              className={`px-3 py-2 rounded-lg transition-colors whitespace-nowrap flex items-center gap-1 text-sm ${
                activeTab === 'subtasks'
                  ? 'bg-[var(--accent-primary)] text-white'
                  : 'bg-[var(--bg-tertiary)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
              } ${subtaskStats.totalSubtasks > 0 && subtaskStats.progressPercentage < 100 ? 'ring-2 ring-orange-500' : ''}`}
            >
              <span>✓</span> Subtasks
              {subtaskStats.totalSubtasks > 0 && (
                <span className="text-xs ml-1">({subtaskStats.completedSubtasks}/{subtaskStats.totalSubtasks})</span>
              )}
            </button>
            <button
              onClick={() => setActiveTab('recurring')}
              className={`px-3 py-2 rounded-lg transition-colors whitespace-nowrap flex items-center gap-1 text-sm ${
                activeTab === 'recurring'
                  ? 'bg-[var(--accent-primary)] text-white'
                  : 'bg-[var(--bg-tertiary)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
              } ${task.isRecurring ? 'ring-2 ring-orange-500' : ''}`}
            >
              <span>🔁</span> Recurring
            </button>
            <button
              onClick={() => setActiveTab('templates')}
              className={`px-3 py-2 rounded-lg transition-colors whitespace-nowrap flex items-center gap-1 text-sm ${
                activeTab === 'templates'
                  ? 'bg-[var(--accent-primary)] text-white'
                  : 'bg-[var(--bg-tertiary)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
              }`}
            >
              <span>⭐</span> Templates
            </button>
          </div>
        </div>

        {/* Content - Tabbed */}
        <div className="flex-1 overflow-y-auto p-6">
          {activeTab === 'overview' && (
            <div className="space-y-6">
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
                {task.createdAt && <div>Created: {new Date(task.createdAt).toLocaleDateString()}</div>}
                {task.updatedAt && <div>Updated: {new Date(task.updatedAt).toLocaleDateString()}</div>}
              </div>
            </div>
          )}

          {activeTab === 'dependencies' && onUpdateTask && (
            <TaskDependencies
              task={task}
              project={project}
              onUpdateTask={onUpdateTask}
            />
          )}

          {activeTab === 'subtasks' && onUpdateTask && (
            <SubtaskManager
              task={task}
              teamMembers={teamMembers}
              onUpdateTask={onUpdateTask}
            />
          )}

          {activeTab === 'recurring' && onUpdateTask && (
            <RecurringTaskSetup task={task} onUpdateTask={onUpdateTask} />
          )}

          {activeTab === 'templates' && onSaveTemplate && onLoadTemplate && onDeleteTemplate && (
            <TaskTemplateManager
              task={task}
              templates={templates}
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
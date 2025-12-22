/**
 * TaskTemplateSelector Component
 *
 * Allows users to save tasks as templates or create tasks from existing templates.
 */

import React, { useState } from 'react';
import type { Task, TaskTemplate } from '../types';
import { TaskTemplateService } from '../lib/TaskTemplateService';

interface TaskTemplateSelectorProps {
  task: Task;
  templates: TaskTemplate[];
  userId: string;
  onSaveAsTemplate: (template: TaskTemplate) => void;
  onCreateFromTemplate: (task: Task) => void;
  onClose?: () => void;
}

export const TaskTemplateSelector: React.FC<TaskTemplateSelectorProps> = ({
  task,
  templates,
  userId,
  onSaveAsTemplate,
  onCreateFromTemplate,
  onClose
}) => {
  const [mode, setMode] = useState<'save' | 'load'>('save');
  const [templateName, setTemplateName] = useState(task.name);
  const [templateCategory, setTemplateCategory] = useState('General');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(null);
  const [validationError, setValidationError] = useState<string | null>(null);

  const categories = TaskTemplateService.getCategories(templates);
  const filteredTemplates = searchQuery
    ? TaskTemplateService.searchTemplates(templates, searchQuery)
    : templates;

  const handleSaveAsTemplate = () => {
    if (!templateName.trim()) {
      setValidationError('Template name is required');
      return;
    }

    if (!templateCategory.trim()) {
      setValidationError('Category is required');
      return;
    }

    const newTemplate = TaskTemplateService.createTemplateFromTask(
      task,
      userId,
      templateCategory
    );

    const updatedTemplate = { ...newTemplate, name: templateName };
    const validation = TaskTemplateService.validateTemplate(updatedTemplate);

    if (!validation.valid) {
      setValidationError(validation.errors[0]);
      return;
    }

    onSaveAsTemplate(updatedTemplate);
  };

  const handleLoadFromTemplate = () => {
    if (!selectedTemplateId) {
      setValidationError('Please select a template');
      return;
    }

    const template = templates.find(t => t.id === selectedTemplateId);
    if (!template) return;

    const result = TaskTemplateService.createTaskFromTemplate(template, {
      dueDate: task.dueDate,
      startDate: task.startDate
    });

    if (!result.success || !result.task) {
      setValidationError(result.error || 'Failed to create task from template');
      return;
    }

    onCreateFromTemplate(result.task);
  };

  const getTemplateStats = (template: TaskTemplate) => {
    return TaskTemplateService.getTemplateStats(template);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-[var(--text-primary)]">
          Task Templates
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

      {/* Mode Tabs */}
      <div className="flex gap-2 p-1 bg-[var(--bg-secondary)] rounded-lg">
        <button
          onClick={() => setMode('save')}
          className={`flex-1 px-4 py-2 rounded-lg font-medium transition-colors ${
            mode === 'save'
              ? 'bg-[var(--accent-primary)] text-white'
              : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
          }`}
        >
          💾 Save as Template
        </button>
        <button
          onClick={() => setMode('load')}
          className={`flex-1 px-4 py-2 rounded-lg font-medium transition-colors ${
            mode === 'load'
              ? 'bg-[var(--accent-primary)] text-white'
              : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
          }`}
        >
          📂 Load Template
        </button>
      </div>

      {validationError && (
        <div className="p-3 bg-red-500/20 border border-red-500/50 rounded-lg">
          <p className="text-red-400 text-sm">{validationError}</p>
        </div>
      )}

      {/* Save Mode */}
      {mode === 'save' && (
        <div className="space-y-4">
          <div className="bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-lg p-4 space-y-4">
            <div>
              <label className="block text-sm font-medium text-[var(--text-primary)] mb-2">
                Template Name
              </label>
              <input
                type="text"
                value={templateName}
                onChange={(e) => setTemplateName(e.target.value)}
                placeholder="Enter template name..."
                className="w-full px-3 py-2 bg-[var(--bg-primary)] border border-[var(--border-primary)] rounded-lg text-[var(--text-primary)]"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-[var(--text-primary)] mb-2">
                Category
              </label>
              <div className="flex gap-2">
                <select
                  value={templateCategory}
                  onChange={(e) => setTemplateCategory(e.target.value)}
                  className="flex-1 px-3 py-2 bg-[var(--bg-primary)] border border-[var(--border-primary)] rounded-lg text-[var(--text-primary)]"
                >
                  <option value="">Select or create...</option>
                  {categories.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
                <input
                  type="text"
                  value={templateCategory}
                  onChange={(e) => setTemplateCategory(e.target.value)}
                  placeholder="Or type new..."
                  className="flex-1 px-3 py-2 bg-[var(--bg-primary)] border border-[var(--border-primary)] rounded-lg text-[var(--text-primary)]"
                />
              </div>
            </div>

            {/* Preview */}
            <div className="pt-4 border-t border-[var(--border-primary)]">
              <h4 className="text-sm font-medium text-[var(--text-primary)] mb-3">
                Template will include:
              </h4>
              <div className="space-y-2 text-sm text-[var(--text-secondary)]">
                <div className="flex items-center gap-2">
                  <span className="text-green-400">✓</span>
                  <span>Task name and description</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-green-400">✓</span>
                  <span>Priority ({task.priority})</span>
                </div>
                {task.estimatedHours && (
                  <div className="flex items-center gap-2">
                    <span className="text-green-400">✓</span>
                    <span>Estimated hours ({task.estimatedHours}h)</span>
                  </div>
                )}
                {task.subtasks && task.subtasks.length > 0 && (
                  <div className="flex items-center gap-2">
                    <span className="text-green-400">✓</span>
                    <span>{task.subtasks.length} subtasks</span>
                  </div>
                )}
                {task.tags && task.tags.length > 0 && (
                  <div className="flex items-center gap-2">
                    <span className="text-green-400">✓</span>
                    <span>{task.tags.length} tags</span>
                  </div>
                )}
                {task.assignees && task.assignees.length > 0 && (
                  <div className="flex items-center gap-2">
                    <span className="text-green-400">✓</span>
                    <span>Default assignees</span>
                  </div>
                )}
              </div>
            </div>

            <button
              onClick={handleSaveAsTemplate}
              disabled={!templateName.trim() || !templateCategory.trim()}
              className="w-full px-4 py-2 bg-[var(--accent-primary)] hover:opacity-90 text-white rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Save Template
            </button>
          </div>
        </div>
      )}

      {/* Load Mode */}
      {mode === 'load' && (
        <div className="space-y-4">
          {/* Search */}
          <div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search templates..."
              className="w-full px-3 py-2 bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-lg text-[var(--text-primary)]"
            />
          </div>

          {/* Template List */}
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {filteredTemplates.length === 0 ? (
              <div className="text-center py-8 text-[var(--text-secondary)]">
                <div className="text-4xl mb-2">📋</div>
                <p>No templates found</p>
                <p className="text-sm mt-1">
                  {searchQuery ? 'Try a different search' : 'Save your first template to get started'}
                </p>
              </div>
            ) : (
              filteredTemplates.map(template => {
                const stats = getTemplateStats(template);
                const isSelected = selectedTemplateId === template.id;

                return (
                  <div
                    key={template.id}
                    onClick={() => setSelectedTemplateId(template.id)}
                    className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                      isSelected
                        ? 'border-[var(--accent-primary)] bg-[var(--accent-primary)]/10'
                        : 'border-[var(--border-primary)] bg-[var(--bg-secondary)] hover:border-[var(--accent-primary)]/50'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h4 className="font-medium text-[var(--text-primary)]">
                            {template.name}
                          </h4>
                          <span className="px-2 py-0.5 text-xs bg-blue-500/20 text-blue-300 rounded">
                            {template.category}
                          </span>
                        </div>
                        {template.description && (
                          <p className="text-sm text-[var(--text-secondary)] mt-1 line-clamp-2">
                            {template.description}
                          </p>
                        )}
                      </div>
                      {isSelected && (
                        <span className="text-[var(--accent-primary)] text-xl">✓</span>
                      )}
                    </div>

                    {/* Stats */}
                    <div className="flex gap-4 mt-3 text-xs text-[var(--text-tertiary)]">
                      {stats.subtaskCount > 0 && (
                        <span>📝 {stats.subtaskCount} subtasks</span>
                      )}
                      {stats.totalEstimatedHours > 0 && (
                        <span>⏱ {stats.totalEstimatedHours}h</span>
                      )}
                      {stats.tagCount > 0 && (
                        <span>🏷 {stats.tagCount} tags</span>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Load Button */}
          {filteredTemplates.length > 0 && (
            <button
              onClick={handleLoadFromTemplate}
              disabled={!selectedTemplateId}
              className="w-full px-4 py-2 bg-[var(--accent-primary)] hover:opacity-90 text-white rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Apply Template
            </button>
          )}
        </div>
      )}
    </div>
  );
};

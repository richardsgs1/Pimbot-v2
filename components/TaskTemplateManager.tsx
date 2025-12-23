import React, { useState } from 'react';
import type { Task, TaskTemplate } from '../types';
import { generateUUID } from '../lib/utils';

interface TaskTemplateManagerProps {
  task: Task;
  templates: TaskTemplate[];
  userId: string; // Add userId prop from auth context
  onSaveTemplate: (template: TaskTemplate) => void;
  onLoadTemplate: (template: TaskTemplate) => void;
  onDeleteTemplate: (templateId: string) => void;
}

const TaskTemplateManager: React.FC<TaskTemplateManagerProps> = ({
  task,
  templates,
  userId,
  onSaveTemplate,
  onLoadTemplate,
  onDeleteTemplate,
}) => {
  const [isSavingTemplate, setIsSavingTemplate] = useState(false);
  const [templateName, setTemplateName] = useState('');
  const [templateCategory, setTemplateCategory] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');

  // Get unique categories
  const categories = Array.from(new Set(templates.map(t => t.category))).sort();

  const handleSaveAsTemplate = () => {
    if (!templateName.trim() || !templateCategory.trim()) {
      alert('Please fill in template name and category');
      return;
    }

    if (!userId) {
      alert('Error: User not authenticated. Please log in.');
      return;
    }

    const newTemplate: TaskTemplate = {
      id: generateUUID(),
      userId: userId, // Use auth context user ID
      name: templateName,
      description: task.description,
      category: templateCategory,
      defaultPriority: task.priority,
      defaultEstimatedHours: task.estimatedHours,
      subtasks: task.subtasks,
      defaultAssignees: task.assignees,
      tags: task.tags,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    onSaveTemplate(newTemplate);
    setTemplateName('');
    setTemplateCategory('');
    setIsSavingTemplate(false);
  };

  const handleLoadTemplate = (template: TaskTemplate) => {
    if (confirm(`Load template "${template.name}"? This will overwrite current task settings.`)) {
      onLoadTemplate(template);
    }
  };

  const filteredTemplates = selectedCategory
    ? templates.filter(t => t.category === selectedCategory)
    : templates;

  return (
    <div className="space-y-4">
      {/* Save as Template Button */}
      {!isSavingTemplate ? (
        <button
          onClick={() => setIsSavingTemplate(true)}
          className="w-full px-3 py-2 text-sm bg-[var(--accent-primary)]/10 text-[var(--accent-primary)] border border-[var(--accent-primary)]/30 rounded-lg hover:bg-[var(--accent-primary)]/20 transition-colors"
        >
          💾 Save as Template
        </button>
      ) : (
        <div className="space-y-2 p-3 bg-[var(--bg-tertiary)] rounded-lg border border-[var(--border-primary)]">
          <div>
            <label className="block text-sm font-medium text-[var(--text-primary)] mb-1">
              Template Name
            </label>
            <input
              type="text"
              placeholder="e.g., Weekly Review, Sprint Planning"
              value={templateName}
              onChange={(e) => setTemplateName(e.target.value)}
              className="w-full px-2 py-1 bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded text-[var(--text-primary)] text-sm"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-[var(--text-primary)] mb-1">
              Category
            </label>
            <div className="space-y-2">
              <input
                type="text"
                placeholder="New category or select existing..."
                value={templateCategory}
                onChange={(e) => setTemplateCategory(e.target.value)}
                className="w-full px-2 py-1 bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded text-[var(--text-primary)] text-sm"
              />
              {categories.length > 0 && (
                <div className="flex gap-1 flex-wrap">
                  {categories.map(cat => (
                    <button
                      key={cat}
                      onClick={() => setTemplateCategory(cat)}
                      className={`px-2 py-1 text-xs rounded transition-colors ${
                        templateCategory === cat
                          ? 'bg-[var(--accent-primary)] text-white'
                          : 'bg-[var(--bg-secondary)] text-[var(--text-secondary)] border border-[var(--border-primary)] hover:border-[var(--accent-primary)]'
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="text-xs text-[var(--text-tertiary)] p-2 bg-[var(--bg-secondary)] rounded">
            <p className="font-medium mb-1">This template will include:</p>
            <ul className="space-y-0.5">
              <li>✓ Task name and description</li>
              <li>✓ Priority and estimated hours</li>
              {task.subtasks && task.subtasks.length > 0 && (
                <li>✓ {task.subtasks.length} subtasks</li>
              )}
              {task.assignees && task.assignees.length > 0 && (
                <li>✓ {task.assignees.length} assignees</li>
              )}
              {task.tags && task.tags.length > 0 && (
                <li>✓ {task.tags.length} tags</li>
              )}
            </ul>
          </div>

          <div className="flex gap-2">
            <button
              onClick={handleSaveAsTemplate}
              disabled={!templateName.trim() || !templateCategory.trim()}
              className="flex-1 px-2 py-1 text-sm bg-[var(--accent-primary)] text-white rounded hover:opacity-80 disabled:opacity-50 disabled:cursor-not-allowed transition-opacity"
            >
              Save
            </button>
            <button
              onClick={() => {
                setIsSavingTemplate(false);
                setTemplateName('');
                setTemplateCategory('');
              }}
              className="flex-1 px-2 py-1 text-sm bg-[var(--bg-secondary)] text-[var(--text-primary)] border border-[var(--border-primary)] rounded hover:opacity-80 transition-opacity"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Templates List */}
      {templates.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-sm font-medium text-[var(--text-primary)]">
            Saved Templates ({filteredTemplates.length})
          </h3>

          {/* Category Filter */}
          {categories.length > 0 && (
            <div className="flex gap-1 flex-wrap">
              <button
                onClick={() => setSelectedCategory('')}
                className={`px-2 py-1 text-xs rounded transition-colors ${
                  selectedCategory === ''
                    ? 'bg-[var(--accent-primary)] text-white'
                    : 'bg-[var(--bg-tertiary)] text-[var(--text-secondary)] border border-[var(--border-primary)] hover:border-[var(--accent-primary)]'
                }`}
              >
                All
              </button>
              {categories.map(cat => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-2 py-1 text-xs rounded transition-colors ${
                    selectedCategory === cat
                      ? 'bg-[var(--accent-primary)] text-white'
                      : 'bg-[var(--bg-tertiary)] text-[var(--text-secondary)] border border-[var(--border-primary)] hover:border-[var(--accent-primary)]'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          )}

          {/* Templates */}
          {filteredTemplates.length > 0 ? (
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {filteredTemplates.map(template => (
                <div
                  key={template.id}
                  className="p-3 bg-[var(--bg-tertiary)] rounded-lg border border-[var(--border-primary)] hover:border-[var(--accent-primary)] transition-colors"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <h4 className="text-sm font-medium text-[var(--text-primary)]">
                        {template.name}
                      </h4>
                      <p className="text-xs text-[var(--text-tertiary)]">
                        Category: {template.category}
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-1 mb-2 text-xs">
                    {template.defaultPriority && (
                      <span className="px-1.5 py-0.5 bg-[var(--accent-primary)]/20 text-[var(--accent-primary)] rounded">
                        {template.defaultPriority} priority
                      </span>
                    )}
                    {template.defaultEstimatedHours && (
                      <span className="px-1.5 py-0.5 bg-[var(--accent-primary)]/20 text-[var(--accent-primary)] rounded">
                        {template.defaultEstimatedHours}h est.
                      </span>
                    )}
                    {template.subtasks && template.subtasks.length > 0 && (
                      <span className="px-1.5 py-0.5 bg-blue-500/20 text-blue-600 dark:text-blue-400 rounded">
                        {template.subtasks.length} subtasks
                      </span>
                    )}
                    {template.defaultAssignees && template.defaultAssignees.length > 0 && (
                      <span className="px-1.5 py-0.5 bg-green-500/20 text-green-600 dark:text-green-400 rounded">
                        {template.defaultAssignees.length} assignees
                      </span>
                    )}
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={() => handleLoadTemplate(template)}
                      className="flex-1 px-2 py-1 text-xs bg-[var(--accent-primary)] text-white rounded hover:opacity-80 transition-opacity"
                    >
                      Load
                    </button>
                    <button
                      onClick={() => {
                        if (confirm(`Delete template "${template.name}"?`)) {
                          onDeleteTemplate(template.id);
                        }
                      }}
                      className="px-2 py-1 text-xs bg-red-500/20 text-red-600 dark:text-red-400 rounded hover:bg-red-500/30 transition-colors"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-4 text-[var(--text-tertiary)] text-sm">
              <p>No templates in {selectedCategory ? `${selectedCategory} category` : 'this category'}</p>
            </div>
          )}
        </div>
      )}

      {/* Empty State */}
      {templates.length === 0 && !isSavingTemplate && (
        <div className="text-center py-4 text-[var(--text-tertiary)] text-sm">
          <p>No templates yet</p>
          <p className="text-xs mt-1">Save this task as a template to reuse it later.</p>
        </div>
      )}
    </div>
  );
};

export default TaskTemplateManager;

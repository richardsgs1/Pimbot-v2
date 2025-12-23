import React, { useState } from 'react';
import type { TaskTemplate } from '../types';
import { PRIORITY_VALUES } from '../types';
import { generateUUID } from '../lib/utils';

interface TemplateManagementProps {
  templates: TaskTemplate[];
  userId: string;
  onSaveTemplate: (template: TaskTemplate) => void;
  onDeleteTemplate: (templateId: string) => void;
  onLoadTemplate?: (template: TaskTemplate) => void;
  onMenuClick?: () => void;
}

const TemplateManagement: React.FC<TemplateManagementProps> = ({
  templates,
  userId,
  onSaveTemplate,
  onDeleteTemplate,
  onLoadTemplate,
  onMenuClick
}) => {
  const [isCreatingTemplate, setIsCreatingTemplate] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [editingTemplate, setEditingTemplate] = useState<TaskTemplate | null>(null);

  // Form state for creating/editing templates
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category: '',
    defaultPriority: PRIORITY_VALUES.Medium,
    defaultEstimatedHours: 0,
    tags: [] as string[]
  });

  const [tagInput, setTagInput] = useState('');
  const [validationError, setValidationError] = useState<string | null>(null);

  // Get unique categories
  const categories = Array.from(new Set(templates.map(t => t.category))).sort();

  // Filter templates
  const filteredTemplates = templates.filter(t => {
    const matchesCategory = !selectedCategory || t.category === selectedCategory;
    const matchesSearch = !searchTerm ||
      t.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.description?.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const handleCreateTemplate = () => {
    // Validate required fields
    if (!formData.name.trim()) {
      setValidationError('Template name is required');
      return;
    }
    if (!formData.category.trim()) {
      setValidationError('Category is required');
      return;
    }

    setValidationError(null);

    const newTemplate: TaskTemplate = {
      id: generateUUID(),
      userId: userId,
      name: formData.name,
      description: formData.description,
      category: formData.category,
      defaultPriority: formData.defaultPriority,
      defaultEstimatedHours: formData.defaultEstimatedHours,
      subtasks: [],
      defaultAssignees: [],
      tags: formData.tags,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    onSaveTemplate(newTemplate);
    resetForm();
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      category: '',
      defaultPriority: PRIORITY_VALUES.Medium,
      defaultEstimatedHours: 0,
      tags: []
    });
    setTagInput('');
    setIsCreatingTemplate(false);
    setEditingTemplate(null);
  };

  const handleAddTag = () => {
    if (tagInput.trim() && !formData.tags.includes(tagInput.trim())) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, tagInput.trim()]
      }));
      setTagInput('');
    }
  };

  const handleRemoveTag = (tag: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(t => t !== tag)
    }));
  };

  return (
    <div className="w-full h-full flex flex-col bg-[var(--bg-primary)]">
      {/* Header */}
      <div className="flex-shrink-0 border-b border-[var(--border-primary)] p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-3xl font-bold text-[var(--text-primary)]">📋 Task Templates</h1>
            <p className="text-[var(--text-secondary)] mt-1">Create and manage reusable task templates</p>
          </div>
          {onMenuClick && (
            <button onClick={onMenuClick} className="text-[var(--text-secondary)] hover:text-[var(--text-primary)]">
              ☰
            </button>
          )}
        </div>

        <button
          onClick={() => setIsCreatingTemplate(true)}
          className="w-full px-4 py-2 bg-[var(--accent-primary)] text-white rounded-lg hover:opacity-90 transition-opacity font-medium flex items-center justify-center gap-2"
        >
          <span>➕</span> Create New Template
        </button>
      </div>

      {/* Create/Edit Form */}
      {isCreatingTemplate && (
        <div className="border-b border-[var(--border-primary)] p-6 bg-[var(--bg-secondary)]">
          <h2 className="text-xl font-bold text-[var(--text-primary)] mb-4">Create New Template</h2>

          {/* Validation Error Message */}
          {validationError && (
            <div className="mb-4 p-4 bg-red-500/20 border border-red-500/50 rounded-lg">
              <p className="text-red-400 text-sm font-medium">{validationError}</p>
            </div>
          )}

          <div className="space-y-4">
            {/* Name */}
            <div>
              <label className="block text-sm font-medium text-[var(--text-primary)] mb-2">
                Template Name *
              </label>
              <input
                type="text"
                placeholder="e.g., Code Review, Bug Fix"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                className="w-full px-3 py-2 bg-[var(--bg-primary)] border border-[var(--border-primary)] rounded-lg text-[var(--text-primary)] placeholder-[var(--text-tertiary)]"
              />
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-[var(--text-primary)] mb-2">
                Description
              </label>
              <textarea
                placeholder="What is this template for?"
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                className="w-full px-3 py-2 bg-[var(--bg-primary)] border border-[var(--border-primary)] rounded-lg text-[var(--text-primary)] placeholder-[var(--text-tertiary)]"
                rows={3}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              {/* Category */}
              <div>
                <label className="block text-sm font-medium text-[var(--text-primary)] mb-2">
                  Category *
                </label>
                <input
                  type="text"
                  placeholder="Development, Communication, etc."
                  value={formData.category}
                  onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
                  className="w-full px-3 py-2 bg-[var(--bg-primary)] border border-[var(--border-primary)] rounded-lg text-[var(--text-primary)]"
                />
                {categories.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {categories.map(cat => (
                      <button
                        key={cat}
                        onClick={() => setFormData(prev => ({ ...prev, category: cat }))}
                        className={`px-2 py-1 text-xs rounded transition-colors ${
                          formData.category === cat
                            ? 'bg-[var(--accent-primary)] text-white'
                            : 'bg-[var(--bg-tertiary)] text-[var(--text-secondary)] border border-[var(--border-primary)] hover:border-[var(--accent-primary)]'
                        }`}
                      >
                        {cat}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Priority */}
              <div>
                <label className="block text-sm font-medium text-[var(--text-primary)] mb-2">
                  Default Priority
                </label>
                <select
                  value={formData.defaultPriority}
                  onChange={(e) => setFormData(prev => ({ ...prev, defaultPriority: e.target.value as any }))}
                  className="w-full px-3 py-2 bg-[var(--bg-primary)] border border-[var(--border-primary)] rounded-lg text-[var(--text-primary)]"
                >
                  <option value={PRIORITY_VALUES.Low}>Low</option>
                  <option value={PRIORITY_VALUES.Medium}>Medium</option>
                  <option value={PRIORITY_VALUES.High}>High</option>
                </select>
              </div>
            </div>

            {/* Estimated Hours */}
            <div>
              <label className="block text-sm font-medium text-[var(--text-primary)] mb-2">
                Default Estimated Hours
              </label>
              <input
                type="number"
                min="0"
                step="0.5"
                value={formData.defaultEstimatedHours}
                onChange={(e) => setFormData(prev => ({ ...prev, defaultEstimatedHours: parseFloat(e.target.value) || 0 }))}
                className="w-full px-3 py-2 bg-[var(--bg-primary)] border border-[var(--border-primary)] rounded-lg text-[var(--text-primary)]"
              />
            </div>

            {/* Tags */}
            <div>
              <label className="block text-sm font-medium text-[var(--text-primary)] mb-2">
                Tags
              </label>
              <div className="flex gap-2 mb-2">
                <input
                  type="text"
                  placeholder="Add a tag and press Enter"
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddTag();
                    }
                  }}
                  className="flex-1 px-3 py-2 bg-[var(--bg-primary)] border border-[var(--border-primary)] rounded-lg text-[var(--text-primary)]"
                />
                <button
                  onClick={handleAddTag}
                  className="px-3 py-2 bg-[var(--accent-primary)] text-white rounded-lg hover:opacity-90"
                >
                  Add
                </button>
              </div>
              {formData.tags.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {formData.tags.map(tag => (
                    <button
                      key={tag}
                      onClick={() => handleRemoveTag(tag)}
                      className="px-2 py-1 bg-[var(--accent-primary)]/20 text-[var(--accent-primary)] rounded text-sm hover:bg-[var(--accent-primary)]/30"
                    >
                      {tag} ✕
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Buttons */}
            <div className="flex gap-2 pt-4">
              <button
                onClick={handleCreateTemplate}
                disabled={!formData.name.trim() || !formData.category.trim()}
                className="flex-1 px-4 py-2 bg-[var(--accent-primary)] text-white rounded-lg hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
              >
                Create Template
              </button>
              <button
                onClick={resetForm}
                className="flex-1 px-4 py-2 bg-[var(--bg-tertiary)] text-[var(--text-primary)] border border-[var(--border-primary)] rounded-lg hover:bg-[var(--bg-secondary)]"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Search and Filter */}
      <div className="flex-shrink-0 border-b border-[var(--border-primary)] p-6 space-y-4">
        <input
          type="text"
          placeholder="🔍 Search templates..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full px-4 py-2 bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-lg text-[var(--text-primary)] placeholder-[var(--text-tertiary)]"
        />

        {categories.length > 0 && (
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setSelectedCategory(null)}
              className={`px-3 py-1 rounded-lg text-sm transition-colors ${
                !selectedCategory
                  ? 'bg-[var(--accent-primary)] text-white'
                  : 'bg-[var(--bg-secondary)] text-[var(--text-secondary)] border border-[var(--border-primary)] hover:border-[var(--accent-primary)]'
              }`}
            >
              All Categories
            </button>
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1 rounded-lg text-sm transition-colors ${
                  selectedCategory === cat
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

      {/* Templates Grid */}
      <div className="flex-1 overflow-y-auto p-6">
        {filteredTemplates.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredTemplates.map(template => (
              <div
                key={template.id}
                className="p-4 bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-lg hover:border-[var(--accent-primary)] transition-colors"
              >
                <div className="mb-3">
                  <h3 className="font-semibold text-[var(--text-primary)] text-lg">{template.name}</h3>
                  <p className="text-xs text-[var(--text-tertiary)]">{template.category}</p>
                </div>

                {template.description && (
                  <p className="text-sm text-[var(--text-secondary)] mb-3 line-clamp-2">
                    {template.description}
                  </p>
                )}

                <div className="space-y-2 mb-4 text-sm">
                  {template.defaultPriority && (
                    <div className="flex items-center gap-2">
                      <span className="text-[var(--text-tertiary)]">Priority:</span>
                      <span className="px-2 py-0.5 bg-[var(--accent-primary)]/20 text-[var(--accent-primary)] rounded text-xs">
                        {template.defaultPriority}
                      </span>
                    </div>
                  )}
                  {template.defaultEstimatedHours && (
                    <div className="flex items-center gap-2">
                      <span className="text-[var(--text-tertiary)]">Time:</span>
                      <span className="text-[var(--text-primary)]">{template.defaultEstimatedHours}h</span>
                    </div>
                  )}
                </div>

                {template.tags && template.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1 mb-4">
                    {template.tags.map(tag => (
                      <span
                        key={tag}
                        className="px-2 py-0.5 bg-[var(--bg-tertiary)] text-[var(--text-secondary)] rounded text-xs"
                      >
                        #{tag}
                      </span>
                    ))}
                  </div>
                )}

                <div className="flex gap-2">
                  {onLoadTemplate && (
                    <button
                      onClick={() => onLoadTemplate(template)}
                      className="flex-1 px-3 py-1 text-sm bg-[var(--accent-primary)] text-white rounded hover:opacity-90 transition-opacity"
                    >
                      Use
                    </button>
                  )}
                  <button
                    onClick={() => {
                      if (confirm(`Delete template "${template.name}"?`)) {
                        onDeleteTemplate(template.id);
                      }
                    }}
                    className="px-3 py-1 text-sm bg-red-500/20 text-red-600 dark:text-red-400 rounded hover:bg-red-500/30 transition-colors"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-full">
            <p className="text-[var(--text-tertiary)] text-lg mb-4">
              {templates.length === 0 ? 'No templates yet' : 'No templates match your search'}
            </p>
            {templates.length === 0 && (
              <button
                onClick={() => setIsCreatingTemplate(true)}
                className="px-4 py-2 bg-[var(--accent-primary)] text-white rounded-lg hover:opacity-90"
              >
                Create Your First Template →
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default TemplateManagement;
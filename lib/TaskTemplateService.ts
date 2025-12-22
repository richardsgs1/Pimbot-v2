/**
 * TaskTemplateService
 *
 * Manages task templates for saving and reusing common task configurations.
 * Allows users to create tasks from templates with customization options.
 */

import type {
  Task,
  TaskTemplate,
  TaskFromTemplateResult,
  Priority,
  TaskStatus,
  Subtask
} from '../types';

export class TaskTemplateService {
  /**
   * Create a task template from an existing task
   */
  static createTemplateFromTask(
    task: Task,
    userId: string,
    category: string
  ): TaskTemplate {
    return {
      id: this.generateTemplateId(),
      userId,
      name: task.name,
      description: task.description,
      category,
      defaultPriority: task.priority,
      defaultEstimatedHours: task.estimatedHours,
      subtasks: task.subtasks ? [...task.subtasks] : undefined,
      defaultAssignees: task.assignees.length > 0 ? [...task.assignees] : undefined,
      tags: task.tags ? [...task.tags] : undefined,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
  }

  /**
   * Create a task from a template
   */
  static createTaskFromTemplate(
    template: TaskTemplate,
    options?: {
      name?: string;
      description?: string;
      priority?: Priority;
      estimatedHours?: number;
      assignees?: string[];
      dueDate?: string;
      startDate?: string;
      projectId?: string;
    }
  ): TaskFromTemplateResult {
    try {
      const task: Task = {
        id: this.generateTaskId(),
        name: options?.name || template.name,
        description: options?.description || template.description,
        completed: false,
        status: TaskStatus.ToDo,
        priority: options?.priority || template.defaultPriority || Priority.Medium,
        dueDate: options?.dueDate,
        startDate: options?.startDate,
        assignees: options?.assignees || template.defaultAssignees || [],
        tags: template.tags ? [...template.tags] : [],
        estimatedHours: options?.estimatedHours || template.defaultEstimatedHours,
        actualHours: 0,
        attachments: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        // Copy subtasks if available
        subtasks: template.subtasks
          ? template.subtasks.map(st => ({
              ...st,
              id: this.generateSubtaskId(),
              completed: false
            }))
          : undefined,
        subtaskProgress: 0
      };

      return {
        success: true,
        task
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Update a template
   */
  static updateTemplate(
    template: TaskTemplate,
    updates: Partial<Omit<TaskTemplate, 'id' | 'userId' | 'createdAt'>>
  ): TaskTemplate {
    return {
      ...template,
      ...updates,
      updatedAt: new Date().toISOString()
    };
  }

  /**
   * Validate template data
   */
  static validateTemplate(template: Partial<TaskTemplate>): {
    valid: boolean;
    errors: string[];
  } {
    const errors: string[] = [];

    if (!template.name || template.name.trim().length === 0) {
      errors.push('Template name is required');
    }

    if (template.name && template.name.length > 200) {
      errors.push('Template name must be less than 200 characters');
    }

    if (!template.category || template.category.trim().length === 0) {
      errors.push('Category is required');
    }

    if (template.defaultEstimatedHours !== undefined && template.defaultEstimatedHours < 0) {
      errors.push('Estimated hours cannot be negative');
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  /**
   * Get template categories from a list of templates
   */
  static getCategories(templates: TaskTemplate[]): string[] {
    const categories = new Set<string>();
    templates.forEach(t => categories.add(t.category));
    return Array.from(categories).sort();
  }

  /**
   * Filter templates by category
   */
  static filterByCategory(
    templates: TaskTemplate[],
    category: string
  ): TaskTemplate[] {
    return templates.filter(t => t.category === category);
  }

  /**
   * Search templates by name or description
   */
  static searchTemplates(
    templates: TaskTemplate[],
    query: string
  ): TaskTemplate[] {
    const lowerQuery = query.toLowerCase();
    return templates.filter(
      t =>
        t.name.toLowerCase().includes(lowerQuery) ||
        t.description.toLowerCase().includes(lowerQuery)
    );
  }

  /**
   * Sort templates by various criteria
   */
  static sortTemplates(
    templates: TaskTemplate[],
    sortBy: 'name' | 'category' | 'createdAt' | 'updatedAt',
    order: 'asc' | 'desc' = 'asc'
  ): TaskTemplate[] {
    const sorted = [...templates].sort((a, b) => {
      let comparison = 0;

      switch (sortBy) {
        case 'name':
          comparison = a.name.localeCompare(b.name);
          break;
        case 'category':
          comparison = a.category.localeCompare(b.category);
          break;
        case 'createdAt':
          comparison = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
          break;
        case 'updatedAt':
          comparison = new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime();
          break;
      }

      return order === 'asc' ? comparison : -comparison;
    });

    return sorted;
  }

  /**
   * Duplicate a template
   */
  static duplicateTemplate(
    template: TaskTemplate,
    userId: string
  ): TaskTemplate {
    return {
      ...template,
      id: this.generateTemplateId(),
      name: `${template.name} (Copy)`,
      userId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
  }

  /**
   * Merge multiple templates into one
   */
  static mergeTemplates(
    templates: TaskTemplate[],
    userId: string,
    name: string,
    category: string
  ): TaskTemplate {
    if (templates.length === 0) {
      throw new Error('Cannot merge empty template list');
    }

    // Combine all subtasks
    const allSubtasks: Subtask[] = [];
    templates.forEach(t => {
      if (t.subtasks) {
        allSubtasks.push(
          ...t.subtasks.map(st => ({
            ...st,
            id: this.generateSubtaskId()
          }))
        );
      }
    });

    // Combine tags
    const allTags = new Set<string>();
    templates.forEach(t => {
      if (t.tags) {
        t.tags.forEach(tag => allTags.add(tag));
      }
    });

    // Average estimated hours
    const totalHours = templates.reduce(
      (sum, t) => sum + (t.defaultEstimatedHours || 0),
      0
    );
    const avgHours = templates.length > 0 ? totalHours / templates.length : undefined;

    return {
      id: this.generateTemplateId(),
      userId,
      name,
      description: templates.map(t => t.description).join('\n\n'),
      category,
      defaultPriority: templates[0].defaultPriority,
      defaultEstimatedHours: avgHours,
      subtasks: allSubtasks.length > 0 ? allSubtasks : undefined,
      tags: allTags.size > 0 ? Array.from(allTags) : undefined,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
  }

  /**
   * Get template statistics
   */
  static getTemplateStats(template: TaskTemplate): {
    subtaskCount: number;
    totalEstimatedHours: number;
    tagCount: number;
    assigneeCount: number;
  } {
    return {
      subtaskCount: template.subtasks?.length || 0,
      totalEstimatedHours: template.defaultEstimatedHours || 0,
      tagCount: template.tags?.length || 0,
      assigneeCount: template.defaultAssignees?.length || 0
    };
  }

  /**
   * Export template to JSON
   */
  static exportTemplate(template: TaskTemplate): string {
    return JSON.stringify(template, null, 2);
  }

  /**
   * Import template from JSON
   */
  static importTemplate(
    json: string,
    userId: string
  ): TaskFromTemplateResult {
    try {
      const data = JSON.parse(json);

      // Validate required fields
      if (!data.name || !data.category) {
        return {
          success: false,
          error: 'Invalid template data: missing required fields'
        };
      }

      const template: TaskTemplate = {
        id: this.generateTemplateId(),
        userId,
        name: data.name,
        description: data.description || '',
        category: data.category,
        defaultPriority: data.defaultPriority,
        defaultEstimatedHours: data.defaultEstimatedHours,
        subtasks: data.subtasks,
        defaultAssignees: data.defaultAssignees,
        tags: data.tags,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      return {
        success: true,
        task: template as any // Type gymnastics for compatibility
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to parse JSON'
      };
    }
  }

  /**
   * Get commonly used templates (by usage count)
   * Note: This would require tracking usage in the database
   */
  static getMostUsedTemplates(
    templates: TaskTemplate[],
    limit = 5
  ): TaskTemplate[] {
    // For now, return most recently updated
    // In production, you'd track usage counts
    return this.sortTemplates(templates, 'updatedAt', 'desc').slice(0, limit);
  }

  /**
   * Create a quick task template with minimal info
   */
  static createQuickTemplate(
    userId: string,
    name: string,
    category: string
  ): TaskTemplate {
    return {
      id: this.generateTemplateId(),
      userId,
      name,
      description: '',
      category,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
  }

  /**
   * Batch create tasks from a template
   */
  static batchCreateFromTemplate(
    template: TaskTemplate,
    count: number,
    options?: {
      namePrefix?: string;
      nameSuffix?: string;
      startDate?: string;
      daysBetween?: number;
    }
  ): TaskFromTemplateResult[] {
    const results: TaskFromTemplateResult[] = [];
    const startDate = options?.startDate ? new Date(options.startDate) : new Date();
    const daysBetween = options?.daysBetween || 0;

    for (let i = 0; i < count; i++) {
      const dueDate = new Date(startDate);
      dueDate.setDate(dueDate.getDate() + i * daysBetween);

      const name = `${options?.namePrefix || ''}${template.name}${
        options?.nameSuffix || ` ${i + 1}`
      }`;

      const result = this.createTaskFromTemplate(template, {
        name,
        dueDate: dueDate.toISOString()
      });

      results.push(result);
    }

    return results;
  }

  /**
   * Generate a unique template ID
   */
  private static generateTemplateId(): string {
    return `template_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Generate a unique task ID
   */
  private static generateTaskId(): string {
    return `task_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Generate a unique subtask ID
   */
  private static generateSubtaskId(): string {
    return `subtask_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

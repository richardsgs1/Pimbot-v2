/**
 * SubtaskService
 *
 * Manages subtasks within tasks, including progress calculation,
 * reordering, and bulk operations.
 */

import type { Task, Subtask, SubtaskProgress } from '../types';

export class SubtaskService {
  /**
   * Calculate progress percentage for a task's subtasks
   */
  static calculateProgress(subtasks: Subtask[]): SubtaskProgress {
    if (!subtasks || subtasks.length === 0) {
      return {
        total: 0,
        completed: 0,
        percentage: 0,
        remaining: 0
      };
    }

    const total = subtasks.length;
    const completed = subtasks.filter(s => s.completed).length;
    const remaining = total - completed;
    const percentage = Math.round((completed / total) * 100);

    return {
      total,
      completed,
      percentage,
      remaining
    };
  }

  /**
   * Add a new subtask to a task
   */
  static addSubtask(
    task: Task,
    subtaskName: string,
    options?: {
      estimatedHours?: number;
      assignees?: string[];
    }
  ): Task {
    const newSubtask: Subtask = {
      id: this.generateSubtaskId(),
      name: subtaskName,
      completed: false,
      estimatedHours: options?.estimatedHours,
      assignees: options?.assignees,
      order: (task.subtasks?.length || 0) + 1
    };

    const subtasks = [...(task.subtasks || []), newSubtask];
    const progress = this.calculateProgress(subtasks);

    return {
      ...task,
      subtasks,
      subtaskProgress: progress.percentage
    };
  }

  /**
   * Update a subtask
   */
  static updateSubtask(
    task: Task,
    subtaskId: string,
    updates: Partial<Subtask>
  ): Task {
    if (!task.subtasks) return task;

    const subtasks = task.subtasks.map(s =>
      s.id === subtaskId ? { ...s, ...updates } : s
    );

    const progress = this.calculateProgress(subtasks);

    return {
      ...task,
      subtasks,
      subtaskProgress: progress.percentage
    };
  }

  /**
   * Toggle subtask completion status
   */
  static toggleSubtask(task: Task, subtaskId: string): Task {
    if (!task.subtasks) return task;

    const subtasks = task.subtasks.map(s =>
      s.id === subtaskId ? { ...s, completed: !s.completed } : s
    );

    const progress = this.calculateProgress(subtasks);

    return {
      ...task,
      subtasks,
      subtaskProgress: progress.percentage
    };
  }

  /**
   * Delete a subtask
   */
  static deleteSubtask(task: Task, subtaskId: string): Task {
    if (!task.subtasks) return task;

    const subtasks = task.subtasks.filter(s => s.id !== subtaskId);
    const progress = this.calculateProgress(subtasks);

    return {
      ...task,
      subtasks,
      subtaskProgress: progress.percentage
    };
  }

  /**
   * Reorder subtasks
   */
  static reorderSubtasks(
    task: Task,
    subtaskId: string,
    newOrder: number
  ): Task {
    if (!task.subtasks) return task;

    const subtasks = [...task.subtasks];
    const subtaskIndex = subtasks.findIndex(s => s.id === subtaskId);

    if (subtaskIndex === -1) return task;

    // Remove from old position
    const [movedSubtask] = subtasks.splice(subtaskIndex, 1);

    // Insert at new position
    subtasks.splice(newOrder - 1, 0, movedSubtask);

    // Update order values
    const reorderedSubtasks = subtasks.map((s, idx) => ({
      ...s,
      order: idx + 1
    }));

    return {
      ...task,
      subtasks: reorderedSubtasks
    };
  }

  /**
   * Move a subtask up in the list
   */
  static moveSubtaskUp(task: Task, subtaskId: string): Task {
    if (!task.subtasks) return task;

    const index = task.subtasks.findIndex(s => s.id === subtaskId);
    if (index <= 0) return task; // Already at top or not found

    return this.reorderSubtasks(task, subtaskId, index);
  }

  /**
   * Move a subtask down in the list
   */
  static moveSubtaskDown(task: Task, subtaskId: string): Task {
    if (!task.subtasks) return task;

    const index = task.subtasks.findIndex(s => s.id === subtaskId);
    if (index === -1 || index >= task.subtasks.length - 1) {
      return task; // Not found or already at bottom
    }

    return this.reorderSubtasks(task, subtaskId, index + 2);
  }

  /**
   * Mark all subtasks as complete
   */
  static completeAllSubtasks(task: Task): Task {
    if (!task.subtasks) return task;

    const subtasks = task.subtasks.map(s => ({ ...s, completed: true }));

    return {
      ...task,
      subtasks,
      subtaskProgress: 100
    };
  }

  /**
   * Mark all subtasks as incomplete
   */
  static uncompleteAllSubtasks(task: Task): Task {
    if (!task.subtasks) return task;

    const subtasks = task.subtasks.map(s => ({ ...s, completed: false }));

    return {
      ...task,
      subtasks,
      subtaskProgress: 0
    };
  }

  /**
   * Get incomplete subtasks
   */
  static getIncompleteSubtasks(task: Task): Subtask[] {
    if (!task.subtasks) return [];
    return task.subtasks.filter(s => !s.completed);
  }

  /**
   * Get completed subtasks
   */
  static getCompletedSubtasks(task: Task): Subtask[] {
    if (!task.subtasks) return [];
    return task.subtasks.filter(s => s.completed);
  }

  /**
   * Check if all subtasks are complete
   */
  static areAllSubtasksComplete(task: Task): boolean {
    if (!task.subtasks || task.subtasks.length === 0) return true;
    return task.subtasks.every(s => s.completed);
  }

  /**
   * Get total estimated hours for all subtasks
   */
  static getTotalEstimatedHours(task: Task): number {
    if (!task.subtasks) return 0;
    return task.subtasks.reduce((sum, s) => sum + (s.estimatedHours || 0), 0);
  }

  /**
   * Get estimated hours for incomplete subtasks
   */
  static getRemainingEstimatedHours(task: Task): number {
    if (!task.subtasks) return 0;
    return task.subtasks
      .filter(s => !s.completed)
      .reduce((sum, s) => sum + (s.estimatedHours || 0), 0);
  }

  /**
   * Get subtasks assigned to a specific user
   */
  static getSubtasksByAssignee(task: Task, assigneeId: string): Subtask[] {
    if (!task.subtasks) return [];
    return task.subtasks.filter(
      s => s.assignees && s.assignees.includes(assigneeId)
    );
  }

  /**
   * Assign a subtask to user(s)
   */
  static assignSubtask(
    task: Task,
    subtaskId: string,
    assigneeIds: string[]
  ): Task {
    return this.updateSubtask(task, subtaskId, { assignees: assigneeIds });
  }

  /**
   * Bulk create subtasks from an array of names
   */
  static bulkCreateSubtasks(
    task: Task,
    subtaskNames: string[],
    options?: {
      estimatedHours?: number;
      assignees?: string[];
    }
  ): Task {
    const existingSubtasks = task.subtasks || [];
    let currentOrder = existingSubtasks.length + 1;

    const newSubtasks: Subtask[] = subtaskNames.map(name => ({
      id: this.generateSubtaskId(),
      name,
      completed: false,
      estimatedHours: options?.estimatedHours,
      assignees: options?.assignees,
      order: currentOrder++
    }));

    const allSubtasks = [...existingSubtasks, ...newSubtasks];
    const progress = this.calculateProgress(allSubtasks);

    return {
      ...task,
      subtasks: allSubtasks,
      subtaskProgress: progress.percentage
    };
  }

  /**
   * Convert task description to subtasks (split by line)
   */
  static createSubtasksFromText(task: Task, text: string): Task {
    const lines = text
      .split('\n')
      .map(line => line.trim())
      .filter(line => line.length > 0);

    return this.bulkCreateSubtasks(task, lines);
  }

  /**
   * Duplicate a subtask
   */
  static duplicateSubtask(task: Task, subtaskId: string): Task {
    if (!task.subtasks) return task;

    const subtask = task.subtasks.find(s => s.id === subtaskId);
    if (!subtask) return task;

    const newSubtask: Subtask = {
      ...subtask,
      id: this.generateSubtaskId(),
      name: `${subtask.name} (Copy)`,
      completed: false,
      order: task.subtasks.length + 1
    };

    const subtasks = [...task.subtasks, newSubtask];
    const progress = this.calculateProgress(subtasks);

    return {
      ...task,
      subtasks,
      subtaskProgress: progress.percentage
    };
  }

  /**
   * Sort subtasks by completion status
   */
  static sortByCompletion(task: Task, completedLast = true): Task {
    if (!task.subtasks) return task;

    const sorted = [...task.subtasks].sort((a, b) => {
      if (completedLast) {
        return a.completed === b.completed ? 0 : a.completed ? 1 : -1;
      } else {
        return a.completed === b.completed ? 0 : a.completed ? -1 : 1;
      }
    });

    // Update order values
    const subtasks = sorted.map((s, idx) => ({
      ...s,
      order: idx + 1
    }));

    return {
      ...task,
      subtasks
    };
  }

  /**
   * Generate a unique subtask ID
   */
  private static generateSubtaskId(): string {
    return `subtask_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Validate subtask data
   */
  static validateSubtask(subtask: Partial<Subtask>): {
    valid: boolean;
    errors: string[];
  } {
    const errors: string[] = [];

    if (!subtask.name || subtask.name.trim().length === 0) {
      errors.push('Subtask name is required');
    }

    if (subtask.name && subtask.name.length > 200) {
      errors.push('Subtask name must be less than 200 characters');
    }

    if (subtask.estimatedHours !== undefined && subtask.estimatedHours < 0) {
      errors.push('Estimated hours cannot be negative');
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  /**
   * Get subtask statistics for a task
   */
  static getSubtaskStats(task: Task): {
    progress: SubtaskProgress;
    totalHours: number;
    remainingHours: number;
    assigneeCount: number;
    averageProgress: number;
  } {
    const progress = this.calculateProgress(task.subtasks || []);
    const totalHours = this.getTotalEstimatedHours(task);
    const remainingHours = this.getRemainingEstimatedHours(task);

    const assignees = new Set<string>();
    task.subtasks?.forEach(s => {
      s.assignees?.forEach(a => assignees.add(a));
    });

    return {
      progress,
      totalHours,
      remainingHours,
      assigneeCount: assignees.size,
      averageProgress: progress.percentage
    };
  }
}

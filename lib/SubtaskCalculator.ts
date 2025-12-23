/**
 * SubtaskCalculator Service
 *
 * Manages subtask logic and calculations.
 * Helps break down tasks into smaller work units and track progress.
 *
 * Key Features:
 * - Calculate progress percentage
 * - Count completed/total subtasks
 * - Auto-complete parent task when all subtasks done
 * - Manage subtask assignments
 * - Reorder subtasks
 */

import type { Task, Subtask } from '../types';

export class SubtaskCalculator {
  /**
   * Calculate the completion percentage of a task's subtasks
   * Returns 0 if task has no subtasks
   *
   * @param task - The task to calculate progress for
   * @returns Percentage (0-100) of subtasks completed
   */
  getProgressPercentage(task: Task): number {
    if (!task.subtasks || task.subtasks.length === 0) {
      return 0;
    }

    const completed = task.subtasks.filter(st => st.completed).length;
    return Math.round((completed / task.subtasks.length) * 100);
  }

  /**
   * Get count of completed subtasks
   *
   * @param task - The task to count
   * @returns Number of completed subtasks
   */
  getCompletedCount(task: Task): number {
    if (!task.subtasks || task.subtasks.length === 0) {
      return 0;
    }
    return task.subtasks.filter(st => st.completed).length;
  }

  /**
   * Get total subtask count
   *
   * @param task - The task to count
   * @returns Total number of subtasks
   */
  getTotalCount(task: Task): number {
    return task.subtasks?.length || 0;
  }

  /**
   * Check if all subtasks are completed
   *
   * @param task - The task to check
   * @returns true if all subtasks are done, false otherwise
   */
  areAllSubtasksCompleted(task: Task): boolean {
    if (!task.subtasks || task.subtasks.length === 0) {
      return true; // No subtasks = all "completed"
    }
    return task.subtasks.every(st => st.completed);
  }

  /**
   * Check if any subtasks are completed
   *
   * @param task - The task to check
   * @returns true if at least one subtask is completed
   */
  hasCompletedSubtasks(task: Task): boolean {
    return this.getCompletedCount(task) > 0;
  }

  /**
   * Update a subtask by ID
   *
   * @param task - The task containing the subtask
   * @param subtaskId - ID of subtask to update
   * @param updates - Updates to apply
   * @returns Updated task
   */
  updateSubtask(
    task: Task,
    subtaskId: string,
    updates: Partial<Subtask>
  ): Task {
    if (!task.subtasks) {
      return task;
    }

    const updatedSubtasks = task.subtasks.map(st =>
      st.id === subtaskId ? { ...st, ...updates } : st
    );

    const progress = this.getProgressPercentage({
      ...task,
      subtasks: updatedSubtasks,
    });

    return {
      ...task,
      subtasks: updatedSubtasks,
      subtaskProgress: progress,
    };
  }

  /**
   * Add a new subtask to a task
   *
   * @param task - The task to add subtask to
   * @param subtask - The subtask to add
   * @returns Updated task
   */
  addSubtask(task: Task, subtask: Omit<Subtask, 'order'>): Task {
    const subtasks = task.subtasks || [];
    const newSubtask: Subtask = {
      ...subtask,
      order: subtasks.length,
    };

    return {
      ...task,
      subtasks: [...subtasks, newSubtask],
    };
  }

  /**
   * Delete a subtask from a task
   *
   * @param task - The task to remove subtask from
   * @param subtaskId - ID of subtask to remove
   * @returns Updated task
   */
  deleteSubtask(task: Task, subtaskId: string): Task {
    if (!task.subtasks) {
      return task;
    }

    const updatedSubtasks = task.subtasks.filter(st => st.id !== subtaskId);
    const progress = this.getProgressPercentage({
      ...task,
      subtasks: updatedSubtasks,
    });

    return {
      ...task,
      subtasks: updatedSubtasks,
      subtaskProgress: progress,
    };
  }

  /**
   * Reorder subtasks
   *
   * @param task - The task containing subtasks
   * @param subtaskId - ID of subtask to move
   * @param newIndex - New position in list
   * @returns Updated task with reordered subtasks
   */
  reorderSubtask(task: Task, subtaskId: string, newIndex: number): Task {
    if (!task.subtasks) {
      return task;
    }

    const subtasks = [...task.subtasks];
    const currentIndex = subtasks.findIndex(st => st.id === subtaskId);

    if (currentIndex === -1 || newIndex < 0 || newIndex >= subtasks.length) {
      return task;
    }

    // Remove from current position
    const [movedSubtask] = subtasks.splice(currentIndex, 1);

    // Insert at new position
    subtasks.splice(newIndex, 0, movedSubtask);

    // Update order numbers
    const reorderedSubtasks = subtasks.map((st, index) => ({
      ...st,
      order: index,
    }));

    return {
      ...task,
      subtasks: reorderedSubtasks,
    };
  }

  /**
   * Toggle subtask completion status
   *
   * @param task - The task containing the subtask
   * @param subtaskId - ID of subtask to toggle
   * @returns Updated task
   */
  toggleSubtask(task: Task, subtaskId: string): Task {
    if (!task.subtasks) {
      return task;
    }

    const updatedSubtasks = task.subtasks.map(st =>
      st.id === subtaskId ? { ...st, completed: !st.completed } : st
    );

    const progress = this.getProgressPercentage({
      ...task,
      subtasks: updatedSubtasks,
    });

    // Check if parent should auto-complete
    const allCompleted = updatedSubtasks.every(st => st.completed);

    return {
      ...task,
      subtasks: updatedSubtasks,
      subtaskProgress: progress,
      // Optionally auto-complete parent if all subtasks done
      // completed: allCompleted,
    };
  }

  /**
   * Mark all subtasks as completed
   *
   * @param task - The task to update
   * @returns Updated task with all subtasks complete
   */
  completeAllSubtasks(task: Task): Task {
    if (!task.subtasks) {
      return task;
    }

    const completedSubtasks = task.subtasks.map(st => ({
      ...st,
      completed: true,
    }));

    return {
      ...task,
      subtasks: completedSubtasks,
      subtaskProgress: 100,
    };
  }

  /**
   * Mark all subtasks as incomplete
   *
   * @param task - The task to update
   * @returns Updated task with all subtasks incomplete
   */
  uncompleteAllSubtasks(task: Task): Task {
    if (!task.subtasks) {
      return task;
    }

    const incompletedSubtasks = task.subtasks.map(st => ({
      ...st,
      completed: false,
    }));

    return {
      ...task,
      subtasks: incompletedSubtasks,
      subtaskProgress: 0,
    };
  }

  /**
   * Get subtasks by status (completed/incomplete)
   *
   * @param task - The task to filter
   * @param completed - Filter by completed status
   * @returns Array of matching subtasks
   */
  getSubtasksByStatus(task: Task, completed: boolean): Subtask[] {
    if (!task.subtasks) {
      return [];
    }
    return task.subtasks.filter(st => st.completed === completed);
  }

  /**
   * Get subtasks assigned to a specific team member
   *
   * @param task - The task to search
   * @param memberId - Team member ID to find
   * @returns Array of subtasks assigned to member
   */
  getSubtasksForMember(task: Task, memberId: string): Subtask[] {
    if (!task.subtasks) {
      return [];
    }
    return task.subtasks.filter(
      st => st.assignees && st.assignees.includes(memberId)
    );
  }

  /**
   * Get unassigned subtasks
   *
   * @param task - The task to search
   * @returns Array of subtasks with no assignees
   */
  getUnassignedSubtasks(task: Task): Subtask[] {
    if (!task.subtasks) {
      return [];
    }
    return task.subtasks.filter(
      st => !st.assignees || st.assignees.length === 0
    );
  }

  /**
   * Calculate total estimated hours for all subtasks
   *
   * @param task - The task to calculate
   * @returns Total estimated hours
   */
  getTotalEstimatedHours(task: Task): number {
    if (!task.subtasks) {
      return task.estimatedHours || 0;
    }

    const subtaskHours = task.subtasks.reduce(
      (sum, st) => sum + (st.estimatedHours || 0),
      0
    );

    return subtaskHours || task.estimatedHours || 0;
  }

  /**
   * Calculate estimated hours for completed subtasks
   *
   * @param task - The task to calculate
   * @returns Estimated hours of completed subtasks
   */
  getCompletedEstimatedHours(task: Task): number {
    if (!task.subtasks) {
      return 0;
    }

    return task.subtasks
      .filter(st => st.completed)
      .reduce((sum, st) => sum + (st.estimatedHours || 0), 0);
  }

  /**
   * Get progress statistics for a task
   *
   * @param task - The task to analyze
   * @returns Statistics object
   */
  getProgressStats(task: Task): {
    totalSubtasks: number;
    completedSubtasks: number;
    incompleteSubtasks: number;
    progressPercentage: number;
    completedHours: number;
    totalHours: number;
    hoursPercentage: number;
  } {
    const total = this.getTotalCount(task);
    const completed = this.getCompletedCount(task);
    const progressPct = this.getProgressPercentage(task);
    const completedHours = this.getCompletedEstimatedHours(task);
    const totalHours = this.getTotalEstimatedHours(task);
    const hoursPct =
      totalHours > 0 ? Math.round((completedHours / totalHours) * 100) : 0;

    return {
      totalSubtasks: total,
      completedSubtasks: completed,
      incompleteSubtasks: total - completed,
      progressPercentage: progressPct,
      completedHours,
      totalHours,
      hoursPercentage: hoursPct,
    };
  }
}

// Export singleton instance
export const subtaskCalculator = new SubtaskCalculator();

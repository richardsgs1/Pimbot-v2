/**
 * DependencyResolver Service
 *
 * Manages task dependencies and blocking logic.
 * Ensures tasks cannot start until their prerequisites are complete.
 *
 * Key Features:
 * - Check if task can be started (all dependencies met)
 * - Get blocking tasks (tasks preventing this one from starting)
 * - Get dependent tasks (tasks that depend on this one)
 * - Detect circular dependencies (prevent infinite loops)
 * - Update blocked status for entire project
 * - Resolve dependency chains recursively
 */

import type { Task, Project } from '../types';

export class DependencyResolver {
  /**
   * Check if a task can be started
   * Task can start if ALL dependencies are completed
   *
   * @param taskId - The task ID to check
   * @param project - The project containing tasks
   * @returns true if task can start, false if blocked
   */
  canStartTask(taskId: string, project: Project): boolean {
    const task = project.tasks.find(t => t.id === taskId);
    if (!task || !task.dependencies || task.dependencies.length === 0) {
      return true; // No dependencies, can start
    }

    // All dependencies must be completed
    return task.dependencies.every(depId => {
      const depTask = project.tasks.find(t => t.id === depId);
      return depTask && depTask.completed;
    });
  }

  /**
   * Get all tasks that are blocking this task from starting
   * Returns tasks that are incomplete and referenced in dependencies
   *
   * @param taskId - The task ID to check
   * @param project - The project containing tasks
   * @returns Array of blocking tasks
   */
  getBlockingTasks(taskId: string, project: Project): Task[] {
    const task = project.tasks.find(t => t.id === taskId);
    if (!task || !task.dependencies || task.dependencies.length === 0) {
      return [];
    }

    return task.dependencies
      .map(depId => project.tasks.find(t => t.id === depId))
      .filter((t): t is Task => t !== undefined && !t.completed);
  }

  /**
   * Get all tasks that depend on this task
   * Returns tasks that list this task in their dependencies
   *
   * @param taskId - The task ID to check
   * @param project - The project containing tasks
   * @returns Array of dependent tasks
   */
  getDependentTasks(taskId: string, project: Project): Task[] {
    return project.tasks.filter(
      task =>
        task.dependencies &&
        task.dependencies.includes(taskId)
    );
  }

  /**
   * Detect circular dependencies
   * Prevents infinite dependency chains (A depends on B, B depends on A)
   *
   * @param taskId - The task being checked
   * @param newDependencies - The new dependency IDs being added
   * @param project - The project containing tasks
   * @returns true if a circular dependency exists
   */
  hasCircularDependency(
    taskId: string,
    newDependencies: string[],
    project: Project
  ): boolean {
    // Check if any of the new dependencies would create a cycle
    for (const depId of newDependencies) {
      if (this._hasCyclePath(depId, taskId, project, new Set())) {
        return true;
      }
    }
    return false;
  }

  /**
   * Recursive helper to detect cycles in dependency graph
   * @private
   */
  private _hasCyclePath(
    currentId: string,
    targetId: string,
    project: Project,
    visited: Set<string>
  ): boolean {
    if (currentId === targetId) {
      return true; // Cycle found
    }

    if (visited.has(currentId)) {
      return false; // Already checked this path
    }

    visited.add(currentId);

    const currentTask = project.tasks.find(t => t.id === currentId);
    if (!currentTask || !currentTask.dependencies) {
      return false;
    }

    // Check all dependencies recursively
    for (const depId of currentTask.dependencies) {
      if (this._hasCyclePath(depId, targetId, project, new Set(visited))) {
        return true;
      }
    }

    return false;
  }

  /**
   * Update blocked status for all tasks in project
   * Recalculates which tasks are blocked based on dependency completion
   * Should be called whenever a task status changes
   *
   * @param project - The project to update
   * @returns Updated project with correct isBlocked flags
   */
  updateBlockedStatus(project: Project): Project {
    const updatedTasks = project.tasks.map(task => ({
      ...task,
      isBlocked: !this.canStartTask(task.id, project),
    }));

    return {
      ...project,
      tasks: updatedTasks,
    };
  }

  /**
   * Get all tasks that would be unblocked by completing this task
   * Useful for notifying users of cascading effects
   *
   * @param taskId - The task being completed
   * @param project - The project containing tasks
   * @returns Array of tasks that would become unblocked
   */
  getTasksUnblockedBy(taskId: string, project: Project): Task[] {
    const dependentTasks = this.getDependentTasks(taskId, project);

    return dependentTasks.filter(depTask => {
      // Task would be unblocked if ALL its other dependencies are complete
      const otherDeps = depTask.dependencies?.filter(id => id !== taskId) || [];
      return otherDeps.every(depId => {
        const depTask = project.tasks.find(t => t.id === depId);
        return depTask && depTask.completed;
      });
    });
  }

  /**
   * Validate a dependency change before applying it
   * Checks for circular dependencies and other issues
   *
   * @param taskId - The task being modified
   * @param newDependencies - The new dependencies to set
   * @param project - The project containing tasks
   * @returns Object with validation result and error message if any
   */
  validateDependencies(
    taskId: string,
    newDependencies: string[],
    project: Project
  ): { valid: boolean; error?: string } {
    // Check if any dependencies reference non-existent tasks
    const invalidDeps = newDependencies.filter(
      depId => !project.tasks.find(t => t.id === depId)
    );

    if (invalidDeps.length > 0) {
      return {
        valid: false,
        error: `Invalid task IDs in dependencies: ${invalidDeps.join(', ')}`,
      };
    }

    // Check for self-dependency
    if (newDependencies.includes(taskId)) {
      return {
        valid: false,
        error: 'A task cannot depend on itself',
      };
    }

    // Check for circular dependencies
    if (this.hasCircularDependency(taskId, newDependencies, project)) {
      return {
        valid: false,
        error: 'Adding these dependencies would create a circular dependency',
      };
    }

    return { valid: true };
  }

  /**
   * Get a topological sort of tasks (useful for scheduling/ordering)
   * Returns tasks ordered by their dependencies
   *
   * @param project - The project containing tasks
   * @returns Array of tasks in dependency order
   */
  getTopologicalOrder(project: Project): Task[] {
    const visited = new Set<string>();
    const result: Task[] = [];

    const visit = (taskId: string) => {
      if (visited.has(taskId)) return;
      visited.add(taskId);

      const task = project.tasks.find(t => t.id === taskId);
      if (task && task.dependencies) {
        // Visit all dependencies first
        for (const depId of task.dependencies) {
          visit(depId);
        }
      }

      if (task) {
        result.push(task);
      }
    };

    // Visit all tasks
    for (const task of project.tasks) {
      visit(task.id);
    }

    return result;
  }

  /**
   * Get dependency depth for a task
   * Depth 0 = no dependencies
   * Depth 1 = depends on tasks with no dependencies
   * Depth N = depends on tasks with depth N-1
   *
   * @param taskId - The task to check
   * @param project - The project containing tasks
   * @returns Depth level (0 for no dependencies)
   */
  getDependencyDepth(taskId: string, project: Project): number {
    const task = project.tasks.find(t => t.id === taskId);
    if (!task || !task.dependencies || task.dependencies.length === 0) {
      return 0;
    }

    const maxDepth = Math.max(
      ...task.dependencies.map(depId => this.getDependencyDepth(depId, project))
    );

    return maxDepth + 1;
  }

  /**
   * Get all tasks in a dependency chain starting from this task
   * Includes all dependencies and dependents (full graph)
   *
   * @param taskId - The task to start from
   * @param project - The project containing tasks
   * @returns Array of all related tasks
   */
  getDependencyChain(taskId: string, project: Project): Task[] {
    const chain = new Set<string>();

    const addToChain = (id: string) => {
      if (chain.has(id)) return;
      chain.add(id);

      const task = project.tasks.find(t => t.id === id);
      if (!task) return;

      // Add dependencies
      if (task.dependencies) {
        for (const depId of task.dependencies) {
          addToChain(depId);
        }
      }

      // Add dependents
      const dependents = this.getDependentTasks(id, project);
      for (const dep of dependents) {
        addToChain(dep.id);
      }
    };

    addToChain(taskId);

    return project.tasks.filter(t => chain.has(t.id));
  }

  /**
   * Get summary statistics about dependencies in a project
   * Useful for analytics and dashboard displays
   *
   * @param project - The project to analyze
   * @returns Statistics object
   */
  getDependencyStats(project: Project): {
    totalTasks: number;
    tasksWithDependencies: number;
    blockedTasks: number;
    averageDependenciesPerTask: number;
    maxDependencyDepth: number;
  } {
    const blockedTasks = project.tasks.filter(t => t.isBlocked).length;
    const tasksWithDeps = project.tasks.filter(
      t => t.dependencies && t.dependencies.length > 0
    ).length;
    const totalDeps = project.tasks.reduce(
      (sum, t) => sum + (t.dependencies?.length || 0),
      0
    );
    const maxDepth = Math.max(
      0,
      ...project.tasks.map(t => this.getDependencyDepth(t.id, project))
    );

    return {
      totalTasks: project.tasks.length,
      tasksWithDependencies: tasksWithDeps,
      blockedTasks,
      averageDependenciesPerTask:
        project.tasks.length > 0 ? totalDeps / project.tasks.length : 0,
      maxDependencyDepth: maxDepth,
    };
  }
}

// Export singleton instance for use across app
export const dependencyResolver = new DependencyResolver();

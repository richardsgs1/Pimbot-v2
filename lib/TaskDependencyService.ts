/**
 * TaskDependencyService
 *
 * Manages task dependencies with circular dependency detection,
 * blocked status calculation, and dependency graph analysis.
 */

import type {
  Task,
  TaskDependency,
  DependencyStatus,
  DependencyValidationResult
} from '../types';

import {
  createTaskDependency,
  getTaskDependencies,
  getDependentTasks,
  deleteTaskDependency,
  deleteAllTaskDependencies
} from './database';

export class TaskDependencyService {
  /**
   * Add a dependency relationship between tasks
   * Validates for circular dependencies before adding
   */
  static async addDependency(
    dependentTaskId: string,
    blockingTaskId: string,
    allTasks: Task[]
  ): Promise<{ success: boolean; error?: string }> {
    // Prevent self-dependency
    if (dependentTaskId === blockingTaskId) {
      return { success: false, error: 'A task cannot depend on itself' };
    }

    // Check if this would create a circular dependency
    const validation = await this.validateDependency(
      dependentTaskId,
      blockingTaskId,
      allTasks
    );

    if (!validation.valid) {
      return {
        success: false,
        error: validation.errors.join(', ')
      };
    }

    // Create the dependency in the database
    const dependency = await createTaskDependency(dependentTaskId, blockingTaskId);

    if (!dependency) {
      return { success: false, error: 'Failed to create dependency' };
    }

    return { success: true };
  }

  /**
   * Remove a dependency relationship
   */
  static async removeDependency(
    dependentTaskId: string,
    blockingTaskId: string
  ): Promise<boolean> {
    return await deleteTaskDependency(dependentTaskId, blockingTaskId);
  }

  /**
   * Remove all dependencies for a task (when deleting)
   */
  static async removeAllDependencies(taskId: string): Promise<boolean> {
    return await deleteAllTaskDependencies(taskId);
  }

  /**
   * Validate if adding a dependency would create a circular reference
   */
  static async validateDependency(
    dependentTaskId: string,
    blockingTaskId: string,
    allTasks: Task[]
  ): Promise<DependencyValidationResult> {
    const errors: string[] = [];

    // Build dependency graph
    const graph = this.buildDependencyGraph(allTasks);

    // Add the new dependency temporarily
    if (!graph.has(dependentTaskId)) {
      graph.set(dependentTaskId, []);
    }
    graph.get(dependentTaskId)!.push(blockingTaskId);

    // Check for cycles
    const cycles = this.findCycles(graph);

    if (cycles.length > 0) {
      errors.push('This dependency would create a circular reference');
      return {
        valid: false,
        errors,
        circularDependencies: cycles
      };
    }

    return { valid: true, errors: [] };
  }

  /**
   * Build a dependency graph from all tasks
   */
  private static buildDependencyGraph(tasks: Task[]): Map<string, string[]> {
    const graph = new Map<string, string[]>();

    for (const task of tasks) {
      if (task.dependencies && task.dependencies.length > 0) {
        graph.set(task.id, task.dependencies);
      }
    }

    return graph;
  }

  /**
   * Detect circular dependencies using DFS
   */
  private static findCycles(graph: Map<string, string[]>): string[][] {
    const cycles: string[][] = [];
    const visited = new Set<string>();
    const recursionStack = new Set<string>();
    const currentPath: string[] = [];

    const dfs = (node: string): void => {
      visited.add(node);
      recursionStack.add(node);
      currentPath.push(node);

      const neighbors = graph.get(node) || [];
      for (const neighbor of neighbors) {
        if (!visited.has(neighbor)) {
          dfs(neighbor);
        } else if (recursionStack.has(neighbor)) {
          // Found a cycle
          const cycleStart = currentPath.indexOf(neighbor);
          cycles.push([...currentPath.slice(cycleStart), neighbor]);
        }
      }

      currentPath.pop();
      recursionStack.delete(node);
    };

    for (const node of graph.keys()) {
      if (!visited.has(node)) {
        dfs(node);
      }
    }

    return cycles;
  }

  /**
   * Calculate dependency status for a task
   */
  static async getDependencyStatus(
    task: Task,
    allTasks: Task[]
  ): Promise<DependencyStatus> {
    const taskMap = new Map(allTasks.map(t => [t.id, t]));

    // Get blocking tasks (tasks this task depends on)
    const blockingTasks: Task[] = [];
    let hasIncompleteBlockers = false;

    if (task.dependencies && task.dependencies.length > 0) {
      for (const depId of task.dependencies) {
        const depTask = taskMap.get(depId);
        if (depTask) {
          blockingTasks.push(depTask);
          if (!depTask.completed) {
            hasIncompleteBlockers = true;
          }
        }
      }
    }

    // Get dependent tasks (tasks waiting on this task)
    const dependentTasks: Task[] = [];
    if (task.dependentTaskIds && task.dependentTaskIds.length > 0) {
      for (const depId of task.dependentTaskIds) {
        const depTask = taskMap.get(depId);
        if (depTask) {
          dependentTasks.push(depTask);
        }
      }
    }

    return {
      isBlocked: hasIncompleteBlockers,
      blockingTasks,
      dependentTasks,
      canStart: !hasIncompleteBlockers
    };
  }

  /**
   * Update blocked status for a task based on its dependencies
   */
  static calculateBlockedStatus(task: Task, allTasks: Task[]): boolean {
    if (!task.dependencies || task.dependencies.length === 0) {
      return false;
    }

    const taskMap = new Map(allTasks.map(t => [t.id, t]));

    // Check if any dependency is incomplete
    for (const depId of task.dependencies) {
      const depTask = taskMap.get(depId);
      if (depTask && !depTask.completed) {
        return true;
      }
    }

    return false;
  }

  /**
   * Get all tasks blocked by a specific task
   */
  static getBlockedTasks(taskId: string, allTasks: Task[]): Task[] {
    return allTasks.filter(
      task =>
        task.dependencies &&
        task.dependencies.includes(taskId) &&
        !task.completed
    );
  }

  /**
   * Get dependency chain for a task (all ancestors)
   */
  static getDependencyChain(task: Task, allTasks: Task[]): Task[] {
    const chain: Task[] = [];
    const visited = new Set<string>();
    const taskMap = new Map(allTasks.map(t => [t.id, t]));

    const traverse = (currentTask: Task) => {
      if (visited.has(currentTask.id)) return;
      visited.add(currentTask.id);

      if (currentTask.dependencies && currentTask.dependencies.length > 0) {
        for (const depId of currentTask.dependencies) {
          const depTask = taskMap.get(depId);
          if (depTask) {
            chain.push(depTask);
            traverse(depTask);
          }
        }
      }
    };

    traverse(task);
    return chain;
  }

  /**
   * Get topological sort of tasks (respecting dependencies)
   * Returns tasks in an order where dependencies come before dependents
   */
  static getTopologicalOrder(tasks: Task[]): Task[] {
    const graph = this.buildDependencyGraph(tasks);
    const inDegree = new Map<string, number>();
    const taskMap = new Map(tasks.map(t => [t.id, t]));

    // Initialize in-degree
    for (const task of tasks) {
      inDegree.set(task.id, 0);
    }

    // Calculate in-degree
    for (const [_, dependencies] of graph) {
      for (const dep of dependencies) {
        inDegree.set(dep, (inDegree.get(dep) || 0) + 1);
      }
    }

    // Kahn's algorithm
    const queue: string[] = [];
    const result: Task[] = [];

    // Add all nodes with in-degree 0
    for (const [taskId, degree] of inDegree) {
      if (degree === 0) {
        queue.push(taskId);
      }
    }

    while (queue.length > 0) {
      const taskId = queue.shift()!;
      const task = taskMap.get(taskId);
      if (task) {
        result.push(task);
      }

      const dependents = graph.get(taskId) || [];
      for (const dep of dependents) {
        inDegree.set(dep, inDegree.get(dep)! - 1);
        if (inDegree.get(dep) === 0) {
          queue.push(dep);
        }
      }
    }

    // If result doesn't contain all tasks, there's a cycle
    if (result.length !== tasks.length) {
      console.warn('Circular dependency detected in topological sort');
      return tasks; // Return original order
    }

    return result;
  }

  /**
   * Update dependent task IDs when a dependency is added/removed
   * This keeps the bidirectional relationship in sync
   */
  static updateDependentTaskIds(
    tasks: Task[],
    dependentTaskId: string,
    blockingTaskId: string,
    action: 'add' | 'remove'
  ): Task[] {
    return tasks.map(task => {
      if (task.id === blockingTaskId) {
        const dependentIds = new Set(task.dependentTaskIds || []);

        if (action === 'add') {
          dependentIds.add(dependentTaskId);
        } else {
          dependentIds.delete(dependentTaskId);
        }

        return {
          ...task,
          dependentTaskIds: Array.from(dependentIds)
        };
      }
      return task;
    });
  }

  /**
   * Check if all dependencies for a task are completed
   */
  static areAllDependenciesComplete(task: Task, allTasks: Task[]): boolean {
    if (!task.dependencies || task.dependencies.length === 0) {
      return true;
    }

    const taskMap = new Map(allTasks.map(t => [t.id, t]));

    for (const depId of task.dependencies) {
      const depTask = taskMap.get(depId);
      if (!depTask || !depTask.completed) {
        return false;
      }
    }

    return true;
  }

  /**
   * Get critical path for project (longest dependency chain)
   */
  static getCriticalPath(tasks: Task[]): Task[] {
    let longestPath: Task[] = [];
    const taskMap = new Map(tasks.map(t => [t.id, t]));

    const findLongestPath = (task: Task, visited: Set<string>): Task[] => {
      if (visited.has(task.id)) return [];

      visited.add(task.id);
      let maxPath: Task[] = [task];

      if (task.dependencies && task.dependencies.length > 0) {
        for (const depId of task.dependencies) {
          const depTask = taskMap.get(depId);
          if (depTask) {
            const path = findLongestPath(depTask, new Set(visited));
            if (path.length + 1 > maxPath.length) {
              maxPath = [task, ...path];
            }
          }
        }
      }

      return maxPath;
    };

    for (const task of tasks) {
      const path = findLongestPath(task, new Set());
      if (path.length > longestPath.length) {
        longestPath = path;
      }
    }

    return longestPath;
  }
}

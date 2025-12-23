/**
 * Task Dependencies API
 *
 * Endpoints for managing task dependencies with circular dependency detection.
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';
import type { Task, DependencyValidationResult, DependencyStatus } from '../../types';
import { TaskDependencyService } from '../../lib/TaskDependencyService';
import {
  createTaskDependency,
  deleteTaskDependency,
  getTaskDependencies,
  getDependentTasks
} from '../../lib/database';

// Helper to get all tasks (you'll need to implement this based on your data structure)
async function getAllTasksForProject(projectId: string): Promise<Task[]> {
  // TODO: Implement based on your project/task loading logic
  // This is a placeholder - replace with actual implementation
  throw new Error('getAllTasksForProject not implemented');
}

/**
 * POST /api/tasks/dependencies
 * Create a new task dependency
 *
 * Body:
 * {
 *   "dependentTaskId": "task-123",
 *   "blockingTaskId": "task-456",
 *   "projectId": "project-789"
 * }
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,DELETE,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    // POST - Create dependency
    if (req.method === 'POST') {
      const { dependentTaskId, blockingTaskId, projectId } = req.body;

      if (!dependentTaskId || !blockingTaskId || !projectId) {
        return res.status(400).json({
          error: 'Missing required fields: dependentTaskId, blockingTaskId, projectId'
        });
      }

      // Get all tasks for validation
      const allTasks = await getAllTasksForProject(projectId);

      // Validate dependency (circular check)
      const validation = await TaskDependencyService.validateDependency(
        dependentTaskId,
        blockingTaskId,
        allTasks
      );

      if (!validation.valid) {
        return res.status(400).json({
          error: validation.errors[0],
          circularDependencies: validation.circularDependencies
        });
      }

      // Create dependency
      const dependency = await createTaskDependency(dependentTaskId, blockingTaskId);

      if (!dependency) {
        return res.status(500).json({ error: 'Failed to create dependency' });
      }

      return res.status(201).json({
        success: true,
        dependency
      });
    }

    // DELETE - Remove dependency
    if (req.method === 'DELETE') {
      const { dependentTaskId, blockingTaskId } = req.query;

      if (!dependentTaskId || !blockingTaskId) {
        return res.status(400).json({
          error: 'Missing required query params: dependentTaskId, blockingTaskId'
        });
      }

      const success = await deleteTaskDependency(
        dependentTaskId as string,
        blockingTaskId as string
      );

      if (!success) {
        return res.status(500).json({ error: 'Failed to delete dependency' });
      }

      return res.status(200).json({
        success: true,
        message: 'Dependency removed'
      });
    }

    // GET - Get dependencies for a task
    if (req.method === 'GET') {
      const { taskId, type, projectId } = req.query;

      if (!taskId) {
        return res.status(400).json({ error: 'Missing required query param: taskId' });
      }

      // Get blocking tasks (dependencies)
      if (type === 'blocking' || !type) {
        const dependencies = await getTaskDependencies(taskId as string);
        return res.status(200).json({ dependencies });
      }

      // Get dependent tasks (tasks waiting on this one)
      if (type === 'dependent') {
        const dependents = await getDependentTasks(taskId as string);
        return res.status(200).json({ dependents });
      }

      // Get full dependency status
      if (type === 'status' && projectId) {
        const allTasks = await getAllTasksForProject(projectId as string);
        const task = allTasks.find(t => t.id === taskId);

        if (!task) {
          return res.status(404).json({ error: 'Task not found' });
        }

        const status = await TaskDependencyService.getDependencyStatus(task, allTasks);
        return res.status(200).json({ status });
      }

      return res.status(400).json({ error: 'Invalid type parameter' });
    }

    return res.status(405).json({ error: 'Method not allowed' });

  } catch (error) {
    console.error('Dependencies API error:', error);
    return res.status(500).json({
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

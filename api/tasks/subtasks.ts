/**
 * Subtasks API
 *
 * Endpoints for managing subtasks within tasks.
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';
import type { Task, Subtask } from '../../types';
import { SubtaskService } from '../../lib/SubtaskService';

/**
 * POST /api/tasks/subtasks - Add subtask
 * PUT /api/tasks/subtasks - Update subtask
 * DELETE /api/tasks/subtasks - Delete subtask
 * GET /api/tasks/subtasks - Get subtask statistics
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    // POST - Add subtask
    if (req.method === 'POST') {
      const { task, subtaskName, estimatedHours, assignees, bulk } = req.body;

      if (!task) {
        return res.status(400).json({ error: 'Missing required field: task' });
      }

      // Bulk create
      if (bulk && Array.isArray(subtaskName)) {
        const updatedTask = SubtaskService.bulkCreateSubtasks(task, subtaskName, {
          estimatedHours,
          assignees
        });

        return res.status(201).json({
          success: true,
          task: updatedTask,
          count: subtaskName.length
        });
      }

      // Single create
      if (!subtaskName || typeof subtaskName !== 'string') {
        return res.status(400).json({ error: 'Missing or invalid subtaskName' });
      }

      const updatedTask = SubtaskService.addSubtask(task, subtaskName, {
        estimatedHours,
        assignees
      });

      return res.status(201).json({
        success: true,
        task: updatedTask
      });
    }

    // PUT - Update subtask
    if (req.method === 'PUT') {
      const { task, subtaskId, updates, action } = req.body;

      if (!task || !subtaskId) {
        return res.status(400).json({ error: 'Missing required fields: task, subtaskId' });
      }

      let updatedTask: Task;

      // Toggle completion
      if (action === 'toggle') {
        updatedTask = SubtaskService.toggleSubtask(task, subtaskId);
      }
      // Move up/down
      else if (action === 'moveUp') {
        updatedTask = SubtaskService.moveSubtaskUp(task, subtaskId);
      } else if (action === 'moveDown') {
        updatedTask = SubtaskService.moveSubtaskDown(task, subtaskId);
      }
      // Update properties
      else if (updates) {
        updatedTask = SubtaskService.updateSubtask(task, subtaskId, updates);
      } else {
        return res.status(400).json({ error: 'Invalid action or missing updates' });
      }

      return res.status(200).json({
        success: true,
        task: updatedTask
      });
    }

    // DELETE - Delete subtask
    if (req.method === 'DELETE') {
      const { task, subtaskId } = req.body;

      if (!task || !subtaskId) {
        return res.status(400).json({ error: 'Missing required fields: task, subtaskId' });
      }

      const updatedTask = SubtaskService.deleteSubtask(task, subtaskId);

      return res.status(200).json({
        success: true,
        task: updatedTask
      });
    }

    // GET - Get statistics
    if (req.method === 'GET') {
      const { taskJson } = req.query;

      if (!taskJson) {
        return res.status(400).json({ error: 'Missing required query param: taskJson' });
      }

      const task = JSON.parse(taskJson as string) as Task;
      const progress = SubtaskService.calculateProgress(task.subtasks || []);
      const stats = SubtaskService.getSubtaskStats(task);

      return res.status(200).json({
        progress,
        stats
      });
    }

    return res.status(405).json({ error: 'Method not allowed' });

  } catch (error) {
    console.error('Subtasks API error:', error);
    return res.status(500).json({
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

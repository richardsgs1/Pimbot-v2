/**
 * Recurring Tasks API
 *
 * Endpoints for managing recurring task patterns and instances.
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';
import type { Task, RecurrencePattern } from '../../types';
import { RecurringTaskService } from '../../lib/RecurringTaskService';

/**
 * POST /api/tasks/recurring - Generate next instance
 * GET /api/tasks/recurring - Get instances or preview
 * PUT /api/tasks/recurring - Update recurrence pattern
 * DELETE /api/tasks/recurring - Delete all instances
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
    // POST - Generate next instance
    if (req.method === 'POST') {
      const { task, scheduledDate, occurrenceNumber } = req.body;

      if (!task) {
        return res.status(400).json({ error: 'Missing required field: task' });
      }

      if (!task.isRecurring || !task.recurrencePattern) {
        return res.status(400).json({ error: 'Task is not a recurring task' });
      }

      // Auto-calculate if not provided
      const nextOccNum = occurrenceNumber || await RecurringTaskService.getNextOccurrenceNumber(task.id);
      const nextOccurrence = scheduledDate || RecurringTaskService.calculateNextOccurrence(task.recurrencePattern);

      if (!nextOccurrence) {
        return res.status(400).json({ error: 'Could not calculate next occurrence' });
      }

      const result = await RecurringTaskService.generateTaskInstance(
        task,
        typeof nextOccurrence === 'string' ? nextOccurrence : nextOccurrence.date,
        nextOccNum
      );

      if (!result.success) {
        return res.status(500).json({ error: result.error });
      }

      return res.status(201).json({
        success: true,
        generatedTask: result.generatedTask,
        instance: result.instance,
        nextScheduledDate: result.nextScheduledDate
      });
    }

    // GET - Get instances or preview
    if (req.method === 'GET') {
      const { taskId, action, pattern, fromDate, lookAheadDays } = req.query;

      // Get all instances for a task
      if (action === 'instances' && taskId) {
        const instances = await RecurringTaskService.getTaskInstances(taskId as string);
        return res.status(200).json({ instances });
      }

      // Preview upcoming occurrences
      if (action === 'preview' && pattern) {
        const recurrencePattern = JSON.parse(pattern as string) as RecurrencePattern;
        const from = fromDate as string || new Date().toISOString();
        const lookAhead = lookAheadDays ? parseInt(lookAheadDays as string) : 30;

        const upcoming = RecurringTaskService.getUpcomingInstances(
          recurrencePattern,
          from,
          lookAhead
        );

        return res.status(200).json({ upcoming });
      }

      // Calculate next occurrence
      if (action === 'next' && pattern) {
        const recurrencePattern = JSON.parse(pattern as string) as RecurrencePattern;
        const from = fromDate as string;

        const nextOccurrence = RecurringTaskService.calculateNextOccurrence(
          recurrencePattern,
          from
        );

        return res.status(200).json({ nextOccurrence });
      }

      // Check if should generate
      if (action === 'shouldGenerate' && pattern) {
        const recurrencePattern = JSON.parse(pattern as string) as RecurrencePattern;
        const lastDate = fromDate as string;

        const should = RecurringTaskService.shouldGenerateInstance(
          recurrencePattern,
          lastDate
        );

        return res.status(200).json({ shouldGenerate: should });
      }

      // Get pattern description
      if (action === 'description' && pattern) {
        const recurrencePattern = JSON.parse(pattern as string) as RecurrencePattern;
        const description = RecurringTaskService.getPatternDescription(recurrencePattern);

        return res.status(200).json({ description });
      }

      return res.status(400).json({ error: 'Invalid action parameter' });
    }

    // PUT - Update recurrence pattern
    if (req.method === 'PUT') {
      const { task, pattern } = req.body;

      if (!task || !pattern) {
        return res.status(400).json({ error: 'Missing required fields: task, pattern' });
      }

      // Validation could be added here
      const updatedTask: Task = {
        ...task,
        isRecurring: true,
        recurrencePattern: pattern,
        updatedAt: new Date().toISOString()
      };

      return res.status(200).json({
        success: true,
        task: updatedTask
      });
    }

    // DELETE - Delete all instances
    if (req.method === 'DELETE') {
      const { taskId } = req.query;

      if (!taskId) {
        return res.status(400).json({ error: 'Missing required query param: taskId' });
      }

      const success = await RecurringTaskService.deleteAllInstances(taskId as string);

      if (!success) {
        return res.status(500).json({ error: 'Failed to delete instances' });
      }

      return res.status(200).json({
        success: true,
        message: 'All instances deleted'
      });
    }

    return res.status(405).json({ error: 'Method not allowed' });

  } catch (error) {
    console.error('Recurring tasks API error:', error);
    return res.status(500).json({
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

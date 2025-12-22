/**
 * Task Templates API
 *
 * Endpoints for managing task templates (save, load, search, delete).
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';
import type { Task, TaskTemplate } from '../../types';
import { TaskTemplateService } from '../../lib/TaskTemplateService';

// You'll need to implement template storage
// This could be in Supabase, localStorage, or a dedicated templates table
async function saveTemplateToStorage(template: TaskTemplate): Promise<boolean> {
  // TODO: Implement based on your storage choice
  throw new Error('saveTemplateToStorage not implemented');
}

async function getTemplatesFromStorage(userId: string): Promise<TaskTemplate[]> {
  // TODO: Implement based on your storage choice
  throw new Error('getTemplatesFromStorage not implemented');
}

async function deleteTemplateFromStorage(templateId: string): Promise<boolean> {
  // TODO: Implement based on your storage choice
  throw new Error('deleteTemplateFromStorage not implemented');
}

/**
 * POST /api/tasks/templates - Create template from task
 * GET /api/tasks/templates - Get templates or search
 * PUT /api/tasks/templates - Update template
 * DELETE /api/tasks/templates - Delete template
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
    // POST - Create template from task OR create task from template
    if (req.method === 'POST') {
      const { action, task, userId, category, template, options } = req.body;

      // Create template from task
      if (action === 'saveAsTemplate') {
        if (!task || !userId || !category) {
          return res.status(400).json({
            error: 'Missing required fields: task, userId, category'
          });
        }

        const newTemplate = TaskTemplateService.createTemplateFromTask(
          task,
          userId,
          category
        );

        // Validate
        const validation = TaskTemplateService.validateTemplate(newTemplate);
        if (!validation.valid) {
          return res.status(400).json({
            error: validation.errors[0],
            errors: validation.errors
          });
        }

        // Save to storage
        const saved = await saveTemplateToStorage(newTemplate);
        if (!saved) {
          return res.status(500).json({ error: 'Failed to save template' });
        }

        return res.status(201).json({
          success: true,
          template: newTemplate
        });
      }

      // Create task from template
      if (action === 'createFromTemplate') {
        if (!template) {
          return res.status(400).json({ error: 'Missing required field: template' });
        }

        const result = TaskTemplateService.createTaskFromTemplate(template, options);

        if (!result.success) {
          return res.status(500).json({ error: result.error });
        }

        return res.status(201).json({
          success: true,
          task: result.task
        });
      }

      // Batch create from template
      if (action === 'batchCreate') {
        const { count, namePrefix, nameSuffix, startDate, daysBetween } = req.body;

        if (!template || !count) {
          return res.status(400).json({ error: 'Missing required fields: template, count' });
        }

        const results = TaskTemplateService.batchCreateFromTemplate(
          template,
          count,
          { namePrefix, nameSuffix, startDate, daysBetween }
        );

        const successful = results.filter(r => r.success);
        const failed = results.filter(r => !r.success);

        return res.status(201).json({
          success: true,
          created: successful.length,
          failed: failed.length,
          tasks: successful.map(r => r.task)
        });
      }

      return res.status(400).json({ error: 'Invalid action' });
    }

    // GET - Get templates, search, or get categories
    if (req.method === 'GET') {
      const { userId, action, query, category, sortBy, sortOrder } = req.query;

      if (!userId) {
        return res.status(400).json({ error: 'Missing required query param: userId' });
      }

      const templates = await getTemplatesFromStorage(userId as string);

      // Get all templates
      if (!action || action === 'all') {
        let filtered = templates;

        // Filter by category
        if (category) {
          filtered = TaskTemplateService.filterByCategory(filtered, category as string);
        }

        // Sort
        if (sortBy) {
          filtered = TaskTemplateService.sortTemplates(
            filtered,
            sortBy as any,
            (sortOrder as any) || 'asc'
          );
        }

        return res.status(200).json({ templates: filtered });
      }

      // Search templates
      if (action === 'search' && query) {
        const results = TaskTemplateService.searchTemplates(templates, query as string);
        return res.status(200).json({ templates: results });
      }

      // Get categories
      if (action === 'categories') {
        const categories = TaskTemplateService.getCategories(templates);
        return res.status(200).json({ categories });
      }

      // Get most used templates
      if (action === 'mostUsed') {
        const limit = req.query.limit ? parseInt(req.query.limit as string) : 5;
        const mostUsed = TaskTemplateService.getMostUsedTemplates(templates, limit);
        return res.status(200).json({ templates: mostUsed });
      }

      // Get template stats
      if (action === 'stats') {
        const { templateJson } = req.query;
        if (!templateJson) {
          return res.status(400).json({ error: 'Missing templateJson param' });
        }

        const template = JSON.parse(templateJson as string) as TaskTemplate;
        const stats = TaskTemplateService.getTemplateStats(template);
        return res.status(200).json({ stats });
      }

      return res.status(400).json({ error: 'Invalid action parameter' });
    }

    // PUT - Update template
    if (req.method === 'PUT') {
      const { template, updates } = req.body;

      if (!template || !updates) {
        return res.status(400).json({ error: 'Missing required fields: template, updates' });
      }

      const updatedTemplate = TaskTemplateService.updateTemplate(template, updates);

      // Validate
      const validation = TaskTemplateService.validateTemplate(updatedTemplate);
      if (!validation.valid) {
        return res.status(400).json({
          error: validation.errors[0],
          errors: validation.errors
        });
      }

      // Save to storage
      const saved = await saveTemplateToStorage(updatedTemplate);
      if (!saved) {
        return res.status(500).json({ error: 'Failed to update template' });
      }

      return res.status(200).json({
        success: true,
        template: updatedTemplate
      });
    }

    // DELETE - Delete template
    if (req.method === 'DELETE') {
      const { templateId } = req.query;

      if (!templateId) {
        return res.status(400).json({ error: 'Missing required query param: templateId' });
      }

      const success = await deleteTemplateFromStorage(templateId as string);

      if (!success) {
        return res.status(500).json({ error: 'Failed to delete template' });
      }

      return res.status(200).json({
        success: true,
        message: 'Template deleted'
      });
    }

    return res.status(405).json({ error: 'Method not allowed' });

  } catch (error) {
    console.error('Templates API error:', error);
    return res.status(500).json({
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

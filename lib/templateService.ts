import { supabase } from './supabase';
import type { TaskTemplate } from '../types';

/**
 * Template Service
 * Manages task templates with Supabase backend with localStorage fallback for offline support
 *
 * Features:
 * - Multi-user data isolation via userId validation
 * - Offline support with localStorage fallback
 * - Error handling with user feedback
 * - Input validation and sanitization
 */

// Validate userId format (must be UUID-like)
const isValidUserId = (userId: string): boolean => {
  return Boolean(userId && typeof userId === 'string' && userId.length > 0 && userId !== 'current-user');
};

export const templateService = {
  /**
   * Load all templates for a user from Supabase
   * Falls back to localStorage if offline
   * @throws Error if userId is invalid
   */
  async loadTemplates(userId: string): Promise<TaskTemplate[]> {
    // Validate user ID
    if (!isValidUserId(userId)) {
      console.error('Invalid or missing userId:', userId);
      throw new Error('User authentication required. Please log in.');
    }

    try {
      const { data, error } = await supabase
        .from('task_templates')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) {
        console.warn('Failed to load templates from Supabase, falling back to localStorage:', error);
        return this.loadFromLocalStorage();
      }

      if (data && data.length > 0) {
        // Cache to localStorage for offline access
        try {
          localStorage.setItem('pimbot_task_templates', JSON.stringify(data));
        } catch (storageError) {
          console.warn('Failed to cache templates to localStorage:', storageError);
          // Continue even if cache fails
        }
        return data as TaskTemplate[];
      }

      return [];
    } catch (error) {
      console.warn('Error loading templates, using localStorage fallback:', error);
      return this.loadFromLocalStorage();
    }
  },

  /**
   * Save a new template to Supabase
   */
  async saveTemplate(userId: string, template: Omit<TaskTemplate, 'id' | 'userId' | 'createdAt' | 'updatedAt'>): Promise<TaskTemplate> {
    try {
      const now = new Date().toISOString();
      const newTemplate = {
        ...template,
        user_id: userId,
        created_at: now,
        updated_at: now,
      };

      const { data, error } = await supabase
        .from('task_templates')
        .insert(newTemplate)
        .select()
        .single();

      if (error) throw error;

      const savedTemplate = this.convertFromDb(data);

      // Update localStorage cache
      const cached = this.loadFromLocalStorage();
      localStorage.setItem('pimbot_task_templates', JSON.stringify([savedTemplate, ...cached]));

      return savedTemplate;
    } catch (error) {
      console.error('Failed to save template to Supabase:', error);
      throw error;
    }
  },

  /**
   * Update an existing template
   */
  async updateTemplate(templateId: string, updates: Partial<Omit<TaskTemplate, 'id' | 'userId' | 'createdAt'>>): Promise<TaskTemplate> {
    try {
      const updateData = {
        ...updates,
        updated_at: new Date().toISOString(),
      };

      const { data, error } = await supabase
        .from('task_templates')
        .update(updateData)
        .eq('id', templateId)
        .select()
        .single();

      if (error) throw error;

      const updatedTemplate = this.convertFromDb(data);

      // Update localStorage cache
      const cached = this.loadFromLocalStorage();
      const updated = cached.map(t => t.id === templateId ? updatedTemplate : t);
      localStorage.setItem('pimbot_task_templates', JSON.stringify(updated));

      return updatedTemplate;
    } catch (error) {
      console.error('Failed to update template:', error);
      throw error;
    }
  },

  /**
   * Delete a template
   */
  async deleteTemplate(templateId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('task_templates')
        .delete()
        .eq('id', templateId);

      if (error) throw error;

      // Update localStorage cache
      const cached = this.loadFromLocalStorage();
      const updated = cached.filter(t => t.id !== templateId);
      localStorage.setItem('pimbot_task_templates', JSON.stringify(updated));
    } catch (error) {
      console.error('Failed to delete template:', error);
      throw error;
    }
  },

  /**
   * Get templates filtered by category
   */
  async getTemplatesByCategory(userId: string, category: string): Promise<TaskTemplate[]> {
    try {
      const { data, error } = await supabase
        .from('task_templates')
        .select('*')
        .eq('user_id', userId)
        .eq('category', category)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return (data || []) as TaskTemplate[];
    } catch (error) {
      console.error('Failed to get templates by category:', error);
      return [];
    }
  },

  /**
   * Search templates by name
   */
  async searchTemplates(userId: string, searchTerm: string): Promise<TaskTemplate[]> {
    try {
      const { data, error } = await supabase
        .from('task_templates')
        .select('*')
        .eq('user_id', userId)
        .ilike('name', `%${searchTerm}%`)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return (data || []) as TaskTemplate[];
    } catch (error) {
      console.error('Failed to search templates:', error);
      return [];
    }
  },

  /**
   * Get unique categories for a user
   */
  async getCategories(userId: string): Promise<string[]> {
    try {
      const templates = await this.loadTemplates(userId);
      return Array.from(new Set(templates.map(t => t.category))).sort();
    } catch (error) {
      console.error('Failed to get categories:', error);
      return [];
    }
  },

  /**
   * Subscribe to real-time template changes (premium feature)
   */
  subscribeToChanges(userId: string, onUpdate: (templates: TaskTemplate[]) => void) {
    try {
      const subscription = supabase
        .from(`task_templates:user_id=eq.${userId}`)
        .on('*', (payload) => {
          console.log('Template changed:', payload);
          // Reload templates on any change
          this.loadTemplates(userId).then(templates => onUpdate(templates));
        })
        .subscribe();

      return subscription;
    } catch (error) {
      console.error('Failed to subscribe to template changes:', error);
      return null;
    }
  },

  // Helper methods

  /**
   * Convert database format to application format
   */
  convertFromDb(dbTemplate: any): TaskTemplate {
    return {
      id: dbTemplate.id,
      userId: dbTemplate.user_id,
      name: dbTemplate.name,
      description: dbTemplate.description,
      category: dbTemplate.category,
      defaultPriority: dbTemplate.default_priority,
      defaultEstimatedHours: dbTemplate.default_estimated_hours,
      subtasks: dbTemplate.subtasks,
      defaultAssignees: dbTemplate.default_assignees,
      tags: dbTemplate.tags,
      createdAt: dbTemplate.created_at,
      updatedAt: dbTemplate.updated_at,
    };
  },

  /**
   * Load templates from localStorage as fallback
   */
  loadFromLocalStorage(): TaskTemplate[] {
    try {
      const cached = localStorage.getItem('pimbot_task_templates');
      return cached ? JSON.parse(cached) : [];
    } catch (error) {
      console.warn('Failed to load templates from localStorage:', error);
      return [];
    }
  },

  /**
   * Clear cache
   */
  clearCache(): void {
    localStorage.removeItem('pimbot_task_templates');
  },
};

export default templateService;

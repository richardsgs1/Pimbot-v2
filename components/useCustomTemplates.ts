import { useState, useEffect } from 'react';
import { SupabaseClient } from '@supabase/supabase-js';
import { ProjectTemplate } from './ProjectTemplates';

export interface CustomTemplate extends ProjectTemplate {
  userId?: string;
  createdAt?: string;
  isCustom: true;
}

export const useCustomTemplates = (supabase: SupabaseClient | null) => {
  const [customTemplates, setCustomTemplates] = useState<CustomTemplate[]>([]);
  const [loading, setLoading] = useState(false);

  // Load custom templates from database
  const loadTemplates = async () => {
    if (!supabase) return;
    
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('project_templates')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      if (data) {
        const templates: CustomTemplate[] = data.map(t => ({
          id: t.id,
          name: t.name,
          description: t.description,
          icon: t.icon || '📋',
          category: t.category || 'Custom',
          estimatedDuration: t.estimated_duration || 'Flexible',
          defaultBudget: t.default_budget,
          tasks: t.tasks || [],
          teamRoles: t.team_roles || [],
          milestones: t.milestones || [],
          userId: t.user_id,
          createdAt: t.created_at,
          isCustom: true
        }));
        setCustomTemplates(templates);
      }
    } catch (error) {
      console.error('Error loading templates:', error);
    } finally {
      setLoading(false);
    }
  };

  // Save a project as a template
  const saveAsTemplate = async (
    projectData: any,
    templateName: string,
    templateDescription: string
  ): Promise<boolean> => {
    if (!supabase) return false;

    try {
      const { error } = await supabase
        .from('project_templates')
        .insert({
          id: crypto.randomUUID(),
          name: templateName,
          description: templateDescription,
          icon: '⭐', // Custom templates get a star icon
          category: 'My Templates',
          estimated_duration: calculateDuration(projectData),
          default_budget: projectData.budget || 0,
          tasks: projectData.tasks || [],
          team_roles: projectData.teamMembers?.map((m: any) => ({
            role: m.role,
            description: `${m.role} position`
          })) || [],
          milestones: [],
          created_at: new Date().toISOString()
        });

      if (error) throw error;

      await loadTemplates(); // Reload templates
      return true;
    } catch (error) {
      console.error('Error saving template:', error);
      return false;
    }
  };

  // Delete a custom template
  const deleteTemplate = async (templateId: string): Promise<boolean> => {
    if (!supabase) return false;

    try {
      const { error } = await supabase
        .from('project_templates')
        .delete()
        .eq('id', templateId);

      if (error) throw error;

      await loadTemplates(); // Reload templates
      return true;
    } catch (error) {
      console.error('Error deleting template:', error);
      return false;
    }
  };

  // Calculate duration from project dates
  const calculateDuration = (projectData: any): string => {
    if (!projectData.startDate || !projectData.endDate) return 'Flexible';

    const start = new Date(projectData.startDate);
    const end = new Date(projectData.endDate);
    const days = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));

    if (days < 7) return `${days} days`;
    if (days < 30) return `${Math.ceil(days / 7)} weeks`;
    return `${Math.ceil(days / 30)} months`;
  };

  // Load templates on mount
  useEffect(() => {
    loadTemplates();
  }, [supabase]);

  return {
    customTemplates,
    loading,
    saveAsTemplate,
    deleteTemplate,
    reloadTemplates: loadTemplates
  };
};
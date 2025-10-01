import { supabase } from './supabase'
import type { OnboardingData, Project } from '../types'

export const saveUserData = async (userData: Partial<OnboardingData> & { id?: string }): Promise<string> => {
  try {
    if (!userData.id) {
      // Insert new user - let Supabase generate the ID
      const { data, error } = await supabase
        .from('users')
        .insert({
          name: userData.name || 'Unnamed User',
          email: userData.email || '',
          skill_level: userData.skillLevel || 'Beginner',
          methodologies: userData.methodologies || [],
          tools: userData.tools || []
        })
        .select('id')
        .single()

      if (error) throw error
      
      // Store the Supabase-generated ID in localStorage
      localStorage.setItem('user_id', data.id);
      return data.id
    }

    // Update existing user
    const { data, error } = await supabase
      .from('users')
      .update({
        name: userData.name,
        email: userData.email,
        skill_level: userData.skillLevel,
        methodologies: userData.methodologies,
        tools: userData.tools,
        updated_at: new Date().toISOString()
      })
      .eq('id', userData.id)
      .select('id')
      .single()

    if (error) throw error
    return data.id
  } catch (error) {
    console.error('Database operation failed:', error)
    throw error
  }
}

export const getUserId = (): string | null => {
  if (typeof window === 'undefined') return null;
  
  let userId = localStorage.getItem('user_id')
  
  // Return the stored ID if it exists, otherwise return null
  // This forces the INSERT path which lets Supabase generate a proper UUID
  return userId;
}
export const loadUserData = async (userId: string): Promise<OnboardingData | null> => {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single()

    if (error) {
      console.error('Failed to load user data:', error)
      return null
    }

    // Map database fields to OnboardingData format
    return {
      id: data.id,
      name: data.name,
      email: data.email,
      skillLevel: data.skill_level,
      methodologies: data.methodologies || [],
      tools: data.tools || []
    }
  } catch (error) {
    console.error('Error loading user data:', error)
    return null
  }
}
export const saveProject = async (userId: string, project: Project): Promise<string> => {
  try {
    const projectData = {
      user_id: userId,
      name: project.name,
      description: project.description,
      status: project.status,
      progress: project.progress,
      start_date: project.startDate,
      end_date: project.endDate,
      due_date: project.dueDate,
      priority: project.priority,
      manager: project.manager,
      team_size: project.teamSize,
      budget: project.budget,
      spent: project.spent,
      tasks: project.tasks || [],
      team_members: project.teamMembers || [],
      journal: project.journal || [],
      updated_at: new Date().toISOString()
    };

    // Check if project has a valid UUID (not temp IDs like "1", "2", "3")
    const isValidUuid = project.id && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(project.id);

    if (isValidUuid) {
      // Update existing project
      const { data, error } = await supabase
        .from('projects')
        .update(projectData)
        .eq('id', project.id)
        .eq('user_id', userId)
        .select('id')
        .single();

      if (error) throw error;
      return data.id;
    } else {
      // Insert new project (let Supabase generate UUID)
      const { data, error } = await supabase
        .from('projects')
        .insert(projectData)
        .select('id')
        .single();

      if (error) throw error;
      return data.id;
    }
  } catch (error) {
    console.error('Failed to save project:', error);
    throw error;
  }
};

export const loadProjects = async (userId: string): Promise<Project[]> => {
  try {
    const { data, error } = await supabase
      .from('projects')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;

    return data.map(p => ({
      id: p.id,
      name: p.name,
      description: p.description,
      status: p.status,
      progress: p.progress,
      startDate: p.start_date,
      endDate: p.end_date,
      dueDate: p.due_date,
      priority: p.priority,
      manager: p.manager,
      teamSize: p.team_size,
      budget: p.budget,
      spent: p.spent,
      tasks: p.tasks || [],
      teamMembers: p.team_members || [],
      journal: p.journal || []
    }));
  } catch (error) {
    console.error('Failed to load projects:', error);
    return [];
  }
};

export const deleteProject = async (userId: string, projectId: string): Promise<void> => {
  try {
    const { error } = await supabase
      .from('projects')
      .delete()
      .eq('id', projectId)
      .eq('user_id', userId);

    if (error) throw error;
  } catch (error) {
    console.error('Failed to delete project:', error);
    throw error;
  }
};
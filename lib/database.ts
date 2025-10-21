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

export const getUserId = async (): Promise<string | null> => {
  if (typeof window === 'undefined') return null;
  
  // First check localStorage cache
  let userId = localStorage.getItem('user_id');
  if (userId) return userId;
  
  // If not in localStorage, check Supabase auth session
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      // Cache it in localStorage for future calls
      localStorage.setItem('user_id', user.id);
      return user.id;
    }
  } catch (error) {
    console.error('Error getting user from Supabase:', error);
  }
  
  return null;
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
      .order('created_at', { ascending: false});

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

// ============================================
// SUBSCRIPTION DATABASE FUNCTIONS
// ============================================

export const getUserSubscription = async (userId: string): Promise<import('../types').UserSubscription | null> => {
  try {
    const { data, error } = await supabase
      .from('user_subscriptions')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error) {
      console.error('Failed to load subscription:', error);
      return null;
    }

    return {
      id: data.id,
      userId: data.user_id,
      tier: data.tier,
      status: data.status,
      stripeCustomerId: data.stripe_customer_id,
      stripeSubscriptionId: data.stripe_subscription_id,
      currentPeriodStart: new Date(data.current_period_start),
      currentPeriodEnd: new Date(data.current_period_end),
      trialEndsAt: data.trial_ends_at ? new Date(data.trial_ends_at) : undefined,
      cancelAtPeriodEnd: data.cancel_at_period_end,
      createdAt: new Date(data.created_at),
      updatedAt: new Date(data.updated_at)
    };
  } catch (error) {
    console.error('Error loading subscription:', error);
    return null;
  }
};

export const updateSubscription = async (
  userId: string, 
  updates: Partial<import('../types').UserSubscription>
): Promise<void> => {
  try {
    const updateData: any = {};
    
    if (updates.tier) updateData.tier = updates.tier;
    if (updates.status) updateData.status = updates.status;
    if (updates.stripeCustomerId) updateData.stripe_customer_id = updates.stripeCustomerId;
    if (updates.stripeSubscriptionId) updateData.stripe_subscription_id = updates.stripeSubscriptionId;
    if (updates.currentPeriodStart) updateData.current_period_start = updates.currentPeriodStart.toISOString();
    if (updates.currentPeriodEnd) updateData.current_period_end = updates.currentPeriodEnd.toISOString();
    if (updates.trialEndsAt) updateData.trial_ends_at = updates.trialEndsAt.toISOString();
    if (updates.cancelAtPeriodEnd !== undefined) updateData.cancel_at_period_end = updates.cancelAtPeriodEnd;
    
    updateData.updated_at = new Date().toISOString();

    const { error } = await supabase
      .from('user_subscriptions')
      .update(updateData)
      .eq('user_id', userId);

    if (error) throw error;
  } catch (error) {
    console.error('Failed to update subscription:', error);
    throw error;
  }
};

export const getTodayUsage = async (userId: string): Promise<import('../types').UsageTracking | null> => {
  try {
    const today = new Date().toISOString().split('T')[0];
    
    let { data, error } = await supabase
      .from('usage_tracking')
      .select('*')
      .eq('user_id', userId)
      .eq('date', today)
      .single();

    if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
      console.error('Failed to load usage:', error);
      return null;
    }

    if (!data) {
      // Create today's usage record
      const { data: newData, error: insertError } = await supabase
        .from('usage_tracking')
        .insert({
          user_id: userId,
          date: today,
          ai_queries_count: 0,
          storage_used_mb: 0
        })
        .select()
        .single();

      if (insertError) throw insertError;
      data = newData;
    }

    return {
      id: data.id,
      userId: data.user_id,
      date: data.date,
      aiQueriesCount: data.ai_queries_count,
      storageUsedMb: data.storage_used_mb,
      createdAt: new Date(data.created_at)
    };
  } catch (error) {
    console.error('Error loading usage:', error);
    return null;
  }
};

export const incrementAiQueryCount = async (userId: string): Promise<void> => {
  try {
    const today = new Date().toISOString().split('T')[0];
    
    // Try to increment existing record
    const { error } = await supabase.rpc('increment_ai_queries', {
      p_user_id: userId,
      p_date: today
    });

    if (error) {
      // If function doesn't exist or fails, do it manually
      const usage = await getTodayUsage(userId);
      if (usage) {
        await supabase
          .from('usage_tracking')
          .update({ ai_queries_count: usage.aiQueriesCount + 1 })
          .eq('user_id', userId)
          .eq('date', today);
      }
    }
  } catch (error) {
    console.error('Failed to increment AI query count:', error);
  }
};
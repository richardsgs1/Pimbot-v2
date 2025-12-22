import { supabase } from './supabase'
import type { OnboardingData, Project } from '../types'

// Define subscription and usage types locally since they're not in types.ts
interface UserSubscription {
  id: string;
  userId: string;
  tier: string;
  status: string;
  stripeCustomerId?: string;
  stripeSubscriptionId?: string;
  currentPeriodStart: Date;
  currentPeriodEnd: Date;
  trialEndsAt?: Date;
  cancelAtPeriodEnd: boolean;
  createdAt: Date;
  updatedAt: Date;
}

interface UsageTracking {
  id: string;
  userId: string;
  date: string;
  aiQueriesCount: number;
  storageUsedMb: number;
  createdAt: Date;
}

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
    // IMPORTANT: Ensure user_id is the Supabase auth UID, not the application user ID
    // The RLS policies check auth.uid() which must match the user_id column
    const authUser = await supabase.auth.getUser();
    const authUid = authUser.data.user?.id;

    if (!authUid) {
      console.error('Auth check failed - authUser.data:', authUser.data);
      throw new Error('No authenticated user found. Please log in again.');
    }

    console.log(`saveProject: Using auth UID ${authUid} for project ${project.id}`);

    const projectData = {
      user_id: authUid, // Use Supabase auth UID for RLS policies
      name: project.name,
      description: project.description,
      status: project.status,
      progress: project.progress,
      // Convert empty strings to null for date fields (PostgreSQL doesn't accept empty string dates)
      start_date: project.startDate && project.startDate.trim() ? project.startDate : null,
      end_date: project.endDate && project.endDate.trim() ? project.endDate : null,
      due_date: project.dueDate && project.dueDate.trim() ? project.dueDate : null,
      priority: project.priority,
      manager: project.manager,
      budget: project.budget || null,
      spent: project.spent || null,
      tasks: project.tasks || [],
      team_members: project.teamMembers || [],
      // NOTE: Don't save attachments here - they're stored in project.attachments in app state
      // The database stores file metadata separately in the 'files' table
      updated_at: new Date().toISOString()
    };

    // Check if project has a valid UUID (not temp IDs like "1", "2", "3")
    const isValidUuid = project.id && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(project.id);

    if (isValidUuid) {
      // Check if project already exists in database
      const { data: existingProject, error: checkError } = await supabase
        .from('projects')
        .select('id')
        .eq('id', project.id)
        .eq('user_id', userId)
        .single();

      if (checkError && checkError.code !== 'PGRST116') {
        // PGRST116 = no rows found, which is expected for new projects
        throw checkError;
      }

      if (existingProject) {
        // Update existing project
        const { data, error } = await supabase
          .from('projects')
          .update(projectData)
          .eq('id', project.id)
          .eq('user_id', userId)
          .select('id')
          .single();

        if (error) throw error;
        console.log(`Updated project ${project.id}`);
        return data.id;
      } else {
        // Insert new project with the specified UUID
        const { data, error } = await supabase
          .from('projects')
          .insert({
            id: project.id, // Use the generated UUID
            ...projectData
          })
          .select('id')
          .single();

        if (error) throw error;
        console.log(`Inserted new project ${project.id}`);
        return data.id;
      }
    } else {
      // Insert new project (let Supabase generate UUID)
      const { data, error } = await supabase
        .from('projects')
        .insert(projectData)
        .select('id')
        .single();

      if (error) throw error;
      console.log(`Inserted new project with auto-generated ID`);
      return data.id;
    }
  } catch (error) {
    console.error('Failed to save project:', error);
    if (error instanceof Error) {
      console.error('Error message:', error.message);
      console.error('Error stack:', error.stack);
    }
    throw error;
  }
};

export const loadProjects = async (userId: string): Promise<Project[]> => {
  try {
    // IMPORTANT: Get the Supabase auth UID instead of using the passed userId
    // The RLS policies check auth.uid() which must match the user_id column
    const authUser = await supabase.auth.getUser();
    const authUid = authUser.data.user?.id;

    if (!authUid) {
      console.log('No authenticated user found. Cannot load projects.');
      return [];
    }

    // Select only columns that actually exist in the schema
    // Removed: tags, journal, archived (may not exist in all deployments)
    const { data, error } = await supabase
      .from('projects')
      .select('id,user_id,name,description,status,progress,start_date,end_date,due_date,priority,manager,budget,spent,tasks,team_members,created_at,updated_at')
      .eq('user_id', authUid)
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
      budget: p.budget,
      spent: p.spent,
      tasks: p.tasks || [],
      teamMembers: p.team_members || [],
      attachments: [] as any, // Files stored in storage bucket and app state, not DB
      createdAt: p.created_at,
      updatedAt: p.updated_at,
      archived: false, // Not stored in DB yet
      tags: [], // Not stored in DB yet
      journal: [] // Not stored in DB yet
    }));
  } catch (error) {
    console.error('Failed to load projects:', error);
    return [];
  }
};

export const deleteProject = async (userId: string, projectId: string): Promise<void> => {
  try {
    // IMPORTANT: Get the Supabase auth UID instead of using the passed userId
    // The RLS policies check auth.uid() which must match the user_id column
    const authUser = await supabase.auth.getUser();
    const authUid = authUser.data.user?.id;

    if (!authUid) {
      throw new Error('No authenticated user found. Please log in again.');
    }

    const { error } = await supabase
      .from('projects')
      .delete()
      .eq('id', projectId)
      .eq('user_id', authUid);

    if (error) throw error;
  } catch (error) {
    console.error('Failed to delete project:', error);
    throw error;
  }
};

// ============================================
// SUBSCRIPTION DATABASE FUNCTIONS
// ============================================

export const getUserSubscription = async (userId: string): Promise<UserSubscription | null> => {
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
  updates: Partial<UserSubscription>
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

export const getTodayUsage = async (userId: string): Promise<UsageTracking | null> => {
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

// ============================================
// FILE MANAGEMENT DATABASE FUNCTIONS
// ============================================

interface FileRecord {
  id: string;
  name: string;
  size: number;
  type: string;
  file_path: string;
  project_id?: string;
  task_id?: string;
  created_by: string;
  created_at: string;
  updated_at: string;
}

/**
 * Save file metadata to database
 */
export const saveFileMetadata = async (
  fileName: string,
  fileSize: number,
  mimeType: string,
  filePath: string,
  userId: string,
  projectId?: string,
  taskId?: string
): Promise<string | null> => {
  try {
    const { data, error } = await supabase
      .from('files')
      .insert({
        name: fileName,
        size: fileSize,
        type: mimeType,
        file_path: filePath,
        created_by: userId,
        project_id: projectId,
        task_id: taskId
      })
      .select('id')
      .single();

    if (error) throw error;

    // Update storage quota
    if (projectId) {
      await updateStorageQuota(projectId, userId, fileSize);
    }

    return data.id;
  } catch (error) {
    console.error('Failed to save file metadata:', error);
    return null;
  }
};

/**
 * Get files for a project
 */
export const getProjectFiles = async (
  projectId: string,
  filters?: {
    search?: string;
    type?: string;
    sortBy?: 'name' | 'size' | 'date';
    sortOrder?: 'asc' | 'desc';
  }
): Promise<FileRecord[]> => {
  try {
    let query = supabase
      .from('files')
      .select('*')
      .eq('project_id', projectId);

    if (filters?.search) {
      query = query.ilike('name', `%${filters.search}%`);
    }

    if (filters?.type) {
      query = query.eq('type', filters.type);
    }

    const sortColumn = filters?.sortBy || 'created_at';
    const sortOrder = filters?.sortOrder === 'asc' ? { ascending: true } : { ascending: false };
    query = query.order(sortColumn, sortOrder);

    const { data, error } = await query;

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Failed to get project files:', error);
    return [];
  }
};

/**
 * Get files for a task
 */
export const getTaskFiles = async (
  taskId: string,
  filters?: {
    search?: string;
    type?: string;
    sortBy?: 'name' | 'size' | 'date';
    sortOrder?: 'asc' | 'desc';
  }
): Promise<FileRecord[]> => {
  try {
    let query = supabase
      .from('files')
      .select('*')
      .eq('task_id', taskId);

    if (filters?.search) {
      query = query.ilike('name', `%${filters.search}%`);
    }

    if (filters?.type) {
      query = query.eq('type', filters.type);
    }

    const sortColumn = filters?.sortBy || 'created_at';
    const sortOrder = filters?.sortOrder === 'asc' ? { ascending: true } : { ascending: false };
    query = query.order(sortColumn, sortOrder);

    const { data, error } = await query;

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Failed to get task files:', error);
    return [];
  }
};

/**
 * Delete file metadata (should be called after deleting from storage)
 */
export const deleteFileMetadata = async (
  fileId: string,
  projectId?: string,
  userId?: string
): Promise<boolean> => {
  try {
    // Get file info to subtract from quota
    const { data: fileData, error: fetchError } = await supabase
      .from('files')
      .select('size')
      .eq('id', fileId)
      .single();

    if (!fetchError && fileData && projectId && userId) {
      await updateStorageQuota(projectId, userId, -fileData.size);
    }

    const { error } = await supabase
      .from('files')
      .delete()
      .eq('id', fileId);

    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Failed to delete file metadata:', error);
    return false;
  }
};

/**
 * Get storage quota for project
 */
export const getStorageQuota = async (
  projectId: string,
  userId: string
): Promise<{ used: number; limit: number } | null> => {
  try {
    const { data, error } = await supabase
      .from('file_storage_quota')
      .select('total_size_bytes, quota_limit_bytes')
      .eq('project_id', projectId)
      .eq('user_id', userId)
      .single();

    if (error && error.code !== 'PGRST116') throw error;

    // Default: 500MB limit
    const limit = data?.quota_limit_bytes || 500 * 1024 * 1024;
    const used = data?.total_size_bytes || 0;

    return { used, limit };
  } catch (error) {
    console.error('Failed to get storage quota:', error);
    return null;
  }
};

/**
 * Update storage quota after file upload/delete
 */
const updateStorageQuota = async (
  projectId: string,
  userId: string,
  sizeChange: number
): Promise<void> => {
  try {
    const quota = await getStorageQuota(projectId, userId);

    if (!quota) {
      // Create new quota record
      const limit = 500 * 1024 * 1024; // 500MB default
      await supabase
        .from('file_storage_quota')
        .insert({
          project_id: projectId,
          user_id: userId,
          total_size_bytes: Math.max(0, sizeChange),
          quota_limit_bytes: limit
        });
    } else {
      // Update existing quota
      const newTotal = Math.max(0, quota.used + sizeChange);
      await supabase
        .from('file_storage_quota')
        .update({ total_size_bytes: newTotal })
        .eq('project_id', projectId)
        .eq('user_id', userId);
    }
  } catch (error) {
    console.error('Failed to update storage quota:', error);
  }
};

/**
 * Check if file upload would exceed quota
 */
export const checkStorageQuota = async (
  projectId: string,
  userId: string,
  fileSize: number
): Promise<{ allowed: boolean; message: string }> => {
  try {
    const quota = await getStorageQuota(projectId, userId);

    if (!quota) {
      return { allowed: true, message: 'OK' };
    }

    const newTotal = quota.used + fileSize;
    const percentUsed = Math.round((newTotal / quota.limit) * 100);

    if (newTotal > quota.limit) {
      return {
        allowed: false,
        message: `File upload would exceed quota (${percentUsed}% usage)`
      };
    }

    if (percentUsed > 90) {
      return {
        allowed: true,
        message: `Warning: ${percentUsed}% of storage quota used`
      };
    }

    return { allowed: true, message: 'OK' };
  } catch (error) {
    console.error('Failed to check storage quota:', error);
    return { allowed: true, message: 'OK' };
  }
};

/**
 * Log file access for audit trail
 */
export const logFileAccess = async (
  fileId: string,
  userId: string | null,
  action: 'download' | 'preview' | 'delete'
): Promise<void> => {
  try {
    await supabase
      .from('file_access_log')
      .insert({
        file_id: fileId,
        user_id: userId,
        action: action
      });
  } catch (error) {
    console.error('Failed to log file access:', error);
    // Don't throw - logging failure shouldn't break the app
  }
};

// ============================================
// TASK DEPENDENCY DATABASE FUNCTIONS
// ============================================

import type { TaskDependency, TaskDependencyDB } from '../types';

/**
 * Create a task dependency relationship
 */
export const createTaskDependency = async (
  dependentTaskId: string,
  blockingTaskId: string
): Promise<TaskDependency | null> => {
  try {
    const { data, error } = await supabase
      .from('task_dependencies')
      .insert({
        dependent_task_id: dependentTaskId,
        blocking_task_id: blockingTaskId
      })
      .select('*')
      .single();

    if (error) throw error;

    return {
      id: data.id,
      dependentTaskId: data.dependent_task_id,
      blockingTaskId: data.blocking_task_id,
      createdAt: data.created_at
    };
  } catch (error) {
    console.error('Failed to create task dependency:', error);
    return null;
  }
};

/**
 * Get all dependencies for a task (tasks this task depends on)
 */
export const getTaskDependencies = async (
  taskId: string
): Promise<TaskDependency[]> => {
  try {
    const { data, error } = await supabase
      .from('task_dependencies')
      .select('*')
      .eq('dependent_task_id', taskId);

    if (error) throw error;

    return (data || []).map(d => ({
      id: d.id,
      dependentTaskId: d.dependent_task_id,
      blockingTaskId: d.blocking_task_id,
      createdAt: d.created_at
    }));
  } catch (error) {
    console.error('Failed to get task dependencies:', error);
    return [];
  }
};

/**
 * Get all dependent tasks (tasks that depend on this task)
 */
export const getDependentTasks = async (
  taskId: string
): Promise<TaskDependency[]> => {
  try {
    const { data, error } = await supabase
      .from('task_dependencies')
      .select('*')
      .eq('blocking_task_id', taskId);

    if (error) throw error;

    return (data || []).map(d => ({
      id: d.id,
      dependentTaskId: d.dependent_task_id,
      blockingTaskId: d.blocking_task_id,
      createdAt: d.created_at
    }));
  } catch (error) {
    console.error('Failed to get dependent tasks:', error);
    return [];
  }
};

/**
 * Delete a task dependency
 */
export const deleteTaskDependency = async (
  dependentTaskId: string,
  blockingTaskId: string
): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('task_dependencies')
      .delete()
      .eq('dependent_task_id', dependentTaskId)
      .eq('blocking_task_id', blockingTaskId);

    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Failed to delete task dependency:', error);
    return false;
  }
};

/**
 * Delete all dependencies for a task (when task is deleted)
 */
export const deleteAllTaskDependencies = async (
  taskId: string
): Promise<boolean> => {
  try {
    // Delete where this task is dependent
    await supabase
      .from('task_dependencies')
      .delete()
      .eq('dependent_task_id', taskId);

    // Delete where this task is blocking
    await supabase
      .from('task_dependencies')
      .delete()
      .eq('blocking_task_id', taskId);

    return true;
  } catch (error) {
    console.error('Failed to delete all task dependencies:', error);
    return false;
  }
};

// ============================================
// RECURRING TASK INSTANCE DATABASE FUNCTIONS
// ============================================

import type { RecurringTaskInstance, RecurringTaskInstanceDB } from '../types';

/**
 * Create a recurring task instance record
 */
export const createRecurringTaskInstance = async (
  originalTaskId: string,
  generatedTaskId: string,
  occurrenceNumber: number,
  scheduledDate: string
): Promise<RecurringTaskInstance | null> => {
  try {
    const { data, error } = await supabase
      .from('recurring_task_instances')
      .insert({
        original_task_id: originalTaskId,
        generated_task_id: generatedTaskId,
        occurrence_number: occurrenceNumber,
        scheduled_date: scheduledDate
      })
      .select('*')
      .single();

    if (error) throw error;

    return {
      id: data.id,
      originalTaskId: data.original_task_id,
      generatedTaskId: data.generated_task_id,
      occurrenceNumber: data.occurrence_number,
      scheduledDate: data.scheduled_date,
      createdAt: data.created_at
    };
  } catch (error) {
    console.error('Failed to create recurring task instance:', error);
    return null;
  }
};

/**
 * Get all instances for a recurring task
 */
export const getRecurringTaskInstances = async (
  originalTaskId: string
): Promise<RecurringTaskInstance[]> => {
  try {
    const { data, error } = await supabase
      .from('recurring_task_instances')
      .select('*')
      .eq('original_task_id', originalTaskId)
      .order('occurrence_number', { ascending: true });

    if (error) throw error;

    return (data || []).map(d => ({
      id: d.id,
      originalTaskId: d.original_task_id,
      generatedTaskId: d.generated_task_id,
      occurrenceNumber: d.occurrence_number,
      scheduledDate: d.scheduled_date,
      createdAt: d.created_at
    }));
  } catch (error) {
    console.error('Failed to get recurring task instances:', error);
    return [];
  }
};

/**
 * Get instances scheduled within a date range
 */
export const getRecurringTaskInstancesByDateRange = async (
  startDate: string,
  endDate: string
): Promise<RecurringTaskInstance[]> => {
  try {
    const { data, error } = await supabase
      .from('recurring_task_instances')
      .select('*')
      .gte('scheduled_date', startDate)
      .lte('scheduled_date', endDate)
      .order('scheduled_date', { ascending: true });

    if (error) throw error;

    return (data || []).map(d => ({
      id: d.id,
      originalTaskId: d.original_task_id,
      generatedTaskId: d.generated_task_id,
      occurrenceNumber: d.occurrence_number,
      scheduledDate: d.scheduled_date,
      createdAt: d.created_at
    }));
  } catch (error) {
    console.error('Failed to get recurring task instances by date range:', error);
    return [];
  }
};

/**
 * Get the latest instance for a recurring task
 */
export const getLatestRecurringTaskInstance = async (
  originalTaskId: string
): Promise<RecurringTaskInstance | null> => {
  try {
    const { data, error } = await supabase
      .from('recurring_task_instances')
      .select('*')
      .eq('original_task_id', originalTaskId)
      .order('occurrence_number', { ascending: false })
      .limit(1)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    if (!data) return null;

    return {
      id: data.id,
      originalTaskId: data.original_task_id,
      generatedTaskId: data.generated_task_id,
      occurrenceNumber: data.occurrence_number,
      scheduledDate: data.scheduled_date,
      createdAt: data.created_at
    };
  } catch (error) {
    console.error('Failed to get latest recurring task instance:', error);
    return null;
  }
};

/**
 * Delete recurring task instance
 */
export const deleteRecurringTaskInstance = async (
  instanceId: string
): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('recurring_task_instances')
      .delete()
      .eq('id', instanceId);

    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Failed to delete recurring task instance:', error);
    return false;
  }
};

/**
 * Delete all instances for a recurring task (when template is deleted)
 */
export const deleteAllRecurringTaskInstances = async (
  originalTaskId: string
): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('recurring_task_instances')
      .delete()
      .eq('original_task_id', originalTaskId);

    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Failed to delete all recurring task instances:', error);
    return false;
  }
};
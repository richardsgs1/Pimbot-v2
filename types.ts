// Import and re-export file attachment types
import type { FileAttachment } from './lib/fileTypes';
export type { FileAttachment };

// User and Authentication
export interface OnboardingData {
  id: string;
  name: string;
  email: string;
  skillLevel: 'Beginner' | 'Intermediate' | 'Advanced' | 'Expert' | null;
  methodologies: string[];
  tools: string[];
  hasSeenPricing?: boolean;
  onboardingCompleted?: boolean;
  subscriptionId?: string;

  // ============================================
  // ✅ TRIAL NOTIFICATION SYSTEM - NEW FIELDS
  // ============================================
  
  /**
   * ISO date string when user's trial started
   * Example: "2025-01-15T10:30:00.000Z"
   * Automatically set when user signs up
   */
  trialStartDate?: string;

  /**
   * ISO date string when user's trial ends
   * Example: "2025-01-29T10:30:00.000Z" (14 days after start)
   * Used to calculate days remaining
   */
  trialEndDate?: string;

  /**
   * Whether the user has upgraded to a premium plan
   * Set to false by default, true after successful payment
   * When true, no trial banners or emails are shown
   */
  isPremium?: boolean;

  /**
   * Whether trial was manually extended by admin/support
   * Useful for tracking customer service actions
   */
  trialExtended?: boolean;

  /**
   * ISO date string of last trial notification email sent
   * Used to prevent sending duplicate notifications within 24 hours
   * Example: "2025-01-22T09:00:00.000Z"
   */
  lastTrialNotification?: string;

  /**
   * Array of notification types that have been sent to this user
   * Prevents duplicate notifications across the trial period
   * Example: ['trial-7-days', 'trial-3-days']
   * Possible values: 'trial-7-days', 'trial-3-days', 'trial-1-day', 'trial-expired', 'grace-ending'
   */
  trialNotificationsSent?: string[];

  /**
   * Current subscription tier (optional but recommended)
   * Useful if you have multiple paid plans
   */
  subscriptionTier?: 'free' | 'basic' | 'pro' | 'enterprise';

  /**
   * When user upgraded to premium (optional)
   * Example: "2025-01-20T14:30:00.000Z"
   */
  subscriptionStartDate?: string;

  /**
   * For annual subscriptions, when it renews (optional)
   * Example: "2026-01-20T14:30:00.000Z"
   */
  subscriptionEndDate?: string;

  /**
   * Payment method used (optional)
   * Example: 'stripe', 'paypal', etc.
   */
  paymentMethod?: string;
}

// Project Status
export enum ProjectStatus {
  Planning = 'Planning',
  OnTrack = 'On Track',
  AtRisk = 'At Risk',
  OnHold = 'On Hold',
  Completed = 'Completed'
}

export const PROJECT_STATUS_VALUES = {
  Planning: ProjectStatus.Planning,
  OnTrack: ProjectStatus.OnTrack,
  AtRisk: ProjectStatus.AtRisk,
  OnHold: ProjectStatus.OnHold,
  Completed: ProjectStatus.Completed
} as const;

// Task Priority
export enum Priority {
  Low = 'Low',
  Medium = 'Medium',
  High = 'High',
  Urgent = 'Urgent'
}

export const PRIORITY_VALUES = {
  Low: Priority.Low,
  Medium: Priority.Medium,
  High: Priority.High,
  Urgent: Priority.Urgent
} as const;

// Task Status (for Kanban)
export enum TaskStatus {
  ToDo = 'To Do',
  InProgress = 'In Progress',
  Done = 'Done',
  OnHold = 'On Hold'
}

// Team Member
export interface TeamMember {
  id: string;
  name: string;
  email: string;
  role: string;
  avatar?: string;
}

// Subtask (for task decomposition)
export interface Subtask {
  id: string;
  name: string;
  completed: boolean;
  estimatedHours?: number;
  assignees?: string[];
  order?: number; // For ordering subtasks
}

// Recurrence Pattern (for recurring tasks)
export interface RecurrencePattern {
  frequency: 'daily' | 'weekly' | 'biweekly' | 'monthly' | 'quarterly' | 'yearly';
  interval?: number; // Every N weeks/months (default 1)
  daysOfWeek?: number[]; // For weekly: 0-6 (0=Sunday)
  dayOfMonth?: number; // For monthly: 1-31
  endDate?: string; // ISO date or null for infinite
  maxOccurrences?: number; // Or number limit
}

// Task Template (for saving and reusing task configurations)
export interface TaskTemplate {
  id: string;
  userId: string;
  name: string;
  description: string;
  category: string;
  defaultPriority?: Priority;
  defaultEstimatedHours?: number;
  subtasks?: Subtask[];
  defaultAssignees?: string[];
  tags?: string[];
  createdAt: string;
  updatedAt: string;
}

// Task (extended with advanced features)
export interface Task {
  id: string;
  name: string;
  description: string;
  completed: boolean;
  status: TaskStatus;
  priority: Priority;
  dueDate?: string;
  startDate?: string;
  assignees: string[];
  tags?: string[];
  estimatedHours?: number;
  actualHours?: number;
  attachments: FileAttachment[];
  createdAt: string;
  updatedAt: string;

  // ============================================
  // ADVANCED TASK FEATURES - NEW FIELDS
  // ============================================

  // Task Dependencies
  dependencies?: string[]; // Array of task IDs this task depends on
  dependentTaskIds?: string[]; // Array of task IDs that depend on this one
  isBlocked?: boolean; // True if any dependency is incomplete

  // Subtasks
  subtasks?: Subtask[]; // Array of subtasks for task decomposition
  subtaskProgress?: number; // Percentage of subtasks completed (0-100)

  // Recurring Tasks
  isRecurring?: boolean; // True if this is a recurring task template
  recurrencePattern?: RecurrencePattern; // Pattern for generating instances
  originalTaskId?: string; // Reference to original template for instances
  occurrenceNumber?: number; // Which instance this is (1st, 2nd, etc.)

  // Task Templates
  isTemplate?: boolean; // True if this task is saved as a template
  templateCategory?: string; // Category for organization
}

// Journal Entry
export interface JournalEntry {
  id: string;
  content: string;
  timestamp: string;
  projectId: string;
  userId: string;
  tags?: string[];
}

// Project
export interface Project {
  id: string;
  name: string;
  description: string;
  status: ProjectStatus;
  priority: Priority;
  progress: number;
  startDate?: string;
  endDate?: string;
  dueDate?: string;
  budget?: number;
  spent?: number;
  manager?: string;
  teamMembers: TeamMember[];
  tasks: Task[];
  attachments: FileAttachment[];
  journal?: JournalEntry[];
  tags?: string[];
  createdAt: string;
  updatedAt: string;
  archived?: boolean;
  aiHealthSummary?: string;
}

// Chat/AI Message
export interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

// Search Results
export interface SearchResultItem {
  type: 'project' | 'task' | 'journal';
  data: Project | Task | JournalEntry;
  project: Project;
}

export interface SearchResults {
  projects: SearchResultItem[];
  tasks: SearchResultItem[];
  journal: SearchResultItem[];
}

// Dashboard Stats
export interface DashboardStats {
  totalProjects: number;
  activeProjects: number;
  completedProjects: number;
  totalTasks: number;
  completedTasks: number;
  overdueTasks: number;
  upcomingDeadlines: number;
}

// Notification
export interface Notification {
  id: string;
  type: 'info' | 'warning' | 'error' | 'success';
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  projectId?: string;
  taskId?: string;
}

// ============================================
// DATABASE TABLE TYPES FOR ADVANCED FEATURES
// ============================================

/**
 * Task Dependency - Explicit relationship tracking
 * Represents one task blocking/being blocked by another
 */
export interface TaskDependency {
  id: string;
  dependentTaskId: string; // Task that is waiting/blocked
  blockingTaskId: string; // Task that must complete first
  createdAt: string;
}

/**
 * Database representation (snake_case for database operations)
 */
export interface TaskDependencyDB {
  id: string;
  dependent_task_id: string;
  blocking_task_id: string;
  created_at: string;
}

/**
 * Recurring Task Instance - Tracks generated task instances
 * Links generated tasks back to their original template
 */
export interface RecurringTaskInstance {
  id: string;
  originalTaskId: string; // Template task that generated this instance
  generatedTaskId: string; // The actual task instance created
  occurrenceNumber: number; // Which occurrence (1st, 2nd, 3rd, etc.)
  scheduledDate: string; // ISO date when this instance is scheduled
  createdAt: string;
}

/**
 * Database representation (snake_case for database operations)
 */
export interface RecurringTaskInstanceDB {
  id: string;
  original_task_id: string;
  generated_task_id: string;
  occurrence_number: number;
  scheduled_date: string;
  created_at: string;
}

// ============================================
// HELPER TYPES FOR ADVANCED FEATURES
// ============================================

/**
 * Dependency status for a task
 */
export interface DependencyStatus {
  isBlocked: boolean;
  blockingTasks: Task[]; // Tasks that are blocking this one
  dependentTasks: Task[]; // Tasks waiting on this one
  canStart: boolean; // True if all dependencies are complete
}

/**
 * Subtask progress summary
 */
export interface SubtaskProgress {
  total: number;
  completed: number;
  percentage: number;
  remaining: number;
}

/**
 * Next occurrence calculation for recurring tasks
 */
export interface NextOccurrence {
  date: string; // ISO date string
  occurrenceNumber: number;
  isLastOccurrence: boolean; // True if maxOccurrences reached or past endDate
}

/**
 * Recurring task generation result
 */
export interface RecurringTaskGenerationResult {
  success: boolean;
  generatedTask?: Task;
  instance?: RecurringTaskInstance;
  error?: string;
  nextScheduledDate?: string;
}

/**
 * Task template application result
 */
export interface TaskFromTemplateResult {
  success: boolean;
  task?: Task;
  error?: string;
}

/**
 * Dependency validation result
 */
export interface DependencyValidationResult {
  valid: boolean;
  errors: string[];
  circularDependencies?: string[][]; // Arrays of task IDs forming cycles
}

/**
 * Bulk task operation result
 */
export interface BulkTaskOperationResult {
  succeeded: number;
  failed: number;
  errors: Array<{
    taskId: string;
    error: string;
  }>;
}

// ============================================
// DATABASE TYPES (snake_case)
// ============================================

/**
 * Task database representation with all advanced features
 * Use this type when reading from/writing to the database
 */
export interface TaskDB {
  id: string;
  name: string;
  description: string;
  completed: boolean;
  status: TaskStatus;
  priority: Priority;
  due_date?: string;
  start_date?: string;
  assignees: string[];
  tags?: string[];
  estimated_hours?: number;
  actual_hours?: number;
  attachments: FileAttachment[];
  created_at: string;
  updated_at: string;

  // Advanced features (snake_case)
  dependencies?: string[];
  dependent_task_ids?: string[];
  is_blocked?: boolean;
  subtasks?: Subtask[];
  subtask_progress?: number;
  is_recurring?: boolean;
  recurrence_pattern?: RecurrencePattern;
  original_task_id?: string;
  occurrence_number?: number;
  is_template?: boolean;
  template_category?: string;
}

/**
 * Project database representation
 * Use this type when reading from/writing to the database
 */
export interface ProjectDB {
  id: string;
  name: string;
  description: string;
  status: ProjectStatus;
  priority: Priority;
  progress: number;
  start_date?: string;
  end_date?: string;
  due_date?: string;
  budget?: number;
  spent?: number;
  manager?: string;
  team_members: TeamMember[];
  tasks: TaskDB[];
  attachments: FileAttachment[];
  journal?: JournalEntry[];
  tags?: string[];
  created_at: string;
  updated_at: string;
  archived?: boolean;
  ai_health_summary?: string;
}

// Theme
export type Theme = 'light' | 'dark';

// View Types
export type View = 'home' | 'projectList' | 'projectDetails' | 'chat' | 'timeline' | 'account';
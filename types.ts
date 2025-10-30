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

// Task
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

// Theme
export type Theme = 'light' | 'dark';

// View Types
export type View = 'home' | 'projectList' | 'projectDetails' | 'chat' | 'timeline' | 'account';
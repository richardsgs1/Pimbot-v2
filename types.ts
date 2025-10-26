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
  attachments: FileAttachment[]; // NEW: File attachments
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
  progress: number; // 0-100
  startDate?: string;
  endDate?: string; // Added for database.ts compatibility
  dueDate?: string;
  budget?: number;
  spent?: number;
  manager?: string; // Added for database.ts compatibility
  teamMembers: TeamMember[];
  tasks: Task[];
  attachments: FileAttachment[]; // NEW: File attachments
  journal?: JournalEntry[];
  tags?: string[];
  createdAt: string;
  updatedAt: string;
  archived?: boolean;
  aiHealthSummary?: string; // AI-generated health summary for Analytics
}

// Chat/AI Message
export interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

// Search Results (if you use the search feature)
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

// View Types (for navigation)
export type View = 'home' | 'projectList' | 'projectDetails' | 'chat' | 'timeline' | 'account';
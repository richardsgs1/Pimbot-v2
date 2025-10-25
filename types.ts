// User types
export type SkillLevel = 'No Experience' | 'Novice' | 'Intermediate' | 'Experienced' | 'Expert';

// Helper constant for SkillLevel values
export const SKILL_LEVEL_VALUES = {
  NoExperience: 'No Experience' as SkillLevel,
  Novice: 'Novice' as SkillLevel,
  Intermediate: 'Intermediate' as SkillLevel,
  Experienced: 'Experienced' as SkillLevel,
  Expert: 'Expert' as SkillLevel,
};

export interface UserData {
  id: string;
  name: string;
  email?: string;
  skillLevel: string;
  methodologies: string[];
  tools?: string[];
  hasSeenPricing?: boolean;
}

// Task-related types
export type TaskStatus = 'To Do' | 'In Progress' | 'Done' | 'On Hold';
export type Priority = 'Low' | 'Medium' | 'High';

// Helper constants for using as values (not just types)
export const PRIORITY_VALUES = {
  Low: 'Low' as Priority,
  Medium: 'Medium' as Priority,
  High: 'High' as Priority,
};

export interface Task {
  id: string;
  name: string;  // Keep 'name' as primary (for existing code)
  title?: string; // Add 'title' as optional alias for Kanban
  description?: string;
  completed: boolean;
  status: TaskStatus;
  priority: Priority;
  dueDate?: string; // Optional
  startDate?: string;
  duration?: number;
  assigneeId?: string;
  assignedTo?: string;
  estimatedHours?: number;
  dependencies?: string[];
  tags?: string[];
}

// Project-related types
export type ProjectStatus = 'Planning' | 'In Progress' | 'On Hold' | 'Completed' | 'At Risk';

export const PROJECT_STATUS_VALUES = {
  Planning: 'Planning' as ProjectStatus,
  InProgress: 'In Progress' as ProjectStatus,
  OnHold: 'On Hold' as ProjectStatus,
  Completed: 'Completed' as ProjectStatus,
  AtRisk: 'At Risk' as ProjectStatus,
};

export interface TeamMember {
  id: string;
  name: string;
  email?: string;
  role?: string;
}

export interface Project {
  id: string;
  name: string;
  description?: string;
  client?: string;
  status: ProjectStatus;
  progress: number;
  startDate: string;
  endDate?: string;
  dueDate?: string;
  budget?: number;
  spent?: number; // Added for budget tracking
  priority?: Priority; // Added for project prioritization
  manager?: string; // Added for project manager
  aiHealthSummary?: string; // Added for AI-generated health insights
  tasks: Task[];
  teamMembers: TeamMember[];
  tags?: string[];
  archived?: boolean;
  color?: string;
  createdAt?: string;
  updatedAt?: string;
}

// Onboarding types
export interface OnboardingData {
  id?: string;
  name: string;
  email?: string;
  skillLevel: string;
  methodologies: string[];
  tools?: string[];
  hasSeenPricing?: boolean;
}

// Notification types
export interface Notification {
  id: string;
  type: 'success' | 'warning' | 'error' | 'info';
  title: string;
  message: string;
  timestamp: Date;
  read?: boolean;
  projectId?: string;
  taskId?: string;
  actionUrl?: string;
  priority?: 'high' | 'medium' | 'low';
}

export interface SmartNotification extends Notification {
  insights?: string[];
  suggestedActions?: string[];
}

// Chat/AI types
export interface Message {
  role: 'user' | 'assistant';
  content: string;
}

export interface ChatMessage extends Message {
  id: string;
  timestamp: Date;
}

// Export/Report types
export interface ExportOptions {
  format: 'pdf' | 'csv' | 'json';
  includeArchived?: boolean;
  dateRange?: {
    start: Date;
    end: Date;
  };
}
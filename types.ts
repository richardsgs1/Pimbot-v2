export enum SkillLevel {
  NOVICE = 'Novice',
  INTERMEDIATE = 'Intermediate',
  EXPERIENCED = 'Experienced',
  EXPERT = 'Expert',
}

export interface OnboardingData {
  skillLevel: SkillLevel | null;
  methodologies: string[];
  tools: string[];
  name: string;
  id: string; // User's unique ID
}

// New types for Projects
export enum ProjectStatus {
  OnTrack = 'On Track',
  AtRisk = 'At Risk',
  OffTrack = 'Off Track',
  Completed = 'Completed',
}

export enum Priority {
  High = 'High',
  Medium = 'Medium',
  Low = 'Low',
  None = 'None',
}

export interface TeamMember {
  id: string;
  name: string;
  avatarColor: string;
}

export interface Task {
  id: string;
  name: string;
  completed: boolean;
  priority: Priority;
  dueDate?: string; // YYYY-MM-DD format
  dependsOn?: string; // ID of the task it depends on
  assigneeId?: string; // ID of the TeamMember
}

export interface JournalEntry {
  id: string;
  date: string; // ISO 8601 format
  content: string;
}

export interface Project {
  id: string;
  name: string;
  description: string;
  status: ProjectStatus;
  dueDate: string;
  progress: number; // 0-100
  tasks: Task[];
  aiHealthSummary?: string;
  journal: JournalEntry[];
}

// Types for Global Search
export type SearchResultItem = 
  | { type: 'project'; data: Project }
  | { type: 'task'; data: Task; project: { id: string; name: string } }
  | { type: 'journal'; data: JournalEntry; project: { id: string; name: string } };

export interface SearchResults {
  projects: SearchResultItem[];
  tasks: SearchResultItem[];
  journal: SearchResultItem[];
}
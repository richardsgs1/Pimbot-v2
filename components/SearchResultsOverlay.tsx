export enum SkillLevel {
  NO_EXPERIENCE = 'No Experience',
  NOVICE = 'Novice',
  INTERMEDIATE = 'Intermediate',
  EXPERIENCED = 'Experienced',
  EXPERT = 'Expert',
}

export enum ProjectStatus {
  Planning = 'Planning',
  OnTrack = 'On Track',
  AtRisk = 'At Risk',
  Delayed = 'Delayed',
  Completed = 'Completed',
  OnHold = 'On Hold',
}

export enum Priority {
  Low = 'Low',
  Medium = 'Medium',
  High = 'High',
  Critical = 'Critical',
}

export interface Task {
  id: string;
  name: string;
  completed: boolean;
  priority: Priority;
  dueDate: string;
  startDate?: string;
  duration?: number;
}

export interface TeamMember {
  id: string;
  name: string;
  role: string;
  email: string;
  avatar?: string;
  avatarColor?: string;
}

export interface JournalEntry {
  id: string;
  date: string;
  content: string;
  author: string;
  type?: string;
}

export interface Project {
  id: string;
  name: string;
  description: string;
  status: ProjectStatus;
  progress: number;
  endDate: string;
  dueDate: string;
  priority: Priority;
  manager: string;
  teamSize: number;
  tasks: Task[];
  budget?: number;
  spent?: number;
  teamMembers?: TeamMember[];
  journal?: JournalEntry[];
}

export interface OnboardingData {
  name: string;
  skillLevel: SkillLevel | null;
  methodologies: string[];
  tools: string[];
}

export interface SearchResultItem {
  type: 'project' | 'task' | 'journal';
  data: any;
  project: Project;
}

export interface SearchResults {
  projects: SearchResultItem[];
  tasks: SearchResultItem[];
  journal: SearchResultItem[];
}
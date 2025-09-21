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
  OffTrack = 'Off Track',
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
  startDate?: string;    // Added for timeline support
  duration?: number;     // Added for timeline support (in days)
  assigneeId?: string;
  dependsOn?: string;
}

export interface TeamMember {
  id: string;
  name: string;
  role: string;
  email: string;
  avatar?: string;
}

export interface Project {
  id: string;
  name: string;
  description: string;
  status: ProjectStatus;
  progress: number;
  startDate?: string;    // Added for timeline support
  endDate: string;
  dueDate?: string;      // Added to fix Home.tsx and ProjectList.tsx errors
  priority: Priority;
  manager: string;
  teamSize: number;
  tasks: Task[];
  budget?: number;
  spent?: number;
  teamMembers?: TeamMember[];
}

export interface OnboardingData {
  skillLevel: SkillLevel | null;
  methodologies: string[];
  tools: string[];
  name: string;
}

export enum CommunicationType {
  StatusUpdate = 'Project Status Update',
  StakeholderUpdate = 'Stakeholder Update',
  TeamAnnouncement = 'Team Announcement',
  RiskAlert = 'Risk Alert',
  MilestoneUpdate = 'Milestone Update'
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

export interface AIResponse {
  content: string;
  type: 'text' | 'markdown';
}

export enum SkillLevel {
  NOVICE = 'Novice',
  INTERMEDIATE = 'Intermediate',
  EXPERIENCED = 'Experienced',
  EXPERT = 'Expert',
}

export interface OnboardingData {
  id: string;
  skillLevel: SkillLevel | null;
  methodologies: string[];
  tools: string[];
  name: string;
}

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
  dueDate: string;
  assigneeId?: string;
  dependsOn?: string;
}

export interface JournalEntry {
  id: string;
  date: string;
  content: string;
  type: 'user' | 'model' | 'system';
}

export interface Project {
  id: string;
  name: string;
  description: string;
  status: ProjectStatus;
  dueDate: string;
  progress: number;
  tasks: Task[];
  journal: JournalEntry[];
  aiHealthSummary?: string;
}

export type ProjectSearchResult = { type: 'project'; data: Project };
export type TaskSearchResult = { type: 'task'; data: Task; project: { id: string; name: string } };
export type JournalSearchResult = { type: 'journal'; data: JournalEntry; project: { id: string; name: string } };

export type SearchResultItem = ProjectSearchResult | TaskSearchResult | JournalSearchResult;

export interface SearchResults {
  projects: ProjectSearchResult[];
  tasks: TaskSearchResult[];
  journal: JournalSearchResult[];
}

export enum CommunicationType {
  StatusUpdate = 'Project Status Update',
  RiskEscalation = 'Risk Escalation',
  StakeholderUpdate = 'Stakeholder Update',
  MeetingFollowUp = 'Meeting Follow-Up',
}

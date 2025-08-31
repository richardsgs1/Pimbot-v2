
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
}

// New types for Projects
export enum ProjectStatus {
  OnTrack = 'On Track',
  AtRisk = 'At Risk',
  OffTrack = 'Off Track',
  Completed = 'Completed',
}

export interface Task {
  id: string;
  name: string;
  completed: boolean;
}

export interface Project {
  id: string;
  name: string;
  description: string;
  status: ProjectStatus;
  dueDate: string;
  progress: number; // 0-100
  tasks: Task[];
}

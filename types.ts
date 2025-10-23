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
  None = 'None',
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
  avatarColor?: string;  // Add this property
}

export interface JournalEntry {
  id: string;
  date: string;
  content: string;
  author: string;
  type?: string;  // Add this optional property
}

export interface Project {
  id: string;
  name: string;
  description: string;
  status: ProjectStatus;
  progress: number;
  startDate?: string;    // Added for timeline support
  endDate: string;
  dueDate: string;       // Made required to fix null/undefined issues
  priority: Priority;
  manager: string;
  teamSize: number;
  tasks: Task[];
  budget?: number;
  spent?: number;
  teamMembers?: TeamMember[];
  journal?: JournalEntry[];  // Add this property
  archived?: boolean;
}

export interface OnboardingData {
  id?: string;           // Added to fix App.tsx error
  name: string;
  email?: string
  skillLevel: SkillLevel | null;
  methodologies: string[];
  tools: string[];
  hasSeenPricing?: boolean;
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

// ============================================
// SUBSCRIPTION & BILLING TYPES
// ============================================

export type SubscriptionTier = 'trial' | 'starter' | 'pro' | 'team' | 'enterprise';
export type SubscriptionStatus = 'active' | 'trialing' | 'past_due' | 'canceled' | 'incomplete';

export interface UserSubscription {
  id: string;
  userId: string;
  tier: SubscriptionTier;
  status: SubscriptionStatus;
  stripeCustomerId?: string;
  stripeSubscriptionId?: string;
  currentPeriodStart: Date;
  currentPeriodEnd: Date;
  trialEndsAt?: Date;
  cancelAtPeriodEnd: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface UsageLimits {
  maxProjects: number;
  maxTeamMembers: number;
  maxStorage: number; // in MB
  maxAiQueries: number; // per day, -1 for unlimited
  allowedExports: ('pdf' | 'excel' | 'csv' | 'json')[];
  features: {
    advancedNotifications: boolean;
    customBranding: boolean;
    apiAccess: boolean;
    sso: boolean;
    whiteLabel: boolean;
  };
}

export interface UsageTracking {
  id: string;
  userId: string;
  date: string;
  aiQueriesCount: number;
  storageUsedMb: number;
  createdAt: Date;
}
import React from 'react';
import type { Project, Task, ProjectStatus, Priority, TeamMember } from '../types';
import { PROJECT_STATUS_VALUES, PRIORITY_VALUES, TaskStatus } from '../types';

export interface ProjectTemplate {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: string;
  estimatedDuration: string;
  defaultBudget?: number;
  tasks: Array<{
    name: string;
    priority: Priority;
    estimatedDays: number;
    description?: string;
  }>;
  teamRoles: Array<{
    role: string;
    description: string;
  }>;
  milestones?: string[];
}

export const projectTemplates: ProjectTemplate[] = [
  {
    id: 'blank',
    name: 'Blank Project',
    description: 'Start from scratch with a completely custom project',
    icon: '📋',
    category: 'Custom',
    estimatedDuration: 'Flexible',
    tasks: [],
    teamRoles: []
  },
  {
    id: 'website-redesign',
    name: 'Website Redesign',
    description: 'Complete overhaul of an existing website with modern design and functionality',
    icon: '🌐',
    category: 'Web Development',
    estimatedDuration: '2-3 months',
    defaultBudget: 50000,
    tasks: [
      { name: 'Stakeholder requirements gathering', priority: PRIORITY_VALUES.High, estimatedDays: 5 },
      { name: 'Competitive analysis and research', priority: PRIORITY_VALUES.Medium, estimatedDays: 3 },
      { name: 'Create wireframes and mockups', priority: PRIORITY_VALUES.High, estimatedDays: 10 },
      { name: 'Design review and approval', priority: PRIORITY_VALUES.High, estimatedDays: 3 },
      { name: 'Frontend development', priority: PRIORITY_VALUES.High, estimatedDays: 20 },
      { name: 'Backend integration', priority: PRIORITY_VALUES.High, estimatedDays: 15 },
      { name: 'Content migration', priority: PRIORITY_VALUES.Medium, estimatedDays: 7 },
      { name: 'SEO optimization', priority: PRIORITY_VALUES.Medium, estimatedDays: 5 },
      { name: 'Cross-browser testing', priority: PRIORITY_VALUES.High, estimatedDays: 5 },
      { name: 'User acceptance testing', priority: PRIORITY_VALUES.High, estimatedDays: 5 },
      { name: 'Launch and deployment', priority: PRIORITY_VALUES.High, estimatedDays: 2 }
    ],
    teamRoles: [
      { role: 'Project Manager', description: 'Oversees timeline and stakeholder communication' },
      { role: 'UX/UI Designer', description: 'Creates wireframes and visual design' },
      { role: 'Frontend Developer', description: 'Implements the user interface' },
      { role: 'Backend Developer', description: 'Handles server-side logic and APIs' },
      { role: 'QA Engineer', description: 'Tests functionality and user experience' }
    ],
    milestones: ['Design Approval', 'Development Complete', 'Testing Complete', 'Launch']
  },
  {
    id: 'mobile-app',
    name: 'Mobile App Development',
    description: 'Native iOS and Android application from concept to launch',
    icon: '📱',
    category: 'Mobile Development',
    estimatedDuration: '4-6 months',
    defaultBudget: 120000,
    tasks: [
      { name: 'Market research and validation', priority: PRIORITY_VALUES.High, estimatedDays: 7 },
      { name: 'Define feature requirements', priority: PRIORITY_VALUES.High, estimatedDays: 5 },
      { name: 'Create user flows and information architecture', priority: PRIORITY_VALUES.High, estimatedDays: 7 },
      { name: 'UI/UX design for all screens', priority: PRIORITY_VALUES.High, estimatedDays: 15 },
      { name: 'Design system and style guide', priority: PRIORITY_VALUES.Medium, estimatedDays: 5 },
      { name: 'Backend API development', priority: PRIORITY_VALUES.High, estimatedDays: 25 },
      { name: 'iOS app development', priority: PRIORITY_VALUES.High, estimatedDays: 30 },
      { name: 'Android app development', priority: PRIORITY_VALUES.High, estimatedDays: 30 },
      { name: 'Push notifications setup', priority: PRIORITY_VALUES.Medium, estimatedDays: 3 },
      { name: 'Analytics integration', priority: PRIORITY_VALUES.Medium, estimatedDays: 3 },
      { name: 'Beta testing program', priority: PRIORITY_VALUES.High, estimatedDays: 10 },
      { name: 'Bug fixes and refinements', priority: PRIORITY_VALUES.High, estimatedDays: 10 },
      { name: 'App Store submission and approval', priority: PRIORITY_VALUES.High, estimatedDays: 7 },
      { name: 'Launch marketing materials', priority: PRIORITY_VALUES.Medium, estimatedDays: 5 }
    ],
    teamRoles: [
      { role: 'Product Manager', description: 'Defines product vision and requirements' },
      { role: 'UI/UX Designer', description: 'Designs the user experience and interface' },
      { role: 'iOS Developer', description: 'Builds the iOS application' },
      { role: 'Android Developer', description: 'Builds the Android application' },
      { role: 'Backend Developer', description: 'Develops APIs and server infrastructure' },
      { role: 'QA Engineer', description: 'Tests on multiple devices and scenarios' }
    ],
    milestones: ['Design Complete', 'Beta Release', 'App Store Approval', 'Public Launch']
  },
  {
    id: 'marketing-campaign',
    name: 'Marketing Campaign',
    description: 'Multi-channel marketing campaign from strategy to execution',
    icon: '📢',
    category: 'Marketing',
    estimatedDuration: '6-8 weeks',
    defaultBudget: 30000,
    tasks: [
      { name: 'Define campaign goals and KPIs', priority: PRIORITY_VALUES.High, estimatedDays: 2 },
      { name: 'Audience research and segmentation', priority: PRIORITY_VALUES.High, estimatedDays: 3 },
      { name: 'Competitive analysis', priority: PRIORITY_VALUES.Medium, estimatedDays: 2 },
      { name: 'Develop campaign messaging and positioning', priority: PRIORITY_VALUES.High, estimatedDays: 3 },
      { name: 'Create content calendar', priority: PRIORITY_VALUES.High, estimatedDays: 2 },
      { name: 'Design visual assets', priority: PRIORITY_VALUES.High, estimatedDays: 7 },
      { name: 'Write copy for all channels', priority: PRIORITY_VALUES.High, estimatedDays: 5 },
      { name: 'Set up email marketing sequences', priority: PRIORITY_VALUES.Medium, estimatedDays: 3 },
      { name: 'Configure social media ads', priority: PRIORITY_VALUES.High, estimatedDays: 3 },
      { name: 'Set up tracking and analytics', priority: PRIORITY_VALUES.High, estimatedDays: 2 },
      { name: 'Launch campaign', priority: PRIORITY_VALUES.High, estimatedDays: 1 },
      { name: 'Monitor and optimize performance', priority: PRIORITY_VALUES.High, estimatedDays: 14 },
      { name: 'Create final performance report', priority: PRIORITY_VALUES.Medium, estimatedDays: 2 }
    ],
    teamRoles: [
      { role: 'Marketing Manager', description: 'Oversees strategy and execution' },
      { role: 'Content Writer', description: 'Creates copy for all channels' },
      { role: 'Graphic Designer', description: 'Designs visual assets and creatives' },
      { role: 'Social Media Manager', description: 'Manages social channels and engagement' },
      { role: 'Analytics Specialist', description: 'Tracks and reports on performance' }
    ],
    milestones: ['Strategy Approval', 'Content Complete', 'Campaign Launch', 'Campaign End']
  },
  {
    id: 'product-launch',
    name: 'Product Launch',
    description: 'Go-to-market strategy and execution for a new product',
    icon: '🚀',
    category: 'Product',
    estimatedDuration: '3 months',
    defaultBudget: 75000,
    tasks: [
      { name: 'Define product positioning and messaging', priority: PRIORITY_VALUES.High, estimatedDays: 5 },
      { name: 'Identify target audience segments', priority: PRIORITY_VALUES.High, estimatedDays: 3 },
      { name: 'Develop pricing strategy', priority: PRIORITY_VALUES.High, estimatedDays: 3 },
      { name: 'Create launch timeline and milestones', priority: PRIORITY_VALUES.High, estimatedDays: 2 },
      { name: 'Build product landing page', priority: PRIORITY_VALUES.High, estimatedDays: 10 },
      { name: 'Create demo videos and screenshots', priority: PRIORITY_VALUES.Medium, estimatedDays: 5 },
      { name: 'Write press release', priority: PRIORITY_VALUES.Medium, estimatedDays: 2 },
      { name: 'Prepare sales enablement materials', priority: PRIORITY_VALUES.High, estimatedDays: 5 },
      { name: 'Set up customer support system', priority: PRIORITY_VALUES.High, estimatedDays: 5 },
      { name: 'Create onboarding experience', priority: PRIORITY_VALUES.High, estimatedDays: 7 },
      { name: 'Beta program with early customers', priority: PRIORITY_VALUES.High, estimatedDays: 14 },
      { name: 'PR and media outreach', priority: PRIORITY_VALUES.Medium, estimatedDays: 7 },
      { name: 'Launch day coordination', priority: PRIORITY_VALUES.High, estimatedDays: 1 },
      { name: 'Post-launch monitoring and support', priority: PRIORITY_VALUES.High, estimatedDays: 7 },
      { name: 'Gather and analyze launch metrics', priority: PRIORITY_VALUES.Medium, estimatedDays: 3 }
    ],
    teamRoles: [
      { role: 'Product Manager', description: 'Leads launch strategy and execution' },
      { role: 'Marketing Manager', description: 'Drives awareness and demand generation' },
      { role: 'Sales Manager', description: 'Prepares sales team and closes early deals' },
      { role: 'Customer Success Manager', description: 'Ensures smooth onboarding' },
      { role: 'Developer', description: 'Handles technical setup and integrations' }
    ],
    milestones: ['Beta Launch', 'Marketing Assets Complete', 'Public Launch', '30-Day Review']
  },
  {
    id: 'event-planning',
    name: 'Event Planning',
    description: 'Corporate event or conference from planning to execution',
    icon: '🎉',
    category: 'Events',
    estimatedDuration: '2-4 months',
    defaultBudget: 40000,
    tasks: [
      { name: 'Define event goals and success metrics', priority: PRIORITY_VALUES.High, estimatedDays: 2 },
      { name: 'Set budget and get approval', priority: PRIORITY_VALUES.High, estimatedDays: 2 },
      { name: 'Select and book venue', priority: PRIORITY_VALUES.High, estimatedDays: 5 },
      { name: 'Create event brand and theme', priority: PRIORITY_VALUES.Medium, estimatedDays: 3 },
      { name: 'Build event website and registration', priority: PRIORITY_VALUES.High, estimatedDays: 7 },
      { name: 'Book speakers and entertainment', priority: PRIORITY_VALUES.High, estimatedDays: 10 },
      { name: 'Arrange catering and menu', priority: PRIORITY_VALUES.Medium, estimatedDays: 3 },
      { name: 'Plan AV and technical requirements', priority: PRIORITY_VALUES.High, estimatedDays: 3 },
      { name: 'Create promotional materials', priority: PRIORITY_VALUES.Medium, estimatedDays: 5 },
      { name: 'Launch ticket sales and marketing', priority: PRIORITY_VALUES.High, estimatedDays: 2 },
      { name: 'Coordinate vendor contracts', priority: PRIORITY_VALUES.Medium, estimatedDays: 5 },
      { name: 'Create event schedule and agenda', priority: PRIORITY_VALUES.High, estimatedDays: 3 },
      { name: 'Plan day-of logistics and staffing', priority: PRIORITY_VALUES.High, estimatedDays: 3 },
      { name: 'Event day execution', priority: PRIORITY_VALUES.High, estimatedDays: 1 },
      { name: 'Post-event survey and analysis', priority: PRIORITY_VALUES.Medium, estimatedDays: 3 }
    ],
    teamRoles: [
      { role: 'Event Manager', description: 'Oversees all aspects of planning and execution' },
      { role: 'Marketing Coordinator', description: 'Promotes event and drives registrations' },
      { role: 'Logistics Coordinator', description: 'Handles venue, vendors, and operations' },
      { role: 'Content Manager', description: 'Manages speakers and agenda content' },
      { role: 'Volunteer Coordinator', description: 'Recruits and manages event staff' }
    ],
    milestones: ['Venue Secured', 'Ticket Sales Launch', 'Event Day', 'Post-Event Report']
  }
];

// Helper function to create a project from a template
export const createProjectFromTemplate = (
  template: ProjectTemplate,
  customName?: string,
  startDate?: string
): Partial<Project> => {
  const today = startDate || new Date().toISOString().split('T')[0];
  const start = new Date(today);
  
  // Calculate end date based on total estimated days
  const totalDays = template.tasks.reduce((sum, task) => sum + task.estimatedDays, 0);
  const end = new Date(start);
  end.setDate(end.getDate() + totalDays);
  
  // Create tasks with calculated dates
  let currentDate = new Date(start);
  const now = new Date().toISOString();
  const tasks: Task[] = template.tasks.map((taskTemplate, index) => {
    const taskStart = new Date(currentDate);
    const taskEnd = new Date(currentDate);
    taskEnd.setDate(taskEnd.getDate() + taskTemplate.estimatedDays);
    
    const task: Task = {
      id: `task-${Date.now()}-${index}`,
      name: taskTemplate.name,
      description: taskTemplate.description || '',
      completed: false,
      status: TaskStatus.ToDo,
      priority: taskTemplate.priority,
      dueDate: taskEnd.toISOString().split('T')[0],
      startDate: taskStart.toISOString().split('T')[0],
      assignees: [],
      attachments: [],
      createdAt: now,
      updatedAt: now
    };
    
    // Move to next task start date
    currentDate = new Date(taskEnd);
    currentDate.setDate(currentDate.getDate() + 1);
    
    return task;
  });
  
  return {
    name: customName || template.name,
    description: template.description,
    status: PROJECT_STATUS_VALUES.OnTrack,
    progress: 0,
    startDate: today,
    endDate: end.toISOString().split('T')[0],
    dueDate: end.toISOString().split('T')[0],
    priority: PRIORITY_VALUES.Medium,
    manager: '',
    tasks: tasks,
    budget: template.defaultBudget,
    spent: 0,
    teamMembers: [] as TeamMember[],
    attachments: [],
    createdAt: now,
    updatedAt: now
  };
};
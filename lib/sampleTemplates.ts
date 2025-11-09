import type { TaskTemplate } from '../types';
import { generateUUID } from './utils';

/**
 * Sample task templates for common scenarios
 * These are seeded on first login to help users understand how templates work
 */
export const SAMPLE_TASK_TEMPLATES: Omit<TaskTemplate, 'id' | 'userId' | 'createdAt' | 'updatedAt'>[] = [
  {
    name: 'Code Review',
    description: 'Review pull request code for quality, best practices, and potential bugs',
    category: 'Development',
    defaultPriority: 'High',
    defaultEstimatedHours: 2,
    subtasks: [
      { id: generateUUID(), title: 'Check code functionality', completed: false },
      { id: generateUUID(), title: 'Review for security issues', completed: false },
      { id: generateUUID(), title: 'Verify test coverage', completed: false },
      { id: generateUUID(), title: 'Provide feedback', completed: false }
    ],
    defaultAssignees: [],
    tags: ['review', 'qa', 'development']
  },
  {
    name: 'Sprint Planning',
    description: 'Plan and prioritize tasks for the upcoming sprint',
    category: 'Planning',
    defaultPriority: 'High',
    defaultEstimatedHours: 3,
    subtasks: [
      { id: generateUUID(), title: 'Review backlog items', completed: false },
      { id: generateUUID(), title: 'Estimate story points', completed: false },
      { id: generateUUID(), title: 'Assign tasks to team members', completed: false },
      { id: generateUUID(), title: 'Set sprint goals', completed: false },
      { id: generateUUID(), title: 'Create sprint board', completed: false }
    ],
    defaultAssignees: [],
    tags: ['agile', 'planning', 'sprint']
  },
  {
    name: 'Bug Fix',
    description: 'Investigate and fix reported bug in the codebase',
    category: 'Development',
    defaultPriority: 'High',
    defaultEstimatedHours: 4,
    subtasks: [
      { id: generateUUID(), title: 'Reproduce the bug', completed: false },
      { id: generateUUID(), title: 'Identify root cause', completed: false },
      { id: generateUUID(), title: 'Implement fix', completed: false },
      { id: generateUUID(), title: 'Write/update tests', completed: false },
      { id: generateUUID(), title: 'Test the fix', completed: false },
      { id: generateUUID(), title: 'Submit for review', completed: false }
    ],
    defaultAssignees: [],
    tags: ['bug', 'development', 'urgent']
  },
  {
    name: 'Design Review',
    description: 'Review design mockups and provide feedback',
    category: 'Design',
    defaultPriority: 'Medium',
    defaultEstimatedHours: 1.5,
    subtasks: [
      { id: generateUUID(), title: 'Review visual design', completed: false },
      { id: generateUUID(), title: 'Check usability', completed: false },
      { id: generateUUID(), title: 'Verify brand compliance', completed: false },
      { id: generateUUID(), title: 'Provide constructive feedback', completed: false }
    ],
    defaultAssignees: [],
    tags: ['design', 'ux', 'review']
  },
  {
    name: 'Documentation Update',
    description: 'Update or create documentation for feature or system',
    category: 'Documentation',
    defaultPriority: 'Medium',
    defaultEstimatedHours: 2,
    subtasks: [
      { id: generateUUID(), title: 'Gather information', completed: false },
      { id: generateUUID(), title: 'Write content', completed: false },
      { id: generateUUID(), title: 'Add examples/diagrams', completed: false },
      { id: generateUUID(), title: 'Proofread', completed: false },
      { id: generateUUID(), title: 'Get approval', completed: false }
    ],
    defaultAssignees: [],
    tags: ['documentation', 'communication']
  },
  {
    name: 'Team Standup',
    description: 'Daily standup meeting - share progress and blockers',
    category: 'Communication',
    defaultPriority: 'Medium',
    defaultEstimatedHours: 0.25,
    subtasks: [
      { id: generateUUID(), title: 'Share completed work', completed: false },
      { id: generateUUID(), title: 'Discuss current tasks', completed: false },
      { id: generateUUID(), title: 'Identify blockers', completed: false },
      { id: generateUUID(), title: 'Plan next steps', completed: false }
    ],
    defaultAssignees: [],
    tags: ['standup', 'meeting', 'communication']
  },
  {
    name: 'Feature Implementation',
    description: 'Implement new feature from requirements to deployment',
    category: 'Development',
    defaultPriority: 'Medium',
    defaultEstimatedHours: 8,
    subtasks: [
      { id: generateUUID(), title: 'Review requirements', completed: false },
      { id: generateUUID(), title: 'Design architecture', completed: false },
      { id: generateUUID(), title: 'Implement feature', completed: false },
      { id: generateUUID(), title: 'Write unit tests', completed: false },
      { id: generateUUID(), title: 'Create integration tests', completed: false },
      { id: generateUUID(), title: 'Code review', completed: false },
      { id: generateUUID(), title: 'Deploy to staging', completed: false },
      { id: generateUUID(), title: 'Verify in production', completed: false }
    ],
    defaultAssignees: [],
    tags: ['feature', 'development', 'implementation']
  },
  {
    name: 'Weekly Report',
    description: 'Prepare weekly status report for stakeholders',
    category: 'Communication',
    defaultPriority: 'Medium',
    defaultEstimatedHours: 1,
    subtasks: [
      { id: generateUUID(), title: 'Compile achievements', completed: false },
      { id: generateUUID(), title: 'Document metrics', completed: false },
      { id: generateUUID(), title: 'Note blockers/risks', completed: false },
      { id: generateUUID(), title: 'Add next week plan', completed: false },
      { id: generateUUID(), title: 'Format and send', completed: false }
    ],
    defaultAssignees: [],
    tags: ['reporting', 'communication', 'status']
  },
  {
    name: 'Performance Optimization',
    description: 'Analyze and optimize system/application performance',
    category: 'Development',
    defaultPriority: 'Medium',
    defaultEstimatedHours: 6,
    subtasks: [
      { id: generateUUID(), title: 'Profile application', completed: false },
      { id: generateUUID(), title: 'Identify bottlenecks', completed: false },
      { id: generateUUID(), title: 'Implement optimizations', completed: false },
      { id: generateUUID(), title: 'Benchmark improvements', completed: false },
      { id: generateUUID(), title: 'Document changes', completed: false }
    ],
    defaultAssignees: [],
    tags: ['optimization', 'performance', 'development']
  },
  {
    name: 'Client Presentation',
    description: 'Prepare and deliver presentation to client',
    category: 'Communication',
    defaultPriority: 'High',
    defaultEstimatedHours: 4,
    subtasks: [
      { id: generateUUID(), title: 'Gather content and data', completed: false },
      { id: generateUUID(), title: 'Create slides', completed: false },
      { id: generateUUID(), title: 'Practice presentation', completed: false },
      { id: generateUUID(), title: 'Prepare Q&A responses', completed: false },
      { id: generateUUID(), title: 'Deliver presentation', completed: false },
      { id: generateUUID(), title: 'Follow up with client', completed: false }
    ],
    defaultAssignees: [],
    tags: ['presentation', 'client', 'communication']
  }
];

/**
 * Initialize sample templates for a new user
 * Creates a one-time seed of templates to help users understand the feature
 */
export async function initializeSampleTemplates(
  userId: string,
  templateService: any
): Promise<void> {
  try {
    // Check if user already has templates
    const existingTemplates = await templateService.loadTemplates(userId);

    // Only seed if user has no templates (first time)
    if (existingTemplates.length === 0) {
      console.log('Seeding sample templates for new user...');

      // Save each sample template
      for (const template of SAMPLE_TASK_TEMPLATES) {
        try {
          await templateService.saveTemplate(userId, template);
        } catch (error) {
          console.warn(`Failed to save sample template "${template.name}":`, error);
          // Continue with next template even if one fails
        }
      }

      console.log(`Successfully seeded ${SAMPLE_TASK_TEMPLATES.length} sample templates`);
    }
  } catch (error) {
    console.error('Error initializing sample templates:', error);
    // Don't throw - this is non-critical initialization
  }
}
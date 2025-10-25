import type { Project, Task, ProjectStatus, Priority } from '../types';
import { PROJECT_STATUS_VALUES, PRIORITY_VALUES } from '../types';

export interface DetectedIntent {
  type: 'create-task' | 'update-status' | 'assign-task' | 'update-progress' | 'add-budget' | 'none';
  confidence: number;
  data: {
    taskName?: string;
    projectName?: string;
    projectId?: string;
    status?: ProjectStatus;
    assignee?: string;
    priority?: Priority;
    dueDate?: string;
    progress?: number;
    budget?: number;
  };
  rawText: string;
}

export class IntentDetector {
  private projects: Project[];

  constructor(projects: Project[]) {
    this.projects = projects;
  }

  // Main detection method
  detect(message: string): DetectedIntent {
    const lowerMessage = message.toLowerCase();

    // Check each intent type in order of specificity
    const updateStatusIntent = this.detectUpdateStatus(message, lowerMessage);
    if (updateStatusIntent.confidence > 0.7) return updateStatusIntent;

    const assignTaskIntent = this.detectAssignTask(message, lowerMessage);
    if (assignTaskIntent.confidence > 0.7) return assignTaskIntent;

    const createTaskIntent = this.detectCreateTask(message, lowerMessage);
    if (createTaskIntent.confidence > 0.7) return createTaskIntent;

    const updateProgressIntent = this.detectUpdateProgress(message, lowerMessage);
    if (updateProgressIntent.confidence > 0.7) return updateProgressIntent;

    const addBudgetIntent = this.detectAddBudget(message, lowerMessage);
    if (addBudgetIntent.confidence > 0.7) return addBudgetIntent;

    return {
      type: 'none',
      confidence: 0,
      data: {},
      rawText: message
    };
  }

  // Detect "create task" intent
  private detectCreateTask(message: string, lowerMessage: string): DetectedIntent {
    const createTaskPatterns = [
      /(?:create|add|make|new)\s+(?:a\s+)?task/i,
      /(?:add|create)\s+(?:a\s+)?(?:new\s+)?task\s+(?:called|named|for)/i,
      /task:\s*(.+)/i,
      /(?:can you|please)\s+(?:create|add)\s+(?:a\s+)?task/i
    ];

    let confidence = 0;
    let taskName = '';
    let projectName = '';
    let projectId = '';
    let priority = PRIORITY_VALUES.Medium;
    let dueDate = '';

    // Check patterns
    for (const pattern of createTaskPatterns) {
      if (pattern.test(lowerMessage)) {
        confidence += 0.3;
      }
    }

    // Extract task name
    const taskNameMatch = message.match(/(?:task|todo)\s+(?:called|named|for|to|:)\s*["']?([^"'\.]+)["']?/i);
    if (taskNameMatch) {
      taskName = taskNameMatch[1].trim();
      confidence += 0.3;
    }

    // Extract project name
    const projectMatch = message.match(/(?:for|in|on|to)\s+(?:the\s+)?(?:project\s+)?["']?([^"'\.]+)["']?\s+project/i);
    if (projectMatch) {
      projectName = projectMatch[1].trim();
      const project = this.findProject(projectName);
      if (project) {
        projectId = project.id;
        confidence += 0.2;
      }
    }

    // Extract priority
    if (lowerMessage.includes('high priority') || lowerMessage.includes('urgent') || lowerMessage.includes('important') || lowerMessage.includes('critical')) {
      priority = PRIORITY_VALUES.High;
      confidence += 0.1;
    } else if (lowerMessage.includes('low priority')) {
      priority = PRIORITY_VALUES.Low;
    }

    // Extract due date
    const dateMatch = this.extractDate(message);
    if (dateMatch) {
      dueDate = dateMatch;
      confidence += 0.1;
    }

    return {
      type: 'create-task',
      confidence: Math.min(confidence, 1),
      data: { taskName, projectName, projectId, priority, dueDate },
      rawText: message
    };
  }

  // Detect "update status" intent
  private detectUpdateStatus(message: string, lowerMessage: string): DetectedIntent {
    const updateStatusPatterns = [
      /(?:update|change|set|mark)\s+(?:the\s+)?(?:project\s+)?status/i,
      /(?:mark|set)\s+(?:project\s+)?(?:as|to)\s+(?:on track|at risk|off track|completed)/i,
      /(?:project\s+)?(?:is\s+now|became)\s+(?:on track|at risk|off track|completed)/i,
      /status\s+(?:to|as|is)\s+(?:on track|at risk|off track|completed)/i
    ];

    let confidence = 0;
    let projectName = '';
    let projectId = '';
    let status: ProjectStatus | undefined;

    // Check patterns
    for (const pattern of updateStatusPatterns) {
      if (pattern.test(lowerMessage)) {
        confidence += 0.4;
      }
    }

    // Extract status
    if (lowerMessage.includes('on track')) {
      status = PROJECT_STATUS_VALUES.InProgress;
      confidence += 0.3;
    } else if (lowerMessage.includes('at risk')) {
      status = PROJECT_STATUS_VALUES.AtRisk;
      confidence += 0.3;
    } else if (lowerMessage.includes('off track') || lowerMessage.includes('on hold')) {
      status = PROJECT_STATUS_VALUES.OnHold;
      confidence += 0.3;
    } else if (lowerMessage.includes('completed') || lowerMessage.includes('complete')) {
      status = PROJECT_STATUS_VALUES.Completed;
      confidence += 0.3;
    }

    // Extract project name
    const projectMatch = message.match(/(?:for|in|on|to)\s+(?:the\s+)?["']?([^"'\.]+?)["']?\s+(?:project|to)/i);
    if (projectMatch) {
      projectName = projectMatch[1].trim();
      const project = this.findProject(projectName);
      if (project) {
        projectId = project.id;
        confidence += 0.2;
      }
    } else {
      // Try to find project name at the start
      const startMatch = message.match(/^["']?([^"'\.]+?)["']?\s+(?:is|status|project)/i);
      if (startMatch) {
        projectName = startMatch[1].trim();
        const project = this.findProject(projectName);
        if (project) {
          projectId = project.id;
          confidence += 0.2;
        }
      }
    }

    return {
      type: 'update-status',
      confidence: Math.min(confidence, 1),
      data: { projectName, projectId, status },
      rawText: message
    };
  }

  // Detect "assign task" intent
  private detectAssignTask(message: string, lowerMessage: string): DetectedIntent {
    const assignTaskPatterns = [
      /(?:assign|give)\s+(?:the\s+)?task/i,
      /(?:assign|allocate)\s+(?:this|that)\s+to/i,
      /(?:can|could)\s+you\s+assign/i,
      /task\s+(?:to|for)\s+(\w+)/i
    ];

    let confidence = 0;
    let taskName = '';
    let assignee = '';
    let projectName = '';
    let projectId = '';

    // Check patterns
    for (const pattern of assignTaskPatterns) {
      if (pattern.test(lowerMessage)) {
        confidence += 0.4;
      }
    }

    // Extract assignee
    const assigneeMatch = message.match(/(?:to|for)\s+(\w+(?:\s+\w+)?)/i);
    if (assigneeMatch) {
      assignee = assigneeMatch[1].trim();
      confidence += 0.3;
    }

    // Extract task name
    const taskMatch = message.match(/(?:task|todo)\s+["']?([^"'\.]+?)["']?\s+to/i);
    if (taskMatch) {
      taskName = taskMatch[1].trim();
      confidence += 0.2;
    }

    // Extract project
    const projectMatch = message.match(/(?:in|on|for)\s+(?:the\s+)?["']?([^"'\.]+?)["']?\s+project/i);
    if (projectMatch) {
      projectName = projectMatch[1].trim();
      const project = this.findProject(projectName);
      if (project) {
        projectId = project.id;
        confidence += 0.1;
      }
    }

    return {
      type: 'assign-task',
      confidence: Math.min(confidence, 1),
      data: { taskName, assignee, projectName, projectId },
      rawText: message
    };
  }

  // Detect "update progress" intent
  private detectUpdateProgress(message: string, lowerMessage: string): DetectedIntent {
    const progressPatterns = [
      /(?:update|set|change)\s+(?:the\s+)?progress/i,
      /progress\s+(?:is|to)\s+(\d+)%?/i,
      /(\d+)%?\s+(?:complete|done|finished)/i,
      /(?:mark|set)\s+(?:as\s+)?(\d+)%/i
    ];

    let confidence = 0;
    let projectName = '';
    let projectId = '';
    let progress = 0;

    // Check patterns
    for (const pattern of progressPatterns) {
      const match = message.match(pattern);
      if (match) {
        confidence += 0.3;
        // Try to extract progress number
        const numMatch = message.match(/(\d+)%?/);
        if (numMatch) {
          progress = parseInt(numMatch[1]);
          confidence += 0.3;
        }
      }
    }

    // Extract project name
    const projectMatch = message.match(/(?:for|in|on)\s+(?:the\s+)?["']?([^"'\.]+?)["']?\s+project/i);
    if (projectMatch) {
      projectName = projectMatch[1].trim();
      const project = this.findProject(projectName);
      if (project) {
        projectId = project.id;
        confidence += 0.2;
      }
    }

    return {
      type: 'update-progress',
      confidence: Math.min(confidence, 1),
      data: { projectName, projectId, progress },
      rawText: message
    };
  }

  // Detect "add budget" intent
  private detectAddBudget(message: string, lowerMessage: string): DetectedIntent {
    const budgetPatterns = [
      /(?:set|add|update)\s+(?:the\s+)?budget/i,
      /budget\s+(?:is|to)\s+\$?(\d+)/i,
      /\$(\d+)\s+budget/i
    ];

    let confidence = 0;
    let projectName = '';
    let projectId = '';
    let budget = 0;

    // Check patterns
    for (const pattern of budgetPatterns) {
      const match = message.match(pattern);
      if (match) {
        confidence += 0.3;
      }
    }

    // Extract budget amount
    const budgetMatch = message.match(/\$?(\d+(?:,\d{3})*(?:\.\d{2})?)/);
    if (budgetMatch) {
      budget = parseInt(budgetMatch[1].replace(/,/g, ''));
      confidence += 0.4;
    }

    // Extract project name
    const projectMatch = message.match(/(?:for|in|on)\s+(?:the\s+)?["']?([^"'\.]+?)["']?\s+project/i);
    if (projectMatch) {
      projectName = projectMatch[1].trim();
      const project = this.findProject(projectName);
      if (project) {
        projectId = project.id;
        confidence += 0.2;
      }
    }

    return {
      type: 'add-budget',
      confidence: Math.min(confidence, 1),
      data: { projectName, projectId, budget },
      rawText: message
    };
  }

  // Helper: Find project by name (fuzzy matching)
  private findProject(name: string): Project | undefined {
    const lowerName = name.toLowerCase();
    
    // Exact match
    let project = this.projects.find(p => p.name.toLowerCase() === lowerName);
    if (project) return project;

    // Partial match
    project = this.projects.find(p => 
      p.name.toLowerCase().includes(lowerName) || 
      lowerName.includes(p.name.toLowerCase())
    );
    return project;
  }

  // Helper: Extract date from text
  private extractDate(message: string): string | null {
    const today = new Date();
    
    // Check for relative dates
    if (/today/i.test(message)) {
      return today.toISOString().split('T')[0];
    }
    if (/tomorrow/i.test(message)) {
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);
      return tomorrow.toISOString().split('T')[0];
    }
    if (/next week/i.test(message)) {
      const nextWeek = new Date(today);
      nextWeek.setDate(nextWeek.getDate() + 7);
      return nextWeek.toISOString().split('T')[0];
    }
    
    // Check for "in X days"
    const inDaysMatch = message.match(/in\s+(\d+)\s+days?/i);
    if (inDaysMatch) {
      const days = parseInt(inDaysMatch[1]);
      const future = new Date(today);
      future.setDate(future.getDate() + days);
      return future.toISOString().split('T')[0];
    }

    // Check for specific date formats
    const dateMatch = message.match(/(\d{4}-\d{2}-\d{2})/);
    if (dateMatch) {
      return dateMatch[1];
    }

    return null;
  }

  // Auto-suggest updates based on conversation context
  static generateSuggestions(projects: Project[]): string[] {
    const suggestions: string[] = [];

    projects.forEach(project => {
      // Suggest status updates for at-risk projects
      if (project.status === PROJECT_STATUS_VALUES.AtRisk) {
        suggestions.push(`Update status for ${project.name} to On Track`);
      }

      // Suggest progress updates for stalled projects
      const daysSinceStart = project.startDate 
        ? Math.floor((Date.now() - new Date(project.startDate).getTime()) / (1000 * 60 * 60 * 24))
        : 0;
      const expectedProgress = project.startDate && project.dueDate
        ? Math.min(100, (daysSinceStart / Math.ceil((new Date(project.dueDate).getTime() - new Date(project.startDate).getTime()) / (1000 * 60 * 60 * 24))) * 100)
        : 50;
      
      if (expectedProgress - project.progress > 20) {
        suggestions.push(`Update progress for ${project.name} to ${Math.floor(expectedProgress)}%`);
      }

      // Suggest task creation for projects with few tasks
      if (project.tasks.length < 3) {
        suggestions.push(`Add tasks to ${project.name}`);
      }

      // Suggest budget updates
      if (!project.budget) {
        suggestions.push(`Set budget for ${project.name}`);
      }
    });

    return suggestions.slice(0, 5); // Return top 5 suggestions
  }
}

export default IntentDetector;
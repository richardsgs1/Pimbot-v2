// lib/TaskMetadataExtractor.ts
// Extract task metadata from natural language

import type { Project } from '../types';
import { Priority } from '../types';
import { DateParser } from './DateParser';

export interface ExtractedTaskData {
  taskName: string;
  priority: Priority;
  dueDate: string | null;
  assignee: string | null;
  projectName: string | null;
  confidence: number;
}

export class TaskMetadataExtractor {
  /**
   * Extract complete task metadata from natural language input
   */
  static extract(input: string, projects: Project[]): ExtractedTaskData {
    const lowerInput = input.toLowerCase();
    
    return {
      taskName: this.extractTaskName(input),
      priority: this.extractPriority(lowerInput),
      dueDate: this.extractDueDate(lowerInput),
      assignee: this.extractAssignee(lowerInput, projects),
      projectName: this.extractProjectName(lowerInput, projects),
      confidence: this.calculateConfidence(input)
    };
  }

  /**
   * Extract task name by removing metadata keywords
   */
  private static extractTaskName(input: string): string {
    let taskName = input;

    // Remove trigger words
    const triggers = [
      /^create\s+(?:a\s+)?(?:new\s+)?task\s+(?:for\s+)?/i,
      /^add\s+(?:a\s+)?(?:new\s+)?task\s+(?:for\s+)?/i,
      /^new\s+task\s+(?:for\s+)?/i,
      /^task:\s*/i
    ];

    triggers.forEach(trigger => {
      taskName = taskName.replace(trigger, '');
    });

    // Remove priority keywords
    taskName = taskName.replace(/\b(urgent|critical|high\s+priority|low\s+priority|medium\s+priority)\b/gi, '');

    // Remove date phrases
    const datePhrases = DateParser.extractDatePhrases(taskName);
    datePhrases.forEach(phrase => {
      taskName = taskName.replace(new RegExp(phrase, 'gi'), '');
    });
    
    // Remove "due" keyword
    taskName = taskName.replace(/\bdue\b/gi, '');

    // Remove assignee mentions
    taskName = taskName.replace(/\b(?:assign(?:ed)?\s+to|for)\s+@?\w+/gi, '');
    
    // Remove project mentions
    taskName = taskName.replace(/\b(?:in|for)\s+project\s+\w+/gi, '');

    // Clean up extra whitespace
    taskName = taskName.trim().replace(/\s+/g, ' ');

    // Capitalize first letter
    if (taskName.length > 0) {
      taskName = taskName.charAt(0).toUpperCase() + taskName.slice(1);
    }

    return taskName || 'Untitled Task';
  }

  /**
   * Extract priority from text
   */
  private static extractPriority(lowerInput: string): Priority {
    // Priority keywords mapping
    const priorityMap: { [key: string]: Priority } = {
      'critical': Priority.Critical,
      'urgent': Priority.Critical,
      'asap': Priority.Critical,
      'high priority': Priority.High,
      'high': Priority.High,
      'important': Priority.High,
      'medium priority': Priority.Medium,
      'medium': Priority.Medium,
      'normal': Priority.Medium,
      'low priority': Priority.Low,
      'low': Priority.Low,
      'minor': Priority.Low
    };

    // Check for priority keywords
    for (const [keyword, priority] of Object.entries(priorityMap)) {
      if (lowerInput.includes(keyword)) {
        return priority;
      }
    }

    // Default priority
    return Priority.Medium;
  }

  /**
   * Extract due date from text
   */
  private static extractDueDate(lowerInput: string): string | null {
    // Look for "due" keyword followed by date
    const dueMatch = lowerInput.match(/due\s+(.+?)(?:\s+assign|\s+for|\s+in\s+project|$)/);
    if (dueMatch) {
      const dateStr = dueMatch[1].trim();
      const parsed = DateParser.parse(dateStr);
      if (parsed) return parsed;
    }

    // Try to find any date phrase in the text
    const datePhrases = DateParser.extractDatePhrases(lowerInput);
    if (datePhrases.length > 0) {
      const parsed = DateParser.parse(datePhrases[0]);
      if (parsed) return parsed;
    }

    return null;
  }

  /**
   * Extract assignee name from text
   */
  private static extractAssignee(lowerInput: string, projects: Project[]): string | null {
    // Extract all team members from all projects
    const allTeamMembers = projects.flatMap(p => p.teamMembers || []);
    
    // Look for "assign to X" or "for X" patterns
    const assignPatterns = [
      /assign(?:ed)?\s+to\s+@?(\w+(?:\s+\w+)?)/,
      /\bfor\s+@?(\w+(?:\s+\w+)?)/,
      /@(\w+(?:\s+\w+)?)/
    ];

    for (const pattern of assignPatterns) {
      const match = lowerInput.match(pattern);
      if (match) {
        const mentionedName = match[1].toLowerCase();
        
        // Try to find matching team member (fuzzy match)
        const matchedMember = allTeamMembers.find(member => 
          member.name.toLowerCase().includes(mentionedName) ||
          mentionedName.includes(member.name.toLowerCase().split(' ')[0]) // First name match
        );

        if (matchedMember) {
          return matchedMember.name;
        }

        // If no match found, return the extracted name capitalized
        return match[1]
          .split(' ')
          .map(word => word.charAt(0).toUpperCase() + word.slice(1))
          .join(' ');
      }
    }

    return null;
  }

  /**
   * Extract project name from text
   */
  private static extractProjectName(lowerInput: string, projects: Project[]): string | null {
    // Look for "in project X" or "for project X"
    const projectPatterns = [
      /(?:in|for)\s+project\s+(\w+(?:\s+\w+)?)/,
      /(?:in|for)\s+(\w+)\s+project/
    ];

    for (const pattern of projectPatterns) {
      const match = lowerInput.match(pattern);
      if (match) {
        const mentionedProject = match[1].toLowerCase();
        
        // Try to find matching project (fuzzy match)
        const matchedProject = projects.find(project => 
          project.name.toLowerCase().includes(mentionedProject) ||
          mentionedProject.includes(project.name.toLowerCase())
        );

        if (matchedProject) {
          return matchedProject.name;
        }
      }
    }

    // Try to find project name mentioned anywhere in the text
    const matchedProject = projects.find(project => 
      lowerInput.includes(project.name.toLowerCase())
    );

    return matchedProject ? matchedProject.name : null;
  }

  /**
   * Calculate confidence score for the extraction
   */
  private static calculateConfidence(input: string): number {
    let confidence = 0.5; // Base confidence

    const lowerInput = input.toLowerCase();

    // Increase confidence for clear task creation triggers
    if (/^(create|add|new)\s+task/i.test(input)) {
      confidence += 0.2;
    }

    // Increase confidence if priority is mentioned
    if (/(urgent|critical|high|low|priority)/i.test(input)) {
      confidence += 0.1;
    }

    // Increase confidence if due date is mentioned
    if (/due|tomorrow|next|today/i.test(input)) {
      confidence += 0.1;
    }

    // Increase confidence if assignee is mentioned
    if (/(assign|for|@)/i.test(input)) {
      confidence += 0.1;
    }

    return Math.min(confidence, 1.0);
  }

  /**
   * Check if input looks like a task creation request
   */
  static isTaskCreationIntent(input: string): boolean {
    const lowerInput = input.toLowerCase();
    
    const triggers = [
      /^create\s+.*?\btask\b/,  // "create urgent task", "create a task", etc.
      /^add\s+.*?\btask\b/,     // "add high priority task", etc.
      /^new\s+.*?\btask\b/,     // "new urgent task", etc.
      /^task:/                   // "task: whatever"
    ];

    return triggers.some(trigger => trigger.test(lowerInput));
  }

  /**
   * Generate a preview of the extracted task
   */
  static generatePreview(extracted: ExtractedTaskData): string {
    const parts: string[] = [];
    
    parts.push(`**Task:** ${extracted.taskName}`);
    parts.push(`**Priority:** ${extracted.priority}`);
    
    if (extracted.dueDate) {
      const date = new Date(extracted.dueDate);
      parts.push(`**Due:** ${date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`);
    }
    
    if (extracted.assignee) {
      parts.push(`**Assignee:** ${extracted.assignee}`);
    }
    
    if (extracted.projectName) {
      parts.push(`**Project:** ${extracted.projectName}`);
    }

    return parts.join('\n');
  }
}
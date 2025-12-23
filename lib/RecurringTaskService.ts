import type {
  Task,
  RecurrencePattern,
  NextOccurrence,
  RecurringTaskGenerationResult,
  RecurringTaskInstance
} from '../types';
import moment from 'moment';
import {
  createRecurringTaskInstance,
  getRecurringTaskInstances,
  getLatestRecurringTaskInstance,
  deleteAllRecurringTaskInstances
} from './database';

export interface RecurrenceRule {
  frequency: 'daily' | 'weekly' | 'monthly' | 'yearly';
  interval: number; // Every X days/weeks/months/years
  endDate?: Date;
  occurrences?: number; // Alternative to endDate
  daysOfWeek?: number[]; // 0-6 for Sunday-Saturday (for weekly)
  dayOfMonth?: number; // 1-31 (for monthly)
}

export interface RecurringTaskConfig extends Task {
  recurrence?: RecurrenceRule;
  isRecurring?: boolean;
}

// ✅ ADDED: Export RecurringTask type that was missing
export interface RecurringTask {
  id: string;
  title: string;
  pattern: 'daily' | 'weekly' | 'monthly';
  startDate: Date;
  interval: number;
  active: boolean;
  createdAt?: Date;
}

export class RecurringTaskService {
  /**
   * Generate occurrences of a recurring task
   */
  static generateOccurrences(
    task: RecurringTaskConfig,
    startDate: Date,
    endDate: Date
  ): Task[] {
    if (!task.recurrence || !task.isRecurring || !task.dueDate) {
      return [task];
    }

    const occurrences: Task[] = [];
    const rule = task.recurrence;
    const baseDate = moment(task.dueDate);
    const rangeStart = moment(startDate);
    const rangeEnd = moment(endDate);
    
    let currentDate = baseDate.clone();
    let occurrenceCount = 0;
    const maxOccurrences = rule.occurrences || 100; // Limit to prevent infinite loops

    while (occurrenceCount < maxOccurrences) {
      // Check if we're past the end date
      if (rule.endDate && currentDate.isAfter(moment(rule.endDate))) {
        break;
      }

      // Check if we're past the range end
      if (currentDate.isAfter(rangeEnd)) {
        break;
      }

      // Add occurrence if it's within the range
      if (currentDate.isSameOrAfter(rangeStart)) {
        const occurrence: Task = {
          ...task,
          id: `${task.id}-recur-${occurrenceCount}`,
          dueDate: currentDate.toISOString(),
          startDate: task.startDate 
            ? moment(task.startDate).add(currentDate.diff(baseDate), 'milliseconds').toISOString()
            : currentDate.toISOString(),
          name: `${task.name} ${this.getOccurrenceSuffix(currentDate, rule)}`,
        };
        
        occurrences.push(occurrence);
      }

      // Move to next occurrence
      currentDate = this.getNextOccurrence(currentDate, rule);
      occurrenceCount++;

      // Safety check
      if (occurrenceCount >= maxOccurrences) {
        console.warn('Reached maximum occurrences limit');
        break;
      }
    }

    return occurrences;
  }

  /**
   * Get the next occurrence date based on recurrence rule
   */
  private static getNextOccurrence(currentDate: moment.Moment, rule: RecurrenceRule): moment.Moment {
    const next = currentDate.clone();

    switch (rule.frequency) {
      case 'daily':
        return next.add(rule.interval, 'days');

      case 'weekly':
        if (rule.daysOfWeek && rule.daysOfWeek.length > 0) {
          // Find next valid day of week
          let daysToAdd = 1;
          const maxDays = 7 * rule.interval;
          
          while (daysToAdd <= maxDays) {
            next.add(1, 'day');
            if (rule.daysOfWeek.includes(next.day())) {
              return next;
            }
            daysToAdd++;
          }
        }
        return next.add(rule.interval, 'weeks');

      case 'monthly':
        if (rule.dayOfMonth) {
          next.add(rule.interval, 'months');
          next.date(Math.min(rule.dayOfMonth, next.daysInMonth()));
          return next;
        }
        return next.add(rule.interval, 'months');

      case 'yearly':
        return next.add(rule.interval, 'years');

      default:
        return next.add(rule.interval, 'days');
    }
  }

  /**
   * Get a human-readable suffix for the occurrence
   */
  private static getOccurrenceSuffix(date: moment.Moment, rule: RecurrenceRule): string {
    // Don't add suffix for the first occurrence
    return ''; // Could customize this: e.g., "(Week 2)" or "(Feb)"
  }

  /**
   * Get human-readable description of recurrence rule
   */
  static getRecurrenceDescription(rule?: RecurrenceRule): string {
    if (!rule) return 'Does not repeat';

    const parts: string[] = [];

    // Frequency
    switch (rule.frequency) {
      case 'daily':
        parts.push(rule.interval === 1 ? 'Daily' : `Every ${rule.interval} days`);
        break;
      case 'weekly':
        parts.push(rule.interval === 1 ? 'Weekly' : `Every ${rule.interval} weeks`);
        if (rule.daysOfWeek && rule.daysOfWeek.length > 0) {
          const days = rule.daysOfWeek.map(d => this.getDayName(d)).join(', ');
          parts.push(`on ${days}`);
        }
        break;
      case 'monthly':
        parts.push(rule.interval === 1 ? 'Monthly' : `Every ${rule.interval} months`);
        if (rule.dayOfMonth) {
          parts.push(`on day ${rule.dayOfMonth}`);
        }
        break;
      case 'yearly':
        parts.push(rule.interval === 1 ? 'Yearly' : `Every ${rule.interval} years`);
        break;
    }

    // End condition
    if (rule.endDate) {
      parts.push(`until ${moment(rule.endDate).format('MMM D, YYYY')}`);
    } else if (rule.occurrences) {
      parts.push(`for ${rule.occurrences} occurrences`);
    }

    return parts.join(' ');
  }

  /**
   * Get day name from number
   */
  private static getDayName(day: number): string {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    return days[day] || '';
  }

  /**
   * Validate recurrence rule
   */
  static validateRule(rule: RecurrenceRule): { valid: boolean; error?: string } {
    if (rule.interval < 1) {
      return { valid: false, error: 'Interval must be at least 1' };
    }

    if (rule.frequency === 'weekly' && rule.daysOfWeek) {
      if (rule.daysOfWeek.length === 0) {
        return { valid: false, error: 'Must select at least one day of week' };
      }
      if (rule.daysOfWeek.some(d => d < 0 || d > 6)) {
        return { valid: false, error: 'Invalid day of week' };
      }
    }

    if (rule.frequency === 'monthly' && rule.dayOfMonth) {
      if (rule.dayOfMonth < 1 || rule.dayOfMonth > 31) {
        return { valid: false, error: 'Day of month must be between 1-31' };
      }
    }

    if (rule.endDate && rule.occurrences) {
      return { valid: false, error: 'Cannot specify both end date and occurrences' };
    }

    return { valid: true };
  }

  /**
   * Create a simple recurrence rule
   */
  static createSimpleRule(
    frequency: 'daily' | 'weekly' | 'monthly',
    endDate?: Date
  ): RecurrenceRule {
    return {
      frequency,
      interval: 1,
      endDate
    };
  }

  // ============================================
  // NEW: DATABASE-INTEGRATED METHODS
  // ============================================

  /**
   * Calculate the next occurrence date for a recurring task
   */
  static calculateNextOccurrence(
    pattern: RecurrencePattern,
    fromDate?: string
  ): NextOccurrence | null {
    const baseDate = fromDate ? moment(fromDate) : moment();
    const nextDate = this.getNextOccurrence(baseDate, {
      frequency: pattern.frequency,
      interval: pattern.interval || 1,
      daysOfWeek: pattern.daysOfWeek,
      dayOfMonth: pattern.dayOfMonth,
      endDate: pattern.endDate ? new Date(pattern.endDate) : undefined,
      occurrences: pattern.maxOccurrences
    });

    // Check if we've reached the end
    let isLastOccurrence = false;
    if (pattern.endDate && nextDate.isAfter(moment(pattern.endDate))) {
      isLastOccurrence = true;
    }

    // We'll need to track occurrence number externally
    // For now, return a placeholder
    return {
      date: nextDate.toISOString(),
      occurrenceNumber: 1,
      isLastOccurrence
    };
  }

  /**
   * Generate a new task instance from a recurring task template
   */
  static async generateTaskInstance(
    templateTask: Task,
    scheduledDate: string,
    occurrenceNumber: number
  ): Promise<RecurringTaskGenerationResult> {
    try {
      if (!templateTask.isRecurring || !templateTask.recurrencePattern) {
        return {
          success: false,
          error: 'Task is not a recurring task template'
        };
      }

      // Create the new task instance
      const generatedTask: Task = {
        ...templateTask,
        id: `${templateTask.id}-instance-${occurrenceNumber}-${Date.now()}`,
        name: `${templateTask.name}`,
        dueDate: scheduledDate,
        startDate: scheduledDate,
        isRecurring: false, // Instance is not recurring
        recurrencePattern: undefined,
        originalTaskId: templateTask.id,
        occurrenceNumber,
        completed: false,
        status: templateTask.status,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      // Save instance tracking to database
      const instance = await createRecurringTaskInstance(
        templateTask.id,
        generatedTask.id,
        occurrenceNumber,
        scheduledDate
      );

      if (!instance) {
        return {
          success: false,
          error: 'Failed to create instance record in database'
        };
      }

      // Calculate next scheduled date
      const nextOccurrence = this.calculateNextOccurrence(
        templateTask.recurrencePattern,
        scheduledDate
      );

      return {
        success: true,
        generatedTask,
        instance,
        nextScheduledDate: nextOccurrence?.date
      };
    } catch (error) {
      console.error('Error generating task instance:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Get all instances for a recurring task template
   */
  static async getTaskInstances(
    templateTaskId: string
  ): Promise<RecurringTaskInstance[]> {
    return await getRecurringTaskInstances(templateTaskId);
  }

  /**
   * Get the next occurrence number for a recurring task
   */
  static async getNextOccurrenceNumber(
    templateTaskId: string
  ): Promise<number> {
    const latestInstance = await getLatestRecurringTaskInstance(templateTaskId);
    return latestInstance ? latestInstance.occurrenceNumber + 1 : 1;
  }

  /**
   * Delete all instances for a recurring task template
   */
  static async deleteAllInstances(templateTaskId: string): Promise<boolean> {
    return await deleteAllRecurringTaskInstances(templateTaskId);
  }

  /**
   * Check if it's time to generate a new instance
   */
  static shouldGenerateInstance(
    pattern: RecurrencePattern,
    lastGeneratedDate?: string
  ): boolean {
    if (!lastGeneratedDate) return true;

    const now = moment();
    const lastGenerated = moment(lastGeneratedDate);
    const nextDue = this.getNextOccurrence(lastGenerated, {
      frequency: pattern.frequency,
      interval: pattern.interval || 1,
      daysOfWeek: pattern.daysOfWeek,
      dayOfMonth: pattern.dayOfMonth,
      endDate: pattern.endDate ? new Date(pattern.endDate) : undefined
    });

    // Generate if we're past or at the next due date
    return now.isSameOrAfter(nextDue);
  }

  /**
   * Get upcoming instances that should be generated
   */
  static getUpcomingInstances(
    pattern: RecurrencePattern,
    fromDate: string,
    lookAheadDays = 30
  ): string[] {
    const upcoming: string[] = [];
    const start = moment(fromDate);
    const end = moment(fromDate).add(lookAheadDays, 'days');

    let currentDate = start.clone();
    let count = 0;
    const maxOccurrences = pattern.maxOccurrences || 100;

    while (count < maxOccurrences && currentDate.isBefore(end)) {
      if (pattern.endDate && currentDate.isAfter(moment(pattern.endDate))) {
        break;
      }

      upcoming.push(currentDate.toISOString());
      currentDate = this.getNextOccurrence(currentDate, {
        frequency: pattern.frequency,
        interval: pattern.interval || 1,
        daysOfWeek: pattern.daysOfWeek,
        dayOfMonth: pattern.dayOfMonth,
        endDate: pattern.endDate ? new Date(pattern.endDate) : undefined
      });
      count++;
    }

    return upcoming;
  }

  /**
   * Convert RecurrencePattern to RecurrenceRule (for compatibility)
   */
  static patternToRule(pattern: RecurrencePattern): RecurrenceRule {
    return {
      frequency: pattern.frequency,
      interval: pattern.interval || 1,
      daysOfWeek: pattern.daysOfWeek,
      dayOfMonth: pattern.dayOfMonth,
      endDate: pattern.endDate ? new Date(pattern.endDate) : undefined,
      occurrences: pattern.maxOccurrences
    };
  }

  /**
   * Convert RecurrenceRule to RecurrencePattern (for compatibility)
   */
  static ruleToPattern(rule: RecurrenceRule): RecurrencePattern {
    return {
      frequency: rule.frequency,
      interval: rule.interval,
      daysOfWeek: rule.daysOfWeek,
      dayOfMonth: rule.dayOfMonth,
      endDate: rule.endDate?.toISOString(),
      maxOccurrences: rule.occurrences
    };
  }

  /**
   * Check if a recurring task has reached its end condition
   */
  static hasReachedEnd(
    pattern: RecurrencePattern,
    occurrenceNumber: number,
    currentDate: string
  ): boolean {
    // Check max occurrences
    if (pattern.maxOccurrences && occurrenceNumber >= pattern.maxOccurrences) {
      return true;
    }

    // Check end date
    if (pattern.endDate && moment(currentDate).isAfter(moment(pattern.endDate))) {
      return true;
    }

    return false;
  }

  /**
   * Get human-readable recurrence description from RecurrencePattern
   */
  static getPatternDescription(pattern: RecurrencePattern): string {
    return this.getRecurrenceDescription(this.patternToRule(pattern));
  }
}
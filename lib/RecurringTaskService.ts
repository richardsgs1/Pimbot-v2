import type { Task } from '../types';
import moment from 'moment';

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
}
/**
 * RecurringTaskGenerator Service
 *
 * Manages recurring task patterns and automatic instance generation.
 * Allows tasks to be automatically created on a schedule.
 *
 * Key Features:
 * - Generate next task instance based on pattern
 * - Generate all instances up to end date
 * - Check and generate due instances
 * - Validate recurrence patterns
 * - Get next occurrence date
 */

import type { Task, Project, RecurrencePattern } from '../types';
import { generateUUID } from './utils';

export class RecurringTaskGenerator {
  /**
   * Generate the next instance of a recurring task
   * Creates a new task with incremented occurrence number
   *
   * @param template - The recurring task template
   * @param projectId - ID of project to add task to
   * @returns New task instance
   */
  generateNextInstance(template: Task, projectId: string): Task {
    if (!template.isRecurring || !template.recurrencePattern) {
      throw new Error('Task is not a recurring task template');
    }

    const nextDate = this.getNextOccurrenceDate(
      template.dueDate || new Date().toISOString(),
      template.recurrencePattern,
      template.occurrenceNumber || 1
    );

    const nextOccurrence = (template.occurrenceNumber || 1) + 1;

    const newTask: Task = {
      ...template,
      id: generateUUID(),
      dueDate: nextDate,
      occurrenceNumber: nextOccurrence,
      completed: false,
      status: 'To Do' as any, // Reset status
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      // Don't copy these to instance
      isRecurring: false,
      recurrencePattern: undefined,
    };

    return newTask;
  }

  /**
   * Generate all instances of a recurring task up to a given date
   * Useful for bulk creation or initialization
   *
   * @param template - The recurring task template
   * @param upToDate - End date for generation
   * @param maxInstances - Maximum instances to generate (safety limit)
   * @returns Array of generated task instances
   */
  generateInstances(
    template: Task,
    upToDate: Date,
    maxInstances: number = 100
  ): Task[] {
    if (!template.isRecurring || !template.recurrencePattern) {
      return [];
    }

    const instances: Task[] = [];
    let currentOccurrence = template.occurrenceNumber || 1;
    let currentDate = new Date(template.dueDate || new Date().toISOString());

    while (
      currentDate <= upToDate &&
      instances.length < maxInstances &&
      !this._shouldStopGeneration(template.recurrencePattern, currentOccurrence)
    ) {
      const instance: Task = {
        ...template,
        id: generateUUID(),
        dueDate: currentDate.toISOString(),
        occurrenceNumber: currentOccurrence,
        completed: false,
        status: 'To Do' as any,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        isRecurring: false,
        recurrencePattern: undefined,
      };

      instances.push(instance);

      // Get next date
      currentDate = new Date(
        this.getNextOccurrenceDate(
          currentDate.toISOString(),
          template.recurrencePattern,
          currentOccurrence
        )
      );

      currentOccurrence++;
    }

    return instances;
  }

  /**
   * Check and generate recurring task instances that are due
   * Should be called on app load or daily scheduled job
   *
   * @param project - The project containing tasks
   * @param daysAhead - How many days ahead to generate (default 30)
   * @returns Updated project with generated instances
   */
  checkAndGenerateDueInstances(project: Project, daysAhead: number = 30): Project {
    const recurringTasks = project.tasks.filter(t => t.isRecurring);
    let updatedTasks = [...project.tasks];

    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + daysAhead);

    for (const template of recurringTasks) {
      const lastInstance = this._getLastInstanceOfTemplate(template.id, updatedTasks);
      const nextInstanceDate = lastInstance
        ? new Date(this.getNextOccurrenceDate(
            lastInstance.dueDate || new Date().toISOString(),
            template.recurrencePattern!,
            lastInstance.occurrenceNumber || 1
          ))
        : new Date(template.dueDate || new Date().toISOString());

      // Generate instances that should exist but don't
      while (
        nextInstanceDate <= futureDate &&
        !this._shouldStopGeneration(
          template.recurrencePattern!,
          (lastInstance?.occurrenceNumber || 0) + 1
        )
      ) {
        const newInstance = this.generateNextInstance(
          lastInstance || template,
          project.id
        );

        updatedTasks.push(newInstance);

        // Get next date
        const nextDateStr = this.getNextOccurrenceDate(
          nextInstanceDate.toISOString(),
          template.recurrencePattern!,
          (lastInstance?.occurrenceNumber || 1) + 1
        );

        nextInstanceDate.setTime(new Date(nextDateStr).getTime());
      }
    }

    return {
      ...project,
      tasks: updatedTasks,
    };
  }

  /**
   * Get the next occurrence date for a recurring pattern
   *
   * @param fromDate - Date to start from (ISO string)
   * @param pattern - Recurrence pattern
   * @param occurrenceNumber - Current occurrence number
   * @returns ISO string of next occurrence date
   */
  getNextOccurrenceDate(
    fromDate: string,
    pattern: RecurrencePattern,
    occurrenceNumber: number
  ): string {
    const date = new Date(fromDate);
    const interval = pattern.interval || 1;

    switch (pattern.frequency) {
      case 'daily':
        date.setDate(date.getDate() + interval);
        break;

      case 'weekly':
        date.setDate(date.getDate() + 7 * interval);
        // If specific days of week set, find next matching day
        if (pattern.daysOfWeek && pattern.daysOfWeek.length > 0) {
          const nextDate = this._getNextDayOfWeek(date, pattern.daysOfWeek);
          return nextDate.toISOString();
        }
        break;

      case 'biweekly':
        date.setDate(date.getDate() + 14 * interval);
        break;

      case 'monthly':
        if (pattern.dayOfMonth) {
          date.setMonth(date.getMonth() + interval);
          date.setDate(Math.min(pattern.dayOfMonth, 31));
        } else {
          date.setMonth(date.getMonth() + interval);
        }
        break;

      case 'quarterly':
        date.setMonth(date.getMonth() + 3 * interval);
        break;

      case 'yearly':
        date.setFullYear(date.getFullYear() + interval);
        break;
    }

    return date.toISOString();
  }

  /**
   * Get preview of next N occurrences
   * Useful for showing user what will be generated
   *
   * @param template - The recurring task template
   * @param count - Number of occurrences to preview
   * @returns Array of preview dates
   */
  getNextOccurrencesPreview(
    template: Task,
    count: number = 5
  ): Array<{ date: string; occurrenceNumber: number }> {
    if (!template.isRecurring || !template.recurrencePattern) {
      return [];
    }

    const preview: Array<{ date: string; occurrenceNumber: number }> = [];
    let currentDate = new Date(template.dueDate || new Date().toISOString());
    let occurrence = (template.occurrenceNumber || 1) + 1;

    for (let i = 0; i < count; i++) {
      const nextDate = this.getNextOccurrenceDate(
        currentDate.toISOString(),
        template.recurrencePattern,
        occurrence
      );

      preview.push({
        date: nextDate,
        occurrenceNumber: occurrence,
      });

      currentDate = new Date(nextDate);
      occurrence++;

      if (
        this._shouldStopGeneration(template.recurrencePattern, occurrence - 1)
      ) {
        break;
      }
    }

    return preview;
  }

  /**
   * Validate a recurrence pattern for correctness
   *
   * @param pattern - Pattern to validate
   * @returns Object with validation result and error message if any
   */
  validatePattern(
    pattern: RecurrencePattern
  ): { valid: boolean; error?: string } {
    if (!pattern.frequency) {
      return { valid: false, error: 'Frequency is required' };
    }

    if (pattern.interval && pattern.interval < 1) {
      return { valid: false, error: 'Interval must be at least 1' };
    }

    if (
      pattern.daysOfWeek &&
      pattern.daysOfWeek.some(day => day < 0 || day > 6)
    ) {
      return { valid: false, error: 'Days of week must be between 0-6' };
    }

    if (pattern.dayOfMonth && (pattern.dayOfMonth < 1 || pattern.dayOfMonth > 31)) {
      return { valid: false, error: 'Day of month must be between 1-31' };
    }

    if (pattern.endDate) {
      const endDate = new Date(pattern.endDate);
      if (isNaN(endDate.getTime())) {
        return { valid: false, error: 'Invalid end date' };
      }
    }

    if (pattern.maxOccurrences && pattern.maxOccurrences < 1) {
      return { valid: false, error: 'Max occurrences must be at least 1' };
    }

    return { valid: true };
  }

  /**
   * Get human-readable description of recurrence pattern
   *
   * @param pattern - The pattern to describe
   * @returns Human-readable string
   */
  describePattern(pattern: RecurrencePattern): string {
    const interval = pattern.interval || 1;

    let description = '';

    if (interval === 1) {
      description = `Every ${pattern.frequency}`;
    } else {
      description = `Every ${interval} ${pattern.frequency}s`;
    }

    if (pattern.daysOfWeek && pattern.daysOfWeek.length > 0) {
      const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
      const days = pattern.daysOfWeek.map(d => dayNames[d]).join(', ');
      description += ` on ${days}`;
    }

    if (pattern.dayOfMonth) {
      description += ` on the ${pattern.dayOfMonth}${this._getSuffix(pattern.dayOfMonth)}`;
    }

    if (pattern.endDate) {
      const endDate = new Date(pattern.endDate);
      description += ` until ${endDate.toLocaleDateString()}`;
    }

    if (pattern.maxOccurrences) {
      description += ` (${pattern.maxOccurrences} times)`;
    }

    return description;
  }

  /**
   * @private - Get next date with specific day of week
   */
  private _getNextDayOfWeek(fromDate: Date, daysOfWeek: number[]): Date {
    const date = new Date(fromDate);
    date.setDate(date.getDate() + 1); // Start from next day

    while (true) {
      if (daysOfWeek.includes(date.getDay())) {
        return date;
      }
      date.setDate(date.getDate() + 1);
    }
  }

  /**
   * @private - Check if generation should stop
   */
  private _shouldStopGeneration(
    pattern: RecurrencePattern,
    currentOccurrence: number
  ): boolean {
    if (pattern.maxOccurrences && currentOccurrence > pattern.maxOccurrences) {
      return true;
    }

    if (pattern.endDate) {
      const endDate = new Date(pattern.endDate);
      if (new Date() > endDate) {
        return true;
      }
    }

    return false;
  }

  /**
   * @private - Get last instance of a template task
   */
  private _getLastInstanceOfTemplate(templateId: string, tasks: Task[]): Task | null {
    return (
      tasks
        .filter(t => t.originalTaskId === templateId)
        .sort((a, b) => (b.occurrenceNumber || 0) - (a.occurrenceNumber || 0))[0] ||
      null
    );
  }

  /**
   * @private - Get ordinal suffix (1st, 2nd, 3rd, etc)
   */
  private _getSuffix(num: number): string {
    const j = num % 10;
    const k = num % 100;

    if (j === 1 && k !== 11) return 'st';
    if (j === 2 && k !== 12) return 'nd';
    if (j === 3 && k !== 13) return 'rd';
    return 'th';
  }
}

// Export singleton instance
export const recurringTaskGenerator = new RecurringTaskGenerator();

import type { Project, Task } from '../types';
import moment from 'moment';

export interface CalendarExportOptions {
  format: 'ical' | 'google' | 'csv';
  includeCompleted?: boolean;
  includeMilestones?: boolean;
  projectIds?: string[];
  dateRange?: {
    start: Date;
    end: Date;
  };
}

export class CalendarExportService {
  /**
   * Export calendar to iCal format (.ics file)
   */
  static exportToICal(projects: Project[], options: CalendarExportOptions = { format: 'ical' }): void {
    const events = this.collectEvents(projects, options);
    
    let icalContent = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//PiMbOt AI//Calendar Export//EN',
      'CALSCALE:GREGORIAN',
      'METHOD:PUBLISH',
      'X-WR-CALNAME:PiMbOt Tasks',
      'X-WR-TIMEZONE:UTC',
    ];

    events.forEach(event => {
      const startDate = moment(event.start).format('YYYYMMDDTHHmmss') + 'Z';
      const endDate = moment(event.end).format('YYYYMMDDTHHmmss') + 'Z';
      const uid = `${event.id}@pimbot.ai`;
      
      icalContent.push(
        'BEGIN:VEVENT',
        `UID:${uid}`,
        `DTSTAMP:${moment().format('YYYYMMDDTHHmmss')}Z`,
        `DTSTART:${startDate}`,
        `DTEND:${endDate}`,
        `SUMMARY:${this.escapeICalText(event.title)}`,
        `DESCRIPTION:${this.escapeICalText(event.description || '')}`,
        `LOCATION:${this.escapeICalText(event.project)}`,
        `STATUS:${event.completed ? 'COMPLETED' : 'CONFIRMED'}`,
        `PRIORITY:${this.getPriorityNumber(event.priority)}`,
        'END:VEVENT'
      );
    });

    icalContent.push('END:VCALENDAR');
    
    const blob = new Blob([icalContent.join('\r\n')], { type: 'text/calendar;charset=utf-8' });
    this.downloadFile(blob, 'pimbot-calendar.ics');
  }

  /**
   * Generate Google Calendar URL
   */
  static exportToGoogleCalendar(projects: Project[], options: CalendarExportOptions = { format: 'google' }): void {
    const events = this.collectEvents(projects, options);
    
    if (events.length === 0) {
      alert('No events to export!');
      return;
    }

    // Google Calendar only allows one event at a time via URL
    // Open the first event and inform user
    const event = events[0];
    const startDate = moment(event.start).format('YYYYMMDDTHHmmss');
    const endDate = moment(event.end).format('YYYYMMDDTHHmmss');
    
    const params = new URLSearchParams({
      action: 'TEMPLATE',
      text: event.title,
      dates: `${startDate}/${endDate}`,
      details: event.description || '',
      location: event.project,
    });

    const url = `https://calendar.google.com/calendar/render?${params.toString()}`;
    
    if (events.length > 1) {
      const proceed = confirm(
        `Found ${events.length} events. Google Calendar links can only add one event at a time.\n\n` +
        `Would you like to open the first event ("${event.title}") in Google Calendar?\n\n` +
        `Tip: Use iCal export to import all events at once!`
      );
      if (!proceed) return;
    }
    
    window.open(url, '_blank');
  }

  /**
   * Export to CSV format
   */
  static exportToCSV(projects: Project[], options: CalendarExportOptions = { format: 'csv' }): void {
    const events = this.collectEvents(projects, options);
    
    const headers = [
      'Task Name',
      'Project',
      'Start Date',
      'Due Date',
      'Priority',
      'Status',
      'Completed',
      'Assignees',
      'Description',
      'Estimated Hours'
    ];

    const rows = events.map(event => [
      this.escapeCSV(event.title),
      this.escapeCSV(event.project),
      moment(event.start).format('YYYY-MM-DD'),
      moment(event.end).format('YYYY-MM-DD'),
      event.priority || '',
      event.status || '',
      event.completed ? 'Yes' : 'No',
      event.assignees?.join(', ') || '',
      this.escapeCSV(event.description || ''),
      event.estimatedHours?.toString() || ''
    ]);

    const csv = [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
    this.downloadFile(blob, 'pimbot-tasks.csv');
  }

  /**
   * Collect and filter events based on options
   */
  private static collectEvents(projects: Project[], options: CalendarExportOptions): any[] {
    const events: any[] = [];

    projects.forEach(project => {
      // Filter by project IDs if specified
      if (options.projectIds && !options.projectIds.includes(project.id)) {
        return;
      }

      // Add milestones if requested
      if (options.includeMilestones) {
        if (project.startDate) {
          events.push({
            id: `milestone-start-${project.id}`,
            title: `🚀 ${project.name} Start`,
            start: new Date(project.startDate),
            end: new Date(project.startDate),
            project: project.name,
            description: 'Project Start Milestone',
            completed: false,
            priority: 'high'
          });
        }

        if (project.dueDate) {
          events.push({
            id: `milestone-end-${project.id}`,
            title: `🏁 ${project.name} Due`,
            start: new Date(project.dueDate),
            end: new Date(project.dueDate),
            project: project.name,
            description: 'Project Due Milestone',
            completed: false,
            priority: 'high'
          });
        }
      }

      // Add tasks
      project.tasks.forEach(task => {
        if (!task.dueDate) return;

        // Filter completed tasks if needed
        if (!options.includeCompleted && task.completed) return;

        const taskDate = new Date(task.dueDate);
        
        // Filter by date range if specified
        if (options.dateRange) {
          if (taskDate < options.dateRange.start || taskDate > options.dateRange.end) {
            return;
          }
        }

        events.push({
          id: task.id,
          title: task.name,
          start: task.startDate ? new Date(task.startDate) : taskDate,
          end: taskDate,
          project: project.name,
          description: task.description,
          completed: task.completed,
          priority: task.priority,
          status: task.status,
          assignees: task.assignees,
          estimatedHours: task.estimatedHours
        });
      });
    });

    return events;
  }

  /**
   * Escape text for iCal format
   */
  private static escapeICalText(text: string): string {
    return text
      .replace(/\\/g, '\\\\')
      .replace(/;/g, '\\;')
      .replace(/,/g, '\\,')
      .replace(/\n/g, '\\n');
  }

  /**
   * Escape text for CSV format
   */
  private static escapeCSV(text: string): string {
    if (text.includes(',') || text.includes('"') || text.includes('\n')) {
      return `"${text.replace(/"/g, '""')}"`;
    }
    return text;
  }

  /**
   * Convert priority to iCal number (1-9, lower is higher priority)
   */
  private static getPriorityNumber(priority?: string): number {
    switch (priority?.toLowerCase()) {
      case 'high': return 1;
      case 'medium': return 5;
      case 'low': return 9;
      default: return 5;
    }
  }

  /**
   * Download a file
   */
  private static downloadFile(blob: Blob, filename: string): void {
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }
}
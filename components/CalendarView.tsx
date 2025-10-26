import React, { useState, useMemo } from 'react';
import { Calendar, momentLocalizer, View, Event } from 'react-big-calendar';
import moment from 'moment';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import type { Project, Task } from '../types';
import { PRIORITY_VALUES } from '../types';

const localizer = momentLocalizer(moment);

interface CalendarViewProps {
  projects: Project[];
  onTaskClick: (task: Task, projectId: string) => void;
  onDateSelect: (date: Date) => void;
}

interface CalendarEvent extends Event {
  taskId: string;
  projectId: string;
  task: Task;
  project: Project;
  type: 'task' | 'project-start' | 'project-end';
  priority: string;
}

const CalendarView: React.FC<CalendarViewProps> = ({ 
  projects, 
  onTaskClick,
  onDateSelect 
}) => {
  const [currentView, setCurrentView] = useState<View>('month');
  const [currentDate, setCurrentDate] = useState(new Date());

  // Convert tasks and project deadlines to calendar events
  const events = useMemo((): CalendarEvent[] => {
    const calendarEvents: CalendarEvent[] = [];

    projects.forEach(project => {
      // Add project start date
      if (project.startDate) {
        calendarEvents.push({
          title: `🚀 ${project.name} - Start`,
          start: new Date(project.startDate),
          end: new Date(project.startDate),
          allDay: true,
          taskId: `project-start-${project.id}`,
          projectId: project.id,
          task: {} as Task, // Placeholder
          project: project,
          type: 'project-start',
          priority: project.priority,
          resource: {
            type: 'project-start',
            project: project
          }
        });
      }

      // Add project due date
      if (project.dueDate) {
        calendarEvents.push({
          title: `🏁 ${project.name} - Due`,
          start: new Date(project.dueDate),
          end: new Date(project.dueDate),
          allDay: true,
          taskId: `project-end-${project.id}`,
          projectId: project.id,
          task: {} as Task,
          project: project,
          type: 'project-end',
          priority: project.priority,
          resource: {
            type: 'project-end',
            project: project
          }
        });
      }

      // Add tasks with due dates
      project.tasks.forEach(task => {
        if (task.dueDate && !task.completed) {
          const isOverdue = new Date(task.dueDate) < new Date();
          
          calendarEvents.push({
            title: `${task.name} (${project.name})`,
            start: new Date(task.dueDate),
            end: new Date(task.dueDate),
            allDay: true,
            taskId: task.id,
            projectId: project.id,
            task: task,
            project: project,
            type: 'task',
            priority: task.priority,
            resource: {
              type: 'task',
              task: task,
              project: project,
              isOverdue: isOverdue
            }
          });
        }
      });
    });

    return calendarEvents;
  }, [projects]);

  // Custom event styling based on priority and type
  const eventStyleGetter = (event: CalendarEvent) => {
    let backgroundColor = '#3174ad';
    let borderColor = '#265985';

    if (event.type === 'project-start') {
      backgroundColor = '#10b981';
      borderColor = '#059669';
    } else if (event.type === 'project-end') {
      backgroundColor = '#8b5cf6';
      borderColor = '#7c3aed';
    } else if (event.type === 'task') {
      // Check if overdue
      if (event.resource?.isOverdue) {
        backgroundColor = '#ef4444';
        borderColor = '#dc2626';
      } else {
        // Color by priority
        switch (event.priority) {
          case PRIORITY_VALUES.High:
            backgroundColor = '#f59e0b';
            borderColor = '#d97706';
            break;
          case PRIORITY_VALUES.Medium:
            backgroundColor = '#3b82f6';
            borderColor = '#2563eb';
            break;
          case PRIORITY_VALUES.Low:
            backgroundColor = '#6b7280';
            borderColor = '#4b5563';
            break;
          default:
            backgroundColor = '#3174ad';
            borderColor = '#265985';
        }
      }
    }

    return {
      style: {
        backgroundColor,
        borderColor,
        borderWidth: '2px',
        borderStyle: 'solid',
        borderRadius: '4px',
        color: 'white',
        fontSize: '12px',
        padding: '2px 4px'
      }
    };
  };

  const handleSelectEvent = (event: CalendarEvent) => {
    if (event.type === 'task') {
      onTaskClick(event.task, event.projectId);
    }
  };

  const handleSelectSlot = ({ start }: { start: Date }) => {
    onDateSelect(start);
  };

  // Custom toolbar with better mobile support
  const CustomToolbar = (toolbar: any) => {
    const goToBack = () => {
      toolbar.onNavigate('PREV');
    };

    const goToNext = () => {
      toolbar.onNavigate('NEXT');
    };

    const goToToday = () => {
      toolbar.onNavigate('TODAY');
    };

    const label = () => {
      const date = moment(toolbar.date);
      return (
        <span className="text-lg font-bold text-[var(--text-primary)]">
          {date.format('MMMM YYYY')}
        </span>
      );
    };

    return (
      <div className="flex flex-col sm:flex-row items-center justify-between mb-4 gap-3">
        <div className="flex items-center gap-2">
          <button
            onClick={goToBack}
            className="px-3 py-2 bg-[var(--bg-tertiary)] hover:bg-[var(--bg-tertiary)] border border-[var(--border-primary)] rounded-lg transition-colors"
          >
            ←
          </button>
          <button
            onClick={goToToday}
            className="px-4 py-2 bg-[var(--accent-primary)] hover:bg-[var(--accent-secondary)] text-white rounded-lg transition-colors font-medium"
          >
            Today
          </button>
          <button
            onClick={goToNext}
            className="px-3 py-2 bg-[var(--bg-tertiary)] hover:bg-[var(--bg-tertiary)] border border-[var(--border-primary)] rounded-lg transition-colors"
          >
            →
          </button>
        </div>

        <div>{label()}</div>

        <div className="flex gap-2">
          <button
            onClick={() => toolbar.onView('month')}
            className={`px-3 py-2 rounded-lg transition-colors ${
              toolbar.view === 'month'
                ? 'bg-[var(--accent-primary)] text-white'
                : 'bg-[var(--bg-tertiary)] hover:bg-[var(--bg-tertiary)] border border-[var(--border-primary)]'
            }`}
          >
            Month
          </button>
          <button
            onClick={() => toolbar.onView('week')}
            className={`px-3 py-2 rounded-lg transition-colors ${
              toolbar.view === 'week'
                ? 'bg-[var(--accent-primary)] text-white'
                : 'bg-[var(--bg-tertiary)] hover:bg-[var(--bg-tertiary)] border border-[var(--border-primary)]'
            }`}
          >
            Week
          </button>
          <button
            onClick={() => toolbar.onView('agenda')}
            className={`px-3 py-2 rounded-lg transition-colors ${
              toolbar.view === 'agenda'
                ? 'bg-[var(--accent-primary)] text-white'
                : 'bg-[var(--bg-tertiary)] hover:bg-[var(--bg-tertiary)] border border-[var(--border-primary)]'
            }`}
          >
            Agenda
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="h-full flex flex-col">
      {/* Legend */}
      <div className="mb-4 p-4 bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-lg">
        <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-2">Legend</h3>
        <div className="flex flex-wrap gap-4 text-xs">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded" style={{ backgroundColor: '#ef4444' }}></div>
            <span className="text-[var(--text-secondary)]">Overdue</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded" style={{ backgroundColor: '#f59e0b' }}></div>
            <span className="text-[var(--text-secondary)]">High Priority</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded" style={{ backgroundColor: '#3b82f6' }}></div>
            <span className="text-[var(--text-secondary)]">Medium Priority</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded" style={{ backgroundColor: '#6b7280' }}></div>
            <span className="text-[var(--text-secondary)]">Low Priority</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded" style={{ backgroundColor: '#10b981' }}></div>
            <span className="text-[var(--text-secondary)]">🚀 Project Start</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded" style={{ backgroundColor: '#8b5cf6' }}></div>
            <span className="text-[var(--text-secondary)]">🏁 Project Due</span>
          </div>
        </div>
      </div>

      {/* Calendar */}
      <div className="flex-1 bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-lg p-4 calendar-container">
        <Calendar
          localizer={localizer}
          events={events}
          startAccessor="start"
          endAccessor="end"
          style={{ height: '100%', minHeight: '500px' }}
          onSelectEvent={handleSelectEvent}
          onSelectSlot={handleSelectSlot}
          selectable
          view={currentView}
          onView={setCurrentView}
          date={currentDate}
          onNavigate={setCurrentDate}
          eventPropGetter={eventStyleGetter}
          components={{
            toolbar: CustomToolbar
          }}
          popup
        />
      </div>

      {/* Stats Summary */}
      <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-lg p-3">
          <div className="text-xs text-[var(--text-tertiary)]">Total Tasks</div>
          <div className="text-2xl font-bold text-[var(--text-primary)]">
            {events.filter(e => e.type === 'task').length}
          </div>
        </div>
        <div className="bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-lg p-3">
          <div className="text-xs text-[var(--text-tertiary)]">Overdue</div>
          <div className="text-2xl font-bold text-red-500">
            {events.filter(e => e.type === 'task' && e.resource?.isOverdue).length}
          </div>
        </div>
        <div className="bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-lg p-3">
          <div className="text-xs text-[var(--text-tertiary)]">This Week</div>
          <div className="text-2xl font-bold text-[var(--text-primary)]">
            {events.filter(e => {
              const eventDate = moment(e.start);
              const startOfWeek = moment().startOf('week');
              const endOfWeek = moment().endOf('week');
              return e.type === 'task' && eventDate.isBetween(startOfWeek, endOfWeek, null, '[]');
            }).length}
          </div>
        </div>
        <div className="bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-lg p-3">
          <div className="text-xs text-[var(--text-tertiary)]">Projects Due</div>
          <div className="text-2xl font-bold text-purple-500">
            {events.filter(e => e.type === 'project-end').length}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CalendarView;
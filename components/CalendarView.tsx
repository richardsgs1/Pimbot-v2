import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Calendar, momentLocalizer, View, Event } from 'react-big-calendar';
import withDragAndDrop from 'react-big-calendar/lib/addons/dragAndDrop';
import moment from 'moment';
import type { Project, Task } from '../types';
import { Priority, TaskStatus } from '../types'; // ✅ Regular import for enums (not type-only)
import 'react-big-calendar/lib/css/react-big-calendar.css';
import 'react-big-calendar/lib/addons/dragAndDrop/styles.css';

// ✅ FIXED IMPORTS - Import the classes directly (they have static methods)
import { CalendarExportService } from '../lib/CalendarExportService';
import { RecurringTaskService, RecurringTaskConfig } from '../lib/RecurringTaskService';
import { KeyboardShortcutService, CalendarShortcuts } from '../lib/KeyboardShortcutService';

// Services that may not exist yet - we'll handle gracefully
let FilterPresetService: any = null;
let PushNotificationService: any = null;
let TeamViewService: any = null;

try {
  FilterPresetService = require('../lib/FilterPresetService').FilterPresetService;
} catch (e) {
  console.warn('FilterPresetService not available');
}

try {
  PushNotificationService = require('../lib/PushNotificationService').PushNotificationService;
} catch (e) {
  console.warn('PushNotificationService not available');
}

try {
  TeamViewService = require('../lib/TeamViewService').TeamViewService;
} catch (e) {
  console.warn('TeamViewService not available');
}

const localizer = momentLocalizer(moment);

// ✅ FIXED: Properly typed DnD Calendar - use Task types directly
interface CalendarEvent extends Event {
  id: string;
  title: string;
  start: Date;
  end: Date;
  resourceId?: string;
  project?: string;
  priority?: Task['priority']; // Use Task's priority type
  status?: Task['status']; // Use Task's status type
  milestone?: boolean;
  assignee?: string;
  description?: string;
  isRecurring?: boolean;
  recurringId?: string;
}

const DnDCalendar = withDragAndDrop<CalendarEvent, object>(Calendar);

// ✅ FIXED: Updated props interface to match what Dashboard passes
interface CalendarViewProps {
  projects: Project[];
  onTaskClick?: (task: Task) => void;
  onDateSelect?: (date: Date) => void;
  onTaskReschedule?: (taskId: string, newDate: Date, projectId: string) => Promise<void>;
}

// Supporting interfaces
interface NotificationBanner {
  type: 'warning' | 'info';
  message: string;
  tasks: string[];
}

interface RecurringTaskInstance {
  id: string;
  recurringTaskId: string;
  title: string;
  date: Date;
}

interface FilterPreset {
  id: string;
  name: string;
  filters: any;
  isBuiltIn: boolean;
}

interface TeamView {
  id: string;
  name: string;
  memberIds: string[];
  color?: string;
}

interface TeamMember {
  id: string;
  name: string;
  email: string;
  color: string;
}

// ✅ Main Component
export const CalendarView: React.FC<CalendarViewProps> = ({
  projects = [],
  onTaskClick,
  onDateSelect,
  onTaskReschedule
}) => {
  // State
  const [view, setView] = useState<View>('month');
  const [date, setDate] = useState(new Date());
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  
  // Filters
  const [filterProject, setFilterProject] = useState<string>('');
  const [filterPriority, setFilterPriority] = useState<string>('');
  const [filterStatus, setFilterStatus] = useState<string>('');
  const [filterAssignee, setFilterAssignee] = useState<string>('');
  const [showMilestonesOnly, setShowMilestonesOnly] = useState(false);
  const [showOverdueOnly, setShowOverdueOnly] = useState(false);
  
  // UI State
  const [showFilters, setShowFilters] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  const [showPresetModal, setShowPresetModal] = useState(false);
  const [showTeamModal, setShowTeamModal] = useState(false);
  const [showShortcutsModal, setShowShortcutsModal] = useState(false);
  const [showRecurringModal, setShowRecurringModal] = useState(false);
  const [showNotificationSettings, setShowNotificationSettings] = useState(false);
  
  // Week 4 Features
  const [notifications, setNotifications] = useState<NotificationBanner[]>([]);
  const [activePreset, setActivePreset] = useState<string | null>(null);
  const [teamViews, setTeamViews] = useState<TeamView[]>([]);
  const [activeTeamView, setActiveTeamView] = useState<TeamView | null>(null);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [notificationPermission, setNotificationPermission] = useState<NotificationPermission>('default');
  const [pwaInstallPrompt, setPwaInstallPrompt] = useState<any>(null);
  const [recurringTasks, setRecurringTasks] = useState<RecurringTaskConfig[]>([]);
  
  const calendarRef = useRef<any>(null);

  // ✅ Convert projects to calendar events
  useEffect(() => {
    const calendarEvents: CalendarEvent[] = [];
    
    projects.forEach(project => {
      // Add project milestones
      if (project.startDate) {
        calendarEvents.push({
          id: `milestone-start-${project.id}`,
          title: `🚀 ${project.name} Start`,
          start: new Date(project.startDate),
          end: new Date(project.startDate),
          project: project.name,
          milestone: true,
          priority: Priority.High,
          status: TaskStatus.ToDo
        });
      }

      if (project.dueDate) {
        calendarEvents.push({
          id: `milestone-end-${project.id}`,
          title: `🏁 ${project.name} Due`,
          start: new Date(project.dueDate),
          end: new Date(project.dueDate),
          project: project.name,
          milestone: true,
          priority: Priority.High,
          status: TaskStatus.ToDo
        });
      }

      // Add tasks
      project.tasks.forEach(task => {
        if (task.dueDate) {
          const taskStart = task.startDate ? new Date(task.startDate) : new Date(task.dueDate);
          const taskEnd = new Date(task.dueDate);
          
          calendarEvents.push({
            id: task.id,
            title: task.name,
            start: taskStart,
            end: taskEnd,
            project: project.name,
            priority: task.priority,
            status: task.status,
            description: task.description,
            assignee: task.assignees?.[0],
            milestone: false
          });
        }
      });
    });

    setEvents(calendarEvents);
  }, [projects]);

  // Initialization
  useEffect(() => {
    initializeFeatures();
    setupKeyboardShortcuts();
    checkNotifications();
  }, []);

  const initializeFeatures = async () => {
    if (PushNotificationService) {
      const permission = await PushNotificationService.requestPermission();
      setNotificationPermission(permission);
    }
    
    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault();
      setPwaInstallPrompt(e);
    });

    // Register service worker for PWA
    if ('serviceWorker' in navigator) {
      try {
        await navigator.serviceWorker.register('/service-worker.js');
        console.log('✅ PWA registered');
      } catch (error) {
        console.warn('PWA registration failed:', error);
      }
    }
  };

  const setupKeyboardShortcuts = () => {
    // Register keyboard shortcuts using the service
    const shortcuts = CalendarShortcuts.create({
      onViewChange: (newView) => setView(newView),
      onNavigate: (direction) => {
        if (direction === 'today') setDate(new Date());
        else if (direction === 'prev') handleNavigate('PREV');
        else if (direction === 'next') handleNavigate('NEXT');
      },
      onFilterToggle: () => setShowFilters(prev => !prev),
      onPresetToggle: () => setShowPresetModal(prev => !prev),
      onExportToggle: () => setShowExportModal(prev => !prev),
      onCreateTask: () => {
        if (onDateSelect) onDateSelect(new Date());
      },
      onSearch: () => {
        // Could open a search modal here
      },
      onHelp: () => setShowShortcutsModal(prev => !prev)
    });

    KeyboardShortcutService.registerMultiple(shortcuts);
    KeyboardShortcutService.initialize();

    return () => {
      KeyboardShortcutService.cleanup();
    };
  };

  const checkNotifications = () => {
    const now = moment();
    const upcoming: string[] = [];
    const overdue: string[] = [];

    events.forEach(event => {
      const eventDate = moment(event.start);
      const daysUntil = eventDate.diff(now, 'days');

      if (daysUntil >= 0 && daysUntil <= 3 && event.status !== TaskStatus.Done) {
        upcoming.push(event.title);
      } else if (daysUntil < 0 && event.status !== TaskStatus.Done) {
        overdue.push(event.title);
      }
    });

    const newNotifications: NotificationBanner[] = [];

    if (overdue.length > 0) {
      newNotifications.push({
        type: 'warning',
        message: `⚠️ ${overdue.length} Overdue Tasks`,
        tasks: overdue
      });
    }

    if (upcoming.length > 0) {
      newNotifications.push({
        type: 'info',
        message: `📅 ${upcoming.length} Tasks Due Soon`,
        tasks: upcoming
      });
    }

    setNotifications(newNotifications);
  };

  const getFilteredEvents = (): CalendarEvent[] => {
    return events.filter(event => {
      if (filterProject && event.project !== filterProject) return false;
      if (filterPriority && event.priority !== filterPriority) return false;
      if (filterStatus && event.status !== filterStatus) return false;
      if (filterAssignee && event.assignee !== filterAssignee) return false;
      if (showMilestonesOnly && !event.milestone) return false;
      if (showOverdueOnly && !moment(event.start).isBefore(moment(), 'day')) return false;
      return true;
    });
  };

  // ✅ FIXED: Event handlers with proper types
  const handleSelectEvent = (event: CalendarEvent) => {
    setSelectedEvent(event);
    
    // If it's a task (not milestone), call the onTaskClick handler
    if (!event.milestone && onTaskClick) {
      // Find the original task from projects
      for (const project of projects) {
        const task = project.tasks.find(t => t.id === event.id);
        if (task) {
          onTaskClick(task);
          break;
        }
      }
    }
  };

  const handleSelectSlot = (slotInfo: { start: Date; end: Date }) => {
    if (onDateSelect) {
      onDateSelect(slotInfo.start);
    }
  };

  const handleEventDrop = async (args: { event: CalendarEvent; start: string | Date; end: string | Date }) => {
    // Convert stringOrDate to Date
    const startDate = typeof args.start === 'string' ? new Date(args.start) : args.start;
    const endDate = typeof args.end === 'string' ? new Date(args.end) : args.end;
    
    // Find which project this task belongs to
    const project = projects.find(p => p.tasks.some(t => t.id === args.event.id));
    
    if (project && onTaskReschedule) {
      await onTaskReschedule(args.event.id, startDate, project.id);
    }

    // Update local state
    setEvents(prev =>
      prev.map(e =>
        e.id === args.event.id ? { ...e, start: startDate, end: endDate } : e
      )
    );
  };

  const handleEventResize = async (args: { event: CalendarEvent; start: string | Date; end: string | Date }) => {
    // Convert stringOrDate to Date
    const startDate = typeof args.start === 'string' ? new Date(args.start) : args.start;
    const endDate = typeof args.end === 'string' ? new Date(args.end) : args.end;
    
    // Similar to drop
    const project = projects.find(p => p.tasks.some(t => t.id === args.event.id));
    
    if (project && onTaskReschedule) {
      await onTaskReschedule(args.event.id, endDate, project.id);
    }

    setEvents(prev =>
      prev.map(e =>
        e.id === args.event.id ? { ...e, start: startDate, end: endDate } : e
      )
    );
  };

  const handleNavigate = (action: 'PREV' | 'NEXT' | 'TODAY') => {
    let newDate = new Date(date);
    
    if (action === 'TODAY') {
      newDate = new Date();
    } else if (action === 'PREV') {
      if (view === 'month') newDate = moment(date).subtract(1, 'month').toDate();
      else if (view === 'week') newDate = moment(date).subtract(1, 'week').toDate();
      else if (view === 'day') newDate = moment(date).subtract(1, 'day').toDate();
    } else if (action === 'NEXT') {
      if (view === 'month') newDate = moment(date).add(1, 'month').toDate();
      else if (view === 'week') newDate = moment(date).add(1, 'week').toDate();
      else if (view === 'day') newDate = moment(date).add(1, 'day').toDate();
    }
    
    setDate(newDate);
  };

  const handleExport = (format: 'ical' | 'google' | 'csv') => {
    // Convert CalendarEvents back to Projects format for export
    const exportProjects = projects;
    const options = {
      format,
      includeCompleted: true,
      includeMilestones: true
    };

    try {
      if (format === 'ical') {
        CalendarExportService.exportToICal(exportProjects, options);
      } else if (format === 'google') {
        CalendarExportService.exportToGoogleCalendar(exportProjects, options);
      } else if (format === 'csv') {
        CalendarExportService.exportToCSV(exportProjects, options);
      }
      setShowExportModal(false);
    } catch (error) {
      console.error('Export failed:', error);
      alert('Export failed. Please try again.');
    }
  };

  const handleSavePreset = () => {
    if (!FilterPresetService) {
      alert('Filter presets not available');
      return;
    }

    const name = window.prompt('Preset name:');
    if (!name) return;

    const filters = {
      project: filterProject,
      priority: filterPriority,
      status: filterStatus,
      assignee: filterAssignee,
      milestonesOnly: showMilestonesOnly,
      overdueOnly: showOverdueOnly
    };

    FilterPresetService.savePreset(name, filters);
    setShowPresetModal(false);
  };

  const closeAllModals = () => {
    setShowExportModal(false);
    setShowPresetModal(false);
    setShowTeamModal(false);
    setShowShortcutsModal(false);
    setShowRecurringModal(false);
    setShowNotificationSettings(false);
  };

  const calculateStats = () => {
    const filtered = getFilteredEvents();
    const completed = filtered.filter(e => e.status === TaskStatus.Done).length;
    const inProgress = filtered.filter(e => e.status === TaskStatus.InProgress).length;
    const notStarted = filtered.filter(e => e.status === TaskStatus.ToDo).length;
    const overdue = filtered.filter(e => 
      moment(e.start).isBefore(moment(), 'day') && e.status !== TaskStatus.Done
    ).length;
    const milestones = filtered.filter(e => e.milestone).length;

    return { total: filtered.length, completed, inProgress, notStarted, overdue, milestones };
  };

  const stats = calculateStats();
  const activeFilters = [filterProject, filterPriority, filterStatus, filterAssignee]
    .filter(Boolean).length + (showMilestonesOnly ? 1 : 0) + (showOverdueOnly ? 1 : 0);

  // ✅ FIXED: Properly typed event style getter
  const eventStyleGetter = (event: CalendarEvent) => {
    let backgroundColor = '#3b82f6';
    
    if (event.priority === Priority.High) backgroundColor = '#ef4444';
    else if (event.priority === Priority.Low) backgroundColor = '#10b981';
    
    if (event.status === TaskStatus.Done) backgroundColor = '#6b7280';
    if (event.milestone) backgroundColor = '#8b5cf6';
    if (event.isRecurring) backgroundColor = '#f59e0b';
    
    if (event.assignee) {
      const member = teamMembers.find((m: TeamMember) => m.id === event.assignee);
      if (member) backgroundColor = member.color;
    }

    return {
      style: {
        backgroundColor,
        borderRadius: '4px',
        opacity: 0.9,
        border: event.milestone ? '2px solid #fff' : 'none',
        fontWeight: event.milestone ? 'bold' : 'normal'
      }
    };
  };

  const uniqueProjects = Array.from(new Set(events.map(e => e.project).filter((p): p is string => Boolean(p))));
  const uniqueAssignees = Array.from(new Set(events.map(e => e.assignee).filter((a): a is string => Boolean(a))));

  return (
    <div className="calendar-container" style={{ height: '100vh', padding: '20px', backgroundColor: 'var(--bg-primary)' }}>
      {/* Notifications */}
      {notifications.map((notif, idx) => (
        <div key={idx} style={{
          padding: '12px',
          marginBottom: '12px',
          backgroundColor: notif.type === 'warning' ? '#fef3c7' : '#dbeafe',
          borderLeft: `4px solid ${notif.type === 'warning' ? '#f59e0b' : '#3b82f6'}`,
          borderRadius: '4px'
        }}>
          <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>{notif.message}</div>
          {notif.tasks.length > 0 && (
            <div style={{ fontSize: '14px', color: '#6b7280' }}>
              {notif.tasks.slice(0, 3).map((task, i) => <div key={i}>• {task}</div>)}
              {notif.tasks.length > 3 && <div>...and {notif.tasks.length - 3} more</div>}
            </div>
          )}
        </div>
      ))}

      {/* Stats Bar */}
      <div style={{
        display: 'flex',
        gap: '12px',
        marginBottom: '16px',
        padding: '12px',
        backgroundColor: 'var(--bg-secondary)',
        borderRadius: '8px',
        flexWrap: 'wrap'
      }}>
        <StatBadge label="Total" value={stats.total} color="#3b82f6" />
        <StatBadge label="Completed" value={stats.completed} color="#10b981" />
        <StatBadge label="In Progress" value={stats.inProgress} color="#f59e0b" />
        <StatBadge label="Not Started" value={stats.notStarted} color="#6b7280" />
        <StatBadge label="Overdue" value={stats.overdue} color="#ef4444" />
        <StatBadge label="Milestones" value={stats.milestones} color="#8b5cf6" />
      </div>

      {/* Action Bar */}
      <div style={{ display: 'flex', gap: '12px', marginBottom: '16px', flexWrap: 'wrap' }}>
        <ActionButton 
          onClick={() => setShowFilters(!showFilters)} 
          label={`🔍 Filters ${activeFilters > 0 ? `(${activeFilters})` : ''}`}
        />
        <ActionButton onClick={() => setShowExportModal(true)} label="📤 Export" />
        <ActionButton onClick={() => setShowPresetModal(true)} label="💾 Presets" />
        <ActionButton onClick={() => setShowShortcutsModal(true)} label="⌨️ Shortcuts" />
        <ActionButton onClick={() => handleNavigate('TODAY')} label="📅 Today" />
      </div>

      {/* Filters Panel */}
      {showFilters && (
        <div style={{
          padding: '16px',
          marginBottom: '16px',
          backgroundColor: 'var(--bg-secondary)',
          borderRadius: '8px',
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '12px'
        }}>
          <FilterSelect
            label="Project"
            value={filterProject}
            onChange={setFilterProject}
            options={['', ...uniqueProjects]}
          />
          <FilterSelect
            label="Priority"
            value={filterPriority}
            onChange={setFilterPriority}
            options={['', Priority.Low, Priority.Medium, Priority.High, Priority.Urgent]}
          />
          <FilterSelect
            label="Status"
            value={filterStatus}
            onChange={setFilterStatus}
            options={['', TaskStatus.ToDo, TaskStatus.InProgress, TaskStatus.Done, TaskStatus.OnHold]}
          />
          <FilterSelect
            label="Assignee"
            value={filterAssignee}
            onChange={setFilterAssignee}
            options={['', ...uniqueAssignees]}
          />
          <label style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <input
              type="checkbox"
              checked={showMilestonesOnly}
              onChange={(e) => setShowMilestonesOnly(e.target.checked)}
            />
            Milestones Only
          </label>
          <label style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <input
              type="checkbox"
              checked={showOverdueOnly}
              onChange={(e) => setShowOverdueOnly(e.target.checked)}
            />
            Overdue Only
          </label>
          <button
            onClick={() => {
              setFilterProject('');
              setFilterPriority('');
              setFilterStatus('');
              setFilterAssignee('');
              setShowMilestonesOnly(false);
              setShowOverdueOnly(false);
            }}
            style={{
              padding: '8px 16px',
              backgroundColor: '#ef4444',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer'
            }}
          >
            Clear All
          </button>
        </div>
      )}

      {/* ✅ FIXED: Calendar with proper accessor functions */}
      <div style={{
        height: 'calc(100vh - 350px)',
        backgroundColor: 'white',
        borderRadius: '8px',
        padding: '16px'
      }}>
        <DnDCalendar
          localizer={localizer}
          events={getFilteredEvents()}
          startAccessor={(event: CalendarEvent) => event.start}
          endAccessor={(event: CalendarEvent) => event.end}
          view={view}
          onView={setView}
          date={date}
          onNavigate={setDate}
          onSelectEvent={handleSelectEvent}
          onSelectSlot={handleSelectSlot}
          onEventDrop={handleEventDrop}
          onEventResize={handleEventResize}
          selectable
          resizable
          eventPropGetter={eventStyleGetter}
          style={{ height: '100%' }}
        />
      </div>

      {/* Export Modal */}
      {showExportModal && (
        <Modal title="Export Calendar" onClose={() => setShowExportModal(false)}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <button onClick={() => handleExport('ical')} className="modal-button">
              📅 Export to iCal (.ics)
            </button>
            <button onClick={() => handleExport('google')} className="modal-button">
              🗓️ Add to Google Calendar
            </button>
            <button onClick={() => handleExport('csv')} className="modal-button">
              📊 Export to CSV
            </button>
          </div>
        </Modal>
      )}

      {/* Shortcuts Modal */}
      {showShortcutsModal && (
        <Modal title="Keyboard Shortcuts" onClose={() => setShowShortcutsModal(false)}>
          <div style={{ display: 'grid', gap: '8px' }}>
            {KeyboardShortcutService.getShortcutsByCategory().map((category, idx) => (
              <div key={idx}>
                <h3 style={{ fontWeight: 'bold', marginTop: '12px', marginBottom: '8px' }}>
                  {category.name}
                </h3>
                {category.shortcuts.map((shortcut, sidx) => (
                  <div key={sidx} style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    padding: '4px 0'
                  }}>
                    <span>{shortcut.description}</span>
                    <code style={{
                      backgroundColor: '#f3f4f6',
                      padding: '2px 8px',
                      borderRadius: '4px',
                      fontSize: '12px'
                    }}>
                      {KeyboardShortcutService.getShortcutDisplay(shortcut)}
                    </code>
                  </div>
                ))}
              </div>
            ))}
          </div>
        </Modal>
      )}
    </div>
  );
};

// Helper Components
const StatBadge: React.FC<{ label: string; value: number; color: string }> = ({ label, value, color }) => (
  <div style={{
    padding: '8px 16px',
    backgroundColor: color + '20',
    borderLeft: `3px solid ${color}`,
    borderRadius: '4px',
    display: 'flex',
    flexDirection: 'column'
  }}>
    <span style={{ fontSize: '12px', color: '#6b7280' }}>{label}</span>
    <span style={{ fontSize: '20px', fontWeight: 'bold', color }}>{value}</span>
  </div>
);

const ActionButton: React.FC<{ onClick: () => void; label: string }> = ({ onClick, label }) => (
  <button
    onClick={onClick}
    style={{
      padding: '8px 16px',
      backgroundColor: '#3b82f6',
      color: 'white',
      border: 'none',
      borderRadius: '6px',
      cursor: 'pointer',
      fontWeight: 500
    }}
  >
    {label}
  </button>
);

const FilterSelect: React.FC<{
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: string[];
}> = ({ label, value, onChange, options }) => (
  <div>
    <label style={{ display: 'block', marginBottom: '4px', fontSize: '14px', fontWeight: 500 }}>
      {label}
    </label>
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      style={{
        width: '100%',
        padding: '8px',
        borderRadius: '4px',
        border: '1px solid #d1d5db',
        backgroundColor: 'white'
      }}
    >
      <option value="">All</option>
      {options.filter(o => o !== '').map(option => (
        <option key={option} value={option}>
          {option.charAt(0).toUpperCase() + option.slice(1).replace('-', ' ')}
        </option>
      ))}
    </select>
  </div>
);

const Modal: React.FC<{ title: string; onClose: () => void; children: React.ReactNode }> = ({
  title,
  onClose,
  children
}) => (
  <div
    style={{
      position: 'fixed',
      inset: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000
    }}
    onClick={onClose}
  >
    <div
      style={{
        backgroundColor: 'white',
        borderRadius: '12px',
        padding: '24px',
        maxWidth: '600px',
        width: '90%',
        maxHeight: '80vh',
        overflow: 'auto'
      }}
      onClick={(e) => e.stopPropagation()}
    >
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '20px'
      }}>
        <h2 style={{ fontSize: '24px', fontWeight: 'bold' }}>{title}</h2>
        <button
          onClick={onClose}
          style={{
            background: 'none',
            border: 'none',
            fontSize: '24px',
            cursor: 'pointer',
            color: '#6b7280'
          }}
        >
          ×
        </button>
      </div>
      {children}
    </div>
  </div>
);

export default CalendarView;
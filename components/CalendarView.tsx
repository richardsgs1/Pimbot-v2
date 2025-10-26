// CalendarView_Week4.tsx
// 🎉 FINAL VERSION - Week 4: Complete Feature Set
// ✅ All Weeks 1-3 features + Recurring tasks + Push notifications + PWA + Team views + Keyboard shortcuts

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Calendar, momentLocalizer, View, Event } from 'react-big-calendar';
import moment from 'moment';
import 'react-big-calendar/lib/css/react-big-calendar.css';

// Import all services
import { calendarExportService } from './lib/CalendarExportService';
import { filterPresetService } from './lib/FilterPresetService';
import { recurringTaskService, RecurringTask } from './lib/RecurringTaskService';
import { pushNotificationService } from './lib/PushNotificationService';
import { teamViewService, TeamView, TeamMember } from './lib/TeamViewService';
import { keyboardShortcutService, SHORTCUT_DISPLAY } from './lib/KeyboardShortcutService';

const localizer = momentLocalizer(moment);

// Extended CalendarEvent interface
interface CalendarEvent extends Event {
  id: string;
  title: string;
  start: Date;
  end: Date;
  resourceId?: string;
  project?: string;
  priority?: 'low' | 'medium' | 'high';
  status?: 'not-started' | 'in-progress' | 'completed';
  milestone?: boolean;
  assignee?: string;
  description?: string;
  isRecurring?: boolean;
  recurringId?: string;
}

interface CalendarViewProps {
  tasks?: CalendarEvent[];
  onTaskUpdate?: (taskId: string, updates: Partial<CalendarEvent>) => void;
  onTaskCreate?: (task: Omit<CalendarEvent, 'id'>) => void;
}

interface NotificationBanner {
  type: 'warning' | 'info';
  message: string;
  tasks: string[];
}

export const CalendarView: React.FC<CalendarViewProps> = ({
  tasks = [],
  onTaskUpdate,
  onTaskCreate
}) => {
  // === STATE ===
  const [view, setView] = useState<View>('month');
  const [date, setDate] = useState(new Date());
  const [events, setEvents] = useState<CalendarEvent[]>(tasks);
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
  
  // Week 3 & 4 Features
  const [notifications, setNotifications] = useState<NotificationBanner[]>([]);
  const [activePreset, setActivePreset] = useState<string | null>(null);
  const [teamViews, setTeamViews] = useState<TeamView[]>([]);
  const [activeTeamView, setActiveTeamView] = useState<TeamView | null>(null);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [notificationPermission, setNotificationPermission] = useState<NotificationPermission>('default');
  const [pwaInstallPrompt, setPwaInstallPrompt] = useState<any>(null);
  const [recurringTasks, setRecurringTasks] = useState<RecurringTask[]>([]);
  
  const calendarRef = useRef<any>(null);

  // === INITIALIZATION ===
  useEffect(() => {
    initializeWeek4Features();
    setupKeyboardShortcuts();
    checkNotifications();
    loadTeamData();
    loadRecurringTasks();
    registerPWA();
  }, []);

  // Initialize Week 4 features
  const initializeWeek4Features = async () => {
    // Check notification permission
    const permission = pushNotificationService.getPermissionStatus();
    setNotificationPermission(permission);
    
    // Register service worker
    await pushNotificationService.registerServiceWorker();
    
    // Listen for PWA install prompt
    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault();
      setPwaInstallPrompt(e);
    });
  };

  // Register PWA
  const registerPWA = async () => {
    if ('serviceWorker' in navigator) {
      try {
        await navigator.serviceWorker.register('/service-worker.js');
        console.log('✅ PWA registered');
      } catch (error) {
        console.error('❌ PWA registration failed:', error);
      }
    }
  };

  // Load team data
  const loadTeamData = () => {
    const members = teamViewService.getAllMembers();
    setTeamMembers(members);
    
    const views = teamViewService.getAllViews();
    if (views.length === 0) {
      teamViewService.createDefaultViews('current-user');
      setTeamViews(teamViewService.getAllViews());
    } else {
      setTeamViews(views);
    }
  };

  // Load recurring tasks
  const loadRecurringTasks = () => {
    const recurring = recurringTaskService.getAllRecurringTasks();
    setRecurringTasks(recurring);
    
    // Generate instances for current view
    const instances = recurringTaskService.generateInstancesForRange(
      moment(date).startOf('month').toDate(),
      moment(date).endOf('month').toDate()
    );
    
    // Add to events
    const recurringEvents: CalendarEvent[] = instances.map(instance => ({
      id: instance.id,
      title: instance.title,
      start: instance.date,
      end: instance.date,
      isRecurring: true,
      recurringId: instance.recurringTaskId,
      priority: 'medium',
      status: 'not-started'
    }));
    
    setEvents(prev => [...tasks, ...recurringEvents]);
  };

  // Setup keyboard shortcuts
  const setupKeyboardShortcuts = () => {
    const service = keyboardShortcutService;
    
    // Navigation
    service.register({ key: 'd', description: 'Day view', action: () => setView('day') });
    service.register({ key: 'w', description: 'Week view', action: () => setView('week') });
    service.register({ key: 'm', description: 'Month view', action: () => setView('month') });
    service.register({ key: 'a', description: 'Agenda view', action: () => setView('agenda') });
    service.register({ key: 't', description: 'Today', action: () => setDate(new Date()) });
    service.register({ key: 'arrowleft', description: 'Previous', action: () => handleNavigate('PREV') });
    service.register({ key: 'arrowright', description: 'Next', action: () => handleNavigate('NEXT') });
    
    // Actions
    service.register({ key: 'f', description: 'Toggle filters', action: () => setShowFilters(prev => !prev) });
    service.register({ key: 'e', description: 'Export', action: () => setShowExportModal(true) });
    service.register({ key: 's', description: 'Save preset', action: () => setShowPresetModal(true) });
    service.register({ key: 'p', description: 'Toggle milestones', action: () => setShowMilestonesOnly(prev => !prev) });
    service.register({ key: 'o', description: 'Toggle overdue', action: () => setShowOverdueOnly(prev => !prev) });
    service.register({ key: '?', shiftKey: true, description: 'Show shortcuts', action: () => setShowShortcutsModal(true) });
    service.register({ key: 'Escape', description: 'Close modal', action: closeAllModals });
    
    // Team views
    service.register({ key: '1', ctrlKey: true, description: 'Team 1', action: () => loadTeamView(0) });
    service.register({ key: '2', ctrlKey: true, description: 'Team 2', action: () => loadTeamView(1) });
    service.register({ key: '3', ctrlKey: true, description: 'Team 3', action: () => loadTeamView(2) });
  };

  const closeAllModals = () => {
    setShowExportModal(false);
    setShowPresetModal(false);
    setShowTeamModal(false);
    setShowShortcutsModal(false);
    setShowRecurringModal(false);
    setShowNotificationSettings(false);
  };

  const loadTeamView = (index: number) => {
    if (teamViews[index]) {
      setActiveTeamView(teamViews[index]);
      setShowTeamModal(true);
    }
  };

  // Check and show notifications
  const checkNotifications = () => {
    const tomorrow = moment().add(1, 'day').startOf('day');
    const dueSoon = events.filter(event => {
      const eventDate = moment(event.start);
      return eventDate.isSame(tomorrow, 'day') && event.status !== 'completed';
    });

    if (dueSoon.length > 0) {
      setNotifications([{
        type: 'warning',
        message: `📅 ${dueSoon.length} task(s) due tomorrow`,
        tasks: dueSoon.map(e => e.title)
      }]);

      // Send push notification
      if (notificationPermission === 'granted') {
        dueSoon.forEach(task => {
          pushNotificationService.notifyTaskDue(task.title, task.start);
        });
      }
    }

    // Check overdue
    const overdue = events.filter(event => {
      return moment(event.start).isBefore(moment(), 'day') && event.status !== 'completed';
    });

    if (overdue.length > 0) {
      setNotifications(prev => [...prev, {
        type: 'warning',
        message: `🚨 ${overdue.length} overdue task(s)`,
        tasks: overdue.map(e => e.title)
      }]);
    }
  };

  // Request notification permission
  const requestNotificationPermission = async () => {
    const granted = await pushNotificationService.requestPermission();
    setNotificationPermission(granted ? 'granted' : 'denied');
    
    if (granted) {
      // Send test notification
      await pushNotificationService.showNotification({
        title: '🎉 Notifications Enabled',
        body: 'You\'ll now receive task reminders!',
        tag: 'welcome'
      });
    }
  };

  // Install PWA
  const installPWA = async () => {
    if (!pwaInstallPrompt) return;
    
    pwaInstallPrompt.prompt();
    const { outcome } = await pwaInstallPrompt.userChoice;
    
    if (outcome === 'accepted') {
      console.log('✅ PWA installed');
      setPwaInstallPrompt(null);
    }
  };

  // === FILTERING ===
  const getFilteredEvents = useCallback(() => {
    let filtered = [...events];

    if (filterProject) {
      filtered = filtered.filter(e => e.project === filterProject);
    }
    if (filterPriority) {
      filtered = filtered.filter(e => e.priority === filterPriority);
    }
    if (filterStatus) {
      filtered = filtered.filter(e => e.status === filterStatus);
    }
    if (filterAssignee) {
      filtered = filtered.filter(e => e.assignee === filterAssignee);
    }
    if (showMilestonesOnly) {
      filtered = filtered.filter(e => e.milestone);
    }
    if (showOverdueOnly) {
      const now = new Date();
      filtered = filtered.filter(e => e.start < now && e.status !== 'completed');
    }
    if (activeTeamView) {
      const memberIds = activeTeamView.members.map(m => m.id);
      filtered = filtered.filter(e => e.assignee && memberIds.includes(e.assignee));
    }

    return filtered;
  }, [events, filterProject, filterPriority, filterStatus, filterAssignee, 
      showMilestonesOnly, showOverdueOnly, activeTeamView]);

  // === EVENT HANDLERS ===
  const handleSelectEvent = (event: CalendarEvent) => {
    setSelectedEvent(event);
  };

  const handleSelectSlot = ({ start, end }: { start: Date; end: Date }) => {
    const title = window.prompt('New task title:');
    if (title && onTaskCreate) {
      onTaskCreate({
        title,
        start,
        end,
        priority: 'medium',
        status: 'not-started'
      });
    }
  };

  const handleEventDrop = ({ event, start, end }: any) => {
    const updatedEvent = { ...event, start, end };
    setEvents(events.map(e => (e.id === event.id ? updatedEvent : e)));
    onTaskUpdate?.(event.id, { start, end });
  };

  const handleEventResize = ({ event, start, end }: any) => {
    const updatedEvent = { ...event, start, end };
    setEvents(events.map(e => (e.id === event.id ? updatedEvent : e)));
    onTaskUpdate?.(event.id, { start, end });
  };

  const handleNavigate = (action: 'PREV' | 'NEXT' | 'TODAY') => {
    let newDate = new Date(date);
    
    if (action === 'TODAY') {
      newDate = new Date();
    } else if (action === 'PREV') {
      if (view === 'month') {
        newDate = moment(date).subtract(1, 'month').toDate();
      } else if (view === 'week') {
        newDate = moment(date).subtract(1, 'week').toDate();
      } else if (view === 'day') {
        newDate = moment(date).subtract(1, 'day').toDate();
      }
    } else if (action === 'NEXT') {
      if (view === 'month') {
        newDate = moment(date).add(1, 'month').toDate();
      } else if (view === 'week') {
        newDate = moment(date).add(1, 'week').toDate();
      } else if (view === 'day') {
        newDate = moment(date).add(1, 'day').toDate();
      }
    }
    
    setDate(newDate);
    
    // Reload recurring task instances for new date range
    if (recurringTasks.length > 0) {
      loadRecurringTasks();
    }
  };

  // === EXPORT ===
  const handleExport = (format: 'ical' | 'google' | 'csv') => {
    const filtered = getFilteredEvents();
    
    if (format === 'ical') {
      const blob = calendarExportService.exportToICal(filtered, 'TaskFlow Calendar');
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'calendar.ics';
      a.click();
    } else if (format === 'google') {
      const url = calendarExportService.exportToGoogleCalendar(filtered[0]);
      window.open(url, '_blank');
    } else if (format === 'csv') {
      const blob = calendarExportService.exportToCSV(filtered);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'calendar.csv';
      a.click();
    }
    
    setShowExportModal(false);
  };

  // === PRESETS ===
  const handleSavePreset = () => {
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

    filterPresetService.savePreset(name, filters);
    setShowPresetModal(false);
  };

  const handleLoadPreset = (presetId: string) => {
    const preset = filterPresetService.getPreset(presetId);
    if (!preset) return;

    setFilterProject(preset.filters.project || '');
    setFilterPriority(preset.filters.priority || '');
    setFilterStatus(preset.filters.status || '');
    setFilterAssignee(preset.filters.assignee || '');
    setShowMilestonesOnly(preset.filters.milestonesOnly || false);
    setShowOverdueOnly(preset.filters.overdueOnly || false);
    setActivePreset(presetId);
    setShowPresetModal(false);
  };

  const handleDeletePreset = (presetId: string) => {
    filterPresetService.deletePreset(presetId);
    if (activePreset === presetId) {
      setActivePreset(null);
    }
  };

  // === RECURRING TASKS ===
  const handleCreateRecurring = () => {
    const title = window.prompt('Recurring task title:');
    if (!title) return;

    const pattern = window.prompt('Pattern (daily/weekly/monthly):');
    if (!pattern || !['daily', 'weekly', 'monthly'].includes(pattern)) return;

    const task: Omit<RecurringTask, 'id' | 'createdAt'> = {
      title,
      pattern: pattern as 'daily' | 'weekly' | 'monthly',
      startDate: new Date(),
      interval: 1,
      active: true
    };

    const recurring = recurringTaskService.createRecurringTask(task);
    setRecurringTasks(prev => [...prev, recurring]);
    loadRecurringTasks();
  };

  // === TEAM VIEWS ===
  const handleCreateTeamView = () => {
    const name = window.prompt('Team view name:');
    if (!name) return;

    // For demo, select first 3 members
    const memberIds = teamMembers.slice(0, 3).map(m => m.id);
    const view = teamViewService.createView(name, memberIds, 'current-user');
    setTeamViews(prev => [...prev, view]);
  };

  const handleLoadTeamView = (view: TeamView) => {
    setActiveTeamView(view);
    setShowTeamModal(false);
  };

  // === STATS ===
  const calculateStats = () => {
    const filtered = getFilteredEvents();
    const completed = filtered.filter(e => e.status === 'completed').length;
    const inProgress = filtered.filter(e => e.status === 'in-progress').length;
    const notStarted = filtered.filter(e => e.status === 'not-started').length;
    const overdue = filtered.filter(e => 
      moment(e.start).isBefore(moment(), 'day') && e.status !== 'completed'
    ).length;
    const milestones = filtered.filter(e => e.milestone).length;

    return { total: filtered.length, completed, inProgress, notStarted, overdue, milestones };
  };

  const stats = calculateStats();
  const activeFilters = [filterProject, filterPriority, filterStatus, filterAssignee]
    .filter(Boolean).length + (showMilestonesOnly ? 1 : 0) + (showOverdueOnly ? 1 : 0);

  // === EVENT STYLING ===
  const eventStyleGetter = (event: CalendarEvent) => {
    let backgroundColor = '#3b82f6';
    
    if (event.priority === 'high') backgroundColor = '#ef4444';
    else if (event.priority === 'low') backgroundColor = '#10b981';
    
    if (event.status === 'completed') backgroundColor = '#6b7280';
    if (event.milestone) backgroundColor = '#8b5cf6';
    if (event.isRecurring) backgroundColor = '#f59e0b';
    
    // Team member color
    if (event.assignee) {
      const member = teamMembers.find(m => m.id === event.assignee);
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

  // === RENDER ===
  return (
    <div className="calendar-container" style={{ height: '100vh', padding: '20px' }}>
      {/* Notification Banners */}
      {notifications.map((notif, idx) => (
        <div
          key={idx}
          style={{
            padding: '12px',
            marginBottom: '12px',
            backgroundColor: notif.type === 'warning' ? '#fef3c7' : '#dbeafe',
            borderLeft: `4px solid ${notif.type === 'warning' ? '#f59e0b' : '#3b82f6'}`,
            borderRadius: '4px'
          }}
        >
          <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>{notif.message}</div>
          {notif.tasks.length > 0 && (
            <div style={{ fontSize: '14px', color: '#6b7280' }}>
              {notif.tasks.slice(0, 3).map((task, i) => (
                <div key={i}>• {task}</div>
              ))}
              {notif.tasks.length > 3 && <div>...and {notif.tasks.length - 3} more</div>}
            </div>
          )}
        </div>
      ))}

      {/* Action Bar */}
      <div style={{ display: 'flex', gap: '12px', marginBottom: '16px', flexWrap: 'wrap', alignItems: 'center' }}>
        <button
          onClick={() => setShowFilters(!showFilters)}
          style={{
            padding: '8px 16px',
            backgroundColor: '#3b82f6',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer'
          }}
        >
          🔍 Filters {activeFilters > 0 && `(${activeFilters})`}
        </button>

        <button
          onClick={() => setShowPresetModal(true)}
          style={{
            padding: '8px 16px',
            backgroundColor: activePreset ? '#10b981' : '#6b7280',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer'
          }}
        >
          🔖 Presets {activePreset && '✓'}
        </button>

        <button
          onClick={() => setShowExportModal(true)}
          style={{
            padding: '8px 16px',
            backgroundColor: '#8b5cf6',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer'
          }}
        >
          📤 Export
        </button>

        <button
          onClick={() => setShowTeamModal(true)}
          style={{
            padding: '8px 16px',
            backgroundColor: '#f59e0b',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer'
          }}
        >
          👥 Team {activeTeamView && `(${activeTeamView.name})`}
        </button>

        <button
          onClick={() => setShowRecurringModal(true)}
          style={{
            padding: '8px 16px',
            backgroundColor: '#ec4899',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer'
          }}
        >
          🔄 Recurring ({recurringTasks.length})
        </button>

        <button
          onClick={() => setShowNotificationSettings(true)}
          style={{
            padding: '8px 16px',
            backgroundColor: notificationPermission === 'granted' ? '#10b981' : '#6b7280',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer'
          }}
        >
          🔔 Notifications {notificationPermission === 'granted' && '✓'}
        </button>

        {pwaInstallPrompt && (
          <button
            onClick={installPWA}
            style={{
              padding: '8px 16px',
              backgroundColor: '#06b6d4',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer'
            }}
          >
            📱 Install App
          </button>
        )}

        <button
          onClick={() => setShowShortcutsModal(true)}
          style={{
            padding: '8px 16px',
            backgroundColor: '#6b7280',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer'
          }}
        >
          ⌨️ Shortcuts
        </button>

        <label style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <input
            type="checkbox"
            checked={showMilestonesOnly}
            onChange={(e) => setShowMilestonesOnly(e.target.checked)}
          />
          ⭐ Milestones Only
        </label>

        <label style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <input
            type="checkbox"
            checked={showOverdueOnly}
            onChange={(e) => setShowOverdueOnly(e.target.checked)}
          />
          🚨 Overdue Only
        </label>
      </div>

      {/* Filters Panel */}
      {showFilters && (
        <div style={{
          padding: '16px',
          marginBottom: '16px',
          backgroundColor: '#f3f4f6',
          borderRadius: '8px',
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '12px'
        }}>
          <select
            value={filterProject}
            onChange={(e) => setFilterProject(e.target.value)}
            style={{ padding: '8px', borderRadius: '4px', border: '1px solid #d1d5db' }}
          >
            <option value="">All Projects</option>
            <option value="Project A">Project A</option>
            <option value="Project B">Project B</option>
            <option value="Project C">Project C</option>
          </select>

          <select
            value={filterPriority}
            onChange={(e) => setFilterPriority(e.target.value)}
            style={{ padding: '8px', borderRadius: '4px', border: '1px solid #d1d5db' }}
          >
            <option value="">All Priorities</option>
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
          </select>

          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            style={{ padding: '8px', borderRadius: '4px', border: '1px solid #d1d5db' }}
          >
            <option value="">All Statuses</option>
            <option value="not-started">Not Started</option>
            <option value="in-progress">In Progress</option>
            <option value="completed">Completed</option>
          </select>

          <select
            value={filterAssignee}
            onChange={(e) => setFilterAssignee(e.target.value)}
            style={{ padding: '8px', borderRadius: '4px', border: '1px solid #d1d5db' }}
          >
            <option value="">All Assignees</option>
            {teamMembers.map(member => (
              <option key={member.id} value={member.id}>{member.name}</option>
            ))}
          </select>

          <button
            onClick={() => {
              setFilterProject('');
              setFilterPriority('');
              setFilterStatus('');
              setFilterAssignee('');
              setShowMilestonesOnly(false);
              setShowOverdueOnly(false);
              setActivePreset(null);
              setActiveTeamView(null);
            }}
            style={{
              padding: '8px',
              backgroundColor: '#ef4444',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            Clear All
          </button>
        </div>
      )}

      {/* Stats Bar */}
      <div style={{
        display: 'flex',
        gap: '12px',
        marginBottom: '16px',
        flexWrap: 'wrap'
      }}>
        <div style={{ padding: '8px 16px', backgroundColor: '#dbeafe', borderRadius: '6px' }}>
          📊 Total: <strong>{stats.total}</strong>
        </div>
        <div style={{ padding: '8px 16px', backgroundColor: '#d1fae5', borderRadius: '6px' }}>
          ✅ Completed: <strong>{stats.completed}</strong>
        </div>
        <div style={{ padding: '8px 16px', backgroundColor: '#fef3c7', borderRadius: '6px' }}>
          ⚡ In Progress: <strong>{stats.inProgress}</strong>
        </div>
        <div style={{ padding: '8px 16px', backgroundColor: '#fee2e2', borderRadius: '6px' }}>
          🚨 Overdue: <strong>{stats.overdue}</strong>
        </div>
        <div style={{ padding: '8px 16px', backgroundColor: '#ede9fe', borderRadius: '6px' }}>
          ⭐ Milestones: <strong>{stats.milestones}</strong>
        </div>
        {recurringTasks.length > 0 && (
          <div style={{ padding: '8px 16px', backgroundColor: '#fed7aa', borderRadius: '6px' }}>
            🔄 Recurring: <strong>{recurringTasks.length}</strong>
          </div>
        )}
      </div>

      {/* Calendar */}
      <div style={{ height: 'calc(100vh - 300px)', backgroundColor: 'white', borderRadius: '8px', padding: '16px' }}>
        <Calendar
          ref={calendarRef}
          localizer={localizer}
          events={getFilteredEvents()}
          startAccessor="start"
          endAccessor="end"
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
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            backgroundColor: 'white',
            padding: '24px',
            borderRadius: '12px',
            minWidth: '300px'
          }}>
            <h3 style={{ marginTop: 0 }}>📤 Export Calendar</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <button
                onClick={() => handleExport('ical')}
                style={{
                  padding: '12px',
                  backgroundColor: '#3b82f6',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer'
                }}
              >
                📅 iCal Format (.ics)
              </button>
              <button
                onClick={() => handleExport('google')}
                style={{
                  padding: '12px',
                  backgroundColor: '#10b981',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer'
                }}
              >
                🗓️ Google Calendar
              </button>
              <button
                onClick={() => handleExport('csv')}
                style={{
                  padding: '12px',
                  backgroundColor: '#8b5cf6',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer'
                }}
              >
                📊 CSV Spreadsheet
              </button>
              <button
                onClick={() => setShowExportModal(false)}
                style={{
                  padding: '12px',
                  backgroundColor: '#6b7280',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer'
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Preset Modal */}
      {showPresetModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            backgroundColor: 'white',
            padding: '24px',
            borderRadius: '12px',
            minWidth: '400px',
            maxHeight: '80vh',
            overflow: 'auto'
          }}>
            <h3 style={{ marginTop: 0 }}>🔖 Filter Presets</h3>
            
            <button
              onClick={handleSavePreset}
              style={{
                padding: '12px',
                backgroundColor: '#10b981',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                width: '100%',
                marginBottom: '16px'
              }}
            >
              💾 Save Current Filters
            </button>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {filterPresetService.getAllPresets().map(preset => (
                <div
                  key={preset.id}
                  style={{
                    padding: '12px',
                    backgroundColor: activePreset === preset.id ? '#dbeafe' : '#f3f4f6',
                    borderRadius: '6px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}
                >
                  <span
                    onClick={() => handleLoadPreset(preset.id)}
                    style={{ cursor: 'pointer', flex: 1 }}
                  >
                    {preset.name} {activePreset === preset.id && '✓'}
                  </span>
                  {!preset.isBuiltIn && (
                    <button
                      onClick={() => handleDeletePreset(preset.id)}
                      style={{
                        padding: '4px 8px',
                        backgroundColor: '#ef4444',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        fontSize: '12px'
                      }}
                    >
                      🗑️
                    </button>
                  )}
                </div>
              ))}
            </div>

            <button
              onClick={() => setShowPresetModal(false)}
              style={{
                padding: '12px',
                backgroundColor: '#6b7280',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                width: '100%',
                marginTop: '16px'
              }}
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* Team View Modal */}
      {showTeamModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            backgroundColor: 'white',
            padding: '24px',
            borderRadius: '12px',
            minWidth: '500px',
            maxHeight: '80vh',
            overflow: 'auto'
          }}>
            <h3 style={{ marginTop: 0 }}>👥 Team Calendar Views</h3>

            <button
              onClick={handleCreateTeamView}
              style={{
                padding: '12px',
                backgroundColor: '#10b981',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                width: '100%',
                marginBottom: '16px'
              }}
            >
              ➕ Create New Team View
            </button>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {teamViews.map(view => (
                <div
                  key={view.id}
                  style={{
                    padding: '16px',
                    backgroundColor: activeTeamView?.id === view.id ? '#dbeafe' : '#f3f4f6',
                    borderRadius: '8px'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <strong>{view.name}</strong>
                    <button
                      onClick={() => handleLoadTeamView(view)}
                      style={{
                        padding: '6px 12px',
                        backgroundColor: '#3b82f6',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        fontSize: '12px'
                      }}
                    >
                      Load View
                    </button>
                  </div>
                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                    {view.members.map(member => (
                      <span
                        key={member.id}
                        style={{
                          padding: '4px 8px',
                          backgroundColor: member.color,
                          color: 'white',
                          borderRadius: '12px',
                          fontSize: '12px'
                        }}
                      >
                        {member.name}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            <button
              onClick={() => {
                setActiveTeamView(null);
                setShowTeamModal(false);
              }}
              style={{
                padding: '12px',
                backgroundColor: '#6b7280',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                width: '100%',
                marginTop: '16px'
              }}
            >
              {activeTeamView ? 'Clear Team View' : 'Close'}
            </button>
          </div>
        </div>
      )}

      {/* Recurring Tasks Modal */}
      {showRecurringModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            backgroundColor: 'white',
            padding: '24px',
            borderRadius: '12px',
            minWidth: '400px',
            maxHeight: '80vh',
            overflow: 'auto'
          }}>
            <h3 style={{ marginTop: 0 }}>🔄 Recurring Tasks</h3>

            <button
              onClick={handleCreateRecurring}
              style={{
                padding: '12px',
                backgroundColor: '#10b981',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                width: '100%',
                marginBottom: '16px'
              }}
            >
              ➕ Create Recurring Task
            </button>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {recurringTasks.map(task => (
                <div
                  key={task.id}
                  style={{
                    padding: '12px',
                    backgroundColor: task.active ? '#f3f4f6' : '#fee2e2',
                    borderRadius: '6px'
                  }}
                >
                  <div style={{ fontWeight: 'bold' }}>{task.title}</div>
                  <div style={{ fontSize: '14px', color: '#6b7280' }}>
                    {task.pattern} • Every {task.interval} {task.pattern}
                  </div>
                  {task.endDate && (
                    <div style={{ fontSize: '12px', color: '#6b7280' }}>
                      Ends: {moment(task.endDate).format('MMM D, YYYY')}
                    </div>
                  )}
                </div>
              ))}
              {recurringTasks.length === 0 && (
                <div style={{ padding: '12px', textAlign: 'center', color: '#6b7280' }}>
                  No recurring tasks yet
                </div>
              )}
            </div>

            <button
              onClick={() => setShowRecurringModal(false)}
              style={{
                padding: '12px',
                backgroundColor: '#6b7280',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                width: '100%',
                marginTop: '16px'
              }}
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* Notification Settings Modal */}
      {showNotificationSettings && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            backgroundColor: 'white',
            padding: '24px',
            borderRadius: '12px',
            minWidth: '400px'
          }}>
            <h3 style={{ marginTop: 0 }}>🔔 Notification Settings</h3>

            <div style={{ marginBottom: '16px' }}>
              <p>Status: <strong>
                {notificationPermission === 'granted' ? '✅ Enabled' : 
                 notificationPermission === 'denied' ? '❌ Blocked' : 
                 '⚠️ Not Set'}
              </strong></p>
            </div>

            {notificationPermission !== 'granted' && (
              <button
                onClick={requestNotificationPermission}
                style={{
                  padding: '12px',
                  backgroundColor: '#10b981',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  width: '100%',
                  marginBottom: '16px'
                }}
              >
                Enable Notifications
              </button>
            )}

            <div style={{ fontSize: '14px', color: '#6b7280', marginBottom: '16px' }}>
              <p>You'll receive notifications for:</p>
              <ul>
                <li>Tasks due tomorrow</li>
                <li>Overdue tasks</li>
                <li>Project deadlines</li>
                <li>Team mentions</li>
              </ul>
            </div>

            <button
              onClick={() => setShowNotificationSettings(false)}
              style={{
                padding: '12px',
                backgroundColor: '#6b7280',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                width: '100%'
              }}
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* Keyboard Shortcuts Modal */}
      {showShortcutsModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            backgroundColor: 'white',
            padding: '24px',
            borderRadius: '12px',
            minWidth: '600px',
            maxHeight: '80vh',
            overflow: 'auto'
          }}>
            <h3 style={{ marginTop: 0 }}>⌨️ Keyboard Shortcuts</h3>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '24px' }}>
              {Object.entries(SHORTCUT_DISPLAY).map(([category, shortcuts]) => (
                <div key={category}>
                  <h4 style={{ 
                    marginTop: 0, 
                    marginBottom: '12px', 
                    textTransform: 'capitalize',
                    color: '#3b82f6'
                  }}>
                    {category}
                  </h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {shortcuts.map((shortcut, idx) => (
                      <div
                        key={idx}
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          padding: '8px',
                          backgroundColor: '#f3f4f6',
                          borderRadius: '4px'
                        }}
                      >
                        <span style={{ fontSize: '14px' }}>{shortcut.description}</span>
                        <div style={{ display: 'flex', gap: '4px' }}>
                          {shortcut.keys.map((key, kidx) => (
                            <kbd
                              key={kidx}
                              style={{
                                padding: '2px 6px',
                                backgroundColor: 'white',
                                border: '1px solid #d1d5db',
                                borderRadius: '3px',
                                fontSize: '12px',
                                fontFamily: 'monospace'
                              }}
                            >
                              {key}
                            </kbd>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            <button
              onClick={() => setShowShortcutsModal(false)}
              style={{
                padding: '12px',
                backgroundColor: '#6b7280',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                width: '100%',
                marginTop: '24px'
              }}
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* Legend */}
      <div style={{
        marginTop: '16px',
        padding: '12px',
        backgroundColor: '#f9fafb',
        borderRadius: '8px',
        display: 'flex',
        gap: '16px',
        flexWrap: 'wrap',
        fontSize: '14px'
      }}>
        <span><span style={{ display: 'inline-block', width: '12px', height: '12px', backgroundColor: '#ef4444', borderRadius: '2px', marginRight: '4px' }}></span>High Priority</span>
        <span><span style={{ display: 'inline-block', width: '12px', height: '12px', backgroundColor: '#3b82f6', borderRadius: '2px', marginRight: '4px' }}></span>Medium Priority</span>
        <span><span style={{ display: 'inline-block', width: '12px', height: '12px', backgroundColor: '#10b981', borderRadius: '2px', marginRight: '4px' }}></span>Low Priority</span>
        <span><span style={{ display: 'inline-block', width: '12px', height: '12px', backgroundColor: '#8b5cf6', border: '2px solid #fff', borderRadius: '2px', marginRight: '4px' }}></span>Milestone</span>
        <span><span style={{ display: 'inline-block', width: '12px', height: '12px', backgroundColor: '#f59e0b', borderRadius: '2px', marginRight: '4px' }}></span>Recurring</span>
        <span><span style={{ display: 'inline-block', width: '12px', height: '12px', backgroundColor: '#6b7280', borderRadius: '2px', marginRight: '4px' }}></span>Completed</span>
      </div>
    </div>
  );
};

export default CalendarView;
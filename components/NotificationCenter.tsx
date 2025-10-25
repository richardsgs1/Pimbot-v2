import React, { useState, useEffect } from 'react';
import type { Project, ProjectStatus, Priority } from '../types';
import { PROJECT_STATUS_VALUES, PRIORITY_VALUES } from '../types';
import type { SmartNotification } from '../lib/SmartNotificationEngine';

export interface Notification {
  id: string;
  type: 'task-due' | 'project-status' | 'budget-alert' | 'overdue' | 'milestone' | 'info';
  title: string;
  message: string;
  timestamp: Date;
  read: boolean;
  priority: 'low' | 'medium' | 'high' | 'critical';
  projectId?: string;
  actionLink?: string;
}

interface NotificationCenterProps {
  projects: Project[];
  smartNotifications?: SmartNotification[];
  onNotificationClick: (notification: Notification) => void;
}

const NotificationCenter: React.FC<NotificationCenterProps> = ({ 
  projects,
  smartNotifications = [],
  onNotificationClick 
}) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [showPanel, setShowPanel] = useState(false);
  const [filter, setFilter] = useState<'all' | 'unread'>('all');

  // Generate notifications from project data
  useEffect(() => {
    const newNotifications: Notification[] = [];
    const now = new Date();

    projects.forEach(project => {
      // Task due date reminders
      project.tasks.forEach(task => {
        if (!task.completed && task.dueDate) {
          const dueDate = new Date(task.dueDate);
          const daysUntilDue = Math.ceil((dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

          // Overdue tasks
          if (daysUntilDue < 0) {
            newNotifications.push({
              id: `overdue-${task.id}`,
              type: 'overdue',
              title: 'Task Overdue',
              message: `"${task.name}" in ${project.name} is ${Math.abs(daysUntilDue)} day${Math.abs(daysUntilDue) !== 1 ? 's' : ''} overdue`,
              timestamp: dueDate,
              read: false,
              priority: task.priority === PRIORITY_VALUES.High ? 'critical' : 'high',
              projectId: project.id
            });
          }
          // Due within 3 days
          else if (daysUntilDue <= 3 && daysUntilDue >= 0) {
            newNotifications.push({
              id: `due-soon-${task.id}`,
              type: 'task-due',
              title: 'Task Due Soon',
              message: `"${task.name}" in ${project.name} is due in ${daysUntilDue} day${daysUntilDue !== 1 ? 's' : ''}`,
              timestamp: now,
              read: false,
              priority: daysUntilDue === 0 ? 'high' : 'medium',
              projectId: project.id
            });
          }
          // Due within 7 days (for high priority tasks)
          else if (daysUntilDue <= 7 && (task.priority === PRIORITY_VALUES.High)) {
            newNotifications.push({
              id: `upcoming-${task.id}`,
              type: 'task-due',
              title: 'High Priority Task Upcoming',
              message: `"${task.name}" in ${project.name} is due in ${daysUntilDue} days`,
              timestamp: now,
              read: false,
              priority: 'medium',
              projectId: project.id
            });
          }
        }
      });

      // Project status alerts
      if (project.status === PROJECT_STATUS_VALUES.AtRisk) {
        newNotifications.push({
          id: `status-${project.id}`,
          type: 'project-status',
          title: 'Project At Risk',
          message: `${project.name} is currently at risk and needs attention`,
          timestamp: now,
          read: false,
          priority: 'high',
          projectId: project.id
        });
      } else if (project.status === PROJECT_STATUS_VALUES.OnHold) {
        newNotifications.push({
          id: `status-offtrack-${project.id}`,
          type: 'project-status',
          title: 'Project Off Track',
          message: `${project.name} is off track - immediate action required`,
          timestamp: now,
          read: false,
          priority: 'critical',
          projectId: project.id
        });
      }

      // Budget threshold alerts
      if (project.budget && project.spent) {
        const budgetUtilization = (project.spent / project.budget) * 100;
        
        if (budgetUtilization > 100) {
          newNotifications.push({
            id: `budget-over-${project.id}`,
            type: 'budget-alert',
            title: 'Budget Exceeded',
            message: `${project.name} is ${(budgetUtilization - 100).toFixed(1)}% over budget`,
            timestamp: now,
            read: false,
            priority: 'critical',
            projectId: project.id
          });
        } else if (budgetUtilization >= 90) {
          newNotifications.push({
            id: `budget-high-${project.id}`,
            type: 'budget-alert',
            title: 'Budget Alert',
            message: `${project.name} has used ${budgetUtilization.toFixed(1)}% of budget`,
            timestamp: now,
            read: false,
            priority: 'high',
            projectId: project.id
          });
        } else if (budgetUtilization >= 75) {
          newNotifications.push({
            id: `budget-warning-${project.id}`,
            type: 'budget-alert',
            title: 'Budget Warning',
            message: `${project.name} has used ${budgetUtilization.toFixed(1)}% of budget`,
            timestamp: now,
            read: false,
            priority: 'medium',
            projectId: project.id
          });
        }
      }

      // Project deadline approaching
      if (!project.dueDate) return;
      const projectDueDate = new Date(project.dueDate);
      const daysUntilProjectDue = Math.ceil((projectDueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      
      if (daysUntilProjectDue <= 7 && daysUntilProjectDue > 0 && project.status !== PROJECT_STATUS_VALUES.Completed) {
        newNotifications.push({
          id: `project-due-${project.id}`,
          type: 'milestone',
          title: 'Project Deadline Approaching',
          message: `${project.name} is due in ${daysUntilProjectDue} day${daysUntilProjectDue !== 1 ? 's' : ''}`,
          timestamp: now,
          read: false,
          priority: daysUntilProjectDue <= 3 ? 'high' : 'medium',
          projectId: project.id
        });
      }
    });

    // Sort by priority and timestamp
    newNotifications.sort((a, b) => {
      const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
      const priorityDiff = priorityOrder[a.priority] - priorityOrder[b.priority];
      if (priorityDiff !== 0) return priorityDiff;
      return b.timestamp.getTime() - a.timestamp.getTime();
    });

    setNotifications(newNotifications);
  }, [projects]);

  const unreadCount = notifications.filter(n => !n.read).length;
  const filteredNotifications = filter === 'unread' 
    ? notifications.filter(n => !n.read)
    : notifications;

  const markAsRead = (id: string) => {
    setNotifications(prev =>
      prev.map(n => n.id === id ? { ...n, read: true } : n)
    );
  };

  const markAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  const clearAll = () => {
    setNotifications([]);
  };

  const getNotificationIcon = (type: Notification['type']) => {
    switch (type) {
      case 'task-due':
        return '📅';
      case 'overdue':
        return '🔴';
      case 'project-status':
        return '⚠️';
      case 'budget-alert':
        return '💰';
      case 'milestone':
        return '🎯';
      default:
        return 'ℹ️';
    }
  };

  const getPriorityColor = (priority: Notification['priority']) => {
    switch (priority) {
      case 'critical':
        return 'bg-red-500/10 border-red-500/30 text-red-600 dark:text-red-400';
      case 'high':
        return 'bg-orange-500/10 border-orange-500/30 text-orange-600 dark:text-orange-400';
      case 'medium':
        return 'bg-yellow-500/10 border-yellow-500/30 text-yellow-600 dark:text-yellow-400';
      default:
        return 'bg-blue-500/10 border-blue-500/30 text-blue-600 dark:text-blue-400';
    }
  };

  const handleNotificationClick = (notification: Notification) => {
    markAsRead(notification.id);
    if (onNotificationClick) {
      onNotificationClick(notification);
    }
  };

  return (
    <div className="relative">
      {/* Notification Bell Button */}
      <button
        onClick={() => setShowPanel(!showPanel)}
        className="relative p-2 hover:bg-[var(--bg-tertiary)] rounded-lg transition-colors"
        title="Notifications"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-[var(--text-primary)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
        
        </svg>
        
        {/* Unread Badge */}
        {(unreadCount + smartNotifications.length) > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
            {Math.min(unreadCount + smartNotifications.length, 9)}+
          </span>
        )}
      </button>

      {/* Notification Panel */}
        {showPanel && (
        <>
            {/* Backdrop */}
            <div 
            className="fixed inset-0 z-40" 
            onClick={() => setShowPanel(false)}
            />
            
            {/* Panel - MOBILE RESPONSIVE */}
            <div className="absolute right-0 mt-2 w-[calc(100vw-2rem)] sm:w-[420px] md:w-96 bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-xl shadow-2xl z-50 max-h-[80vh] sm:max-h-[600px] flex flex-col">
            {/* Header */}
            <div className="p-3 sm:p-4 border-b border-[var(--border-primary)]">
                <div className="flex items-center justify-between mb-3">
                <h3 className="text-base sm:text-lg font-bold text-[var(--text-primary)]">Notifications</h3>
                <div className="flex items-center gap-2">
                    {unreadCount > 0 && (
                    <button
                        onClick={markAllAsRead}
                        className="text-xs text-[var(--accent-primary)] hover:text-[var(--accent-secondary)] px-2 py-1"
                    >
                        Mark all read
                    </button>
                    )}
                    <button
                    onClick={clearAll}
                    className="text-xs text-[var(--text-tertiary)] hover:text-[var(--text-primary)] px-2 py-1"
                    >
                    Clear all
                    </button>
                </div>
                </div>

                {/* Filter Tabs - MOBILE OPTIMIZED */}
                <div className="flex gap-2">
                <button
                    onClick={() => setFilter('all')}
                    className={`flex-1 sm:flex-none px-3 py-1.5 sm:py-1 rounded-lg text-xs sm:text-sm transition-colors ${
                    filter === 'all'
                        ? 'bg-[var(--accent-primary)] text-white'
                        : 'bg-[var(--bg-tertiary)] text-[var(--text-secondary)] hover:bg-[var(--bg-tertiary)]'
                    }`}
                >
                    All ({notifications.length})
                </button>
                <button
                    onClick={() => setFilter('unread')}
                    className={`flex-1 sm:flex-none px-3 py-1.5 sm:py-1 rounded-lg text-xs sm:text-sm transition-colors ${
                    filter === 'unread'
                        ? 'bg-[var(--accent-primary)] text-white'
                        : 'bg-[var(--bg-tertiary)] text-[var(--text-secondary)] hover:bg-[var(--bg-tertiary)]'
                    }`}
                >
                    Unread ({unreadCount})
                </button>
                </div>
            </div>

            {/* Notification List - MOBILE SCROLLING */}
            <div className="flex-1 overflow-y-auto overscroll-contain">
                {/* Smart Notifications Section */}
                {smartNotifications.length > 0 && (
                <>
                    <div className="px-3 sm:px-4 py-2 bg-[var(--bg-tertiary)] border-b border-[var(--border-primary)] sticky top-0 z-10">
                    <h3 className="text-xs font-semibold text-[var(--text-secondary)] uppercase">
                        AI Alerts ({smartNotifications.length})
                    </h3>
                    </div>
                    
                    {smartNotifications.map(smartNotif => (
                    <div
                        key={smartNotif.id}
                        className={`p-3 sm:p-4 border-b border-[var(--border-primary)] hover:bg-[var(--bg-tertiary)] active:bg-[var(--bg-tertiary)] cursor-pointer transition-colors ${
                        smartNotif.severity === 'critical' ? 'border-l-4 border-l-red-500' :
                        smartNotif.severity === 'warning' ? 'border-l-4 border-l-yellow-500' :
                        'border-l-4 border-l-blue-500'
                        }`}
                        onClick={() => {
                        if (smartNotif.projectId) {
                            onNotificationClick({
                            id: smartNotif.id,
                            type: smartNotif.severity === 'critical' ? 'overdue' : 'info',
                            title: smartNotif.title,
                            message: smartNotif.message,
                            timestamp: smartNotif.timestamp,
                            projectId: smartNotif.projectId,
                            read: false,
                            priority: smartNotif.severity as any
                            });
                            setShowPanel(false); // Close panel on mobile after click
                        }
                        }}
                    >
                        <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-[var(--text-primary)] mb-1 break-words">
                            {smartNotif.title}
                            </p>
                            <p className="text-xs text-[var(--text-tertiary)] mb-2 break-words">
                            {smartNotif.message}
                            </p>
                            {smartNotif.suggestedAction && (
                            <div className="mt-2 p-2 bg-[var(--accent-primary)]/10 rounded text-xs">
                                <span className="font-semibold text-[var(--accent-primary)]">💡 Suggestion: </span>
                                <span className="text-[var(--text-secondary)] break-words">{smartNotif.suggestedAction}</span>
                            </div>
                            )}
                            <p className="text-xs text-[var(--text-tertiary)] mt-2">
                            {new Date(smartNotif.timestamp).toLocaleTimeString()}
                            </p>
                        </div>
                        <span className={`flex-shrink-0 ml-2 px-2 py-1 rounded text-xs font-semibold ${
                            smartNotif.severity === 'critical' ? 'bg-red-500/20 text-red-400' :
                            smartNotif.severity === 'warning' ? 'bg-yellow-500/20 text-yellow-400' :
                            'bg-blue-500/20 text-blue-400'
                        }`}>
                            {smartNotif.severity.toUpperCase()}
                        </span>
                        </div>
                    </div>
                    ))}
                </>
                )}

                {/* Regular Notifications Section */}
                {filteredNotifications.length > 0 ? (
                <div className="divide-y divide-[var(--border-primary)]">
                    {filteredNotifications.map(notification => (
                    <button
                        key={notification.id}
                        onClick={() => {
                        handleNotificationClick(notification);
                        setShowPanel(false); // Close panel on mobile after click
                        }}
                        className={`w-full p-3 sm:p-4 text-left hover:bg-[var(--bg-tertiary)] active:bg-[var(--bg-tertiary)] transition-colors ${
                        !notification.read ? 'bg-[var(--accent-primary)]/5' : ''
                        }`}
                    >
                        <div className="flex items-start gap-2 sm:gap-3">
                        <span className="text-xl sm:text-2xl flex-shrink-0">{getNotificationIcon(notification.type)}</span>
                        <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-2 mb-1">
                            <h4 className="font-semibold text-sm text-[var(--text-primary)] break-words">
                                {notification.title}
                            </h4>
                            {!notification.read && (
                                <span className="flex-shrink-0 w-2 h-2 bg-[var(--accent-primary)] rounded-full mt-1"></span>
                            )}
                            </div>
                            <p className="text-xs sm:text-sm text-[var(--text-secondary)] mb-2 break-words">
                            {notification.message}
                            </p>
                            <div className="flex items-center justify-between gap-2">
                            <span className="text-xs text-[var(--text-tertiary)]">
                                {notification.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                            <span className={`text-xs px-2 py-0.5 rounded-full border flex-shrink-0 ${getPriorityColor(notification.priority)}`}>
                                {notification.priority}
                            </span>
                            </div>
                        </div>
                        </div>
                    </button>
                    ))}
                </div>
                ) : (
                <div className="flex flex-col items-center justify-center py-8 sm:py-12 px-4">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 sm:h-16 sm:w-16 text-[var(--text-tertiary)] mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <p className="text-[var(--text-tertiary)] text-sm">
                    {filter === 'unread' ? 'No unread notifications' : 'All caught up!'}
                    </p>
                </div>
                )}
            </div>
            </div>
        </>
        )}
    </div>
  );
};

export default NotificationCenter;
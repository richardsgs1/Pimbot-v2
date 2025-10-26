// PushNotificationService.ts
// Browser push notification management

export interface NotificationConfig {
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  tag?: string;
  requireInteraction?: boolean;
  actions?: NotificationAction[];
}

export class PushNotificationService {
  private static instance: PushNotificationService;
  private registration: ServiceWorkerRegistration | null = null;
  private permission: NotificationPermission = 'default';

  private constructor() {
    this.checkPermission();
  }

  static getInstance(): PushNotificationService {
    if (!PushNotificationService.instance) {
      PushNotificationService.instance = new PushNotificationService();
    }
    return PushNotificationService.instance;
  }

  // Check current notification permission
  private checkPermission(): void {
    if ('Notification' in window) {
      this.permission = Notification.permission;
    }
  }

  // Request notification permission
  async requestPermission(): Promise<boolean> {
    if (!('Notification' in window)) {
      console.warn('Notifications not supported');
      return false;
    }

    if (this.permission === 'granted') {
      return true;
    }

    try {
      const permission = await Notification.requestPermission();
      this.permission = permission;
      return permission === 'granted';
    } catch (error) {
      console.error('Permission request failed:', error);
      return false;
    }
  }

  // Register service worker for push notifications
  async registerServiceWorker(): Promise<boolean> {
    if (!('serviceWorker' in navigator)) {
      console.warn('Service Workers not supported');
      return false;
    }

    try {
      this.registration = await navigator.serviceWorker.register('/service-worker.js');
      console.log('Service Worker registered:', this.registration);
      return true;
    } catch (error) {
      console.error('Service Worker registration failed:', error);
      return false;
    }
  }

  // Show a notification
  async showNotification(config: NotificationConfig): Promise<void> {
    if (this.permission !== 'granted') {
      const granted = await this.requestPermission();
      if (!granted) return;
    }

    if (this.registration) {
      // Use service worker notification (better for PWA)
      await this.registration.showNotification(config.title, {
        body: config.body,
        icon: config.icon || '/icon-192.png',
        badge: config.badge || '/icon-192.png',
        tag: config.tag || 'default',
        requireInteraction: config.requireInteraction || false,
        vibrate: [200, 100, 200],
        actions: config.actions || []
      });
    } else {
      // Fallback to basic notification
      new Notification(config.title, {
        body: config.body,
        icon: config.icon || '/icon-192.png'
      });
    }
  }

  // Schedule a notification
  scheduleNotification(config: NotificationConfig, delayMs: number): number {
    return window.setTimeout(() => {
      this.showNotification(config);
    }, delayMs);
  }

  // Task-specific notifications
  async notifyTaskDue(taskTitle: string, dueDate: Date): Promise<void> {
    const now = new Date();
    const timeUntilDue = dueDate.getTime() - now.getTime();
    const hoursUntilDue = Math.floor(timeUntilDue / (1000 * 60 * 60));

    let body = '';
    if (hoursUntilDue < 0) {
      body = `Task "${taskTitle}" is overdue!`;
    } else if (hoursUntilDue < 1) {
      body = `Task "${taskTitle}" is due in less than 1 hour!`;
    } else if (hoursUntilDue < 24) {
      body = `Task "${taskTitle}" is due in ${hoursUntilDue} hours`;
    } else {
      const daysUntilDue = Math.floor(hoursUntilDue / 24);
      body = `Task "${taskTitle}" is due in ${daysUntilDue} days`;
    }

    await this.showNotification({
      title: '📅 Task Due Soon',
      body,
      tag: 'task-due',
      requireInteraction: true,
      actions: [
        { action: 'view', title: 'View Task', icon: '/icon-192.png' },
        { action: 'snooze', title: 'Snooze', icon: '/icon-192.png' }
      ]
    });
  }

  // Project deadline notification
  async notifyProjectDeadline(projectName: string, dueDate: Date): Promise<void> {
    const now = new Date();
    const daysUntilDue = Math.ceil((dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

    await this.showNotification({
      title: '🚨 Project Deadline',
      body: `Project "${projectName}" is due in ${daysUntilDue} days`,
      tag: 'project-deadline',
      requireInteraction: true
    });
  }

  // Daily summary notification
  async notifyDailySummary(taskCount: number, overdueCount: number): Promise<void> {
    let body = `You have ${taskCount} tasks today`;
    if (overdueCount > 0) {
      body += ` and ${overdueCount} overdue tasks`;
    }

    await this.showNotification({
      title: '📊 Daily Summary',
      body,
      tag: 'daily-summary'
    });
  }

  // Team mention notification
  async notifyTeamMention(mentionedBy: string, taskTitle: string): Promise<void> {
    await this.showNotification({
      title: '👥 Team Mention',
      body: `${mentionedBy} mentioned you in "${taskTitle}"`,
      tag: 'team-mention',
      requireInteraction: true
    });
  }

  // Check if notifications are supported
  isSupported(): boolean {
    return 'Notification' in window && 'serviceWorker' in navigator;
  }

  // Get permission status
  getPermissionStatus(): NotificationPermission {
    return this.permission;
  }

  // Clear all notifications with a specific tag
  async clearNotifications(tag?: string): Promise<void> {
    if (!this.registration) return;

    const notifications = await this.registration.getNotifications({ tag });
    notifications.forEach(notification => notification.close());
  }
}

// Export singleton instance
export const pushNotificationService = PushNotificationService.getInstance();
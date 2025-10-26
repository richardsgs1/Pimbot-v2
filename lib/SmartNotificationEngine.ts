// lib/SmartNotificationEngine.ts
// AI-powered notification system for proactive project monitoring

import type { Project, ProjectStatus, Priority } from '../types';
import { PROJECT_STATUS_VALUES, PRIORITY_VALUES } from '../types';

export type NotificationSeverity = 'critical' | 'warning' | 'info';
export type NotificationType = 
  | 'deadline_approaching' 
  | 'budget_warning' 
  | 'budget_critical'
  | 'dependency_conflict'
  | 'project_stalled'
  | 'team_overload'
  | 'milestone_at_risk';

export interface SmartNotification {
  id: string;
  type: NotificationType;
  severity: NotificationSeverity;
  title: string;
  message: string;
  projectId?: string;
  projectName?: string;
  actionable: boolean;
  suggestedAction?: string;
  timestamp: Date;
  metadata?: {
    daysUntilDeadline?: number;
    budgetUtilization?: number;
    tasksAffected?: number;
    [key: string]: any;
  };
}

export class SmartNotificationEngine {
  private projects: Project[];
  private notifications: SmartNotification[] = [];

  constructor(projects: Project[]) {
    this.projects = projects;
  }

  /**
   * Run all notification checks and return alerts
   */
  public generateNotifications(): SmartNotification[] {
    this.notifications = [];

    this.checkApproachingDeadlines();
    this.checkBudgetThresholds();
    this.checkDependencyConflicts();
    this.checkStalledProjects();
    this.checkTeamOverload();
    this.checkMilestonesAtRisk();

    return this.notifications;
  }

  /**
   * Check for approaching project and task deadlines
   */
  private checkApproachingDeadlines(): void {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    this.projects.forEach(project => {
      if (project.status === PROJECT_STATUS_VALUES.Completed) return;
      if (!project.dueDate) return;

      const dueDate = new Date(project.dueDate);
      dueDate.setHours(0, 0, 0, 0);
      const daysUntil = Math.ceil((dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

      if (daysUntil >= 1 && daysUntil <= 3 && project.progress < 90) {
        this.addNotification({
          type: 'deadline_approaching',
          severity: 'critical',
          title: `🔴 ${project.name} due in ${daysUntil} day${daysUntil !== 1 ? 's' : ''}`,
          message: `Project is ${project.progress}% complete with only ${daysUntil} day${daysUntil !== 1 ? 's' : ''} remaining.`,
          projectId: project.id,
          projectName: project.name,
          actionable: true,
          suggestedAction: 'Review incomplete tasks and reassign resources',
          metadata: { daysUntilDeadline: daysUntil }
        });
      } else if (daysUntil >= 4 && daysUntil <= 7 && project.progress < 75) {
        this.addNotification({
          type: 'deadline_approaching',
          severity: 'warning',
          title: `⚠️ ${project.name} due in ${daysUntil} days`,
          message: `Project is ${project.progress}% complete.`,
          projectId: project.id,
          projectName: project.name,
          actionable: true,
          suggestedAction: 'Schedule team sync to address blockers',
          metadata: { daysUntilDeadline: daysUntil }
        });
      } else if (daysUntil >= 8 && daysUntil <= 14 && project.progress < 50) {
        this.addNotification({
          type: 'deadline_approaching',
          severity: 'info',
          title: `📅 ${project.name} due in ${daysUntil} days`,
          message: `Project is ${project.progress}% complete.`,
          projectId: project.id,
          projectName: project.name,
          actionable: false,
          metadata: { daysUntilDeadline: daysUntil }
        });
      }

      const overdueTasks = project.tasks.filter(task => {
        if (!task.dueDate) return false;
        const taskDue = new Date(task.dueDate);
        taskDue.setHours(0, 0, 0, 0);
        return !task.completed && taskDue < today;
      });

      if (overdueTasks.length > 0) {
        this.addNotification({
          type: 'deadline_approaching',
          severity: 'critical',
          title: `🔴 ${overdueTasks.length} overdue task${overdueTasks.length !== 1 ? 's' : ''} in ${project.name}`,
          message: `${overdueTasks.map(t => t.name).slice(0, 3).join(', ')}${overdueTasks.length > 3 ? ` and ${overdueTasks.length - 3} more` : ''}`,
          projectId: project.id,
          projectName: project.name,
          actionable: true,
          suggestedAction: 'Prioritize or reassign overdue tasks',
          metadata: { tasksAffected: overdueTasks.length }
        });
      }
    });
  }

  /**
   * Check budget utilization thresholds
   */
  private checkBudgetThresholds(): void {
    this.projects.forEach(project => {
      if (!project.budget || !project.spent) return;

      const utilization = (project.spent / project.budget) * 100;

      if (utilization > 100) {
        this.addNotification({
          type: 'budget_critical',
          severity: 'critical',
          title: `🔴 ${project.name} over budget`,
          message: `Spent $${project.spent.toLocaleString()} of $${project.budget.toLocaleString()} (${Math.round(utilization)}%).`,
          projectId: project.id,
          projectName: project.name,
          actionable: true,
          suggestedAction: 'Review expenses and adjust scope or budget',
          metadata: { budgetUtilization: utilization }
        });
      } else if (utilization >= 90) {
        this.addNotification({
          type: 'budget_critical',
          severity: 'critical',
          title: `🔴 ${project.name} near budget limit`,
          message: `${Math.round(utilization)}% of budget used.`,
          projectId: project.id,
          projectName: project.name,
          actionable: true,
          suggestedAction: 'Approve additional budget or reduce scope',
          metadata: { budgetUtilization: utilization }
        });
      } else if (utilization >= 75) {
        this.addNotification({
          type: 'budget_warning',
          severity: 'warning',
          title: `⚠️ ${project.name} budget at ${Math.round(utilization)}%`,
          message: `Monitor spending closely.`,
          projectId: project.id,
          projectName: project.name,
          actionable: true,
          suggestedAction: 'Review upcoming expenses',
          metadata: { budgetUtilization: utilization }
        });
      }
    });
  }

  /**
   * Detect dependency conflicts (simplified)
   */
  private checkDependencyConflicts(): void {
    const today = new Date();
    
    this.projects.forEach(project => {
      const incompleteTasks = project.tasks.filter(t => !t.completed);
      const overdueTasks = incompleteTasks.filter(t => t.dueDate && new Date(t.dueDate) < today);
      
      if (overdueTasks.length > 2 && incompleteTasks.length > overdueTasks.length) {
        this.addNotification({
          type: 'dependency_conflict',
          severity: 'warning',
          title: `⚠️ Multiple overdue tasks in ${project.name}`,
          message: `${overdueTasks.length} overdue tasks may be blocking progress.`,
          projectId: project.id,
          projectName: project.name,
          actionable: true,
          suggestedAction: 'Prioritize overdue tasks to unblock team',
          metadata: { tasksAffected: overdueTasks.length }
        });
      }
    });
  }

  /**
   * Detect projects with no recent activity
   */
  private checkStalledProjects(): void {
    const today = new Date();
    const twoWeeksAgo = new Date(today);
    twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);

    this.projects.forEach(project => {
      if (project.status === PROJECT_STATUS_VALUES.Completed || project.status === PROJECT_STATUS_VALUES.OnHold) return;

      // Skip if missing dates
      if (!project.startDate || !project.dueDate) return;
      
      const projectStart = new Date(project.startDate);
      const projectEnd = new Date(project.dueDate);
      const totalDuration = projectEnd.getTime() - projectStart.getTime();
      const elapsed = today.getTime() - projectStart.getTime();
      const expectedProgress = (elapsed / totalDuration) * 100;
      const progressGap = expectedProgress - project.progress;

      // Consider a project stalled if progress is significantly behind schedule
      if (progressGap > 20) {
        this.addNotification({
          type: 'project_stalled',
          severity: 'warning',
          title: `⚠️ ${project.name} may be behind schedule`,
          message: `Progress is ${Math.round(progressGap)}% behind schedule.`,
          projectId: project.id,
          projectName: project.name,
          actionable: true,
          suggestedAction: 'Schedule status check to identify blockers',
          metadata: { progressGap: Math.round(progressGap) }
        });
      }
    });
  }

  /**
   * Check for team member overallocation
   */
  private checkTeamOverload(): void {
    const memberWorkload = new Map<string, { projects: string[], tasks: number }>();

    this.projects.forEach(project => {
      if (project.status === PROJECT_STATUS_VALUES.Completed) return;

      project.teamMembers?.forEach(member => {
        const current = memberWorkload.get(member.name) || { projects: [], tasks: 0 };
        current.projects.push(project.name);
        memberWorkload.set(member.name, current);
      });

      // FIXED: Use assignees array instead of assigneeId
      project.tasks.forEach(task => {
        if (task.completed || !task.assignees || task.assignees.length === 0) return;
        
        // Loop through all assignees for this task
        task.assignees.forEach(assigneeId => {
          const assignee = project.teamMembers?.find(m => m.id === assigneeId);
          if (!assignee) return;

          const current = memberWorkload.get(assignee.name) || { projects: [], tasks: 0 };
          current.tasks++;
          memberWorkload.set(assignee.name, current);
        });
      });
    });

    memberWorkload.forEach((workload, memberName) => {
      if (workload.projects.length >= 3) {
        this.addNotification({
          type: 'team_overload',
          severity: 'warning',
          title: `⚠️ ${memberName} on ${workload.projects.length} projects`,
          message: `Team member may be overallocated.`,
          actionable: true,
          suggestedAction: 'Review workload and redistribute tasks',
          metadata: { projectCount: workload.projects.length }
        });
      }

      if (workload.tasks >= 10) {
        this.addNotification({
          type: 'team_overload',
          severity: 'warning',
          title: `⚠️ ${memberName} has ${workload.tasks} active tasks`,
          message: `High task count may indicate overallocation.`,
          actionable: true,
          suggestedAction: 'Review and prioritize task list',
          metadata: { taskCount: workload.tasks }
        });
      }
    });
  }

  /**
   * Check milestones at risk (using high-priority tasks)
   */
  private checkMilestonesAtRisk(): void {
    const today = new Date();
    
    this.projects.forEach(project => {
      if (project.status === PROJECT_STATUS_VALUES.Completed) return;

      const criticalTasks = project.tasks.filter(task => 
        !task.completed && 
        task.priority === PRIORITY_VALUES.High
      );
      
      criticalTasks.forEach(task => {
        if (!task.dueDate) return;
        const dueDate = new Date(task.dueDate);
        const daysUntil = Math.ceil((dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

        if (daysUntil <= 7 && daysUntil > 0) {
          this.addNotification({
            type: 'milestone_at_risk',
            severity: daysUntil <= 3 ? 'critical' : 'warning',
            title: `${daysUntil <= 3 ? '🔴' : '⚠️'} Critical task "${task.name}" due in ${daysUntil} days`,
            message: `High-priority task in ${project.name} approaching deadline.`,
            projectId: project.id,
            projectName: project.name,
            actionable: true,
            suggestedAction: 'Prioritize task completion',
            metadata: { daysUntilDeadline: daysUntil }
          });
        }

        if (daysUntil < 0) {
          this.addNotification({
            type: 'milestone_at_risk',
            severity: 'critical',
            title: `🔴 Critical task "${task.name}" overdue`,
            message: `High-priority task in ${project.name} overdue by ${Math.abs(daysUntil)} days.`,
            projectId: project.id,
            projectName: project.name,
            actionable: true,
            suggestedAction: 'Immediate action required',
            metadata: { daysOverdue: Math.abs(daysUntil) }
          });
        }
      });
    });
  }

  /**
   * Add notification (prevents duplicates)
   */
  private addNotification(notification: Omit<SmartNotification, 'id' | 'timestamp'>): void {
    const isDuplicate = this.notifications.some(existing => 
      existing.type === notification.type &&
      existing.projectId === notification.projectId &&
      existing.title === notification.title
    );

    if (!isDuplicate) {
      this.notifications.push({
        ...notification,
        id: `notification_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        timestamp: new Date()
      });
    }
  }

  /**
   * Get notifications by severity
   */
  public getNotificationsBySeverity(severity: NotificationSeverity): SmartNotification[] {
    return this.notifications.filter(n => n.severity === severity);
  }

  /**
   * Get notifications by project
   */
  public getNotificationsByProject(projectId: string): SmartNotification[] {
    return this.notifications.filter(n => n.projectId === projectId);
  }

  /**
   * Get count by severity
   */
  public getCountBySeverity(): { critical: number; warning: number; info: number } {
    return {
      critical: this.notifications.filter(n => n.severity === 'critical').length,
      warning: this.notifications.filter(n => n.severity === 'warning').length,
      info: this.notifications.filter(n => n.severity === 'info').length
    };
  }
}
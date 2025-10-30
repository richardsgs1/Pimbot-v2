/**
 * TrialManager.ts
 * Location: /lib/TrialManager.ts
 * 
 * Manages trial period logic, status calculations, and notification scheduling
 */

export interface TrialStatus {
  isActive: boolean;
  hasExpired: boolean;
  isInGracePeriod: boolean;
  daysRemaining: number;
  hoursRemaining: number;
  percentComplete: number;
  endDate: Date;
  gracePeriodEndDate: Date | null;
  shouldShowBanner: boolean;
  urgencyLevel: 'none' | 'low' | 'medium' | 'high' | 'critical';
}

export interface NotificationCheck {
  should: boolean;
  type?: 'trial-7-days' | 'trial-3-days' | 'trial-1-day' | 'trial-expired' | 'grace-ending';
  reason?: string;
}

export class TrialManager {
  private static readonly TRIAL_DURATION_DAYS = 14; // 14-day trial
  private static readonly GRACE_PERIOD_DAYS = 3;    // 3-day grace period
  private static readonly WARNING_THRESHOLDS = [7, 3, 1]; // Days before expiration

  /**
   * Calculate comprehensive trial status for a user
   */
  static getTrialStatus(userData: {
    trialStartDate?: string;
    trialEndDate?: string;
    isPremium?: boolean;
    trialExtended?: boolean;
  }): TrialStatus {
    // If user is premium, no trial logic needed
    if (userData.isPremium) {
      return {
        isActive: false,
        hasExpired: false,
        isInGracePeriod: false,
        daysRemaining: 0,
        hoursRemaining: 0,
        percentComplete: 100,
        endDate: new Date(),
        gracePeriodEndDate: null,
        shouldShowBanner: false,
        urgencyLevel: 'none'
      };
    }

    const now = new Date();
    
    // Determine trial end date
    let trialEndDate: Date;
    if (userData.trialEndDate) {
      trialEndDate = new Date(userData.trialEndDate);
    } else if (userData.trialStartDate) {
      const startDate = new Date(userData.trialStartDate);
      trialEndDate = new Date(startDate);
      trialEndDate.setDate(trialEndDate.getDate() + this.TRIAL_DURATION_DAYS);
    } else {
      // No trial data - treat as new user, start trial now
      trialEndDate = new Date();
      trialEndDate.setDate(trialEndDate.getDate() + this.TRIAL_DURATION_DAYS);
    }

    // Calculate grace period end date
    const gracePeriodEndDate = new Date(trialEndDate);
    gracePeriodEndDate.setDate(gracePeriodEndDate.getDate() + this.GRACE_PERIOD_DAYS);

    // Time calculations
    const msRemaining = trialEndDate.getTime() - now.getTime();
    const daysRemaining = Math.ceil(msRemaining / (1000 * 60 * 60 * 24));
    const hoursRemaining = Math.ceil(msRemaining / (1000 * 60 * 60));

    // Trial period calculation (for progress bar)
    const trialStartDate = new Date(trialEndDate);
    trialStartDate.setDate(trialStartDate.getDate() - this.TRIAL_DURATION_DAYS);
    const totalTrialMs = trialEndDate.getTime() - trialStartDate.getTime();
    const elapsedMs = now.getTime() - trialStartDate.getTime();
    const percentComplete = Math.min(100, Math.max(0, (elapsedMs / totalTrialMs) * 100));

    // Status flags
    const hasExpired = now > trialEndDate;
    const isInGracePeriod = hasExpired && now <= gracePeriodEndDate;
    const isActive = !hasExpired;

    // Urgency level for UI styling
    let urgencyLevel: 'none' | 'low' | 'medium' | 'high' | 'critical' = 'none';
    if (isInGracePeriod) {
      urgencyLevel = 'critical';
    } else if (daysRemaining <= 1) {
      urgencyLevel = 'critical';
    } else if (daysRemaining <= 3) {
      urgencyLevel = 'high';
    } else if (daysRemaining <= 7) {
      urgencyLevel = 'medium';
    } else if (daysRemaining <= 10) {
      urgencyLevel = 'low';
    }

    const shouldShowBanner = isActive && daysRemaining <= 7 || isInGracePeriod;

    return {
      isActive,
      hasExpired,
      isInGracePeriod,
      daysRemaining,
      hoursRemaining,
      percentComplete,
      endDate: trialEndDate,
      gracePeriodEndDate: isInGracePeriod ? gracePeriodEndDate : null,
      shouldShowBanner,
      urgencyLevel
    };
  }

  /**
   * Determine if a notification should be sent
   */
  static shouldSendNotification(
    status: TrialStatus,
    lastNotificationDate?: string,
    sentNotifications: string[] = []
  ): NotificationCheck {
    // Don't notify if user is premium or trial is not active/expired
    if (!status.isActive && !status.isInGracePeriod) {
      return { should: false, reason: 'Trial not active' };
    }

    const now = new Date();
    const lastSent = lastNotificationDate ? new Date(lastNotificationDate) : null;

    // Don't send more than one notification per day
    if (lastSent) {
      const hoursSinceLastNotification = (now.getTime() - lastSent.getTime()) / (1000 * 60 * 60);
      if (hoursSinceLastNotification < 24) {
        return { should: false, reason: 'Recently sent notification' };
      }
    }

    // Check grace period ending notification
    if (status.isInGracePeriod) {
      const graceDaysLeft = status.gracePeriodEndDate 
        ? Math.ceil((status.gracePeriodEndDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
        : 0;

      if (graceDaysLeft === 1 && !sentNotifications.includes('grace-ending')) {
        return { should: true, type: 'grace-ending' };
      }
    }

    // Check trial expiration notification
    if (status.hasExpired && !status.isInGracePeriod && !sentNotifications.includes('trial-expired')) {
      return { should: true, type: 'trial-expired' };
    }

    // Check trial warning notifications
    const { daysRemaining } = status;

    if (daysRemaining === 7 && !sentNotifications.includes('trial-7-days')) {
      return { should: true, type: 'trial-7-days' };
    }

    if (daysRemaining === 3 && !sentNotifications.includes('trial-3-days')) {
      return { should: true, type: 'trial-3-days' };
    }

    if (daysRemaining === 1 && !sentNotifications.includes('trial-1-day')) {
      return { should: true, type: 'trial-1-day' };
    }

    return { should: false, reason: 'No notification threshold met' };
  }

  /**
   * Initialize trial dates for a new user
   */
  static initializeTrialForUser(): {
    trialStartDate: string;
    trialEndDate: string;
    trialNotificationsSent: string[];
  } {
    const now = new Date();
    const endDate = new Date(now);
    endDate.setDate(endDate.getDate() + this.TRIAL_DURATION_DAYS);

    return {
      trialStartDate: now.toISOString(),
      trialEndDate: endDate.toISOString(),
      trialNotificationsSent: []
    };
  }

  /**
   * Extend trial period (for customer service or promotions)
   */
  static extendTrial(
    currentEndDate: string,
    extensionDays: number
  ): string {
    const endDate = new Date(currentEndDate);
    endDate.setDate(endDate.getDate() + extensionDays);
    return endDate.toISOString();
  }

  /**
   * Get human-readable time remaining text
   */
  static getTimeRemainingText(status: TrialStatus): string {
    if (status.isInGracePeriod && status.gracePeriodEndDate) {
      const graceDaysLeft = Math.ceil(
        (status.gracePeriodEndDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
      );
      return graceDaysLeft === 1 
        ? `Grace period ends in ${status.hoursRemaining % 24} hours`
        : `${graceDaysLeft} days left in grace period`;
    }

    if (status.hasExpired) {
      return 'Trial expired';
    }

    if (status.daysRemaining === 0) {
      return `${status.hoursRemaining} hours remaining`;
    }

    if (status.daysRemaining === 1) {
      return '1 day remaining';
    }

    return `${status.daysRemaining} days remaining`;
  }

  /**
   * Get message for trial banner based on status
   */
  static getBannerMessage(status: TrialStatus): {
    title: string;
    message: string;
    ctaText: string;
  } {
    if (status.isInGracePeriod) {
      return {
        title: '⚠️ Trial Expired - Grace Period',
        message: `Your trial has ended, but you have ${this.getTimeRemainingText(status)} to upgrade. Some features may be limited.`,
        ctaText: 'Upgrade Now'
      };
    }

    if (status.daysRemaining <= 1) {
      return {
        title: '🚨 Trial Ending Soon',
        message: `Only ${this.getTimeRemainingText(status)}! Upgrade now to keep all premium features.`,
        ctaText: 'Upgrade Now'
      };
    }

    if (status.daysRemaining <= 3) {
      return {
        title: '⚡ Trial Ending Soon',
        message: `You have ${status.daysRemaining} days left in your trial. Upgrade to continue using all features.`,
        ctaText: 'View Plans'
      };
    }

    if (status.daysRemaining <= 7) {
      return {
        title: '⏰ Trial Period Notice',
        message: `${status.daysRemaining} days remaining in your free trial. Don't lose access to your data!`,
        ctaText: 'See Pricing'
      };
    }

    return {
      title: '✨ Free Trial Active',
      message: `Enjoying Pimbot? You have ${status.daysRemaining} days left to explore all features.`,
      ctaText: 'Learn More'
    };
  }
}
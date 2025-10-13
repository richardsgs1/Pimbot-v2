import type { SubscriptionTier, UserSubscription } from '../types';
import { getTierLimits } from './pricing';
import { getUserSubscription, getTodayUsage } from './database';

// ============================================
// SUBSCRIPTION BUSINESS LOGIC
// ============================================

export interface SubscriptionCheck {
  allowed: boolean;
  reason?: string;
  currentCount?: number;
  limit?: number;
}

/**
 * Check if user can create a new project
 */
export const canCreateProject = async (
  userId: string,
  currentProjectCount: number
): Promise<SubscriptionCheck> => {
  const subscription = await getUserSubscription(userId);
  if (!subscription) {
    return { allowed: false, reason: 'No active subscription' };
  }

  const limits = getTierLimits(subscription.tier);
  
  if (limits.maxProjects === -1) {
    return { allowed: true };
  }

  if (currentProjectCount >= limits.maxProjects) {
    return {
      allowed: false,
      reason: `Project limit reached (${limits.maxProjects})`,
      currentCount: currentProjectCount,
      limit: limits.maxProjects
    };
  }

  return { allowed: true };
};

/**
 * Check if user can make an AI query
 */
export const canMakeAIQuery = async (userId: string): Promise<SubscriptionCheck> => {
  const subscription = await getUserSubscription(userId);
  if (!subscription) {
    return { allowed: false, reason: 'No active subscription' };
  }

  // Check if trial expired
  if (subscription.status === 'trialing' && subscription.trialEndsAt) {
    if (new Date() > subscription.trialEndsAt) {
      return { allowed: false, reason: 'Trial expired' };
    }
  }

  // Check if subscription is active
  if (subscription.status !== 'active' && subscription.status !== 'trialing') {
    return { allowed: false, reason: 'Subscription not active' };
  }

  const limits = getTierLimits(subscription.tier);
  
  if (limits.maxAiQueries === -1) {
    return { allowed: true };
  }

  const usage = await getTodayUsage(userId);
  if (!usage) {
    return { allowed: true }; // If can't check, allow (fail open)
  }

  if (usage.aiQueriesCount >= limits.maxAiQueries) {
    return {
      allowed: false,
      reason: `Daily AI query limit reached (${limits.maxAiQueries})`,
      currentCount: usage.aiQueriesCount,
      limit: limits.maxAiQueries
    };
  }

  return { allowed: true, currentCount: usage.aiQueriesCount, limit: limits.maxAiQueries };
};

/**
 * Check if user can export in specific format
 */
export const canExport = async (
  userId: string,
  format: 'pdf' | 'excel' | 'csv' | 'json'
): Promise<SubscriptionCheck> => {
  const subscription = await getUserSubscription(userId);
  if (!subscription) {
    return { allowed: false, reason: 'No active subscription' };
  }

  const limits = getTierLimits(subscription.tier);
  
  if (!limits.allowedExports.includes(format)) {
    return {
      allowed: false,
      reason: `${format.toUpperCase()} export not available in ${subscription.tier} plan`
    };
  }

  return { allowed: true };
};

/**
 * Check if subscription is in trial period
 */
export const isInTrial = (subscription: UserSubscription): boolean => {
  return subscription.status === 'trialing' && 
         subscription.trialEndsAt !== undefined &&
         new Date() < subscription.trialEndsAt;
};

/**
 * Get days remaining in trial
 */
export const getTrialDaysRemaining = (subscription: UserSubscription): number => {
  if (!subscription.trialEndsAt) return 0;
  
  const now = new Date();
  const trialEnd = subscription.trialEndsAt;
  const diff = trialEnd.getTime() - now.getTime();
  const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
  
  return Math.max(0, days);
};
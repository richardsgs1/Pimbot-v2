import type { SubscriptionTier, UsageLimits } from '../types';

// ============================================
// PRICING TIERS
// ============================================

export const PRICING = {
  starter: {
    name: 'Starter',
    price: 14,
    annual: 150,
    savings: 18,
    description: 'Perfect for freelancers & solopreneurs',
    popular: false,
    features: [
      '3 projects',
      '1 team member',
      '75 AI queries/day',
      'PDF & CSV export',
      '500MB storage',
      'Email support',
      'Basic notifications'
    ]
  },
  pro: {
    name: 'Pro',
    price: 29,
    annual: 309,
    savings: 39,
    description: 'Best for small teams & agencies',
    popular: true,
    features: [
      '25 projects',
      '5 team members',
      '150 AI queries/day',
      'All export formats',
      '10GB storage',
      'Priority support',
      'Advanced notifications',
      'Custom branding',
      'Email integration'
    ]
  },
  team: {
    name: 'Team',
    price: 119,
    annual: 1099,
    savings: 329,
    description: 'For growing businesses',
    popular: false,
    features: [
      'Unlimited projects',
      '20 team members',
      '500 AI queries/day',
      'Advanced AI analytics',
      'All exports + API access',
      '50GB storage',
      'Priority + Slack support',
      'Advanced permissions',
      'White-label options',
      'SSO',
      'Webhook integrations'
    ]
  },
  enterprise: {
    name: 'Enterprise',
    price: null,
    annual: null,
    description: 'Custom solution for large organizations',
    popular: false,
    features: [
      'Everything in Team',
      'Unlimited team members',
      'Custom AI query limits',
      'Dedicated account manager',
      'Custom integrations',
      '99.9% SLA guarantee',
      'On-premise option',
      'Custom contracts',
      'Training & onboarding'
    ]
  }
};

// ============================================
// TIER LIMITS
// ============================================

export const TIER_LIMITS: Record<SubscriptionTier, UsageLimits> = {
  trial: {
    maxProjects: 25,
    maxTeamMembers: 5,
    maxStorage: 10240, // 10GB
    maxAiQueries: 150,
    allowedExports: ['pdf', 'excel', 'csv', 'json'],
    features: {
      advancedNotifications: true,
      customBranding: true,
      apiAccess: false,
      sso: false,
      whiteLabel: false
    }
  },
  starter: {
    maxProjects: 3,
    maxTeamMembers: 1,
    maxStorage: 500, // 500MB
    maxAiQueries: 75,
    allowedExports: ['pdf', 'csv'],
    features: {
      advancedNotifications: false,
      customBranding: false,
      apiAccess: false,
      sso: false,
      whiteLabel: false
    }
  },
  pro: {
    maxProjects: 25,
    maxTeamMembers: 5,
    maxStorage: 10240, // 10GB
    maxAiQueries: 150,
    allowedExports: ['pdf', 'excel', 'csv', 'json'],
    features: {
      advancedNotifications: true,
      customBranding: true,
      apiAccess: false,
      sso: false,
      whiteLabel: false
    }
  },
  team: {
    maxProjects: -1, // unlimited
    maxTeamMembers: 20,
    maxStorage: 51200, // 50GB
    maxAiQueries: 500,
    allowedExports: ['pdf', 'excel', 'csv', 'json'],
    features: {
      advancedNotifications: true,
      customBranding: true,
      apiAccess: true,
      sso: true,
      whiteLabel: true
    }
  },
  enterprise: {
    maxProjects: -1,
    maxTeamMembers: -1,
    maxStorage: -1,
    maxAiQueries: -1,
    allowedExports: ['pdf', 'excel', 'csv', 'json'],
    features: {
      advancedNotifications: true,
      customBranding: true,
      apiAccess: true,
      sso: true,
      whiteLabel: true
    }
  }
};

// ============================================
// HELPER FUNCTIONS
// ============================================

export const getTierLimits = (tier: SubscriptionTier): UsageLimits => {
  return TIER_LIMITS[tier];
};

export const canPerformAction = (
  tier: SubscriptionTier,
  action: 'createProject' | 'addTeamMember' | 'export' | 'aiQuery',
  currentCount: number,
  exportFormat?: 'pdf' | 'excel' | 'csv' | 'json'
): boolean => {
  const limits = getTierLimits(tier);

  switch (action) {
    case 'createProject':
      return limits.maxProjects === -1 || currentCount < limits.maxProjects;
    case 'addTeamMember':
      return limits.maxTeamMembers === -1 || currentCount < limits.maxTeamMembers;
    case 'export':
      return exportFormat ? limits.allowedExports.includes(exportFormat) : false;
    case 'aiQuery':
      return limits.maxAiQueries === -1 || currentCount < limits.maxAiQueries;
    default:
      return false;
  }
};
/**
 * TrialBanner.tsx
 * Location: /components/TrialBanner.tsx
 * 
 * Visual banner component for displaying trial status and encouraging upgrades
 */

import React, { useState, useEffect } from 'react';
import { TrialManager, TrialStatus } from '../lib/TrialManager';
import { X, Clock, AlertTriangle, Zap, Sparkles } from 'lucide-react';

interface TrialBannerProps {
  userData: {
    trialStartDate?: string;
    trialEndDate?: string;
    isPremium?: boolean;
    trialExtended?: boolean;
    name?: string;
    email?: string;
  };
  onUpgradeClick: () => void;
  onDismiss?: () => void;
}

export const TrialBanner: React.FC<TrialBannerProps> = ({
  userData,
  onUpgradeClick,
  onDismiss
}) => {
  const [isDismissed, setIsDismissed] = useState(false);
  const [status, setStatus] = useState<TrialStatus | null>(null);

  useEffect(() => {
    const trialStatus = TrialManager.getTrialStatus(userData);
    setStatus(trialStatus);
  }, [userData]);

  // Don't show banner if dismissed or not needed
  if (isDismissed || !status || !status.shouldShowBanner) {
    return null;
  }

  const handleDismiss = () => {
    setIsDismissed(true);
    if (onDismiss) {
      onDismiss();
    }
  };

  const { title, message, ctaText } = TrialManager.getBannerMessage(status);

  // Color schemes based on urgency
  const colorSchemes = {
    none: {
      bg: 'bg-blue-50',
      border: 'border-blue-200',
      text: 'text-blue-900',
      button: 'bg-blue-600 hover:bg-blue-700',
      progress: 'bg-blue-600',
      icon: <Sparkles className="w-5 h-5" />
    },
    low: {
      bg: 'bg-blue-50',
      border: 'border-blue-300',
      text: 'text-blue-900',
      button: 'bg-blue-600 hover:bg-blue-700',
      progress: 'bg-blue-600',
      icon: <Clock className="w-5 h-5" />
    },
    medium: {
      bg: 'bg-yellow-50',
      border: 'border-yellow-300',
      text: 'text-yellow-900',
      button: 'bg-yellow-600 hover:bg-yellow-700',
      progress: 'bg-yellow-600',
      icon: <Clock className="w-5 h-5" />
    },
    high: {
      bg: 'bg-orange-50',
      border: 'border-orange-300',
      text: 'text-orange-900',
      button: 'bg-orange-600 hover:bg-orange-700',
      progress: 'bg-orange-600',
      icon: <Zap className="w-5 h-5" />
    },
    critical: {
      bg: 'bg-red-50',
      border: 'border-red-300',
      text: 'text-red-900',
      button: 'bg-red-600 hover:bg-red-700',
      progress: 'bg-red-600',
      icon: <AlertTriangle className="w-5 h-5" />
    }
  };

  const colors = colorSchemes[status.urgencyLevel];

  return (
    <div
      className={`relative ${colors.bg} ${colors.border} border-l-4 rounded-lg p-4 mb-6 shadow-sm transition-all duration-300`}
      role="alert"
    >
      <div className="flex items-start justify-between">
        <div className="flex items-start space-x-3 flex-1">
          {/* Icon */}
          <div className={colors.text}>
            {colors.icon}
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <h3 className={`text-sm font-semibold ${colors.text} mb-1`}>
              {title}
            </h3>
            <p className={`text-sm ${colors.text} opacity-90 mb-3`}>
              {message}
            </p>

            {/* Progress bar */}
            <div className="mb-3">
              <div className="flex items-center justify-between text-xs mb-1">
                <span className={`${colors.text} opacity-75`}>
                  Trial Progress
                </span>
                <span className={`${colors.text} font-medium`}>
                  {TrialManager.getTimeRemainingText(status)}
                </span>
              </div>
              <div className="w-full bg-white bg-opacity-50 rounded-full h-2 overflow-hidden">
                <div
                  className={`${colors.progress} h-full rounded-full transition-all duration-500`}
                  style={{ width: `${status.percentComplete}%` }}
                />
              </div>
            </div>

            {/* CTA Button */}
            <button
              onClick={onUpgradeClick}
              className={`${colors.button} text-white px-4 py-2 rounded-md text-sm font-medium transition-colors duration-200 shadow-sm hover:shadow-md`}
            >
              {ctaText}
            </button>
          </div>
        </div>

        {/* Dismiss button (only for low/medium urgency) */}
        {status.urgencyLevel !== 'critical' && status.urgencyLevel !== 'high' && (
          <button
            onClick={handleDismiss}
            className={`${colors.text} opacity-50 hover:opacity-100 transition-opacity ml-2 flex-shrink-0`}
            aria-label="Dismiss notification"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Pulse animation for critical urgency */}
      {status.urgencyLevel === 'critical' && (
        <div className="absolute inset-0 rounded-lg animate-pulse pointer-events-none opacity-20">
          <div className={`absolute inset-0 ${colors.border} border-2 rounded-lg`} />
        </div>
      )}
    </div>
  );
};

/**
 * Compact version for header/sidebar
 */
export const TrialBadge: React.FC<{
  userData: TrialBannerProps['userData'];
  onClick: () => void;
}> = ({ userData, onClick }) => {
  const status = TrialManager.getTrialStatus(userData);

  if (!status.shouldShowBanner) {
    return null;
  }

  const getBadgeColor = () => {
    switch (status.urgencyLevel) {
      case 'critical':
        return 'bg-red-600 text-white animate-pulse';
      case 'high':
        return 'bg-orange-500 text-white';
      case 'medium':
        return 'bg-yellow-500 text-white';
      default:
        return 'bg-blue-500 text-white';
    }
  };

  return (
    <button
      onClick={onClick}
      className={`${getBadgeColor()} px-3 py-1 rounded-full text-xs font-semibold shadow-sm hover:shadow-md transition-all duration-200`}
      title={TrialManager.getTimeRemainingText(status)}
    >
      {status.isInGracePeriod ? '⚠️ Grace Period' : `⏰ ${status.daysRemaining}d left`}
    </button>
  );
};
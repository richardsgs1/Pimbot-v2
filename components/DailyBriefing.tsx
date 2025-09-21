import React, { useState, useEffect } from 'react';
import type { OnboardingData, Project } from '../types';
import { SkillLevel } from '../types';
import SkillAwareAI from './SkillAwareAI';
import MarkdownRenderer from './MarkdownRenderer';

interface DailyBriefingProps {
  userData: OnboardingData;
  projects?: Project[];
}

const DailyBriefing: React.FC<DailyBriefingProps> = ({ userData, projects = [] }) => {
  const [briefingContent, setBriefingContent] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    generateDailyBriefing();
  }, [userData, projects]);

  const generateDailyBriefing = async () => {
    if (!userData.skillLevel) {
      setError('User skill level not available');
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const prompt = SkillAwareAI.createDailyBriefingPrompt(userData, projects);
      
      const response = await fetch('/api/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'daily-briefing',
          prompt: prompt,
          userData: userData,
          projects: projects
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      setBriefingContent(data.briefing || data.content || 'No briefing content available');
    } catch (error) {
      console.error('Error generating daily briefing:', error);
      setError('Failed to generate daily briefing');
      setBriefingContent(getFallbackBriefing());
    } finally {
      setIsLoading(false);
    }
  };

  const getFallbackBriefing = (): string => {
    const greetingTime = getGreetingTime();
    const projectCount = projects.length;
    const onTrackCount = projects.filter(p => p.status === 'On Track').length;
    const atRiskCount = projects.filter(p => p.status === 'At Risk').length;

    switch (userData.skillLevel) {
      case SkillLevel.NO_EXPERIENCE:
        return `${greetingTime}, ${userData.name}! Welcome to your daily briefing. 

**Today's Overview:**
You currently have ${projectCount} project${projectCount !== 1 ? 's' : ''} to work on. ${
  onTrackCount > 0 ? `${onTrackCount} of them are on track (that's great news!)` : ''
}${
  atRiskCount > 0 ? `${onTrackCount > 0 ? ' and ' : ''}${atRiskCount} need some attention.` : ''
}

**What this means:** 
- "On Track" projects are going well and following their schedule
- "At Risk" projects might have some challenges that need your focus

**Today's Focus:**
${atRiskCount > 0 
  ? `Start by checking on your at-risk projects. Don't worry - having projects that need attention is normal in project management!` 
  : `Great job keeping your projects on track! Today is a good day to plan ahead and maybe learn something new about project management.`
}

Remember, you're doing great for someone new to project management. Every day is a learning opportunity!`;

      case SkillLevel.NOVICE:
        return `${greetingTime}, ${userData.name}!

**Portfolio Status:**
You're managing ${projectCount} project${projectCount !== 1 ? 's' : ''} - ${onTrackCount} on track, ${atRiskCount} at risk.

**Today's Priorities:**
${atRiskCount > 0 
  ? `Focus on your at-risk projects first. Review their current status and identify specific blockers or delays.`
  : `With projects running smoothly, consider reviewing upcoming milestones and resource allocation.`
}

**Skill Building Tip:**
Try using a simple project checklist today to track your daily progress. This builds good project management habits!`;

      case SkillLevel.INTERMEDIATE:
        return `${greetingTime}, ${userData.name}!

**Portfolio Overview:**
Managing ${projectCount} active projects with ${(onTrackCount/projectCount*100).toFixed(0)}% on-track performance.

**Strategic Focus:**
${atRiskCount > 0 
  ? `Address risk mitigation for ${atRiskCount} project${atRiskCount !== 1 ? 's' : ''}. Consider resource reallocation and stakeholder communication.`
  : `Strong portfolio performance. Opportunity to optimize processes and plan strategic initiatives.`
}

**Today's Objectives:**
Review project dependencies, update stakeholder communications, and assess resource utilization across your portfolio.`;

      case SkillLevel.EXPERIENCED:
        return `${greetingTime}, ${userData.name}!

**Executive Summary:**
Portfolio health: ${(onTrackCount/projectCount*100).toFixed(0)}% on-track ratio across ${projectCount} projects.

**Strategic Priorities:**
${atRiskCount > 0 
  ? `Risk management required for ${atRiskCount} projects. Recommend stakeholder escalation and resource optimization.`
  : `Portfolio performing optimally. Focus on strategic planning and continuous improvement initiatives.`
}

**Leadership Actions:**
Assess cross-project resource allocation, update executive reporting, and identify strategic optimization opportunities.`;

      case SkillLevel.EXPERT:
        return `${greetingTime}, ${userData.name}!

**Strategic Portfolio Analysis:**
Current portfolio velocity: ${(onTrackCount/projectCount*100).toFixed(0)}% optimal performance.

**Executive Priorities:**
${atRiskCount > 0 
  ? `Risk assessment and mitigation strategies required. Consider portfolio rebalancing and strategic pivots.`
  : `Excellent portfolio health enables focus on innovation initiatives and organizational capability development.`
}

**Strategic Actions:**
Drive organizational PMO improvements, mentor junior PMs, and align portfolio strategy with business objectives.`;

      default:
        return `${greetingTime}, ${userData.name}! You have ${projectCount} projects: ${onTrackCount} on track, ${atRiskCount} at risk.`;
    }
  };

  const getGreetingTime = (): string => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  const getSkillLevelDisplay = (): string => {
    switch (userData.skillLevel) {
      case SkillLevel.NO_EXPERIENCE:
        return '🌱 Learning Mode';
      case SkillLevel.NOVICE:
        return '📚 Building Skills';
      case SkillLevel.INTERMEDIATE:
        return '⚡ Growing Expertise';
      case SkillLevel.EXPERIENCED:
        return '🎯 Strategic Focus';
      case SkillLevel.EXPERT:
        return '🏆 Expert Level';
      default:
        return userData.skillLevel || 'Unknown';
    }
  };

  return (
    <div className="bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-xl p-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-xl font-bold text-[var(--text-primary)]">Daily Briefing</h2>
          <p className="text-sm text-[var(--text-tertiary)]">{getSkillLevelDisplay()}</p>
        </div>
        <button
          onClick={generateDailyBriefing}
          disabled={isLoading}
          className="flex items-center space-x-2 px-3 py-2 bg-[var(--accent-primary)] hover:bg-[var(--accent-secondary)] disabled:bg-[var(--bg-tertiary)] text-white rounded-lg transition-colors text-sm"
        >
          <svg 
            xmlns="http://www.w3.org/2000/svg" 
            className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} 
            fill="none" 
            viewBox="0 0 24 24" 
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          <span>{isLoading ? 'Updating...' : 'Refresh'}</span>
        </button>
      </div>

      <div className="space-y-4">
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <div className="flex items-center space-x-3">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-[var(--accent-primary)]"></div>
              <span className="text-[var(--text-tertiary)]">Generating your personalized briefing...</span>
            </div>
          </div>
        ) : error ? (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
            <div className="flex items-center">
              <svg className="h-5 w-5 text-red-400 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
              <span className="text-red-800 dark:text-red-200 text-sm">{error}</span>
            </div>
          </div>
        ) : (
          <div className="prose prose-sm max-w-none text-[var(--text-primary)]">
            <MarkdownRenderer content={briefingContent} />
          </div>
        )}
      </div>

      {/* Skill-specific tips */}
      {userData.skillLevel === SkillLevel.NO_EXPERIENCE && !isLoading && (
        <div className="mt-4 p-3 bg-[var(--accent-primary)]/10 border border-[var(--accent-primary)]/20 rounded-lg">
          <h4 className="text-sm font-semibold text-[var(--accent-primary)] mb-1">💡 Learning Tip</h4>
          <p className="text-xs text-[var(--text-secondary)]">
            Project management gets easier with practice. Don't hesitate to ask questions or explore different features - that's how you learn!
          </p>
        </div>
      )}
    </div>
  );
};

export default DailyBriefing;
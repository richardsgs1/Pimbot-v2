import React, { useState, useEffect } from 'react';
import type { OnboardingData, Project } from '../types';
import { PRIORITY_VALUES, PROJECT_STATUS_VALUES } from '../types'
import MarkdownRenderer from './MarkdownRenderer';

interface DailyBriefingProps {
  userData: OnboardingData;
  projects?: Project[];
}

const DailyBriefing: React.FC<DailyBriefingProps> = ({ userData, projects = [] }) => {
  const [briefingContent, setBriefingContent] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showFullBriefing, setShowFullBriefing] = useState(false);

  // Calculate key metrics
  const metrics = {
    atRisk: projects.filter(p => p.status === PROJECT_STATUS_VALUES.AtRisk).length,
    overdueTasks: projects.reduce((acc, p) => {
      return acc + p.tasks.filter(t => !t.completed && t.dueDate && new Date(t.dueDate) < new Date()).length;
    }, 0),
    completingSoon: projects.filter(p => {
      if (!p.dueDate) return false;
      const dueDate = new Date(p.dueDate);
      const today = new Date();
      const daysUntilDue = Math.ceil((dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
      return daysUntilDue > 0 && daysUntilDue <= 7;
    }).length,
    overBudget: projects.filter(p => p.budget && p.spent && p.spent > p.budget).length,
  };

  useEffect(() => {
    generateDailyBriefing();
  }, [userData, projects]);

  const generateDailyBriefing = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const prompt = createBriefingPrompt();
      
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
      setBriefingContent(getFallbackBriefing());
    } finally {
      setIsLoading(false);
    }
  };

  const createBriefingPrompt = (): string => {
    return `Create a concise daily briefing for ${userData.name} (${userData.skillLevel} level PM).

Key metrics:
- ${metrics.atRisk} projects at risk
- ${metrics.overdueTasks} overdue tasks
- ${metrics.completingSoon} projects completing this week
- ${metrics.overBudget} projects over budget

Projects: ${JSON.stringify(projects.map(p => ({
  name: p.name,
  status: p.status,
  progress: p.progress,
  tasks: p.tasks.length
})), null, 2)}

FORMAT REQUIREMENTS:
1. Start with a 3-bullet TL;DR section
2. Then provide 2-3 key action items
3. Keep total under 150 words
4. Use clear, actionable language
5. Match the user's skill level

Example format:
**TL;DR:**
• Point 1
• Point 2  
• Point 3

**Today's Priorities:**
1. Action item 1
2. Action item 2`;
  };

  const getFallbackBriefing = (): string => {
    const priority1 = metrics.atRisk > 0 
      ? `1. Review and address ${metrics.atRisk} at-risk project${metrics.atRisk !== 1 ? 's' : ''}` 
      : '1. Monitor project progress and maintain momentum';
    
    const priority2 = metrics.overdueTasks > 0 
      ? `2. Prioritize ${metrics.overdueTasks} overdue task${metrics.overdueTasks !== 1 ? 's' : ''}` 
      : '2. Plan ahead for upcoming milestones';
    
    const priority3 = metrics.overBudget > 0 
      ? `3. Budget review for ${metrics.overBudget} project${metrics.overBudget !== 1 ? 's' : ''}` 
      : '3. Communicate progress to stakeholders';

    return `**TL;DR:**
• ${projects.length} active projects, ${metrics.atRisk} need attention
• ${metrics.overdueTasks} overdue task${metrics.overdueTasks !== 1 ? 's' : ''} requiring action
• ${metrics.completingSoon} project${metrics.completingSoon !== 1 ? 's' : ''} completing this week

**Today's Priorities:**
${priority1}
${priority2}
${priority3}`;
  };

  const getGreetingTime = (): string => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  const getTLDRSummary = (): JSX.Element => {
    return (
      <div className="space-y-2">
        <div className="flex items-start gap-2">
          <span className="text-[var(--accent-primary)] mt-1">•</span>
          <span className="text-sm text-[var(--text-primary)]">
            {projects.length} active project{projects.length !== 1 ? 's' : ''}
            {metrics.atRisk > 0 && <span className="text-yellow-600 dark:text-yellow-400"> ({metrics.atRisk} at risk)</span>}
          </span>
        </div>
        {metrics.overdueTasks > 0 && (
          <div className="flex items-start gap-2">
            <span className="text-red-500 mt-1">•</span>
            <span className="text-sm text-red-600 dark:text-red-400">
              {metrics.overdueTasks} overdue task{metrics.overdueTasks !== 1 ? 's' : ''} need immediate attention
            </span>
          </div>
        )}
        {metrics.completingSoon > 0 && (
          <div className="flex items-start gap-2">
            <span className="text-green-500 mt-1">•</span>
            <span className="text-sm text-green-600 dark:text-green-400">
              {metrics.completingSoon} project{metrics.completingSoon !== 1 ? 's' : ''} completing this week
            </span>
          </div>
        )}
        {metrics.overBudget > 0 && (
          <div className="flex items-start gap-2">
            <span className="text-orange-500 mt-1">•</span>
            <span className="text-sm text-orange-600 dark:text-orange-400">
              {metrics.overBudget} project{metrics.overBudget !== 1 ? 's' : ''} over budget
            </span>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-xl p-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-xl font-bold text-[var(--text-primary)]">
            {getGreetingTime()}, {userData.name}!
          </h2>
          <p className="text-sm text-[var(--text-tertiary)]">Daily Briefing</p>
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

      {/* TL;DR Section - Always Visible */}
      <div className="mb-4 p-4 bg-[var(--accent-primary)]/10 border-l-4 border-[var(--accent-primary)] rounded">
        <h3 className="text-sm font-bold text-[var(--text-primary)] mb-2 flex items-center gap-2">
          <span>⚡</span>
          TL;DR
        </h3>
        {getTLDRSummary()}
      </div>

      {/* Full Briefing - Expandable */}
      <div className="space-y-4">
        {!showFullBriefing ? (
          <button
            onClick={() => setShowFullBriefing(true)}
            className="text-sm text-[var(--accent-primary)] hover:text-[var(--accent-secondary)] flex items-center gap-1"
          >
            <span>View detailed briefing</span>
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
        ) : (
          <>
            <button
              onClick={() => setShowFullBriefing(false)}
              className="text-sm text-[var(--accent-primary)] hover:text-[var(--accent-secondary)] flex items-center gap-1 mb-2"
            >
              <span>Hide details</span>
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
              </svg>
            </button>

            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="flex items-center space-x-3">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-[var(--accent-primary)]"></div>
                  <span className="text-[var(--text-tertiary)]">Generating detailed briefing...</span>
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
          </>
        )}
      </div>

      {/* Quick Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-4">
        <div className="bg-[var(--bg-tertiary)] rounded-lg p-3">
          <div className="text-2xl font-bold text-[var(--text-primary)]">{projects.length}</div>
          <div className="text-xs text-[var(--text-tertiary)]">Total Projects</div>
        </div>
        {metrics.atRisk > 0 && (
          <div className="bg-yellow-500/10 rounded-lg p-3">
            <div className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">{metrics.atRisk}</div>
            <div className="text-xs text-yellow-600 dark:text-yellow-400">At Risk</div>
          </div>
        )}
        {metrics.overdueTasks > 0 && (
          <div className="bg-red-500/10 rounded-lg p-3">
            <div className="text-2xl font-bold text-red-600 dark:text-red-400">{metrics.overdueTasks}</div>
            <div className="text-xs text-red-600 dark:text-red-400">Overdue</div>
          </div>
        )}
        {metrics.completingSoon > 0 && (
          <div className="bg-green-500/10 rounded-lg p-3">
            <div className="text-2xl font-bold text-green-600 dark:text-green-400">{metrics.completingSoon}</div>
            <div className="text-xs text-green-600 dark:text-green-400">Due This Week</div>
          </div>
        )}
      </div>
    </div>
  );
};

export default DailyBriefing;
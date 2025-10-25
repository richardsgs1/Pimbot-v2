import React, { useState } from 'react';
import type { Project, OnboardingData } from '../types';
import { ProjectStatus } from '../types';
import MarkdownRenderer from './MarkdownRenderer';

interface RiskReportProps {
  projects: Project[];
  userData: OnboardingData;
  onClose: () => void;
}

interface RiskFactor {
  project: Project;
  riskScore: number;
  factors: string[];
  recommendations: string[];
}

const RiskReport: React.FC<RiskReportProps> = ({ projects, userData, onClose }) => {
  const [aiInsights, setAiInsights] = useState<string>('');
  const [isGenerating, setIsGenerating] = useState(false);

  // Analyze project risks
  const analyzeRisks = (): RiskFactor[] => {
    return projects
      .filter(p => p.status !== PROJECT_STATUS_VALUES.Completed)
      .map(project => {
        let riskScore = 0;
        const factors: string[] = [];
        const recommendations: string[] = [];

        // Status-based risk
        if (project.status === PROJECT_STATUS_VALUES.AtRisk) {
          riskScore += 30;
          factors.push('Project currently marked as "At Risk"');
        } else if (project.status === PROJECT_STATUS_VALUES.OnHold) {
          riskScore += 50;
          factors.push('Project is off track');
          recommendations.push('Immediate intervention required');
        }

        // Timeline risk
        const daysUntilDue = Math.ceil(
          (new Date(project.dueDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
        );
        if (daysUntilDue < 0) {
          riskScore += 40;
          factors.push(`Overdue by ${Math.abs(daysUntilDue)} days`);
          recommendations.push('Reassess timeline and scope immediately');
        } else if (daysUntilDue < 7) {
          riskScore += 20;
          factors.push(`Only ${daysUntilDue} days until deadline`);
          recommendations.push('Focus on critical path items');
        }

        // Progress risk
        const expectedProgress = project.startDate
          ? calculateExpectedProgress(project.startDate, project.dueDate)
          : 50;
        const progressGap = expectedProgress - project.progress;
        if (progressGap > 20) {
          riskScore += 25;
          factors.push(`${progressGap.toFixed(0)}% behind expected progress`);
          recommendations.push('Accelerate task completion or adjust timeline');
        }

        // Budget risk
        if (project.budget && project.spent) {
          const budgetUtilization = (project.spent / project.budget) * 100;
          if (budgetUtilization > 100) {
            riskScore += 30;
            factors.push(`Over budget by ${((budgetUtilization - 100)).toFixed(1)}%`);
            recommendations.push('Review budget allocation and scope');
          } else if (budgetUtilization > 90) {
            riskScore += 15;
            factors.push(`Budget ${budgetUtilization.toFixed(1)}% utilized`);
            recommendations.push('Monitor remaining expenses closely');
          }
        }

        // Task completion risk
        const overdueTasks = project.tasks.filter(
          t => !t.completed && new Date(t.dueDate) < new Date()
        );
        if (overdueTasks.length > 0) {
          riskScore += overdueTasks.length * 5;
          factors.push(`${overdueTasks.length} overdue task${overdueTasks.length !== 1 ? 's' : ''}`);
          recommendations.push('Prioritize overdue tasks and reassign if needed');
        }

        // Team size risk
        if (project.teamSize < 2 && project.tasks.length > 10) {
          riskScore += 10;
          factors.push('Small team for task volume');
          recommendations.push('Consider adding team members or reducing scope');
        }

        // Add positive factors
        if (factors.length === 0) {
          factors.push('No significant risk factors identified');
          recommendations.push('Maintain current momentum');
        }

        return { project, riskScore: Math.min(riskScore, 100), factors, recommendations };
      })
      .sort((a, b) => b.riskScore - a.riskScore);
  };

  const calculateExpectedProgress = (startDate: string, endDate: string): number => {
    const start = new Date(startDate).getTime();
    const end = new Date(endDate).getTime();
    const now = new Date().getTime();
    const totalDuration = end - start;
    const elapsed = now - start;
    return Math.max(0, Math.min(100, (elapsed / totalDuration) * 100));
  };

  const riskFactors = analyzeRisks();
  const highRiskProjects = riskFactors.filter(r => r.riskScore >= 50);
  const mediumRiskProjects = riskFactors.filter(r => r.riskScore >= 25 && r.riskScore < 50);

  const getRiskLevel = (score: number): { label: string; color: string; bgColor: string } => {
    if (score >= 70) return {
      label: 'Critical',
      color: 'text-red-600 dark:text-red-400',
      bgColor: 'bg-red-500/10'
    };
    if (score >= 50) return {
      label: 'High',
      color: 'text-orange-600 dark:text-orange-400',
      bgColor: 'bg-orange-500/10'
    };
    if (score >= 25) return {
      label: 'Medium',
      color: 'text-yellow-600 dark:text-yellow-400',
      bgColor: 'bg-yellow-500/10'
    };
    return {
      label: 'Low',
      color: 'text-green-600 dark:text-green-400',
      bgColor: 'bg-green-500/10'
    };
  };

  const generateAIInsights = async () => {
    setIsGenerating(true);
    try {
      const prompt = `Analyze these project risks and provide strategic insights:

High Risk Projects (${highRiskProjects.length}):
${highRiskProjects.map(r => `- ${r.project.name}: Score ${r.riskScore}, Factors: ${r.factors.join(', ')}`).join('\n')}

Medium Risk Projects (${mediumRiskProjects.length}):
${mediumRiskProjects.map(r => `- ${r.project.name}: Score ${r.riskScore}`).join('\n')}

User Level: ${userData.skillLevel}

Provide:
1. Top 3 strategic priorities
2. Risk mitigation strategies
3. Resource reallocation suggestions

Keep response under 200 words, actionable and specific.`;

      const response = await fetch('/api/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'generate',
          prompt: prompt,
          userData: userData,
          projects: projects
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setAiInsights(data.content || 'Unable to generate insights at this time.');
      }
    } catch (error) {
      console.error('Error generating AI insights:', error);
      setAiInsights('Unable to generate insights. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-xl max-w-6xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-[var(--border-primary)] flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-[var(--text-primary)]">Risk Assessment Report</h2>
            <p className="text-sm text-[var(--text-tertiary)] mt-1">
              Comprehensive analysis of project risks and mitigation strategies
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-[var(--bg-tertiary)] rounded-lg transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* Summary Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="bg-red-500/10 rounded-lg p-4 border border-red-500/20">
              <div className="text-3xl font-bold text-red-600 dark:text-red-400">{highRiskProjects.length}</div>
              <div className="text-sm text-red-600 dark:text-red-400">High Risk</div>
            </div>
            <div className="bg-yellow-500/10 rounded-lg p-4 border border-yellow-500/20">
              <div className="text-3xl font-bold text-yellow-600 dark:text-yellow-400">{mediumRiskProjects.length}</div>
              <div className="text-sm text-yellow-600 dark:text-yellow-400">Medium Risk</div>
            </div>
            <div className="bg-green-500/10 rounded-lg p-4 border border-green-500/20">
              <div className="text-3xl font-bold text-green-600 dark:text-green-400">
                {riskFactors.length - highRiskProjects.length - mediumRiskProjects.length}
              </div>
              <div className="text-sm text-green-600 dark:text-green-400">Low Risk</div>
            </div>
          </div>

          {/* AI Insights */}
          <div className="mb-6 bg-[var(--accent-primary)]/10 border border-[var(--accent-primary)]/20 rounded-lg p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-lg font-semibold text-[var(--text-primary)] flex items-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-[var(--accent-primary)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
                AI Strategic Insights
              </h3>
              <button
                onClick={generateAIInsights}
                disabled={isGenerating}
                className="text-sm bg-[var(--accent-primary)] hover:bg-[var(--accent-secondary)] disabled:bg-gray-500 text-white px-4 py-2 rounded-lg transition-colors flex items-center gap-2"
              >
                {isGenerating ? (
                  <>
                    <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Generating...
                  </>
                ) : (
                  <>
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                    Generate Insights
                  </>
                )}
              </button>
            </div>
            {aiInsights ? (
              <div className="prose prose-sm max-w-none text-[var(--text-primary)]">
                <MarkdownRenderer content={aiInsights} />
              </div>
            ) : (
              <p className="text-sm text-[var(--text-tertiary)] italic">
                Click "Generate Insights" to get AI-powered strategic recommendations
              </p>
            )}
          </div>

          {/* Risk Breakdown */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-[var(--text-primary)]">Detailed Risk Analysis</h3>
            
            {riskFactors.length > 0 ? (
              riskFactors.map(risk => {
                const level = getRiskLevel(risk.riskScore);
                return (
                  <div key={risk.project.id} className={`${level.bgColor} border border-[var(--border-primary)] rounded-lg p-5`}>
                    {/* Project Header */}
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <h4 className="text-lg font-semibold text-[var(--text-primary)]">{risk.project.name}</h4>
                        <p className="text-sm text-[var(--text-tertiary)] mt-1">{risk.project.description}</p>
                      </div>
                      <div className="text-right ml-4">
                        <div className={`text-sm font-semibold ${level.color}`}>{level.label} Risk</div>
                        <div className="text-3xl font-bold text-[var(--text-primary)]">{risk.riskScore}</div>
                        <div className="text-xs text-[var(--text-tertiary)]">Risk Score</div>
                      </div>
                    </div>

                    {/* Risk Factors */}
                    <div className="mb-4">
                      <h5 className="text-sm font-semibold text-[var(--text-secondary)] mb-2">Risk Factors:</h5>
                      <ul className="space-y-1">
                        {risk.factors.map((factor, idx) => (
                          <li key={idx} className="text-sm text-[var(--text-primary)] flex items-start gap-2">
                            <span className={`mt-1.5 ${level.color}`}>•</span>
                            <span>{factor}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* Recommendations */}
                    <div className="bg-[var(--bg-secondary)] rounded-lg p-4 border-l-4 border-[var(--accent-primary)]">
                      <h5 className="text-sm font-semibold text-[var(--text-primary)] mb-2 flex items-center gap-2">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        Recommendations:
                      </h5>
                      <ul className="space-y-1">
                        {risk.recommendations.map((rec, idx) => (
                          <li key={idx} className="text-sm text-[var(--text-secondary)]">
                            {idx + 1}. {rec}
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* Quick Stats */}
                    <div className="grid grid-cols-3 gap-3 mt-4">
                      <div className="bg-[var(--bg-secondary)] rounded p-2 text-center">
                        <div className="text-lg font-bold text-[var(--text-primary)]">{risk.project.progress}%</div>
                        <div className="text-xs text-[var(--text-tertiary)]">Complete</div>
                      </div>
                      <div className="bg-[var(--bg-secondary)] rounded p-2 text-center">
                        <div className="text-lg font-bold text-[var(--text-primary)]">
                          {Math.ceil((new Date(risk.project.dueDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))}d
                        </div>
                        <div className="text-xs text-[var(--text-tertiary)]">Until Due</div>
                      </div>
                      <div className="bg-[var(--bg-secondary)] rounded p-2 text-center">
                        <div className="text-lg font-bold text-[var(--text-primary)]">{risk.project.teamSize}</div>
                        <div className="text-xs text-[var(--text-tertiary)]">Team Size</div>
                      </div>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="text-center py-12">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mx-auto text-green-500 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p className="text-lg font-semibold text-[var(--text-primary)]">No Active Projects</p>
                <p className="text-sm text-[var(--text-tertiary)] mt-2">All projects are completed or there are no projects to analyze</p>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-[var(--border-primary)] bg-[var(--bg-secondary)] flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 bg-[var(--accent-primary)] hover:bg-[var(--accent-secondary)] text-white py-2 px-4 rounded-lg transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default RiskReport;
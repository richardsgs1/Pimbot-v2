import React from 'react';
import type { Project, TeamMember, ProjectStatus } from '../types';
import { PROJECT_STATUS_VALUES } from '../types';

interface TeamCapacityAnalysisProps {
  projects: Project[];
  onClose: () => void;
}

interface TeamMemberWorkload {
  member: TeamMember;
  projects: { project: Project; role: string }[];
  totalTasks: number;
  completedTasks: number;
  overdueTasks: number;
  workloadScore: number;
}

const TeamCapacityAnalysis: React.FC<TeamCapacityAnalysisProps> = ({ projects, onClose }) => {
  // Aggregate team member data across all projects
  const analyzeTeamCapacity = (): TeamMemberWorkload[] => {
    const memberMap = new Map<string, TeamMemberWorkload>();

    projects.forEach(project => {
      if (project.teamMembers) {
        project.teamMembers.forEach(member => {
          if (!memberMap.has(member.id)) {
            memberMap.set(member.id, {
              member,
              projects: [],
              totalTasks: 0,
              completedTasks: 0,
              overdueTasks: 0,
              workloadScore: 0
            });
          }

          const workload = memberMap.get(member.id)!;
          workload.projects.push({ project, role: member.role || 'Member' });

          // Count tasks (approximate - could be refined with actual task assignments)
          const tasksPerMember = Math.ceil(project.tasks.length / (project.teamMembers?.length || 1));
          workload.totalTasks += tasksPerMember;
          workload.completedTasks += Math.ceil((tasksPerMember * project.progress) / 100);
          
          // Count overdue tasks
          const overdueTasks = project.tasks.filter(t => 
            !t.completed && t.dueDate && new Date(t.dueDate) < new Date()
          );
          workload.overdueTasks += Math.ceil(overdueTasks.length / (project.teamMembers?.length || 1));

          // Calculate workload score (higher = more overloaded)
          // Factors: number of projects, at-risk projects, overdue tasks, total tasks
          let score = workload.projects.length * 10;
          score += workload.totalTasks * 2;
          score += workload.overdueTasks * 5;
          score += workload.projects.filter(p => p.project.status === PROJECT_STATUS_VALUES.AtRisk).length * 15;
          
          workload.workloadScore = score;
        });
      }
    });

    return Array.from(memberMap.values()).sort((a, b) => b.workloadScore - a.workloadScore);
  };

  const teamWorkloads = analyzeTeamCapacity();

  const getAvatarColor = (name: string): string => {
    const colors = ['#6366f1', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#3b82f6', '#ef4444', '#06b6d4'];
    const hash = name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return colors[hash % colors.length];
  };

  const getWorkloadLevel = (score: number): { label: string; color: string; bgColor: string } => {
    if (score >= 80) return { 
      label: 'Critical', 
      color: 'text-red-600 dark:text-red-400',
      bgColor: 'bg-red-500/10'
    };
    if (score >= 50) return { 
      label: 'High', 
      color: 'text-orange-600 dark:text-orange-400',
      bgColor: 'bg-orange-500/10'
    };
    if (score >= 30) return { 
      label: 'Moderate', 
      color: 'text-yellow-600 dark:text-yellow-400',
      bgColor: 'bg-yellow-500/10'
    };
    return { 
      label: 'Low', 
      color: 'text-green-600 dark:text-green-400',
      bgColor: 'bg-green-500/10'
    };
  };

  const overloadedMembers = teamWorkloads.filter(w => w.workloadScore >= 50);
  const averageWorkload = teamWorkloads.reduce((acc, w) => acc + w.workloadScore, 0) / (teamWorkloads.length || 1);

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-xl max-w-5xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-[var(--border-primary)] flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-[var(--text-primary)]">Team Capacity Analysis</h2>
            <p className="text-sm text-[var(--text-tertiary)] mt-1">
              Workload distribution and capacity insights
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
          {teamWorkloads.length > 0 ? (
            <>
              {/* Summary Stats */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="bg-[var(--bg-tertiary)] rounded-lg p-4">
                  <div className="text-2xl font-bold text-[var(--text-primary)]">{teamWorkloads.length}</div>
                  <div className="text-sm text-[var(--text-tertiary)]">Team Members</div>
                </div>
                <div className="bg-orange-500/10 rounded-lg p-4">
                  <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">{overloadedMembers.length}</div>
                  <div className="text-sm text-orange-600 dark:text-orange-400">Overloaded</div>
                </div>
                <div className="bg-[var(--bg-tertiary)] rounded-lg p-4">
                  <div className="text-2xl font-bold text-[var(--text-primary)]">{averageWorkload.toFixed(0)}</div>
                  <div className="text-sm text-[var(--text-tertiary)]">Avg Workload Score</div>
                </div>
              </div>

              {/* Team Member Cards */}
              <div className="space-y-4">
                {teamWorkloads.map(workload => {
                  const level = getWorkloadLevel(workload.workloadScore);
                  return (
                    <div key={workload.member.id} className={`${level.bgColor} border border-[var(--border-primary)] rounded-lg p-5`}>
                      {/* Member Info */}
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <div
                            className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-lg"
                            style={{ backgroundColor: getAvatarColor(workload.member.name) }}
                          >
                            {workload.member.name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <h3 className="text-lg font-semibold text-[var(--text-primary)]">
                              {workload.member.name}
                            </h3>
                            <p className="text-sm text-[var(--text-tertiary)]">{workload.member.email}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className={`text-sm font-semibold ${level.color}`}>{level.label} Load</div>
                          <div className="text-2xl font-bold text-[var(--text-primary)]">{workload.workloadScore}</div>
                        </div>
                      </div>

                      {/* Stats Grid */}
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                        <div className="bg-[var(--bg-secondary)] rounded p-3">
                          <div className="text-lg font-bold text-[var(--text-primary)]">{workload.projects.length}</div>
                          <div className="text-xs text-[var(--text-tertiary)]">Projects</div>
                        </div>
                        <div className="bg-[var(--bg-secondary)] rounded p-3">
                          <div className="text-lg font-bold text-[var(--text-primary)]">{workload.totalTasks}</div>
                          <div className="text-xs text-[var(--text-tertiary)]">Total Tasks</div>
                        </div>
                        <div className="bg-[var(--bg-secondary)] rounded p-3">
                          <div className="text-lg font-bold text-[var(--text-primary)]">{workload.completedTasks}</div>
                          <div className="text-xs text-[var(--text-tertiary)]">Completed</div>
                        </div>
                        <div className="bg-[var(--bg-secondary)] rounded p-3">
                          <div className="text-lg font-bold text-red-600 dark:text-red-400">{workload.overdueTasks}</div>
                          <div className="text-xs text-red-600 dark:text-red-400">Overdue</div>
                        </div>
                      </div>

                      {/* Project List */}
                      <div>
                        <h4 className="text-sm font-semibold text-[var(--text-secondary)] mb-2">Assigned Projects:</h4>
                        <div className="flex flex-wrap gap-2">
                          {workload.projects.map(({ project, role }, idx) => (
                            <div key={idx} className="bg-[var(--bg-secondary)] rounded px-3 py-1.5 text-sm">
                              <span className="font-medium text-[var(--text-primary)]">{project.name}</span>
                              <span className="text-[var(--text-tertiary)] mx-1">•</span>
                              <span className="text-[var(--text-tertiary)]">{role}</span>
                              {project.status === PROJECT_STATUS_VALUES.AtRisk && (
                                <span className="ml-2 text-yellow-600 dark:text-yellow-400">⚠️</span>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Recommendations */}
                      {workload.workloadScore >= 50 && (
                        <div className="mt-4 p-3 bg-[var(--bg-secondary)] rounded border-l-4 border-orange-500">
                          <div className="flex items-start gap-2">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-orange-500 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                            </svg>
                            <div>
                              <p className="text-sm font-semibold text-[var(--text-primary)]">Recommendation:</p>
                              <p className="text-xs text-[var(--text-tertiary)] mt-1">
                                Consider redistributing tasks or extending timelines. Focus on {workload.overdueTasks > 0 ? 'resolving overdue items' : 'at-risk projects'} first.
                              </p>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </>
          ) : (
            <div className="text-center py-12">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mx-auto text-[var(--text-tertiary)] mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              <p className="text-[var(--text-tertiary)]">No team members found in your projects</p>
              <p className="text-sm text-[var(--text-tertiary)] mt-2">Add team members to your projects to see capacity analysis</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-[var(--border-primary)] bg-[var(--bg-secondary)]">
          <button
            onClick={onClose}
            className="w-full bg-[var(--accent-primary)] hover:bg-[var(--accent-secondary)] text-white py-2 px-4 rounded-lg transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default TeamCapacityAnalysis;
import React, { useMemo, useState, useEffect, useCallback } from 'react';
import type { Project, TeamMember, Task } from '../types';
import { Priority } from '../types';

interface TeamHubProps {
  projects: Project[];
  team: TeamMember[];
  onSelectProject: (projectId: string) => void;
  onMenuClick: () => void;
}

const priorityIcons: { [key in Priority]: React.ReactNode } = {
    [PRIORITY_VALUES.High]: <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" /></svg>,
    [PRIORITY_VALUES.Medium]: <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-yellow-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h14" /></svg>,
    [PRIORITY_VALUES.Low]: <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>,
    [Priority.None]: <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" /></svg>,
};

type MemberWithWorkload = TeamMember & {
  tasks: (Task & { projectName: string; projectId: string })[];
  overdueCount: number;
  priorityCounts: Record<Priority, number>;
};

interface MemberCardProps {
    member: MemberWithWorkload;
    onSelectProject: (projectId: string) => void;
}

const MemberCard: React.FC<MemberCardProps> = ({ member, onSelectProject }) => {
    const [isExpanded, setIsExpanded] = useState(false);
    const [summary, setSummary] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const totalTasks = member.tasks.length;
    const highPriorityPercent = totalTasks > 0 ? (member.priorityCounts.High / totalTasks) * 100 : 0;
    const mediumPriorityPercent = totalTasks > 0 ? (member.priorityCounts.Medium / totalTasks) * 100 : 0;
    const lowPriorityPercent = totalTasks > 0 ? (member.priorityCounts.Low / totalTasks) * 100 : 0;
    const nonePriorityPercent = totalTasks > 0 ? (member.priorityCounts.None / totalTasks) * 100 : 0;


    const fetchSummary = useCallback(async () => {
        if (member.tasks.length === 0) {
            setIsLoading(false);
            setSummary("No active tasks assigned.");
            return;
        }
        setIsLoading(true);
        setError(null);
        try {
            const response = await fetch('/api/get-team-workload-summary', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ tasks: member.tasks, memberName: member.name }),
            });
            const responseText = await response.text();
            if (!response.ok) {
                let errorMsg = 'Failed to fetch summary.';
                try { errorMsg = JSON.parse(responseText).error || errorMsg; } catch (e) { errorMsg = responseText || response.statusText; }
                throw new Error(errorMsg);
            }
            if (!responseText) { throw new Error("Received an empty response."); }
            const data = JSON.parse(responseText);
            setSummary(data.summary);
        } catch (err) {
            const msg = err instanceof Error ? err.message : 'Unknown error.';
            setError(msg);
        } finally {
            setIsLoading(false);
        }
    }, [member.tasks, member.name]);

    useEffect(() => {
        fetchSummary();
    }, [fetchSummary]);

    return (
        <div className="bg-slate-800 rounded-xl border border-slate-700">
            <div className="p-6">
                <div className="flex items-center justify-between">
                    <div className="flex items-center">
                        <div className={`w-12 h-12 rounded-full ${member.avatarColor} flex items-center justify-center text-xl font-bold text-white mr-4`}>
                            {member.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                            <h3 className="text-xl font-bold text-white">{member.name}</h3>
                            <p className="text-sm text-slate-400">{member.tasks.length} active tasks</p>
                        </div>
                    </div>
                    <div className="text-right">
                        <p className={`text-2xl font-bold ${member.overdueCount > 0 ? 'text-red-400' : 'text-slate-200'}`}>{member.overdueCount}</p>
                        <p className="text-sm text-slate-400">Overdue</p>
                    </div>
                </div>
                <div className="mt-4 bg-slate-900/50 p-3 rounded-md">
                    <h4 className="text-xs font-semibold text-cyan-400 mb-2">AI Workload Summary</h4>
                     {isLoading ? (
                        <div className="space-y-2 animate-pulse"><div className="h-3 bg-slate-700 rounded w-full"></div><div className="h-3 bg-slate-700 rounded w-5/6"></div></div>
                    ) : error ? (
                        <p className="text-sm text-red-400">{error}</p>
                    ) : (
                        <p className="text-sm text-slate-300">{summary}</p>
                    )}
                </div>
                {totalTasks > 0 && (
                    <div className="mt-4">
                        <h4 className="text-xs font-semibold text-slate-400 mb-1">Workload Distribution</h4>
                        <div className="flex w-full h-2 rounded-full overflow-hidden bg-slate-700">
                            <div className="bg-red-500" style={{ width: `${highPriorityPercent}%` }} title={`High Priority: ${member.priorityCounts.High} tasks`}></div>
                            <div className="bg-yellow-500" style={{ width: `${mediumPriorityPercent}%` }} title={`Medium Priority: ${member.priorityCounts.Medium} tasks`}></div>
                            <div className="bg-blue-500" style={{ width: `${lowPriorityPercent}%` }} title={`Low Priority: ${member.priorityCounts.Low} tasks`}></div>
                            <div className="bg-slate-500" style={{ width: `${nonePriorityPercent}%` }} title={`No Priority: ${member.priorityCounts.None} tasks`}></div>
                        </div>
                    </div>
                )}
            </div>
            {member.tasks.length > 0 && (
                <div>
                    <button onClick={() => setIsExpanded(!isExpanded)} className="w-full text-left p-3 bg-slate-700/50 hover:bg-slate-700 text-sm text-slate-300 font-semibold transition flex justify-between items-center">
                        <span>{isExpanded ? 'Hide' : 'Show'} All Tasks ({member.tasks.length})</span>
                        <svg xmlns="http://www.w3.org/2000/svg" className={`h-5 w-5 transition-transform ${isExpanded ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                    </button>
                    {isExpanded && (
                        <div className="p-4 max-h-80 overflow-y-auto">
                            <ul className="space-y-3">
                                {member.tasks.map(task => (
                                    <li key={task.id} onClick={() => onSelectProject(task.projectId)} className="flex items-center justify-between p-3 bg-slate-700/50 rounded-lg cursor-pointer hover:bg-slate-700 transition">
                                        <div className="flex items-center">
                                            <span className="mr-3" title={`Priority: ${task.priority}`}>{priorityIcons[task.priority]}</span>
                                            <div>
                                                <p className="font-semibold text-white">{task.name}</p>
                                                <p className="text-xs text-slate-400">{task.projectName}</p>
                                            </div>
                                        </div>
                                        {task.dueDate && (
                                            <p className={`text-xs font-medium ${new Date(task.dueDate) < new Date() && !task.completed ? 'text-red-400' : 'text-slate-400'}`}>
                                                {new Date(task.dueDate + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                                            </p>
                                        )}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

const TeamHub: React.FC<TeamHubProps> = ({ projects, team, onSelectProject, onMenuClick }) => {
    const today = useMemo(() => {
        const d = new Date();
        d.setHours(0, 0, 0, 0);
        return d;
    }, []);

  const workloadData = useMemo<MemberWithWorkload[]>(() => {
    return team.map(member => {
      const assignedTasks = projects.flatMap(p => 
        p.tasks
          .filter(t => t.assigneeId === member.id && !t.completed)
          .map(t => ({ ...t, projectName: p.name, projectId: p.id }))
      );

      const overdueCount = assignedTasks.filter(t => t.dueDate && new Date(t.dueDate) < today).length;
      
      const priorityCounts = assignedTasks.reduce((acc, task) => {
        acc[task.priority] = (acc[task.priority] || 0) + 1;
        return acc;
      }, { [PRIORITY_VALUES.High]: 0, [PRIORITY_VALUES.Medium]: 0, [PRIORITY_VALUES.Low]: 0, [Priority.None]: 0 });

      return { ...member, tasks: assignedTasks, overdueCount, priorityCounts };
    });
  }, [projects, team, today]);

  return (
    <div className="flex-1 flex flex-col h-full">
      <header className="flex items-center flex-shrink-0 p-4 border-b border-slate-700 bg-slate-800/50 backdrop-blur-sm">
        <button onClick={onMenuClick} className="md:hidden mr-4 p-1 rounded-full hover:bg-slate-700" aria-label="Open menu">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
        </button>
        <div>
            <h1 className="text-2xl font-bold">Team Hub</h1>
            <p className="text-slate-400">An AI-powered overview of your team's workload and capacity.</p>
        </div>
      </header>
      <div className="flex-1 overflow-y-auto p-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {workloadData.map(member => (
            <MemberCard key={member.id} member={member} onSelectProject={onSelectProject} />
          ))}
        </div>
      </div>
    </div>
  );
};

export default TeamHub;
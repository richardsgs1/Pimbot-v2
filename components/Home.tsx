import React, { useMemo, useState, useEffect, useCallback } from 'react';
import type { Project, OnboardingData } from '../types';
import { ProjectStatus, Priority } from '../types';
import DailyBriefing from './DailyBriefing';

interface HomeProps {
  projects: Project[];
  onSelectProject: (projectId: string) => void;
  userData: OnboardingData;
  onMenuClick: () => void;
}

const statusColors: { [key in ProjectStatus]: { text: string, dot: string } } = {
  [ProjectStatus.OnTrack]: { text: 'text-green-400', dot: 'bg-green-400' },
  [ProjectStatus.AtRisk]: { text: 'text-yellow-400', dot: 'bg-yellow-400' },
  [ProjectStatus.OffTrack]: { text: 'text-red-400', dot: 'bg-red-400' },
  [ProjectStatus.Completed]: { text: 'text-blue-400', dot: 'bg-blue-400' },
};

const priorityIcons: { [key in Priority]: React.ReactNode } = {
    [Priority.High]: <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" /></svg>,
    [Priority.Medium]: <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-yellow-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h14" /></svg>,
    [Priority.Low]: <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>,
    [Priority.None]: <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" /></svg>,
};


const StatCard: React.FC<{ title: string; value: number; icon: React.ReactNode }> = ({ title, value, icon }) => (
    <div className="bg-slate-800 p-4 rounded-xl flex items-center">
        <div className="p-3 rounded-full bg-slate-700 mr-4">
            {icon}
        </div>
        <div>
            <p className="text-3xl font-bold text-white">{value}</p>
            <p className="text-sm text-slate-400">{title}</p>
        </div>
    </div>
);

const Home: React.FC<HomeProps> = ({ projects, onSelectProject, userData, onMenuClick }) => {
  const [briefing, setBriefing] = useState<string | null>(null);
  const [isBriefingLoading, setIsBriefingLoading] = useState(true);
  const [briefingError, setBriefingError] = useState<string | null>(null);
  const today = useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  }, []);

  const fetchBriefing = useCallback(async () => {
    setIsBriefingLoading(true);
    setBriefingError(null);
    try {
      const response = await fetch('/api/generate-daily-briefing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projects }),
      });

      const responseText = await response.text();
      if (!response.ok) {
        let errorMsg = 'Failed to fetch briefing.';
        try {
          errorMsg = JSON.parse(responseText).error || errorMsg;
        } catch (e) {
          errorMsg = responseText || response.statusText;
        }
        throw new Error(errorMsg);
      }

      if (!responseText) {
        throw new Error("Received an empty response from the server. The request may have timed out.");
      }
      
      const data = JSON.parse(responseText);
      setBriefing(data.briefing);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'An unknown error occurred.';
      setBriefingError(msg);
    } finally {
      setIsBriefingLoading(false);
    }
  }, [projects]);

  useEffect(() => {
    // Only fetch briefing if there are projects to analyze
    if (projects && projects.length > 0) {
      fetchBriefing();
    } else {
      setIsBriefingLoading(false);
      setBriefing("No projects found. Create your first project to get started!");
    }
  }, [fetchBriefing, projects]);

  const projectCounts = useMemo(() => {
    return projects.reduce((acc, project) => {
      acc[project.status] = (acc[project.status] || 0) + 1;
      return acc;
    }, {} as Record<ProjectStatus, number>);
  }, [projects]);

  const atRiskProjects = useMemo(() => {
    return projects.filter(p => p.status === ProjectStatus.AtRisk || p.status === ProjectStatus.OffTrack);
  }, [projects]);
  
  const myTasks = useMemo(() => {
    const priorityOrder = { [Priority.High]: 1, [Priority.Medium]: 2, [Priority.Low]: 3, [Priority.None]: 4 };
    
    return projects.flatMap(project => 
      project.tasks
        .filter(task => task.assigneeId === userData.id && !task.completed)
        .map(task => ({ ...task, projectName: project.name, projectId: project.id }))
    ).sort((a, b) => {
      // Sort by due date first (tasks with no due date go to the bottom)
      const dateA = a.dueDate ? new Date(a.dueDate).getTime() : Infinity;
      const dateB = b.dueDate ? new Date(b.dueDate).getTime() : Infinity;
      if (dateA !== dateB) return dateA - dateB;
      // Then sort by priority
      return priorityOrder[a.priority] - priorityOrder[b.priority];
    });

  }, [projects, userData.id]);


  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return `Good morning, ${userData.name}!`;
    if (hour < 18) return `Good afternoon, ${userData.name}!`;
    return `Good evening, ${userData.name}!`;
  };

  return (
    <div className="flex-1 flex flex-col h-full">
      <header className="flex items-center flex-shrink-0 p-4 border-b border-slate-700 bg-slate-800/50 backdrop-blur-sm">
        <button onClick={onMenuClick} className="md:hidden mr-4 p-1 rounded-full hover:bg-slate-700" aria-label="Open menu">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
        </button>
        <div>
            <h1 className="text-2xl font-bold">{getGreeting()}</h1>
            <p className="text-slate-400">Here's a high-level overview of your projects.</p>
        </div>
      </header>
      <div className="flex-1 overflow-y-auto p-6">
        <div className="max-w-7xl mx-auto">
          {/* Daily Briefing */}
           <div className="mb-6">
            <DailyBriefing
              briefing={briefing}
              isLoading={isBriefingLoading}
              error={briefingError}
              onRefresh={fetchBriefing}
            />
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
            <StatCard 
              title="On Track" 
              value={projectCounts[ProjectStatus.OnTrack] || 0} 
              icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg>}
            />
            <StatCard 
              title="At Risk" 
              value={projectCounts[ProjectStatus.AtRisk] || 0}
              icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-yellow-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>}
            />
             <StatCard 
              title="Off Track" 
              value={projectCounts[ProjectStatus.OffTrack] || 0}
              icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" /></svg>}
            />
            <StatCard 
              title="Completed" 
              value={projectCounts[ProjectStatus.Completed] || 0}
              icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
            />
          </div>

          {/* Widgets Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* My Tasks Widget */}
            <div className="bg-slate-800 rounded-xl p-6">
                <h2 className="text-xl font-bold text-white mb-4">My Tasks</h2>
                {myTasks.length > 0 ? (
                    <ul className="space-y-3 max-h-96 overflow-y-auto pr-2">
                        {myTasks.map(task => (
                            <li key={task.id} onClick={() => onSelectProject(task.projectId)} className="flex items-center justify-between p-3 bg-slate-700/50 rounded-lg cursor-pointer hover:bg-slate-700 transition">
                                <div className="flex items-center">
                                    <span className="mr-3" title={`Priority: ${task.priority}`}>{priorityIcons[task.priority]}</span>
                                    <div>
                                        <p className="font-semibold text-white">{task.name}</p>
                                        <p className="text-xs text-slate-400">{task.projectName}</p>
                                    </div>
                                </div>
                                {task.dueDate && (
                                     <p className={`text-xs font-medium ${new Date(task.dueDate) < today ? 'text-red-400' : 'text-slate-400'}`}>
                                        {new Date(task.dueDate + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                                     </p>
                                )}
                            </li>
                        ))}
                    </ul>
                ) : (
                    <p className="text-slate-400 text-center py-8">You have no pending tasks. Great job!</p>
                )}
            </div>
            
            {/* Projects at Risk Widget */}
            <div className="bg-slate-800 rounded-xl p-6">
              <h2 className="text-xl font-bold text-white mb-4">Projects Requiring Attention</h2>
              {atRiskProjects.length > 0 ? (
                <ul className="space-y-3 max-h-96 overflow-y-auto pr-2">
                  {atRiskProjects.map(project => (
                    <li key={project.id} onClick={() => onSelectProject(project.id)} className="flex items-center justify-between p-3 bg-slate-700/50 rounded-lg cursor-pointer hover:bg-slate-700 transition">
                      <div>
                        <p className="font-semibold text-white">{project.name}</p>
                        <p className={`flex items-center text-sm font-medium ${statusColors[project.status].text}`}>
                          <span className={`w-2 h-2 mr-2 rounded-full ${statusColors[project.status].dot}`}></span>
                          {project.status}
                        </p>
                      </div>
                      <span className="text-slate-400 text-xs">{project.progress}%</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-slate-400 text-center py-8">Great job! No projects are currently at risk.</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;
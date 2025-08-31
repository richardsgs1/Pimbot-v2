import React, { useMemo } from 'react';
import type { Project, Task, OnboardingData } from '../types';
import { ProjectStatus } from '../types';

interface HomeProps {
  projects: Project[];
  onSelectProject: (projectId: string) => void;
  userData: OnboardingData;
}

const statusColors: { [key in ProjectStatus]: { text: string, dot: string } } = {
  [ProjectStatus.OnTrack]: { text: 'text-green-400', dot: 'bg-green-400' },
  [ProjectStatus.AtRisk]: { text: 'text-yellow-400', dot: 'bg-yellow-400' },
  [ProjectStatus.OffTrack]: { text: 'text-red-400', dot: 'bg-red-400' },
  [ProjectStatus.Completed]: { text: 'text-blue-400', dot: 'bg-blue-400' },
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

const Home: React.FC<HomeProps> = ({ projects, onSelectProject, userData }) => {

  const projectCounts = useMemo(() => {
    return projects.reduce((acc, project) => {
      acc[project.status] = (acc[project.status] || 0) + 1;
      return acc;
    }, {} as Record<ProjectStatus, number>);
  }, [projects]);

  const atRiskProjects = useMemo(() => {
    return projects.filter(p => p.status === ProjectStatus.AtRisk || p.status === ProjectStatus.OffTrack);
  }, [projects]);

  const upcomingTasks = useMemo(() => {
    const today = new Date();
    const nextWeek = new Date(today);
    nextWeek.setDate(today.getDate() + 7);

    return projects.flatMap(project =>
      project.tasks
        .filter(task => {
          if (!task.dueDate || task.completed) return false;
          const dueDate = new Date(task.dueDate + 'T00:00:00');
          return dueDate >= today && dueDate <= nextWeek;
        })
        .map(task => ({ ...task, projectName: project.name, projectId: project.id }))
    ).sort((a, b) => new Date(a.dueDate!).getTime() - new Date(b.dueDate!).getTime());
  }, [projects]);

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return `Good morning, ${userData.name}!`;
    if (hour < 18) return `Good afternoon, ${userData.name}!`;
    return `Good evening, ${userData.name}!`;
  };

  return (
    <div className="flex-1 flex flex-col h-full">
      <header className="flex-shrink-0 p-4 border-b border-slate-700 bg-slate-800/50 backdrop-blur-sm">
        <h1 className="text-2xl font-bold">{getGreeting()}</h1>
        <p className="text-slate-400">Here's a high-level overview of your projects.</p>
      </header>
      <div className="flex-1 overflow-y-auto p-6">
        <div className="max-w-7xl mx-auto">
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
            {/* Projects at Risk Widget */}
            <div className="bg-slate-800 rounded-xl p-6">
              <h2 className="text-xl font-bold text-white mb-4">Projects Requiring Attention</h2>
              {atRiskProjects.length > 0 ? (
                <ul className="space-y-3">
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

            {/* Upcoming Deadlines Widget */}
            <div className="bg-slate-800 rounded-xl p-6">
              <h2 className="text-xl font-bold text-white mb-4">Upcoming Deadlines (Next 7 Days)</h2>
               {upcomingTasks.length > 0 ? (
                <ul className="space-y-3">
                  {upcomingTasks.map(task => (
                    <li key={task.id} onClick={() => onSelectProject(task.projectId)} className="p-3 bg-slate-700/50 rounded-lg cursor-pointer hover:bg-slate-700 transition">
                      <p className="font-semibold text-white">{task.name}</p>
                      <div className="flex items-center justify-between text-xs mt-1">
                        <p className="text-slate-400">{task.projectName}</p>
                        <p className="font-medium text-cyan-400">{new Date(task.dueDate + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</p>
                      </div>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-slate-400 text-center py-8">Nothing due in the next 7 days. Time to plan ahead!</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;
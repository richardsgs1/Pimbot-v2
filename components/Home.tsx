import React from 'react';
import type { Project, OnboardingData } from '../types';
import { ProjectStatus, Priority } from '../types';

interface HomeProps {
  projects: Project[];
  userData: OnboardingData;
  onSelectProject: (id: string) => void;
  onMenuClick: (filter: string) => void;
}

const Home: React.FC<HomeProps> = ({ projects, userData, onSelectProject, onMenuClick }) => {
  const handleStatusClick = (status: string) => {
    onMenuClick(`projects-${status}`);
  };

  const getRecentProjects = () => {
    return projects.slice(0, 3);
  };

  const getUpcomingTasks = () => {
    const allTasks = projects.flatMap(project => 
      project.tasks
        .filter(task => !task.completed)
        .map(task => ({ ...task, projectName: project.name, projectId: project.id }))
    );
    
    return allTasks
      .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())
      .slice(0, 5);
  };

  const onTrackCount = projects.filter(p => p.status === ProjectStatus.OnTrack).length;
  const atRiskCount = projects.filter(p => p.status === ProjectStatus.AtRisk).length;
  const offTrackCount = projects.filter(p => p.status === ProjectStatus.OffTrack).length;
  const completedCount = projects.filter(p => p.status === ProjectStatus.Completed).length;

  return (
    <div className="space-y-8">
      {/* Project Overview Cards */}
      <div>
        <h2 className="text-xl font-bold mb-4">Project Overview</h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div 
            onClick={() => handleStatusClick('all')}
            className="bg-slate-800 border border-slate-700 rounded-xl p-6 cursor-pointer hover:border-cyan-500 hover:shadow-lg transition-all duration-200 group"
          >
            <h3 className="text-sm font-medium text-slate-400 mb-2 group-hover:text-slate-300 transition-colors">Total Projects</h3>
            <p className="text-3xl font-bold text-white group-hover:text-cyan-400 transition-colors">{projects.length}</p>
            <div className="mt-2 text-xs text-slate-500 group-hover:text-slate-400 transition-colors">Click to view all</div>
          </div>
          
          <div 
            onClick={() => handleStatusClick('on-track')}
            className="bg-slate-800 border border-slate-700 rounded-xl p-6 cursor-pointer hover:border-green-500 hover:shadow-lg transition-all duration-200 group"
          >
            <h3 className="text-sm font-medium text-slate-400 mb-2 group-hover:text-slate-300 transition-colors">On Track</h3>
            <p className="text-3xl font-bold text-green-400 group-hover:text-green-300 transition-colors">{onTrackCount}</p>
            <div className="mt-2 text-xs text-slate-500 group-hover:text-slate-400 transition-colors">Click to filter</div>
          </div>
          
          <div 
            onClick={() => handleStatusClick('at-risk')}
            className="bg-slate-800 border border-slate-700 rounded-xl p-6 cursor-pointer hover:border-yellow-500 hover:shadow-lg transition-all duration-200 group"
          >
            <h3 className="text-sm font-medium text-slate-400 mb-2 group-hover:text-slate-300 transition-colors">At Risk</h3>
            <p className="text-3xl font-bold text-yellow-400 group-hover:text-yellow-300 transition-colors">{atRiskCount}</p>
            <div className="mt-2 text-xs text-slate-500 group-hover:text-slate-400 transition-colors">Click to filter</div>
          </div>

          <div 
            onClick={() => handleStatusClick('off-track')}
            className="bg-slate-800 border border-slate-700 rounded-xl p-6 cursor-pointer hover:border-red-500 hover:shadow-lg transition-all duration-200 group"
          >
            <h3 className="text-sm font-medium text-slate-400 mb-2 group-hover:text-slate-300 transition-colors">Off Track</h3>
            <p className="text-3xl font-bold text-red-400 group-hover:text-red-300 transition-colors">{offTrackCount}</p>
            <div className="mt-2 text-xs text-slate-500 group-hover:text-slate-400 transition-colors">Click to filter</div>
          </div>
        </div>
      </div>

      {/* Recent Projects */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold">Recent Projects</h2>
          <button 
            onClick={() => onMenuClick('projects-all')}
            className="text-cyan-400 hover:text-cyan-300 text-sm font-medium transition-colors"
          >
            View All →
          </button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {getRecentProjects().map(project => (
            <div 
              key={project.id}
              onClick={() => onSelectProject(project.id)}
              className="bg-slate-800 border border-slate-700 rounded-xl p-4 cursor-pointer hover:border-cyan-500 hover:shadow-lg transition-all duration-200"
            >
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-semibold text-white">{project.name}</h3>
                <span className={`text-xs px-2 py-1 rounded-full ${
                  project.status === ProjectStatus.OnTrack ? 'bg-green-500/20 text-green-300' :
                  project.status === ProjectStatus.AtRisk ? 'bg-yellow-500/20 text-yellow-300' :
                  project.status === ProjectStatus.OffTrack ? 'bg-red-500/20 text-red-300' :
                  'bg-blue-500/20 text-blue-300'
                }`}>
                  {project.status}
                </span>
              </div>
              <p className="text-sm text-slate-400 mb-3">{project.description}</p>
              <div className="flex items-center justify-between">
                <div className="text-xs text-slate-500">
                  Due: {new Date(project.dueDate).toLocaleDateString()}
                </div>
                <div className="flex items-center">
                  <div className="w-16 bg-slate-700 rounded-full h-2 mr-2">
                    <div 
                      className="bg-cyan-500 h-2 rounded-full" 
                      style={{width: `${project.progress}%`}}
                    ></div>
                  </div>
                  <span className="text-xs text-slate-400">{project.progress}%</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Upcoming Tasks */}
      <div>
        <h2 className="text-xl font-bold mb-4">Upcoming Tasks</h2>
        <div className="bg-slate-800 border border-slate-700 rounded-xl p-4">
          {getUpcomingTasks().length > 0 ? (
            <div className="space-y-3">
              {getUpcomingTasks().map(task => (
                <div key={task.id} className="flex items-center justify-between p-3 bg-slate-700/50 rounded-lg">
                  <div className="flex-1">
                    <h4 className="font-medium text-white">{task.name}</h4>
                    <p className="text-sm text-slate-400">{task.projectName}</p>
                  </div>
                  <div className="text-right">
                    <div className="text-sm text-slate-300">
                      {new Date(task.dueDate).toLocaleDateString()}
                    </div>
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      task.priority === Priority.High ? 'bg-red-500/20 text-red-300' :
                      task.priority === Priority.Medium ? 'bg-yellow-500/20 text-yellow-300' :
                      'bg-blue-500/20 text-blue-300'
                    }`}>
                      {task.priority}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-slate-400 text-center py-4">No upcoming tasks</p>
          )}
        </div>
      </div>

      {/* Quick Actions */}
      <div>
        <h2 className="text-xl font-bold mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <button 
            onClick={() => onMenuClick('projects-all')}
            className="bg-slate-800 border border-slate-700 rounded-xl p-4 hover:border-cyan-500 transition-all duration-200 text-left group"
          >
            <div className="flex items-center">
              <div className="bg-cyan-600/20 p-3 rounded-lg mr-4 group-hover:bg-cyan-600/30 transition-colors">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-cyan-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                </svg>
              </div>
              <div>
                <h3 className="font-semibold text-white group-hover:text-cyan-300 transition-colors">Create New Project</h3>
                <p className="text-sm text-slate-400">Start a new project from scratch</p>
              </div>
            </div>
          </button>

          <button 
            onClick={() => onMenuClick('analytics')}
            className="bg-slate-800 border border-slate-700 rounded-xl p-4 hover:border-cyan-500 transition-all duration-200 text-left group"
          >
            <div className="flex items-center">
              <div className="bg-purple-600/20 p-3 rounded-lg mr-4 group-hover:bg-purple-600/30 transition-colors">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <div>
                <h3 className="font-semibold text-white group-hover:text-cyan-300 transition-colors">View Analytics</h3>
                <p className="text-sm text-slate-400">Project insights and metrics</p>
              </div>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
};

export default Home;
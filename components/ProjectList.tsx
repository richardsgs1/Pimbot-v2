import React, { useState } from 'react';
import type { Project } from '../types';
import { ProjectStatus } from '../types';

interface ProjectListProps {
  projects: Project[];
  projectFilter: string | null;
  onSelectProject: (id: string) => void;
  onProjectCreated: (projectData: any) => void;
  onClearFilter: () => void;
  onMenuClick: () => void;
}

const ProjectList: React.FC<ProjectListProps> = ({ 
  onMenuClick, 
  projects, 
  projectFilter,
  onSelectProject, 
  onProjectCreated,
  onClearFilter
}) => {
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newProject, setNewProject] = useState({
    name: '',
    description: '',
    dueDate: ''
  });

  const getFilteredProjects = () => {
    if (!projectFilter || projectFilter === 'all') {
      return projects;
    }
    
    switch (projectFilter) {
      case 'on-track':
        return projects.filter(p => p.status === ProjectStatus.OnTrack);
      case 'at-risk':
        return projects.filter(p => p.status === ProjectStatus.AtRisk);
      case 'off-track':
        return projects.filter(p => p.status === ProjectStatus.OffTrack);
      case 'completed':
        return projects.filter(p => p.status === ProjectStatus.Completed);
      default:
        return projects;
    }
  };

  const getFilterTitle = () => {
    if (!projectFilter || projectFilter === 'all') {
      return 'All Projects';
    }
    return projectFilter.charAt(0).toUpperCase() + projectFilter.slice(1).replace('-', ' ') + ' Projects';
  };

  const getFilterDescription = () => {
    if (!projectFilter || projectFilter === 'all') {
      return 'Manage and track your project portfolio';
    }
    const filterName = projectFilter.replace('-', ' ');
    return `Projects currently ${filterName}`;
  };

  const handleCreateProject = () => {
    if (!newProject.name.trim()) return;
    
    const projectData = {
      id: `project-${Date.now()}`,
      name: newProject.name,
      description: newProject.description,
      status: ProjectStatus.OnTrack,
      dueDate: newProject.dueDate,
      progress: 0,
      tasks: [],
      journal: []
    };
    
    onProjectCreated(projectData);
    setNewProject({ name: '', description: '', dueDate: '' });
    setShowCreateForm(false);
  };

  const displayProjects = getFilteredProjects();

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center">
          <button onClick={onMenuClick} className="md:hidden mr-4 p-1 rounded-full hover:bg-slate-700" aria-label="Open menu">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <div>
            <h1 className="text-2xl font-bold">{getFilterTitle()}</h1>
            {projectFilter && projectFilter !== 'all' && (
              <button 
                onClick={onClearFilter}
                className="text-sm text-cyan-400 hover:text-cyan-300 mt-1 flex items-center"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                </svg>
                Back to all projects
              </button>
            )}
          </div>
        </div>
        <button 
          onClick={() => setShowCreateForm(true)}
          className="bg-cyan-600 hover:bg-cyan-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors flex items-center gap-2"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          New Project
        </button>
      </div>
      
      <p className="text-slate-400 mb-4">{getFilterDescription()}</p>

      {/* Filter Status Bar */}
      {projectFilter && projectFilter !== 'all' && (
        <div className="bg-slate-800 border border-slate-700 rounded-lg p-3 mb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div className={`w-3 h-3 rounded-full mr-3 ${
                projectFilter === 'on-track' ? 'bg-green-400' :
                projectFilter === 'at-risk' ? 'bg-yellow-400' :
                projectFilter === 'off-track' ? 'bg-red-400' :
                'bg-blue-400'
              }`}></div>
              <span className="text-sm text-slate-300">
                Showing {displayProjects.length} of {projects.length} projects
              </span>
            </div>
            <button 
              onClick={onClearFilter}
              className="text-xs text-slate-400 hover:text-slate-300 px-2 py-1 rounded border border-slate-600 hover:border-slate-500 transition-colors"
            >
              Clear Filter
            </button>
          </div>
        </div>
      )}

      {showCreateForm && (
        <div className="bg-slate-800 border border-slate-700 rounded-lg p-4 mb-4">
          <h3 className="text-lg font-semibold mb-3">Create New Project</h3>
          <div className="space-y-3">
            <input
              type="text"
              placeholder="Project name"
              value={newProject.name}
              onChange={(e) => setNewProject(prev => ({ ...prev, name: e.target.value }))}
              className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-500"
            />
            <textarea
              placeholder="Project description"
              value={newProject.description}
              onChange={(e) => setNewProject(prev => ({ ...prev, description: e.target.value }))}
              className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-500"
              rows={3}
            />
            <input
              type="date"
              value={newProject.dueDate}
              onChange={(e) => setNewProject(prev => ({ ...prev, dueDate: e.target.value }))}
              className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
            />
            <div className="flex gap-2">
              <button 
                onClick={handleCreateProject}
                disabled={!newProject.name.trim()}
                className="bg-cyan-600 hover:bg-cyan-700 disabled:bg-slate-600 disabled:cursor-not-allowed text-white font-semibold py-2 px-4 rounded-lg transition-colors"
              >
                Create Project
              </button>
              <button 
                onClick={() => setShowCreateForm(false)}
                className="bg-slate-600 hover:bg-slate-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="bg-slate-800 border border-slate-700 rounded-lg">
        {displayProjects.map(p => (
            <div key={p.id} onClick={() => onSelectProject(p.id)} className="cursor-pointer p-4 border-b border-slate-700 last:border-b-0 hover:bg-slate-700/50 transition-colors">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-semibold text-white">{p.name}</h3>
                  <span className={`text-xs px-2 py-1 rounded-full ${
                    p.status === ProjectStatus.OnTrack ? 'bg-green-500/20 text-green-300' :
                    p.status === ProjectStatus.AtRisk ? 'bg-yellow-500/20 text-yellow-300' :
                    p.status === ProjectStatus.OffTrack ? 'bg-red-500/20 text-red-300' :
                    'bg-blue-500/20 text-blue-300'
                  }`}>
                    {p.status}
                  </span>
                </div>
                <p className="text-sm text-slate-400 mb-2">{p.description}</p>
                <div className="flex items-center justify-between">
                  <p className="text-xs text-slate-500">Due: {new Date(p.dueDate).toLocaleDateString()}</p>
                  <div className="flex items-center">
                    <div className="w-16 bg-slate-700 rounded-full h-2 mr-2">
                      <div 
                        className="bg-cyan-500 h-2 rounded-full" 
                        style={{width: `${p.progress}%`}}
                      ></div>
                    </div>
                    <span className="text-xs text-slate-400">{p.progress}%</span>
                  </div>
                </div>
            </div>
        ))}
        {displayProjects.length === 0 && (
          <div className="p-8 text-center">
            <p className="text-slate-400 mb-4">
              {projectFilter && projectFilter !== 'all' 
                ? `No projects found with "${projectFilter.replace('-', ' ')}" status.`
                : "No projects exist yet."
              }
            </p>
            {!projectFilter || projectFilter === 'all' ? (
              <button 
                onClick={() => setShowCreateForm(true)}
                className="text-cyan-400 hover:text-cyan-300 font-medium"
              >
                Create your first project →
              </button>
            ) : (
              <button 
                onClick={onClearFilter}
                className="text-cyan-400 hover:text-cyan-300 font-medium"
              >
                View all projects →
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default ProjectList;
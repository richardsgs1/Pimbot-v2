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
    startDate: '',
    endDate: '',
    dueDate: '',
    priority: 'Medium',
    manager: '',
    teamSize: 0,
    budget: 0,
    spent: 0
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
    if (!newProject.name.trim() || !newProject.dueDate) return;
    
    const projectData = {
      id: `project-${Date.now()}`,
      name: newProject.name,
      description: newProject.description,
      status: ProjectStatus.OnTrack,
      startDate: newProject.startDate || new Date().toISOString().split('T')[0],
      endDate: newProject.endDate || newProject.dueDate,
      dueDate: newProject.dueDate,
      priority: newProject.priority,
      manager: newProject.manager,
      teamSize: newProject.teamSize || 1,
      budget: newProject.budget || 0,
      spent: newProject.spent || 0,
      progress: 0,
      tasks: [],
      teamMembers: [],
      journal: []
    };
    
    onProjectCreated(projectData);
    setNewProject({ 
      name: '', 
      description: '', 
      startDate: '',
      endDate: '',
      dueDate: '',
      priority: 'Medium',
      manager: '',
      teamSize: 0,
      budget: 0,
      spent: 0
    });
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
        <div className="bg-slate-800 border border-slate-700 rounded-lg p-6 mb-4">
          <h3 className="text-lg font-semibold mb-4">Create New Project</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Project Name */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-slate-300 mb-2">Project Name *</label>
              <input
                type="text"
                placeholder="Enter project name"
                value={newProject.name}
                onChange={(e) => setNewProject(prev => ({ ...prev, name: e.target.value }))}
                className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-500"
              />
            </div>

            {/* Description */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-slate-300 mb-2">Description</label>
              <textarea
                placeholder="Enter project description"
                value={newProject.description}
                onChange={(e) => setNewProject(prev => ({ ...prev, description: e.target.value }))}
                className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                rows={3}
              />
            </div>

            {/* Start Date */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Start Date</label>
              <input
                type="date"
                value={newProject.startDate}
                onChange={(e) => setNewProject(prev => ({ ...prev, startDate: e.target.value }))}
                className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
              />
            </div>

            {/* End Date */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">End Date</label>
              <input
                type="date"
                value={newProject.endDate}
                onChange={(e) => setNewProject(prev => ({ ...prev, endDate: e.target.value }))}
                className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
              />
            </div>

            {/* Due Date */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Due Date *</label>
              <input
                type="date"
                value={newProject.dueDate}
                onChange={(e) => setNewProject(prev => ({ ...prev, dueDate: e.target.value }))}
                className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
              />
            </div>

            {/* Priority */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Priority</label>
              <select
                value={newProject.priority}
                onChange={(e) => setNewProject(prev => ({ ...prev, priority: e.target.value }))}
                className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
              >
                <option value="Low">Low</option>
                <option value="Medium">Medium</option>
                <option value="High">High</option>
              </select>
            </div>

            {/* Manager */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Project Manager</label>
              <input
                type="text"
                placeholder="Manager name"
                value={newProject.manager}
                onChange={(e) => setNewProject(prev => ({ ...prev, manager: e.target.value }))}
                className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-500"
              />
            </div>

            {/* Team Size */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Team Size</label>
              <input
                type="number"
                min="1"
                placeholder="5"
                value={newProject.teamSize}
                onChange={(e) => setNewProject(prev => ({ ...prev, teamSize: parseInt(e.target.value) || 0 }))}
                className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-500"
              />
              <p className="text-xs text-slate-400 mt-1">You can add specific team members after creating the project</p>
            </div>

            {/* Budget */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Budget ($)</label>
              <input
                type="number"
                min="0"
                placeholder="50000"
                value={newProject.budget}
                onChange={(e) => setNewProject(prev => ({ ...prev, budget: parseInt(e.target.value) || 0 }))}
                className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-500"
              />
            </div>

            {/* Spent */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Amount Spent ($)</label>
              <input
                type="number"
                min="0"
                placeholder="0"
                value={newProject.spent}
                onChange={(e) => setNewProject(prev => ({ ...prev, spent: parseInt(e.target.value) || 0 }))}
                className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-500"
              />
            </div>
          </div>

          <div className="flex gap-2 mt-6">
            <button 
              onClick={handleCreateProject}
              disabled={!newProject.name.trim() || !newProject.dueDate}
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
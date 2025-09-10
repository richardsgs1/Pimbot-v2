import React, { useState } from 'react';
import type { Project } from '../types';
import { ProjectStatus } from '../types';

interface ProjectListProps {
  projects: Project[];
  onSelectProject: (id: string) => void;
  onProjectCreated: (projectData: any) => void;
  onMenuClick: () => void;
}

const ProjectList: React.FC<ProjectListProps> = ({ onMenuClick, projects, onSelectProject, onProjectCreated }) => {
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newProject, setNewProject] = useState({
    name: '',
    description: '',
    dueDate: ''
  });

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

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center">
          <button onClick={onMenuClick} className="md:hidden mr-4 p-1 rounded-full hover:bg-slate-700" aria-label="Open menu">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <h1 className="text-2xl font-bold">Projects</h1>
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
      
      <p className="text-slate-400 mb-4">Select a project to view its details or create a new one.</p>

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
        {projects.map(p => (
            <div key={p.id} onClick={() => onSelectProject(p.id)} className="cursor-pointer p-4 border-b border-slate-700 last:border-b-0 hover:bg-slate-700/50 transition-colors">
                <p className="font-semibold">{p.name}</p>
                <p className="text-sm text-slate-400">{p.description}</p>
                <p className="text-xs text-slate-500 mt-1">Due: {new Date(p.dueDate).toLocaleDateString()}</p>
            </div>
        ))}
        {projects.length === 0 && <p className="p-4 text-slate-400">No projects exist. Click "New Project" to create one.</p>}
      </div>
    </div>
  );
};

export default ProjectList;
import React from 'react';
import type { Project } from '../types';

interface ProjectListProps {
  projects: Project[];
  onSelectProject: (id: string) => void;
  onProjectCreated: (projectData: any) => void;
  onMenuClick: () => void;
}

const ProjectList: React.FC<ProjectListProps> = ({ onMenuClick, projects, onSelectProject }) => {
  return (
    <div className="p-6">
      <div className="flex items-center mb-4">
        <button onClick={onMenuClick} className="md:hidden mr-4 p-1 rounded-full hover:bg-slate-700" aria-label="Open menu">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
        <h1 className="text-2xl font-bold">Projects</h1>
      </div>
      <p className="text-slate-400 mb-4">Select a project to view its details or create a new one.</p>
        <div className="bg-slate-800 border border-slate-700 rounded-lg">
          {projects.map(p => (
              <div key={p.id} onClick={() => onSelectProject(p.id)} className="cursor-pointer p-4 border-b border-slate-700 last:border-b-0 hover:bg-slate-700/50">
                  <p className="font-semibold">{p.name}</p>
                  <p className="text-sm text-slate-400">{p.description}</p>
              </div>
          ))}
          {projects.length === 0 && <p className="p-4 text-slate-400">No projects exist.</p>}
        </div>
    </div>
  );
};

export default ProjectList;
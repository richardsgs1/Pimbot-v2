import React, { useState } from 'react';
import type { Project } from '../types';
import { ProjectStatus } from '../types';
import NewProjectModal from './NewProjectModal';

interface ProjectListProps {
  projects: Project[];
  onSelectProject: (id: string) => void;
  onProjectCreated: (projectData: Omit<Project, 'id' | 'status' | 'progress'>) => void;
  onMenuClick: () => void;
}

const statusColors: { [key in ProjectStatus]: { bg: string, text: string, dot: string } } = {
  [ProjectStatus.OnTrack]: { bg: 'bg-green-500/10', text: 'text-green-400', dot: 'bg-green-400' },
  [ProjectStatus.AtRisk]: { bg: 'bg-yellow-500/10', text: 'text-yellow-400', dot: 'bg-yellow-400' },
  [ProjectStatus.OffTrack]: { bg: 'bg-red-500/10', text: 'text-red-400', dot: 'bg-red-400' },
  [ProjectStatus.Completed]: { bg: 'bg-blue-500/10', text: 'text-blue-400', dot: 'bg-blue-400' },
};

const ProjectCard: React.FC<{ project: Project; onSelect: () => void }> = ({ project, onSelect }) => {
  const { name, status, dueDate, progress, coverImageUrl } = project;
  const colors = statusColors[status];
  
  const formattedDate = new Date(dueDate + 'T00:00:00').toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
  
  const cardStyle = {
    backgroundImage: coverImageUrl ? `url(${coverImageUrl})` : 'none',
  };

  return (
    <div 
      onClick={onSelect} 
      style={cardStyle}
      className={`relative group border border-slate-700 rounded-xl flex flex-col justify-between overflow-hidden bg-cover bg-center transition-all duration-300 hover:border-cyan-500 transform hover:-translate-y-1 cursor-pointer shadow-lg ${!coverImageUrl ? 'bg-gradient-to-br from-slate-800 to-slate-900' : ''}`}
    >
      <div className="absolute inset-0 bg-slate-900/70 group-hover:bg-slate-900/60 transition-colors duration-300"></div>
      <div className="relative p-6 flex flex-col justify-between h-full">
        <div>
          <div className="flex justify-between items-start">
              <h3 className="text-lg font-bold text-white mb-2">{name}</h3>
              <div className={`flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${colors.bg} ${colors.text} flex-shrink-0`}>
                  <span className={`w-2 h-2 mr-2 rounded-full ${colors.dot}`}></span>
                  {status}
              </div>
          </div>
          <p className="text-sm text-slate-400">Due: {formattedDate}</p>
        </div>
        <div className="mt-6">
          <div className="flex justify-between items-center mb-1">
            <span className="text-xs font-medium text-slate-400">Progress</span>
            <span className="text-xs font-medium text-white">{progress}%</span>
          </div>
          <div className="w-full bg-slate-700 rounded-full h-2">
            <div className="bg-cyan-500 h-2 rounded-full" style={{ width: `${progress}%` }}></div>
          </div>
        </div>
      </div>
    </div>
  );
};


const ProjectList: React.FC<ProjectListProps> = ({ projects, onSelectProject, onProjectCreated, onMenuClick }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  const handleProjectCreated = (projectData: Omit<Project, 'id' | 'status' | 'progress'>) => {
    onProjectCreated(projectData);
    setIsModalOpen(false);
  };

  return (
    <>
      <div className="flex flex-col h-full">
          <header className="flex items-center justify-between p-4 border-b border-slate-700 bg-slate-800/50 backdrop-blur-sm flex-shrink-0">
              <div className="flex items-center">
                <button onClick={onMenuClick} className="md:hidden mr-4 p-1 rounded-full hover:bg-slate-700" aria-label="Open menu">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
                    </svg>
                </button>
                <h2 className="text-xl font-bold">Projects</h2>
              </div>
              <button 
                onClick={() => setIsModalOpen(true)}
                className="bg-cyan-600 hover:bg-cyan-500 text-white font-bold py-2 px-4 rounded-lg transition duration-300 transform hover:scale-105"
              >
                  New Project
              </button>
          </header>
          <div className="flex-1 overflow-y-auto p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {projects.map((project) => (
                      <ProjectCard key={project.id} project={project} onSelect={() => onSelectProject(project.id)} />
                  ))}
              </div>
          </div>
      </div>
      {isModalOpen && (
        <NewProjectModal 
          onClose={() => setIsModalOpen(false)} 
          onProjectCreated={handleProjectCreated}
        />
      )}
    </>
  );
};

export default ProjectList;
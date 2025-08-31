import React, { useState } from 'react';
import type { Project } from '../types';
import { ProjectStatus } from '../types';
import NewProjectModal from './NewProjectModal';

interface ProjectListProps {
  projects: Project[];
  onSelectProject: (id: string) => void;
  onProjectCreated: (projectData: Omit<Project, 'id' | 'status' | 'progress'>) => void;
}

const statusColors: { [key in ProjectStatus]: { bg: string, text: string, dot: string } } = {
  [ProjectStatus.OnTrack]: { bg: 'bg-green-500/10', text: 'text-green-400', dot: 'bg-green-400' },
  [ProjectStatus.AtRisk]: { bg: 'bg-yellow-500/10', text: 'text-yellow-400', dot: 'bg-yellow-400' },
  [ProjectStatus.OffTrack]: { bg: 'bg-red-500/10', text: 'text-red-400', dot: 'bg-red-400' },
  [ProjectStatus.Completed]: { bg: 'bg-blue-500/10', text: 'text-blue-400', dot: 'bg-blue-400' },
};

const ProjectCard: React.FC<{ project: Project; onSelect: () => void }> = ({ project, onSelect }) => {
  const { name, status, dueDate, progress } = project;
  const colors = statusColors[status];
  
  const formattedDate = new Date(dueDate + 'T00:00:00').toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return (
    <div onClick={onSelect} className="bg-slate-800 border border-slate-700 rounded-xl p-6 flex flex-col justify-between hover:border-cyan-500 hover:bg-slate-700/50 cursor-pointer transition-all duration-200">
      <div>
        <div className="flex justify-between items-start">
            <h3 className="text-lg font-bold text-white mb-2">{name}</h3>
            <div className={`flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${colors.bg} ${colors.text}`}>
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
  );
};


const ProjectList: React.FC<ProjectListProps> = ({ projects, onSelectProject, onProjectCreated }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  const handleProjectCreated = (projectData: Omit<Project, 'id' | 'status' | 'progress'>) => {
    onProjectCreated(projectData);
    setIsModalOpen(false);
  };

  return (
    <>
      <div className="flex flex-col h-full">
          <header className="flex items-center justify-between p-4 border-b border-slate-700 bg-slate-800/50 backdrop-blur-sm flex-shrink-0">
              <h2 className="text-xl font-bold">Projects</h2>
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
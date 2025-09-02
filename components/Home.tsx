import React from 'react';
import type { Project, OnboardingData } from '../types';
import { ProjectStatus } from '../types';

interface HomeProps {
  projects: Project[];
  onSelectProject: (id: string) => void;
  userData: OnboardingData;
  onMenuClick: () => void;
}

const Home: React.FC<HomeProps> = ({ projects, onSelectProject }) => {
  const onTrackProjects = projects.filter(p => p.status === ProjectStatus.OnTrack).length;
  const atRiskProjects = projects.filter(p => p.status === ProjectStatus.AtRisk).length;
  
  return (
    <div className="mt-6">
      <h2 className="text-2xl font-bold text-white mb-4">Project Overview</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div className="bg-slate-800 p-4 rounded-lg border border-slate-700">
          <h3 className="text-slate-400 text-sm font-medium">Total Projects</h3>
          <p className="text-3xl font-bold text-white">{projects.length}</p>
        </div>
        <div className="bg-slate-800 p-4 rounded-lg border border-slate-700">
          <h3 className="text-slate-400 text-sm font-medium">On Track</h3>
          <p className="text-3xl font-bold text-green-400">{onTrackProjects}</p>
        </div>
        <div className="bg-slate-800 p-4 rounded-lg border border-slate-700">
          <h3 className="text-slate-400 text-sm font-medium">At Risk</h3>
          <p className="text-3xl font-bold text-yellow-400">{atRiskProjects}</p>
        </div>
      </div>
      
      <h3 className="text-xl font-bold text-white mb-4">Quick Access</h3>
      <div className="bg-slate-800 rounded-lg border border-slate-700">
        {projects.slice(0, 3).map(project => (
          <div key={project.id} className="p-4 border-b border-slate-700 last:border-b-0">
            <button onClick={() => onSelectProject(project.id)} className="w-full text-left transition-colors hover:text-cyan-400 focus:outline-none focus:text-cyan-400">
                <p className="font-semibold text-white">{project.name}</p>
                <p className="text-sm text-slate-400">{project.status} - {project.progress}% complete</p>
            </button>
          </div>
        ))}
         {projects.length === 0 && <p className="p-4 text-slate-400">No projects yet. Go to the 'Projects' tab to create one!</p>}
      </div>
    </div>
  );
};

export default Home;
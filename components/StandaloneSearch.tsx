import React, { useState, useEffect } from 'react';
import type { Project } from '../types';

interface StandaloneSearchProps {
  projects: Project[];
  onProjectClick: (projectId: string) => void;
}

const StandaloneSearch: React.FC<StandaloneSearchProps> = ({ projects, onProjectClick }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [results, setResults] = useState<any[]>([]);
  const [showResults, setShowResults] = useState(false);

  useEffect(() => {
    if (searchTerm.length < 3) {
      setResults([]);
      setShowResults(false);
      return;
    }

    const term = searchTerm.toLowerCase();
    const projectResults = projects
      .filter(p => p.name.toLowerCase().includes(term) || p.description?.toLowerCase().includes(term))
      .map(p => ({ type: 'project', id: p.id, name: p.name }));

    const taskResults = projects.flatMap(project =>
      project.tasks
        .filter(task => task.name.toLowerCase().includes(term))
        .map(task => ({ type: 'task', id: task.id, name: task.name, projectId: project.id, projectName: project.name }))
    );

    setResults([...projectResults, ...taskResults]);
    setShowResults(true);
  }, [searchTerm, projects]);

  const handleResultClick = (result: any) => {
    if (result.type === 'project') {
      onProjectClick(result.id);
    } else if (result.type === 'task') {
      onProjectClick(result.projectId);
    }
    setSearchTerm('');
    setShowResults(false);
  };

  return (
    <div className="relative mb-4">
      <input 
        type="text" 
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        placeholder="Search projects and tasks..." 
        className="w-full bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 py-2 pl-10 pr-4 focus:outline-none focus:ring-2 focus:ring-cyan-500 transition"
      />
      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
      </div>
      {showResults && results.length > 0 && (
        <div className="absolute top-full left-0 right-0 bg-slate-700 rounded-lg mt-1 p-3 text-sm max-h-48 overflow-y-auto z-50 border border-slate-600 shadow-lg">
          <div className="text-slate-300 mb-2 font-medium">
            Found {results.length} results
          </div>
          {results.map((result, index) => (
            <div 
              key={`${result.type}-${result.id}-${index}`}
              className="text-cyan-300 hover:bg-slate-600 hover:text-white cursor-pointer py-2 px-2 rounded transition-colors"
              onClick={() => handleResultClick(result)}
            >
              {result.type === 'project' ? '📁' : '✓'} {result.name}
              {result.type === 'task' && <span className="text-slate-400 text-xs ml-2">in {result.projectName}</span>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default StandaloneSearch;
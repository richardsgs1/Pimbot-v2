import React, { useState } from 'react';
import type { Project } from '../types';

interface NewProjectModalProps {
  onClose: () => void;
  onProjectCreated: (projectData: Omit<Project, 'id' | 'status' | 'progress'>) => void;
}

const NewProjectModal: React.FC<NewProjectModalProps> = ({ onClose, onProjectCreated }) => {
  const [description, setDescription] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!description.trim()) {
      setError('Please provide a description for your project.');
      return;
    }
    setError(null);
    setIsLoading(true);

    try {
      const response = await fetch('/api/generate-project', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: description }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to generate project.');
      }

      const projectData = await response.json();
      onProjectCreated(projectData);

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred.';
      setError(`Error: ${errorMessage}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4" aria-modal="true" role="dialog">
      <div className="bg-slate-800 border border-slate-700 rounded-2xl shadow-2xl w-full max-w-lg relative">
        <button
          onClick={onClose}
          className="absolute top-3 right-3 text-slate-400 hover:text-white transition-colors"
          aria-label="Close modal"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
        
        <form onSubmit={handleSubmit} className="p-8">
          <h2 className="text-2xl font-bold text-white mb-2">Create New Project with AI</h2>
          <p className="text-slate-400 mb-6">Describe your project goal, and PiMbOt AI will generate a plan for you.</p>

          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full bg-slate-700 border border-slate-600 rounded-lg resize-none text-white p-4 focus:outline-none focus:ring-2 focus:ring-cyan-500 transition h-32"
            placeholder="e.g., Launch a social media campaign for our new Q4 product. It needs to be done by the end of November."
            disabled={isLoading}
            required
          />

          {error && <p className="text-red-400 mt-2 text-sm">{error}</p>}
          
          <div className="mt-6 flex justify-end">
            <button
              type="submit"
              className="bg-cyan-600 hover:bg-cyan-500 text-white font-bold py-2 px-6 rounded-lg transition duration-300 transform hover:scale-105 disabled:bg-slate-600 disabled:cursor-not-allowed flex items-center"
              disabled={isLoading || !description.trim()}
            >
              {isLoading && (
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              )}
              {isLoading ? 'Generating...' : 'Generate Project'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default NewProjectModal;
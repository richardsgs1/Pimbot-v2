import React, { useState } from 'react';

interface TaskBreakdownModalProps {
  onClose: () => void;
  onTasksCreated: (taskNames: string[]) => void;
  projectContext: { name: string; description: string };
}

const TaskBreakdownModal: React.FC<TaskBreakdownModalProps> = ({ onClose, onTasksCreated, projectContext }) => {
  const [objective, setObjective] = useState('');
  const [suggestedTasks, setSuggestedTasks] = useState<string[]>([]);
  const [selectedTasks, setSelectedTasks] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasGenerated, setHasGenerated] = useState(false);

  const handleGenerate = async () => {
    if (!objective.trim()) {
      setError('Please provide a high-level objective.');
      return;
    }
    setError(null);
    setIsLoading(true);
    setHasGenerated(true);
    setSuggestedTasks([]);

    try {
      const response = await fetch('/api/breakdown-task', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ objective, projectContext }),
      });

      const responseText = await response.text();
      if (!response.ok) {
        let errorMsg = 'Failed to generate tasks.';
        try { errorMsg = JSON.parse(responseText).error || errorMsg; } catch (e) { errorMsg = responseText || response.statusText; }
        throw new Error(errorMsg);
      }
      if (!responseText) { throw new Error("Received an empty response from the server."); }

      const data = JSON.parse(responseText);
      const tasks: string[] = data.tasks || [];
      setSuggestedTasks(tasks);
      setSelectedTasks(new Set(tasks));

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred.';
      setError(`Error: ${errorMessage}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleTask = (taskName: string) => {
    setSelectedTasks(prev => {
      const newSet = new Set(prev);
      if (newSet.has(taskName)) {
        newSet.delete(taskName);
      } else {
        newSet.add(taskName);
      }
      return newSet;
    });
  };

  const handleAddTasks = () => {
    onTasksCreated(Array.from(selectedTasks));
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4" aria-modal="true" role="dialog">
      <div className="bg-slate-800 border border-slate-700 rounded-2xl shadow-2xl w-full max-w-2xl relative p-8 flex flex-col max-h-[90vh]">
        <button onClick={onClose} className="absolute top-4 right-4 text-slate-400 hover:text-white transition-colors" aria-label="Close modal">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
        </button>
        
        <div className="flex-shrink-0">
            <h2 className="text-2xl font-bold text-white mb-2">Deconstruct Task with AI</h2>
            <p className="text-slate-400 mb-6">Enter a large objective, and the AI will break it down into smaller, actionable tasks for you.</p>

            <textarea
                value={objective}
                onChange={(e) => setObjective(e.target.value)}
                className="w-full bg-slate-700 border border-slate-600 rounded-lg resize-none text-white p-4 focus:outline-none focus:ring-2 focus:ring-cyan-500 transition h-24"
                placeholder="e.g., Build a complete user registration and authentication flow."
                disabled={isLoading}
            />
            <div className="mt-4 flex justify-end">
                <button
                onClick={handleGenerate}
                className="bg-cyan-600 hover:bg-cyan-500 text-white font-bold py-2 px-6 rounded-lg transition duration-300 transform hover:scale-105 disabled:bg-slate-600 disabled:cursor-not-allowed flex items-center"
                disabled={isLoading || !objective.trim()}
                >
                {isLoading && (
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                )}
                {isLoading ? 'Generating...' : 'Deconstruct'}
                </button>
            </div>
        </div>

        <div className="flex-grow overflow-y-auto mt-6 pr-4 -mr-4 border-t border-slate-700 pt-6">
            {error && <p className="text-red-400 text-sm">{error}</p>}
            
            {isLoading && !hasGenerated && ( <p className="text-slate-400 text-center">Enter an objective to get started.</p> )}
            
            {suggestedTasks.length > 0 && (
                <div>
                    <h3 className="text-lg font-semibold text-white mb-3">Suggested Tasks</h3>
                    <div className="space-y-2">
                        {suggestedTasks.map((task, index) => (
                            <label key={index} className="flex items-center p-3 bg-slate-700/50 rounded-lg cursor-pointer hover:bg-slate-700 transition">
                                <input
                                    type="checkbox"
                                    checked={selectedTasks.has(task)}
                                    onChange={() => handleToggleTask(task)}
                                    className="h-5 w-5 rounded border-slate-500 text-cyan-600 focus:ring-cyan-500 bg-slate-900 cursor-pointer"
                                />
                                <span className="ml-3 text-slate-200">{task}</span>
                            </label>
                        ))}
                    </div>
                </div>
            )}
        </div>
        
        {suggestedTasks.length > 0 && (
            <div className="mt-6 flex justify-end flex-shrink-0 border-t border-slate-700 pt-6">
                 <button
                    onClick={handleAddTasks}
                    className="bg-green-600 hover:bg-green-500 text-white font-bold py-2 px-6 rounded-lg transition duration-300 disabled:opacity-50"
                    disabled={selectedTasks.size === 0}
                >
                    Add {selectedTasks.size} Selected Tasks
                </button>
            </div>
        )}
      </div>
    </div>
  );
};

export default TaskBreakdownModal;
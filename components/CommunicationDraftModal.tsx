
import React, { useState, useCallback } from 'react';
import type { Task, TeamMember } from '../types';
import { CommunicationType } from '../types';

interface CommunicationDraftModalProps {
  onClose: () => void;
  task: Task;
  assignee: TeamMember | null;
  project: { name: string };
  projectManagerName: string;
}

const CommunicationDraftModal: React.FC<CommunicationDraftModalProps> = ({ onClose, task, assignee, project, projectManagerName }) => {
  const [selectedType, setSelectedType] = useState<CommunicationType | null>(null);
  const [draft, setDraft] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copyButtonText, setCopyButtonText] = useState('Copy');

  const generateDraft = useCallback(async (type: CommunicationType) => {
    setSelectedType(type);
    setIsLoading(true);
    setError(null);
    setDraft('');

    try {
      const response = await fetch('/api/draft-communication', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
            type, 
            task, 
            project, 
            assignee, 
            projectManager: { name: projectManagerName } 
        }),
      });

      const responseText = await response.text();
      if (!response.ok) {
        let errorMsg = 'Failed to generate draft.';
        try { errorMsg = JSON.parse(responseText).error || errorMsg; } catch (e) { errorMsg = responseText || response.statusText; }
        throw new Error(errorMsg);
      }
      if (!responseText) { throw new Error("Received an empty response from the server."); }
      
      const data = JSON.parse(responseText);
      setDraft(data.draft);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred.';
      setError(`Error: ${errorMessage}`);
    } finally {
      setIsLoading(false);
    }
  }, [task, assignee, project, projectManagerName]);

  const handleCopy = () => {
    navigator.clipboard.writeText(draft);
    setCopyButtonText('Copied!');
    setTimeout(() => setCopyButtonText('Copy'), 2000);
  };
  
  const communicationOptions = [
      ...(assignee ? [CommunicationType.AssignTask, CommunicationType.RequestUpdate] : []),
      ...(task.completed ? [CommunicationType.AnnounceCompletion] : []),
  ];

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4" aria-modal="true" role="dialog">
      <div className="bg-slate-800 border border-slate-700 rounded-2xl shadow-2xl w-full max-w-2xl relative p-8 flex flex-col max-h-[90vh]">
        <button onClick={onClose} className="absolute top-4 right-4 text-slate-400 hover:text-white transition-colors" aria-label="Close modal">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
        </button>
        
        <div className="flex-shrink-0">
            <h2 className="text-2xl font-bold text-white mb-2">Draft Communication</h2>
            <p className="text-slate-400 mb-1">For task: <span className="font-semibold text-slate-300">"{task.name}"</span></p>
            {assignee && <p className="text-slate-400">Regarding: <span className="font-semibold text-slate-300">{assignee.name}</span></p>}
        </div>

        <div className="flex-grow overflow-y-auto mt-6 pr-4 -mr-4 border-t border-slate-700 pt-6">
            {!selectedType ? (
                <div>
                    <h3 className="text-lg font-semibold text-white mb-4">What do you want to do?</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {communicationOptions.map(type => (
                            <button key={type} onClick={() => generateDraft(type)} className="p-4 bg-slate-700 hover:bg-slate-600 rounded-lg text-left transition">
                                <span className="font-semibold text-white">{type}</span>
                            </button>
                        ))}
                         {communicationOptions.length === 0 && <p className="text-slate-400">No communication actions available for this task's state.</p>}
                    </div>
                </div>
            ) : (
                <div>
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-lg font-semibold text-white">Generated Draft</h3>
                        <button onClick={() => setSelectedType(null)} className="text-sm text-cyan-400 hover:text-cyan-300">
                            &larr; Back to options
                        </button>
                    </div>
                    {isLoading && (
                         <div className="flex items-center justify-center h-48">
                            <svg className="animate-spin h-8 w-8 text-cyan-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                        </div>
                    )}
                    {error && <p className="text-red-400 text-sm">{error}</p>}
                    {!isLoading && draft && (
                        <textarea
                            value={draft}
                            onChange={(e) => setDraft(e.target.value)}
                            className="w-full bg-slate-700/50 border border-slate-600 rounded-lg resize-none text-slate-200 p-4 focus:outline-none focus:ring-2 focus:ring-cyan-500 transition h-64"
                        />
                    )}
                </div>
            )}
        </div>
        
        {draft && !isLoading && (
            <div className="mt-6 flex justify-end flex-shrink-0 border-t border-slate-700 pt-6">
                 <button
                    onClick={handleCopy}
                    className="bg-cyan-600 hover:bg-cyan-500 text-white font-bold py-2 px-6 rounded-lg transition duration-300"
                >
                    {copyButtonText}
                </button>
            </div>
        )}
      </div>
    </div>
  );
};

export default CommunicationDraftModal;
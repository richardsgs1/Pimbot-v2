
import React, { useState, useEffect } from 'react';

interface ProjectJournalSummaryModalProps {
  onClose: () => void;
  onConfirm: (summary: string) => void;
  initialSummary: string;
  isLoading: boolean;
  error: string | null;
}

const ProjectJournalSummaryModal: React.FC<ProjectJournalSummaryModalProps> = ({ onClose, onConfirm, initialSummary, isLoading, error }) => {
  const [summary, setSummary] = useState(initialSummary);

  useEffect(() => {
    setSummary(initialSummary);
  }, [initialSummary]);

  const handleConfirm = () => {
    if (summary.trim()) {
      onConfirm(summary.trim());
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4" aria-modal="true" role="dialog">
      <div className="bg-slate-800 border border-slate-700 rounded-2xl shadow-2xl w-full max-w-2xl relative p-8 flex flex-col max-h-[90vh]">
        <h2 className="text-2xl font-bold text-white mb-2">AI-Generated Journal Summary</h2>
        <p className="text-slate-400 mb-6">Review and edit the summary of recent project activities below. This will be added as a single entry, and the original logs will be archived.</p>

        <div className="flex-grow">
          {isLoading && (
            <div className="flex items-center justify-center h-full">
              <div className="flex flex-col items-center">
                <svg className="animate-spin h-8 w-8 text-cyan-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                <p className="mt-4 text-slate-400">Synthesizing activity...</p>
              </div>
            </div>
          )}
          {error && <div className="text-red-400 bg-red-900/50 p-3 rounded-lg">{error}</div>}
          {!isLoading && !error && (
            <textarea
              value={summary}
              onChange={(e) => setSummary(e.target.value)}
              className="w-full h-48 bg-slate-700 border border-slate-600 rounded-lg resize-none text-white p-4 focus:outline-none focus:ring-2 focus:ring-cyan-500 transition"
              autoFocus
            />
          )}
        </div>

        <div className="mt-6 flex justify-end gap-3 flex-shrink-0 border-t border-slate-700 pt-6">
          <button type="button" onClick={onClose} className="font-semibold py-2 px-6 rounded-lg transition duration-300 text-slate-300 hover:bg-slate-700">Cancel</button>
          <button
            onClick={handleConfirm}
            disabled={isLoading || !summary.trim()}
            className="bg-cyan-600 hover:bg-cyan-500 text-white font-bold py-2 px-6 rounded-lg transition disabled:opacity-50"
          >
            Add to Journal
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProjectJournalSummaryModal;
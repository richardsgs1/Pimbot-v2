import React from 'react';
import MarkdownRenderer from './MarkdownRenderer';

interface RiskAnalysisModalProps {
  onClose: () => void;
  analysis: string | null;
  isLoading: boolean;
  error: string | null;
}

const RiskAnalysisModal: React.FC<RiskAnalysisModalProps> = ({ onClose, analysis, isLoading, error }) => {
  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4" aria-modal="true" role="dialog">
      <div className="bg-slate-800 border border-slate-700 rounded-2xl shadow-2xl w-full max-w-2xl relative p-8 flex flex-col max-h-[90vh]">
        <h2 className="text-2xl font-bold text-white mb-4 flex-shrink-0">AI Risk Analysis & Mitigation</h2>
        <div className="flex-grow overflow-y-auto pr-4 -mr-4">
          {isLoading && (
            <div className="flex items-center justify-center h-full">
              <div className="flex flex-col items-center">
                <svg className="animate-spin h-8 w-8 text-cyan-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <p className="mt-4 text-slate-400">Analyzing project data...</p>
              </div>
            </div>
          )}
          {error && <div className="text-red-400 bg-red-900/50 p-3 rounded-lg">{error}</div>}
          {!isLoading && !error && analysis && (
            <MarkdownRenderer content={analysis} />
          )}
        </div>
        <div className="mt-6 flex justify-end gap-3 flex-shrink-0 border-t border-slate-700 pt-6">
          <button type="button" onClick={onClose} className="bg-cyan-600 hover:bg-cyan-500 text-white font-bold py-2 px-6 rounded-lg transition duration-300">
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default RiskAnalysisModal;
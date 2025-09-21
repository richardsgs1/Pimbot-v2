
import React, { useState, useEffect } from 'react';
import type { Project } from '../types';
import { CommunicationType } from '../types';
import MarkdownRenderer from './MarkdownRenderer';

interface CommunicationDraftModalProps {
  isOpen: boolean;
  onClose: () => void;
  project: Project;
}

const CommunicationDraftModal: React.FC<CommunicationDraftModalProps> = ({ isOpen, onClose, project }) => {
  const [communicationType, setCommunicationType] = useState<CommunicationType>(CommunicationType.StatusUpdate);
  const [audience, setAudience] = useState('Team Members');
  const [keyPoints, setKeyPoints] = useState('');
  const [draft, setDraft] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copySuccess, setCopySuccess] = useState('');

  useEffect(() => {
    if (!isOpen) {
      // Reset state when modal is closed
      setDraft(null);
      setError(null);
      setIsLoading(false);
      setKeyPoints('');
      setCopySuccess('');
    }
  }, [isOpen]);

  const handleGenerateDraft = async () => {
    if (!keyPoints.trim()) {
      setError('Please provide at least one key point.');
      return;
    }
    setIsLoading(true);
    setError(null);
    setDraft(null);
    setCopySuccess('');
    try {
      const response = await fetch('/api/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          action: 'draft-communication',
          type: communicationType,
          context: `Project: ${project.name}\nKey Points: ${keyPoints}`,
          recipient: audience,
          project,
          communicationType,
          keyPoints
        }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to generate draft.');
      }
      setDraft(data.communication); // Note: changed from data.draft to data.communication
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred.');
    } finally {
      setIsLoading(false);
});
const data = await response.json();
if (!response.ok) {
  throw new Error(data.error || 'Failed to generate draft.');
}
setDraft(data.communication); // Note: changed from data.draft to data.communication
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopyToClipboard = () => {
    if (draft) {
      navigator.clipboard.writeText(draft);
      setCopySuccess('Copied!');
      setTimeout(() => setCopySuccess(''), 2000);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" onClick={onClose} role="dialog" aria-modal="true" aria-labelledby="comm-modal-title">
      <div className="bg-slate-800 border border-slate-700 rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
        <header className="p-4 border-b border-slate-700 flex justify-between items-center flex-shrink-0">
          <h2 id="comm-modal-title" className="text-xl font-bold">Draft Communication</h2>
          <button onClick={onClose} className="p-1 rounded-full text-slate-400 hover:bg-slate-700" aria-label="Close modal">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </header>

        <div className="p-6 overflow-y-auto">
          {!draft && !isLoading && (
            <div className="space-y-4">
              <div>
                <label htmlFor="comm-type" className="block text-sm font-medium text-slate-300 mb-2">Communication Type</label>
                <select id="comm-type" value={communicationType} onChange={(e) => setCommunicationType(e.target.value as CommunicationType)} className="w-full bg-slate-700 border border-slate-600 rounded-lg p-2.5">
                  {Object.values(CommunicationType).map(type => <option key={type} value={type}>{type}</option>)}
                </select>
              </div>
              <div>
                <label htmlFor="audience" className="block text-sm font-medium text-slate-300 mb-2">Audience</label>
                <input type="text" id="audience" value={audience} onChange={(e) => setAudience(e.target.value)} className="w-full bg-slate-700 border border-slate-600 rounded-lg p-2.5" placeholder="e.g., Stakeholders, Development Team" />
              </div>
              <div>
                <label htmlFor="key-points" className="block text-sm font-medium text-slate-300 mb-2">Key Points (one per line)</label>
                <textarea id="key-points" rows={4} value={keyPoints} onChange={(e) => setKeyPoints(e.target.value)} className="w-full bg-slate-700 border border-slate-600 rounded-lg p-2.5" placeholder="- Project is on track for Q3 launch&#10;- Marketing assets have been approved&#10;- Blocked by legal review on ad copy"></textarea>
              </div>
            </div>
          )}

          {isLoading && (
            <div className="flex flex-col items-center justify-center min-h-[200px]">
              <svg className="animate-spin h-8 w-8 text-cyan-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
              <p className="mt-4 text-slate-400">PiMbOt AI is drafting your message...</p>
            </div>
          )}

          {error && <div className="bg-red-900/50 text-red-300 p-3 rounded-lg text-sm">{error}</div>}

          {draft && (
            <div>
              <div className="prose prose-invert bg-slate-900/50 border border-slate-700 rounded-lg p-4 max-w-none">
                <MarkdownRenderer content={draft} />
              </div>
            </div>
          )}
        </div>

        <footer className="p-4 border-t border-slate-700 flex justify-end items-center gap-4 flex-shrink-0">
          {draft && !isLoading && (
            <>
              <button onClick={handleCopyToClipboard} className="relative bg-slate-600 hover:bg-slate-500 text-white font-semibold py-2 px-4 rounded-lg transition">
                {copySuccess || 'Copy'}
              </button>
              <button onClick={handleGenerateDraft} className="bg-cyan-600 hover:bg-cyan-500 text-white font-bold py-2 px-4 rounded-lg transition">
                Regenerate
              </button>
            </>
          )}
          {!draft && !isLoading && (
             <button onClick={handleGenerateDraft} disabled={isLoading || !keyPoints.trim()} className="bg-cyan-600 hover:bg-cyan-500 text-white font-bold py-2 px-4 rounded-lg transition disabled:bg-slate-600 disabled:cursor-not-allowed">
              Generate Draft
            </button>
          )}
        </footer>
      </div>
    </div>
  );
};

export default CommunicationDraftModal;
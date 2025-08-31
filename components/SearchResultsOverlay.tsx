import React from 'react';
import type { SearchResults, SearchResultItem } from '../types';

interface SearchResultsOverlayProps {
  results: SearchResults;
  onResultClick: (item: SearchResultItem) => void;
  aiSummary: string | null;
  isSummaryLoading: boolean;
}

const ResultItem: React.FC<{ item: SearchResultItem; onClick: () => void }> = ({ item, onClick }) => {
  const renderContent = () => {
    switch (item.type) {
      case 'project':
        return (
          <div>
            <p className="font-semibold text-white">{item.data.name}</p>
            <p className="text-xs text-slate-400 truncate">{item.data.description}</p>
          </div>
        );
      case 'task':
        return (
          <div>
            <p className="font-semibold text-white">{item.data.name}</p>
            <p className="text-xs text-slate-400">Task in: {item.project.name}</p>
          </div>
        );
      case 'journal':
        return (
          <div>
            <p className="font-semibold text-white truncate">{item.data.content}</p>
            <p className="text-xs text-slate-400">Journal entry in: {item.project.name}</p>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <button onClick={onClick} className="w-full text-left p-3 rounded-md hover:bg-slate-600 transition-colors duration-150">
      {renderContent()}
    </button>
  );
};

const SearchResultsOverlay: React.FC<SearchResultsOverlayProps> = ({ results, onResultClick, aiSummary, isSummaryLoading }) => {
  const hasResults = results.projects.length > 0 || results.tasks.length > 0 || results.journal.length > 0;

  return (
    <div className="absolute top-full mt-2 w-full bg-slate-700 border border-slate-600 rounded-lg shadow-2xl z-50 max-h-96 overflow-y-auto flex flex-col">
      {(aiSummary || isSummaryLoading) && (
        <div className="p-3 border-b border-slate-600 bg-slate-800/50">
            {isSummaryLoading ? (
                 <div className="flex items-center text-sm text-cyan-300">
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-cyan-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Generating summary...
                </div>
            ) : (
                <p className="text-sm text-cyan-300 font-medium">{aiSummary}</p>
            )}
        </div>
      )}
      <div className="p-2 overflow-y-auto">
        {hasResults ? (
          <>
            {results.projects.length > 0 && (
              <div className="mb-2">
                <h3 className="text-xs font-bold uppercase text-slate-400 px-3 py-1">Projects</h3>
                {results.projects.map((item) => (
                  <ResultItem key={`proj-${item.data.id}`} item={item} onClick={() => onResultClick(item)} />
                ))}
              </div>
            )}
            {results.tasks.length > 0 && (
              <div className="mb-2">
                <h3 className="text-xs font-bold uppercase text-slate-400 px-3 py-1">Tasks</h3>
                {results.tasks.map((item) => (
                  <ResultItem key={`task-${item.data.id}`} item={item} onClick={() => onResultClick(item)} />
                ))}
              </div>
            )}
            {results.journal.length > 0 && (
              <div>
                <h3 className="text-xs font-bold uppercase text-slate-400 px-3 py-1">Journal</h3>
                {results.journal.map((item) => (
                  <ResultItem key={`jour-${item.data.id}`} item={item} onClick={() => onResultClick(item)} />
                ))}
              </div>
            )}
          </>
        ) : (
          <p className="text-slate-400 text-center p-4">No results found.</p>
        )}
      </div>
    </div>
  );
};

export default SearchResultsOverlay;
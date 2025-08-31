import React from 'react';
import MarkdownRenderer from './MarkdownRenderer';

interface DailyBriefingProps {
  briefing: string | null;
  isLoading: boolean;
  error: string | null;
  onRefresh: () => void;
}

const SkeletonLoader: React.FC = () => (
    <div className="space-y-3 animate-pulse">
        <div className="h-4 bg-slate-700 rounded w-3/4"></div>
        <div className="h-4 bg-slate-700 rounded w-1/2"></div>
        <div className="h-4 bg-slate-700 rounded w-5/6"></div>
    </div>
);

const DailyBriefing: React.FC<DailyBriefingProps> = ({ briefing, isLoading, error, onRefresh }) => {
  return (
    <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold text-white">Your Daily Briefing</h2>
        <button
          onClick={onRefresh}
          disabled={isLoading}
          className="p-2 rounded-full hover:bg-slate-700 text-slate-400 transition disabled:opacity-50 disabled:cursor-wait"
          aria-label="Refresh Briefing"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className={`h-5 w-5 ${isLoading ? 'animate-spin' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h5M20 20v-5h-5M4 4l1.5 1.5A9 9 0 0120 12M20 20l-1.5-1.5A9 9 0 004 12" />
          </svg>
        </button>
      </div>

      <div>
        {isLoading && <SkeletonLoader />}
        {error && (
          <div className="text-red-400 bg-red-900/50 p-3 rounded-lg">
            <p className="font-semibold">Could not load your briefing:</p>
            <p className="text-sm">{error}</p>
          </div>
        )}
        {!isLoading && !error && briefing && (
          <MarkdownRenderer content={briefing} />
        )}
      </div>
    </div>
  );
};

export default DailyBriefing;
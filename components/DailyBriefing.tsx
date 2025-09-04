import React, { useState, useEffect, useCallback } from 'react';
import type { OnboardingData } from '../types';

interface BriefingData {
  quote: {
    text: string;
    author: string;
  };
  summary: {
    title: string;
    content: string;
  };
  tip: {
    title: string;
    content: string;
  };
}

const LoadingSkeleton: React.FC = () => (
  <div className="animate-pulse">
    <div className="h-4 bg-slate-600 rounded w-3/4 mb-4"></div>
    <div className="h-3 bg-slate-700 rounded w-full mb-2"></div>
    <div className="h-3 bg-slate-700 rounded w-5/6"></div>
    <div className="h-4 bg-slate-600 rounded w-1/2 mt-6 mb-4"></div>
    <div className="h-3 bg-slate-700 rounded w-full mb-2"></div>
    <div className="h-3 bg-slate-700 rounded w-full"></div>
  </div>
);

const DailyBriefing: React.FC<{ userData: OnboardingData }> = ({ userData }) => {
  const [briefing, setBriefing] = useState<BriefingData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchBriefing = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/ai', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          action: 'briefing',
          userData 
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Request failed with status ${response.status}`);
      }
      
      const data = await response.json();
      
      // The API returns { briefing: "text" }, but this component expects a structured object
      // For now, let's create a simple structure from the briefing text
      const briefingData: BriefingData = {
        quote: {
          text: "Success is the sum of small efforts repeated day in and day out.",
          author: "Robert Collier"
        },
        summary: {
          title: "Daily Project Overview",
          content: data.briefing || "Your projects are progressing well. Stay focused on your key priorities."
        },
        tip: {
          title: "Today's PM Tip",
          content: "Review your project dependencies and identify any potential blockers early."
        }
      };
      
      setBriefing(briefingData);

    } catch (err) {
       setError(err instanceof Error ? err.message : 'An unknown error occurred.');
    } finally {
      setIsLoading(false);
    }
  }, [userData]);

  useEffect(() => {
    fetchBriefing();
  }, [fetchBriefing]);
  
  const renderContent = () => {
    if (isLoading) {
        return <LoadingSkeleton />;
    }
    if (error) {
        return (
            <div className="bg-red-900/50 text-red-300 p-4 rounded-lg">
                <p className="font-semibold">Could not load your briefing:</p>
                <p className="text-sm">{error}</p>
            </div>
        );
    }
    if (briefing) {
        return (
            <div>
                <blockquote className="border-l-4 border-cyan-500 pl-4 italic text-slate-300 mb-6">
                    <p>"{briefing.quote.text}"</p>
                    <cite className="block text-right not-italic mt-2 text-slate-400">— {briefing.quote.author}</cite>
                </blockquote>

                <div className="mb-6">
                    <h3 className="font-bold text-lg text-white mb-2">{briefing.summary.title}</h3>
                    <p className="text-slate-400">{briefing.summary.content}</p>
                </div>
                
                <div>
                    <h3 className="font-bold text-lg text-white mb-2">{briefing.tip.title}</h3>
                    <p className="text-slate-400">{briefing.tip.content}</p>
                </div>
            </div>
        );
    }
    return null;
  }

  return (
    <div className="bg-slate-800 border border-slate-700 rounded-xl p-6 mb-8" role="region" aria-labelledby="briefing-title">
        <div className="flex justify-between items-center mb-4">
            <h2 id="briefing-title" className="text-xl font-bold text-white">Your Daily Briefing</h2>
            <button 
                onClick={fetchBriefing} 
                disabled={isLoading}
                className="p-2 rounded-full text-slate-400 hover:bg-slate-700 hover:text-white transition duration-200 disabled:opacity-50 disabled:cursor-wait"
                aria-label="Refresh briefing"
            >
                <svg xmlns="http://www.w3.org/2000/svg" className={`h-5 w-5 ${isLoading ? 'animate-spin' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h5M20 20v-5h-5M4 4l1.5 1.5A9 9 0 0120.5 15M20 20l-1.5-1.5A9 9 0 003.5 9" />
                </svg>
            </button>
        </div>
        {renderContent()}
    </div>
  );
};

export default DailyBriefing;
import React, { useState, useEffect } from 'react';
import type { OnboardingData } from '../types';
import MarkdownRenderer from './MarkdownRenderer';

interface DailyBriefingProps {
  userData: OnboardingData;
}

const DailyBriefing: React.FC<DailyBriefingProps> = ({ userData }) => {
  const [briefing, setBriefing] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastGenerated, setLastGenerated] = useState<string | null>(null);

  const generateBriefing = async () => {
    setLoading(true);
    setError(null);

    try {
      // Create skill-aware prompt based on user experience level
      let prompt = '';
      
      switch (userData.skillLevel) {
        case 'No Experience':
          prompt = `Generate a beginner-friendly daily project briefing for someone completely new to project management. Use simple language, explain basic concepts, and provide encouraging guidance. Focus on:
          - Simple, actionable steps they can take today
          - Basic project management concepts explained clearly
          - Encouraging tone that builds confidence
          - Avoid technical jargon
          User's name: ${userData.name}
          Their tools: ${userData.tools.join(', ') || 'None specified'}
          Their methodologies: ${userData.methodologies.join(', ') || 'None specified'}`;
          break;

        case 'Novice':
          prompt = `Generate a daily project briefing for someone with basic project management knowledge. Provide clear guidance with some context and explanation. Focus on:
          - Practical daily actions
          - Basic best practices
          - Clear explanations of concepts
          User's name: ${userData.name}
          Their tools: ${userData.tools.join(', ') || 'None specified'}
          Their methodologies: ${userData.methodologies.join(', ') || 'None specified'}`;
          break;

        case 'Intermediate':
          prompt = `Generate a daily project briefing for someone with moderate project management experience. Provide balanced guidance with relevant details and best practices. Focus on:
          - Strategic daily priorities
          - Best practice reminders
          - Process improvements
          User's name: ${userData.name}
          Their tools: ${userData.tools.join(', ') || 'None specified'}
          Their methodologies: ${userData.methodologies.join(', ') || 'None specified'}`;
          break;

        case 'Experienced':
          prompt = `Generate a daily project briefing for an experienced project manager. Provide comprehensive guidance with advanced insights and strategic considerations. Focus on:
          - Strategic priorities and decisions
          - Advanced project management techniques
          - Leadership and stakeholder management
          User's name: ${userData.name}
          Their tools: ${userData.tools.join(', ') || 'None specified'}
          Their methodologies: ${userData.methodologies.join(', ') || 'None specified'}`;
          break;

        case 'Expert':
          prompt = `Generate a daily project briefing for a project management expert. Provide sophisticated insights with cutting-edge strategies and expert-level analysis. Focus on:
          - High-level strategic thinking
          - Innovation and process optimization
          - Industry trends and best practices
          - Executive-level decision making
          User's name: ${userData.name}
          Their tools: ${userData.tools.join(', ') || 'None specified'}
          Their methodologies: ${userData.methodologies.join(', ') || 'None specified'}`;
          break;

        default:
          prompt = `Generate a daily project briefing for ${userData.name}. Provide practical guidance and actionable insights for effective project management.`;
      }

      const response = await fetch('/api/ai', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'daily-briefing',
          data: {
            prompt: prompt,
            skillLevel: userData.skillLevel
          }
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.briefing) {
        setBriefing(data.briefing);
        setLastGenerated(new Date().toISOString());
        setError(null);
      } else {
        throw new Error('No briefing content received');
      }
    } catch (err) {
      console.error('Error generating briefing:', err);
      setError(err instanceof Error ? err.message : 'Failed to generate briefing');
      setBriefing('');
    } finally {
      setLoading(false);
    }
  };

  // Generate briefing on component mount
  useEffect(() => {
    // Check if we already generated a briefing today
    const today = new Date().toDateString();
    const lastGen = lastGenerated ? new Date(lastGenerated).toDateString() : null;
    
    if (lastGen !== today && !loading && !briefing) {
      generateBriefing();
    }
  }, [userData.skillLevel]); // Re-generate if skill level changes

  const handleRefresh = () => {
    generateBriefing();
  };

  return (
    <div className="bg-[var(--bg-secondary)] rounded-lg p-6 mb-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center">
          <h2 className="text-xl font-semibold text-[var(--text-primary)]">Daily Briefing</h2>
          <span className="ml-2 text-sm text-[var(--text-tertiary)]">
            📚 Building Skills
          </span>
        </div>
        <button
          onClick={handleRefresh}
          disabled={loading}
          className="px-4 py-2 bg-[var(--accent-primary)] text-white rounded-lg hover:bg-[var(--accent-secondary)] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {loading ? 'Generating...' : '🔄 Refresh'}
        </button>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-100 border border-red-300 rounded-lg">
          <p className="text-red-800 text-sm">
            Error generating briefing: {error}
          </p>
          <button
            onClick={handleRefresh}
            className="mt-2 text-red-600 hover:text-red-800 text-sm underline"
          >
            Try again
          </button>
        </div>
      )}

      {loading && (
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-[var(--accent-primary)]"></div>
          <span className="ml-3 text-[var(--text-secondary)]">
            Generating your personalized briefing...
          </span>
        </div>
      )}

      {briefing && !loading && (
        <div className="prose prose-sm max-w-none text-[var(--text-primary)]">
          <MarkdownRenderer content={briefing} />
        </div>
      )}

      {!briefing && !loading && !error && (
        <div className="text-center py-8">
          <p className="text-[var(--text-secondary)] mb-4">
            Ready to generate your daily briefing?
          </p>
          <button
            onClick={generateBriefing}
            className="px-6 py-2 bg-[var(--accent-primary)] text-white rounded-lg hover:bg-[var(--accent-secondary)] transition-colors"
          >
            Generate Briefing
          </button>
        </div>
      )}
    </div>
  );
};

export default DailyBriefing;
import React, { useState } from 'react';
import { SkillLevel } from '../types';
import type { OnboardingData } from '../types';

interface OnboardingProps {
  onOnboardingComplete: (data: OnboardingData) => void;
  initialData: OnboardingData;
}

const Onboarding: React.FC<OnboardingProps> = ({ onOnboardingComplete, initialData }) => {
  const [skillLevel, setSkillLevel] = useState<SkillLevel | null>(initialData.skillLevel);
  const [methodologies, setMethodologies] = useState<string[]>(initialData.methodologies);
  const [tools, setTools] = useState<string[]>(initialData.tools);
  const [name, setName] = useState(initialData.name);

  // Skill level specific content
  const getSkillLevelDescription = (level: SkillLevel) => {
    switch (level) {
      case SkillLevel.NO_EXPERIENCE:
        return "New to project management? We'll guide you through the basics step-by-step and help you learn as you go. You'll start with simple concepts and build up your knowledge.";
      case SkillLevel.NOVICE:
        return "Some experience with projects? We'll help you develop structured approaches and build on what you already know with best practices.";
      case SkillLevel.INTERMEDIATE:
        return "Comfortable with project basics? We'll help you refine your skills and tackle more complex challenges with advanced techniques.";
      case SkillLevel.EXPERIENCED:
        return "Seasoned project manager? We'll provide advanced insights, strategic guidance, and help optimize your existing workflows.";
      case SkillLevel.EXPERT:
        return "Project management expert? We'll offer high-level strategic advice, industry insights, and help you mentor others.";
      default:
        return "";
    }
  };

  // Skill-specific methodology suggestions
  const getMethodologySuggestions = () => {
    if (skillLevel === SkillLevel.NO_EXPERIENCE) {
      return ['Agile', 'Waterfall']; // Keep it simple for beginners
    } else if (skillLevel === SkillLevel.NOVICE) {
      return ['Agile', 'Waterfall', 'Kanban', 'Scrum'];
    } else {
      return ['Agile', 'Waterfall', 'Kanban', 'Scrum', 'Lean', 'Six Sigma', 'DevOps', 'SAFe'];
    }
  };

  // Skill-specific tool suggestions
  const getToolSuggestions = () => {
    if (skillLevel === SkillLevel.NO_EXPERIENCE) {
      return ['Trello', 'Asana', 'Monday.com', 'Notion']; // User-friendly tools
    } else if (skillLevel === SkillLevel.NOVICE) {
      return ['Trello', 'Asana', 'Monday.com', 'Jira', 'Notion', 'ClickUp'];
    } else {
      return ['Jira', 'Asana', 'Monday.com', 'Microsoft Project', 'Smartsheet', 'Wrike', 'Notion', 'ClickUp', 'Linear', 'Azure DevOps'];
    }
  };

  // Get guidance text based on skill level
  const getGuidanceText = () => {
    if (skillLevel === SkillLevel.NO_EXPERIENCE) {
      return {
        methodologyTitle: "We recommend starting with these beginner-friendly approaches:",
        methodologyNote: "Don't worry if you're not familiar with these - we'll explain everything as we go!",
        toolTitle: "These tools are great for beginners:",
        toolNote: "Choose any that sound familiar, or skip this step - you can always add tools later."
      };
    } else if (skillLevel === SkillLevel.NOVICE) {
      return {
        methodologyTitle: "Which methodologies have you worked with or would like to learn?",
        methodologyNote: "Select the ones you know or are interested in exploring.",
        toolTitle: "Which project management tools do you use?",
        toolNote: "This helps us provide relevant advice and integrations."
      };
    } else {
      return {
        methodologyTitle: "Which methodologies do you use or prefer?",
        methodologyNote: "This helps us tailor our recommendations to your style.",
        toolTitle: "Which tools are part of your current workflow?",
        toolNote: "We'll provide insights specific to your tool stack."
      };
    }
  };

  const handleComplete = () => {
    if (!skillLevel) return;
    
    onOnboardingComplete({
      ...initialData,
      skillLevel,
      methodologies,
      tools,
      name
    });
  };

  const guidance = getGuidanceText();
  const isBeginnerLevel = skillLevel === SkillLevel.NO_EXPERIENCE || skillLevel === SkillLevel.NOVICE;

  return (
    <div className="min-h-screen bg-[var(--bg-primary)] text-[var(--text-primary)] flex items-center justify-center p-6">
      <div className="bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-xl p-8 max-w-2xl w-full">
        <h1 className="text-3xl font-bold mb-2">Welcome to PiMbOt AI</h1>
        <p className="text-[var(--text-tertiary)] mb-8">Let's customize your project management experience</p>

        {/* Name Input */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold mb-4">What should we call you?</h2>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Enter your name"
            className="w-full p-3 rounded-lg border border-[var(--border-primary)] bg-[var(--bg-tertiary)] text-[var(--text-primary)] placeholder-[var(--text-tertiary)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-primary)]"
          />
        </div>

        {/* Skill Level Selection */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold mb-4">What's your project management experience level?</h2>
          <div className="space-y-3">
            {Object.values(SkillLevel).map((level) => (
              <label key={level} className="flex items-start p-4 rounded-lg border border-[var(--border-primary)] hover:border-[var(--accent-primary)] cursor-pointer transition-colors bg-[var(--bg-tertiary)]">
                <input
                  type="radio"
                  name="skillLevel"
                  value={level}
                  checked={skillLevel === level}
                  onChange={(e) => setSkillLevel(e.target.value as SkillLevel)}
                  className="mt-1 mr-3 accent-[var(--accent-primary)]"
                />
                <div>
                  <div className="font-medium text-[var(--text-primary)]">{level}</div>
                  <div className="text-sm text-[var(--text-tertiary)] mt-1">
                    {getSkillLevelDescription(level)}
                  </div>
                </div>
              </label>
            ))}
          </div>
        </div>

        {/* Show methodologies only if skill level is selected */}
        {skillLevel && (
          <div className="mb-8">
            <h2 className="text-xl font-semibold mb-2">{guidance.methodologyTitle}</h2>
            <p className="text-sm text-[var(--text-tertiary)] mb-4">{guidance.methodologyNote}</p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {getMethodologySuggestions().map((methodology) => (
                <label key={methodology} className="flex items-center p-3 rounded-lg border border-[var(--border-primary)] hover:border-[var(--accent-primary)] cursor-pointer transition-colors bg-[var(--bg-tertiary)]">
                  <input
                    type="checkbox"
                    checked={methodologies.includes(methodology)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setMethodologies(prev => [...prev, methodology]);
                      } else {
                        setMethodologies(prev => prev.filter(m => m !== methodology));
                      }
                    }}
                    className="mr-2 accent-[var(--accent-primary)]"
                  />
                  <span className="text-sm">{methodology}</span>
                </label>
              ))}
            </div>
          </div>
        )}

        {/* Tools section */}
        {skillLevel && (
          <div className="mb-8">
            <h2 className="text-xl font-semibold mb-2">{guidance.toolTitle}</h2>
            <p className="text-sm text-[var(--text-tertiary)] mb-4">{guidance.toolNote}</p>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {getToolSuggestions().map((tool) => (
                <label key={tool} className="flex items-center p-3 rounded-lg border border-[var(--border-primary)] hover:border-[var(--accent-primary)] cursor-pointer transition-colors bg-[var(--bg-tertiary)]">
                  <input
                    type="checkbox"
                    checked={tools.includes(tool)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setTools(prev => [...prev, tool]);
                      } else {
                        setTools(prev => prev.filter(t => t !== tool));
                      }
                    }}
                    className="mr-2 accent-[var(--accent-primary)]"
                  />
                  <span className="text-sm">{tool}</span>
                </label>
              ))}
            </div>
            {skillLevel === SkillLevel.NO_EXPERIENCE && (
              <p className="text-xs text-[var(--text-tertiary)] mt-3 italic">
                Don't see your tool or don't use any yet? That's perfectly fine - you can skip this step!
              </p>
            )}
          </div>
        )}

        {/* Welcome message for beginners */}
        {skillLevel === SkillLevel.NO_EXPERIENCE && (
          <div className="mb-6 p-4 bg-[var(--accent-primary)]/10 border border-[var(--accent-primary)]/20 rounded-lg">
            <h3 className="font-semibold text-[var(--accent-primary)] mb-2">You're in good hands!</h3>
            <p className="text-sm text-[var(--text-secondary)]">
              PiMbOt AI will provide simple explanations, step-by-step guidance, and help you learn project management fundamentals. 
              We'll start with the basics and gradually introduce more advanced concepts as you grow.
            </p>
          </div>
        )}

        <button
          onClick={handleComplete}
          disabled={!skillLevel || !name.trim()}
          className="w-full bg-[var(--accent-primary)] hover:bg-[var(--accent-secondary)] disabled:bg-[var(--bg-tertiary)] disabled:cursor-not-allowed text-white font-semibold py-3 px-6 rounded-lg transition-colors"
        >
          {skillLevel === SkillLevel.NO_EXPERIENCE ? "Start My Learning Journey" : "Complete Setup"}
        </button>
      </div>
    </div>
  );
};

export default Onboarding;
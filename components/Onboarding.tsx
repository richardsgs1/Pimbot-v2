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
        return "New to project management? We'll guide you through the basics and help you learn as you go.";
      case SkillLevel.NOVICE:
        return "Some experience with projects? We'll help you develop structured approaches and best practices.";
      case SkillLevel.INTERMEDIATE:
        return "Comfortable with project basics? We'll help you refine your skills and tackle complex challenges.";
      case SkillLevel.EXPERIENCED:
        return "Seasoned project manager? We'll provide advanced insights and strategic guidance.";
      case SkillLevel.EXPERT:
        return "Project management expert? We'll offer high-level strategic advice and industry insights.";
      default:
        return "";
    }
  };

  // Skill-specific methodology suggestions
  const getMethodologySuggestions = () => {
    if (skillLevel === SkillLevel.NO_EXPERIENCE) {
      return ['Agile', 'Waterfall']; // Keep it simple
    } else if (skillLevel === SkillLevel.NOVICE) {
      return ['Agile', 'Waterfall', 'Kanban', 'Scrum'];
    } else {
      return ['Agile', 'Waterfall', 'Kanban', 'Scrum', 'Lean', 'Six Sigma', 'DevOps', 'SAFe'];
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

  return (
    <div className="min-h-screen bg-slate-900 text-white flex items-center justify-center p-6">
      <div className="bg-slate-800 rounded-xl p-8 max-w-2xl w-full">
        <h1 className="text-3xl font-bold mb-2">Welcome to PiMbOt AI</h1>
        <p className="text-slate-400 mb-8">Let's customize your project management experience</p>

        {/* Skill Level Selection */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold mb-4">What's your project management experience level?</h2>
          <div className="space-y-3">
            {Object.values(SkillLevel).map((level) => (
              <label key={level} className="flex items-start p-4 rounded-lg border border-slate-600 hover:border-cyan-500 cursor-pointer transition-colors">
                <input
                  type="radio"
                  name="skillLevel"
                  value={level}
                  checked={skillLevel === level}
                  onChange={(e) => setSkillLevel(e.target.value as SkillLevel)}
                  className="mt-1 mr-3"
                />
                <div>
                  <div className="font-medium">{level}</div>
                  <div className="text-sm text-slate-400 mt-1">
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
            <h2 className="text-xl font-semibold mb-4">
              {skillLevel === SkillLevel.NO_EXPERIENCE 
                ? "We recommend starting with these methodologies:" 
                : "Which methodologies do you use?"
              }
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {getMethodologySuggestions().map((methodology) => (
                <label key={methodology} className="flex items-center p-3 rounded-lg border border-slate-600 hover:border-cyan-500 cursor-pointer transition-colors">
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
                    className="mr-2"
                  />
                  <span className="text-sm">{methodology}</span>
                </label>
              ))}
            </div>
          </div>
        )}

        {/* Continue with tools and name sections... */}
        <button
          onClick={handleComplete}
          disabled={!skillLevel}
          className="w-full bg-cyan-600 hover:bg-cyan-700 disabled:bg-slate-600 disabled:cursor-not-allowed text-white font-semibold py-3 px-6 rounded-lg transition-colors"
        >
          Complete Setup
        </button>
      </div>
    </div>
  );
};

export default Onboarding;
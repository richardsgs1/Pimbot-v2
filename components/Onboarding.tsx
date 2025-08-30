
import React, { useState } from 'react';
import type { OnboardingData } from '../types';
import { SkillLevel } from '../types';

interface OnboardingProps {
  onOnboardingComplete: (data: OnboardingData) => void;
  initialName: string;
}

const steps = [
  { id: 1, title: "Welcome" },
  { id: 2, title: "Skill Level" },
  { id: 3, title: "Methodologies" },
  { id: 4, title: "Tool Integrations" },
  { id: 5, title: "All Set!" },
];

const methodologies = ["Waterfall", "Agile", "Scrum", "Scaled Agile (SAFe)", "DevOps", "DevSecOps", "Lean", "Hybrid"];
const tools = ["Jira", "Confluence", "Mural", "Monday.com", "MS Project", "Google Suite"];


const Onboarding: React.FC<OnboardingProps> = ({ onOnboardingComplete, initialName }) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [data, setData] = useState<OnboardingData>({
    skillLevel: null,
    methodologies: [],
    tools: [],
    name: initialName,
  });

  const handleNext = () => {
    if (currentStep < steps.length) {
      setCurrentStep(currentStep + 1);
    } else {
      onOnboardingComplete(data);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };
  
  const toggleSelection = <K extends keyof OnboardingData,>(key: K, value: OnboardingData[K] extends (infer U)[] ? U : never) => {
    setData(prev => {
        const currentValues = (prev[key] as typeof value[] | undefined) || [];
        const newValues = currentValues.includes(value)
            ? currentValues.filter(item => item !== value)
            : [...currentValues, value];
        return { ...prev, [key]: newValues };
    });
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div>
            <h2 className="text-3xl font-bold text-white">Welcome, {data.name}!</h2>
            <p className="mt-4 text-slate-400">Let's personalize your PiMbOt AI experience. This quick setup will help us tailor guidance to your specific needs.</p>
          </div>
        );
      case 2:
        return (
          <div>
            <h2 className="text-2xl font-bold text-white">What's your project management experience?</h2>
            <p className="mt-2 text-slate-400">This helps us adjust the level of detail in our guidance.</p>
            <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
              {Object.values(SkillLevel).map((level) => (
                <button
                  key={level}
                  onClick={() => setData({ ...data, skillLevel: level })}
                  className={`p-6 rounded-lg text-left transition duration-200 ${data.skillLevel === level ? 'bg-cyan-600 ring-2 ring-cyan-400' : 'bg-slate-700 hover:bg-slate-600'}`}
                >
                  <span className="font-bold text-lg text-white">{level}</span>
                </button>
              ))}
            </div>
          </div>
        );
      case 3:
        return (
          <div>
            <h2 className="text-2xl font-bold text-white">Which methodologies are you familiar with?</h2>
            <p className="mt-2 text-slate-400">Select all that apply. We'll prioritize insights for these.</p>
            <div className="mt-6 grid grid-cols-2 md:grid-cols-3 gap-4">
              {methodologies.map((method) => (
                <button
                  key={method}
                  onClick={() => toggleSelection('methodologies', method)}
                  className={`p-4 rounded-lg transition duration-200 flex items-center justify-center ${data.methodologies.includes(method) ? 'bg-cyan-600 ring-2 ring-cyan-400' : 'bg-slate-700 hover:bg-slate-600'}`}
                >
                  <span className="font-medium text-white">{method}</span>
                </button>
              ))}
            </div>
          </div>
        );
      case 4:
        return (
          <div>
            <h2 className="text-2xl font-bold text-white">Connect your favorite tools</h2>
            <p className="mt-2 text-slate-400">Select tools you use to get relevant integrations and tips. (Coming soon!)</p>
            <div className="mt-6 grid grid-cols-2 md:grid-cols-3 gap-4">
              {tools.map((tool) => (
                <button
                  key={tool}
                  onClick={() => toggleSelection('tools', tool)}
                  className={`p-4 rounded-lg transition duration-200 flex items-center justify-center ${data.tools.includes(tool) ? 'bg-cyan-600 ring-2 ring-cyan-400' : 'bg-slate-700 hover:bg-slate-600'}`}
                >
                  <span className="font-medium text-white">{tool}</span>
                </button>
              ))}
            </div>
          </div>
        );
      case 5:
         return (
          <div className="text-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-24 w-24 text-green-400 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <h2 className="mt-6 text-3xl font-bold text-white">You're all set!</h2>
            <p className="mt-4 text-slate-400">We've tailored PiMbOt AI for you. Let's get started on managing your projects more effectively.</p>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-900 p-4">
      <div className="w-full max-w-3xl">
        <div className="bg-slate-800 border border-slate-700 rounded-2xl shadow-2xl p-8 md:p-12">
          <div className="mb-8">
            <div className="flex justify-between items-center">
              <h1 className="text-xl font-bold text-white">PiMbOt AI Setup</h1>
              <span className="text-sm text-slate-400">Step {currentStep} of {steps.length}</span>
            </div>
            <div className="w-full bg-slate-700 rounded-full h-2 mt-2">
              <div className="bg-cyan-500 h-2 rounded-full" style={{ width: `${(currentStep / steps.length) * 100}%` }}></div>
            </div>
          </div>
          
          <div className="min-h-[300px] flex flex-col justify-center">
            {renderStepContent()}
          </div>

          <div className="mt-12 flex justify-between items-center">
            <button
              onClick={handleBack}
              className={`font-bold py-2 px-6 rounded-lg transition duration-300 ${currentStep === 1 ? 'opacity-0 cursor-default' : 'text-slate-300 hover:bg-slate-700'}`}
              disabled={currentStep === 1}
            >
              Back
            </button>
            <button
              onClick={handleNext}
              className="bg-cyan-600 hover:bg-cyan-500 text-white font-bold py-3 px-8 rounded-lg transition duration-300 transform hover:scale-105"
            >
              {currentStep === steps.length ? 'Finish' : 'Next'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Onboarding;

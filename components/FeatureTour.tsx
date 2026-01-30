import React, { useState, useEffect, useCallback } from 'react';

export interface TourStep {
  id: string;
  target: string; // CSS selector for the target element
  title: string;
  description: string;
  position: 'top' | 'bottom' | 'left' | 'right';
}

interface FeatureTourProps {
  steps: TourStep[];
  onComplete: () => void;
  onSkip: () => void;
}

const TOUR_STEPS: TourStep[] = [
  {
    id: 'welcome',
    target: '[data-tour="dashboard"]',
    title: 'Welcome to PiMbOt AI!',
    description: 'Let\'s take a quick tour of the key features to help you get started.',
    position: 'bottom',
  },
  {
    id: 'home',
    target: '[data-tour="nav-home"]',
    title: 'Dashboard Home',
    description: 'Your command center. View daily briefings, project summaries, and quick stats at a glance.',
    position: 'right',
  },
  {
    id: 'projects',
    target: '[data-tour="nav-projects"]',
    title: 'Project Management',
    description: 'Create and manage projects with List or Kanban views. Track tasks, set priorities, and monitor progress.',
    position: 'right',
  },
  {
    id: 'calendar',
    target: '[data-tour="nav-calendar"]',
    title: 'Calendar View',
    description: 'See all your tasks and deadlines in a calendar format. Never miss a due date!',
    position: 'right',
  },
  {
    id: 'ai-assistant',
    target: '[data-tour="nav-chat"]',
    title: 'AI Assistant',
    description: 'Get intelligent help with your projects. Ask questions, get suggestions, and let AI help you plan.',
    position: 'right',
  },
  {
    id: 'templates',
    target: '[data-tour="nav-templates"]',
    title: 'Task Templates',
    description: 'Save time with reusable task templates. Create templates for common workflows.',
    position: 'right',
  },
  {
    id: 'theme',
    target: '[data-tour="theme-toggle"]',
    title: 'Customize Your Theme',
    description: 'Switch between light and dark mode to suit your preference.',
    position: 'right',
  },
];

const FeatureTour: React.FC<FeatureTourProps> = ({ steps, onComplete, onSkip }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [tooltipPosition, setTooltipPosition] = useState({ top: 0, left: 0 });
  const [isVisible, setIsVisible] = useState(false);

  const currentTourStep = steps[currentStep];

  const calculatePosition = useCallback(() => {
    if (!currentTourStep) return;

    const targetElement = document.querySelector(currentTourStep.target);
    if (!targetElement) {
      // If target not found, show tooltip in center of screen
      setTooltipPosition({
        top: window.innerHeight / 2 - 100,
        left: window.innerWidth / 2 - 150,
      });
      setIsVisible(true);
      return;
    }

    const rect = targetElement.getBoundingClientRect();
    const tooltipWidth = 320;
    const tooltipHeight = 180;
    const padding = 16;

    let top = 0;
    let left = 0;

    switch (currentTourStep.position) {
      case 'top':
        top = rect.top - tooltipHeight - padding;
        left = rect.left + rect.width / 2 - tooltipWidth / 2;
        break;
      case 'bottom':
        top = rect.bottom + padding;
        left = rect.left + rect.width / 2 - tooltipWidth / 2;
        break;
      case 'left':
        top = rect.top + rect.height / 2 - tooltipHeight / 2;
        left = rect.left - tooltipWidth - padding;
        break;
      case 'right':
        top = rect.top + rect.height / 2 - tooltipHeight / 2;
        left = rect.right + padding;
        break;
    }

    // Keep tooltip within viewport
    top = Math.max(padding, Math.min(top, window.innerHeight - tooltipHeight - padding));
    left = Math.max(padding, Math.min(left, window.innerWidth - tooltipWidth - padding));

    setTooltipPosition({ top, left });
    setIsVisible(true);

    // Highlight the target element
    targetElement.classList.add('tour-highlight');
  }, [currentTourStep]);

  useEffect(() => {
    // Small delay to let the DOM settle
    const timer = setTimeout(calculatePosition, 100);
    return () => clearTimeout(timer);
  }, [currentStep, calculatePosition]);

  useEffect(() => {
    // Remove highlight from previous element
    const allHighlighted = document.querySelectorAll('.tour-highlight');
    allHighlighted.forEach(el => el.classList.remove('tour-highlight'));

    calculatePosition();

    // Recalculate on resize
    window.addEventListener('resize', calculatePosition);
    return () => {
      window.removeEventListener('resize', calculatePosition);
      // Clean up highlights on unmount
      const highlighted = document.querySelectorAll('.tour-highlight');
      highlighted.forEach(el => el.classList.remove('tour-highlight'));
    };
  }, [calculatePosition]);

  const handleNext = () => {
    // Remove current highlight
    const currentTarget = document.querySelector(currentTourStep?.target || '');
    currentTarget?.classList.remove('tour-highlight');

    if (currentStep < steps.length - 1) {
      setIsVisible(false);
      setTimeout(() => setCurrentStep(prev => prev + 1), 150);
    } else {
      onComplete();
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      const currentTarget = document.querySelector(currentTourStep?.target || '');
      currentTarget?.classList.remove('tour-highlight');
      setIsVisible(false);
      setTimeout(() => setCurrentStep(prev => prev - 1), 150);
    }
  };

  const handleSkip = () => {
    const allHighlighted = document.querySelectorAll('.tour-highlight');
    allHighlighted.forEach(el => el.classList.remove('tour-highlight'));
    onSkip();
  };

  if (!currentTourStep) return null;

  return (
    <>
      {/* Backdrop overlay */}
      <div
        className="fixed inset-0 bg-black/50 z-[9998]"
        onClick={handleSkip}
      />

      {/* Tooltip */}
      <div
        className={`fixed z-[9999] w-80 bg-[var(--bg-primary)] border border-[var(--border-primary)] rounded-xl shadow-2xl transition-all duration-300 ${
          isVisible ? 'opacity-100 scale-100' : 'opacity-0 scale-95'
        }`}
        style={{
          top: tooltipPosition.top,
          left: tooltipPosition.left,
        }}
        role="dialog"
        aria-modal="true"
        aria-labelledby="tour-title"
      >
        {/* Progress indicator */}
        <div className="flex gap-1 p-3 pb-0">
          {steps.map((_, index) => (
            <div
              key={index}
              className={`h-1 flex-1 rounded-full transition-colors ${
                index <= currentStep
                  ? 'bg-[var(--accent-primary)]'
                  : 'bg-[var(--bg-tertiary)]'
              }`}
            />
          ))}
        </div>

        {/* Content */}
        <div className="p-4">
          <h3
            id="tour-title"
            className="text-lg font-semibold text-[var(--text-primary)] mb-2"
          >
            {currentTourStep.title}
          </h3>
          <p className="text-sm text-[var(--text-secondary)] mb-4">
            {currentTourStep.description}
          </p>

          {/* Navigation */}
          <div className="flex items-center justify-between">
            <button
              onClick={handleSkip}
              className="text-sm text-[var(--text-tertiary)] hover:text-[var(--text-secondary)] transition-colors"
            >
              Skip tour
            </button>

            <div className="flex gap-2">
              {currentStep > 0 && (
                <button
                  onClick={handlePrevious}
                  className="px-3 py-1.5 text-sm bg-[var(--bg-tertiary)] text-[var(--text-primary)] rounded-lg hover:opacity-80 transition-opacity"
                >
                  Back
                </button>
              )}
              <button
                onClick={handleNext}
                className="px-4 py-1.5 text-sm bg-[var(--accent-primary)] text-white rounded-lg hover:opacity-90 transition-opacity"
              >
                {currentStep === steps.length - 1 ? 'Get Started' : 'Next'}
              </button>
            </div>
          </div>

          {/* Step counter */}
          <div className="mt-3 text-center text-xs text-[var(--text-tertiary)]">
            Step {currentStep + 1} of {steps.length}
          </div>
        </div>

        {/* Arrow pointer */}
        <div
          className={`absolute w-3 h-3 bg-[var(--bg-primary)] border-[var(--border-primary)] transform rotate-45 ${
            currentTourStep.position === 'top'
              ? 'bottom-[-7px] left-1/2 -translate-x-1/2 border-r border-b'
              : currentTourStep.position === 'bottom'
              ? 'top-[-7px] left-1/2 -translate-x-1/2 border-l border-t'
              : currentTourStep.position === 'left'
              ? 'right-[-7px] top-1/2 -translate-y-1/2 border-t border-r'
              : 'left-[-7px] top-1/2 -translate-y-1/2 border-b border-l'
          }`}
        />
      </div>
    </>
  );
};

// Export default steps for use by parent components
export const DEFAULT_TOUR_STEPS = TOUR_STEPS;

export default FeatureTour;

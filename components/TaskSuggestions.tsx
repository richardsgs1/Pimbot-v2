import React, { useState, useEffect } from 'react';
import type { OnboardingData, Project, Task, Priority, SkillLevel, TaskStatus } from '../types';
import { SKILL_LEVEL_VALUES } from '../types';
import SkillAwareAI from './SkillAwareAI';
import MarkdownRenderer from './MarkdownRenderer';

interface TaskSuggestionsProps {
  userData: OnboardingData;
  project: Project;
  onTaskAdd?: (task: Omit<Task, 'id'>) => void;
  compact?: boolean;
}

interface SuggestedTask {
  name: string;
  description: string;
  priority: Priority;
  estimatedDuration: string;
  skillBenefit?: string; // What skill this task helps develop
}

const TaskSuggestions: React.FC<TaskSuggestionsProps> = ({ 
  userData, 
  project, 
  onTaskAdd,
  compact = false 
}) => {
  const [suggestions, setSuggestions] = useState<SuggestedTask[]>([]);
  const [aiSuggestions, setAiSuggestions] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [isExpanded, setIsExpanded] = useState(!compact);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isExpanded) {
      generateTaskSuggestions();
    }
  }, [project, userData.skillLevel, isExpanded]);

  const generateTaskSuggestions = async () => {
    if (!userData.skillLevel) return;

    setIsLoading(true);
    setError(null);

    try {
      // Generate static suggestions based on skill level
      const staticSuggestions = getStaticSuggestions();
      setSuggestions(staticSuggestions);

      // Generate AI-powered suggestions
      const prompt = SkillAwareAI.createTaskSuggestionPrompt(userData, project);
      
      const response = await fetch('/api/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'task-suggestions',
          prompt: prompt,
          project: project,
          userData: userData
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setAiSuggestions(data.suggestions || data.content || '');
      }
    } catch (error) {
      console.error('Error generating task suggestions:', error);
      setError('Could not generate AI suggestions');
    } finally {
      setIsLoading(false);
    }
  };

  const getStaticSuggestions = (): SuggestedTask[] => {
    const completedTasks = project.tasks.filter(t => t.completed).length;
    const totalTasks = project.tasks.length;
    const progressPercentage = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;

    switch (userData.skillLevel) {
      case SKILL_LEVEL_VALUES.NoExperience:
        return [
          {
            name: "Review project goals",
            description: "Take 15 minutes to clearly understand what this project is trying to achieve. Write down the main goal in your own words.",
            priority: "Medium" as Priority,
            estimatedDuration: "15 minutes",
            skillBenefit: "Helps you practice defining clear project objectives"
          },
          {
            name: "Create a simple task list",
            description: "Break down your next steps into small, specific tasks. Each task should be something you can complete in 2-3 hours.",
            priority: "High" as Priority,
            estimatedDuration: "30 minutes",
            skillBenefit: "Teaches you how to break big work into manageable pieces"
          },
          {
            name: "Set up a daily check-in routine",
            description: "Decide on a specific time each day (like 9 AM) to review your project progress and plan your day.",
            priority: "Medium" as Priority,
            estimatedDuration: "10 minutes",
            skillBenefit: "Builds the habit of regular project monitoring"
          }
        ];

      case SKILL_LEVEL_VALUES.Novice:
        return [
          {
            name: "Update project timeline",
            description: "Review your current timeline and adjust dates based on actual progress. Identify any tasks that are behind schedule.",
            priority: "High" as Priority,
            estimatedDuration: "45 minutes",
            skillBenefit: "Develops timeline management and planning skills"
          },
          {
            name: "Identify project risks",
            description: "List 3-5 things that could go wrong with your project and think about how to prevent or handle them.",
            priority: "Medium" as Priority,
            estimatedDuration: "30 minutes",
            skillBenefit: "Introduces basic risk management concepts"
          },
          {
            name: "Stakeholder communication",
            description: "Send a brief status update to your key stakeholders about current progress and any issues.",
            priority: "Medium" as Priority,
            estimatedDuration: "20 minutes",
            skillBenefit: "Practices clear project communication"
          }
        ];

      case SKILL_LEVEL_VALUES.Intermediate:
        return [
          {
            name: "Resource optimization review",
            description: "Analyze current resource allocation and identify opportunities to improve efficiency or redistribute workload.",
            priority: "High" as Priority,
            estimatedDuration: "1 hour",
            skillBenefit: "Develops resource management expertise"
          },
          {
            name: "Dependency mapping",
            description: "Create or update a visual map of task dependencies to identify critical path and potential bottlenecks.",
            priority: "Medium" as Priority,
            estimatedDuration: "45 minutes",
            skillBenefit: "Enhances understanding of project complexity"
          },
          {
            name: "Quality checkpoint",
            description: "Establish quality criteria for current deliverables and schedule review sessions with team members.",
            priority: "Medium" as Priority,
            estimatedDuration: "30 minutes",
            skillBenefit: "Builds quality management processes"
          }
        ];

      case SKILL_LEVEL_VALUES.Experienced:
        return [
          {
            name: "Strategic project alignment review",
            description: "Assess how this project aligns with broader organizational objectives and identify strategic value drivers.",
            priority: "High" as Priority,
            estimatedDuration: "1 hour",
            skillBenefit: "Strengthens strategic thinking and business alignment"
          },
          {
            name: "Team performance optimization",
            description: "Analyze team productivity metrics and implement process improvements or resource adjustments.",
            priority: "Medium" as Priority,
            estimatedDuration: "45 minutes",
            skillBenefit: "Develops advanced team management skills"
          },
          {
            name: "Cross-project portfolio impact analysis",
            description: "Evaluate how changes in this project might affect other projects in your portfolio.",
            priority: "Medium" as Priority,
            estimatedDuration: "30 minutes",
            skillBenefit: "Builds portfolio management perspective"
          }
        ];

      case SKILL_LEVEL_VALUES.Expert:
        return [
          {
            name: "Organizational capability assessment",
            description: "Evaluate what organizational capabilities this project is building and how to leverage them strategically.",
            priority: "High" as Priority,
            estimatedDuration: "1.5 hours",
            skillBenefit: "Enhances strategic organizational development"
          },
          {
            name: "PMO standards development",
            description: "Document best practices from this project that can be applied to improve organizational project management.",
            priority: "Medium" as Priority,
            estimatedDuration: "1 hour",
            skillBenefit: "Contributes to organizational PM maturity"
          },
          {
            name: "Mentoring session planning",
            description: "Plan knowledge transfer sessions to help junior PMs learn from this project's challenges and solutions.",
            priority: "Low" as Priority,
            estimatedDuration: "45 minutes",
            skillBenefit: "Develops leadership and mentoring skills"
          }
        ];

      default:
        return [];
    }
  };

  const getPriorityColor = (priority: Priority): string => {
    switch (priority) {
      case "High":
        return "bg-orange-100 text-orange-800 border-orange-200";
      case "Medium":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "Low":
        return "bg-green-100 text-green-800 border-green-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const handleAddTask = (suggestion: SuggestedTask) => {
    if (onTaskAdd) {
      const newTask: Omit<Task, 'id'> = {
        name: suggestion.name,
        completed: false,
        status: 'To Do' as TaskStatus,
        priority: suggestion.priority,
        dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 7 days from now
        startDate: new Date().toISOString().split('T')[0],
        duration: parseInt(suggestion.estimatedDuration) || 1
      };
      onTaskAdd(newTask);
    }
  };

  const getSkillLevelLabel = (): string => {
    switch (userData.skillLevel) {
      case SKILL_LEVEL_VALUES.NoExperience:
        return "🌱 Learning Tasks";
      case SKILL_LEVEL_VALUES.Novice:
        return "📚 Skill Building Tasks";
      case SKILL_LEVEL_VALUES.Intermediate:
        return "⚡ Growth Tasks";
      case SKILL_LEVEL_VALUES.Experienced:
        return "🎯 Strategic Tasks";
      case SKILL_LEVEL_VALUES.Expert:
        return "🏆 Leadership Tasks";
      default:
        return "Suggested Tasks";
    }
  };

  if (compact && !isExpanded) {
    return (
      <button
        onClick={() => setIsExpanded(true)}
        className="w-full p-3 bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-lg hover:border-[var(--accent-primary)] transition-colors text-left"
      >
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-[var(--text-primary)]">
            {getSkillLevelLabel()}
          </span>
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-[var(--text-tertiary)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
        <p className="text-xs text-[var(--text-tertiary)] mt-1">
          Get personalized task suggestions for your skill level
        </p>
      </button>
    );
  }

  return (
    <div className="bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-xl p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-[var(--text-primary)]">
          {getSkillLevelLabel()}
        </h3>
        <div className="flex items-center space-x-2">
          <button
            onClick={generateTaskSuggestions}
            disabled={isLoading}
            className="px-3 py-1 bg-[var(--accent-primary)] hover:bg-[var(--accent-secondary)] disabled:bg-[var(--bg-tertiary)] text-white rounded-lg transition-colors text-sm"
          >
            {isLoading ? 'Generating...' : 'Refresh'}
          </button>
          {compact && (
            <button
              onClick={() => setIsExpanded(false)}
              className="p-1 hover:bg-[var(--bg-tertiary)] rounded"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
              </svg>
            </button>
          )}
        </div>
      </div>

      {/* Static Suggestions */}
      <div className="space-y-3 mb-6">
        {suggestions.map((suggestion, index) => (
          <div key={index} className="p-4 bg-[var(--bg-tertiary)] rounded-lg border border-[var(--border-primary)]">
            <div className="flex items-start justify-between mb-2">
              <h4 className="font-medium text-[var(--text-primary)]">{suggestion.name}</h4>
              <div className="flex items-center space-x-2">
                <span className={`px-2 py-1 rounded text-xs font-medium border ${getPriorityColor(suggestion.priority)}`}>
                  {suggestion.priority}
                </span>
                {onTaskAdd && (
                  <button
                    onClick={() => handleAddTask(suggestion)}
                    className="px-2 py-1 bg-[var(--accent-primary)] hover:bg-[var(--accent-secondary)] text-white rounded text-xs transition-colors"
                  >
                    Add
                  </button>
                )}
              </div>
            </div>
            
            <p className="text-sm text-[var(--text-secondary)] mb-2">{suggestion.description}</p>
            
            <div className="flex items-center justify-between text-xs text-[var(--text-tertiary)]">
              <span>⏱️ {suggestion.estimatedDuration}</span>
              {suggestion.skillBenefit && (
                <span className="italic">💡 {suggestion.skillBenefit}</span>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* AI Suggestions */}
      {aiSuggestions && (
        <div className="border-t border-[var(--border-primary)] pt-4">
          <h4 className="font-medium text-[var(--text-primary)] mb-3">AI-Powered Insights</h4>
          <div className="prose prose-sm max-w-none text-[var(--text-primary)]">
            <MarkdownRenderer content={aiSuggestions} />
          </div>
        </div>
      )}

      {isLoading && (
        <div className="flex items-center justify-center py-4">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-[var(--accent-primary)]"></div>
          <span className="ml-2 text-sm text-[var(--text-tertiary)]">Generating personalized suggestions...</span>
        </div>
      )}

      {error && (
        <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-3">
          <p className="text-yellow-800 dark:text-yellow-200 text-sm">{error}</p>
        </div>
      )}

      {/* Skill Level Context */}
      {userData.skillLevel === SKILL_LEVEL_VALUES.NoExperience && (
        <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
          <p className="text-blue-800 dark:text-blue-200 text-sm">
            <strong>Learning Focus:</strong> These tasks are designed to help you build fundamental project management skills. 
            Take your time with each one and don't hesitate to ask for help!
          </p>
        </div>
      )}
    </div>
  );
};

export default TaskSuggestions;
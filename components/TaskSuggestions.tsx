import React, { useState, useEffect } from 'react';
import type { OnboardingData, Project, Task, Priority, TaskStatus } from '../types';
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

      // Generate AI suggestions
      const prompt = `As a project management coach, suggest 2-3 personalized tasks for this project based on the user's skill level.

Project: ${project.name}
Description: ${project.description}
User Skill Level: ${userData.skillLevel}
Current Progress: ${project.progress}%
Current Tasks: ${project.tasks.length}

Provide suggestions that:
1. Match the user's skill level (${userData.skillLevel})
2. Help them develop PM skills appropriate to their level
3. Address gaps or next steps for this specific project
4. Are actionable and specific

Format as a numbered list with task name and brief description.`;

      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          messages: [{ role: 'user', content: prompt }],
          context: { skillLevel: userData.skillLevel }
        })
      });

      if (!response.ok) {
        throw new Error('Failed to generate AI suggestions');
      }

      const data = await response.json();
      setAiSuggestions(data.response || '');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate suggestions');
      console.error('Error generating task suggestions:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const getStaticSuggestions = (): SuggestedTask[] => {
    const totalTasks = project.tasks.length;
    const completedTasks = project.tasks.filter(t => t.completed).length;
    const progressPercentage = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;

    // Use string literals that match OnboardingData.skillLevel type
    switch (userData.skillLevel) {
      case 'Beginner': // Was: 'No Experience'
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

      case 'Intermediate':
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

      case 'Advanced': // Was: 'Experienced'
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

      case 'Expert':
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
          },
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
            description: "Plan a session to share your project insights and lessons learned with less experienced team members.",
            priority: "Low" as Priority,
            estimatedDuration: "30 minutes",
            skillBenefit: "Develops leadership and knowledge transfer skills"
          }
        ];

      default:
        return [
          {
            name: "Project status review",
            description: "Review current project status and identify next steps.",
            priority: "Medium" as Priority,
            estimatedDuration: "30 minutes"
          }
        ];
    }
  };

  const handleAddTask = (suggestion: SuggestedTask) => {
    if (onTaskAdd) {
      const now = new Date().toISOString();
      const newTask: Omit<Task, 'id'> = {
        name: suggestion.name,
        description: suggestion.description,
        completed: false,
        status: 'To Do' as TaskStatus,
        priority: suggestion.priority,
        dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 7 days from now
        startDate: new Date().toISOString().split('T')[0],
        assignees: [], // Required field
        attachments: [], // Required field
        createdAt: now, // Required field
        updatedAt: now, // Required field
        // Removed duration field as it doesn't exist in Task type
      };
      onTaskAdd(newTask);
    }
  };

  const getSkillLevelLabel = (): string => {
    switch (userData.skillLevel) {
      case 'Beginner': // Was: 'No Experience'
        return "🌱 Learning Tasks";
      case 'Intermediate':
        return "📚 Skill Building Tasks";
      case 'Advanced': // Was: 'Experienced'
        return "⚡ Growth Tasks";
      case 'Expert':
        return "🎯 Leadership Tasks";
      default:
        return "💡 Suggested Tasks";
    }
  };

  if (!isExpanded && compact) {
    return (
      <button
        onClick={() => setIsExpanded(true)}
        className="w-full p-4 bg-gradient-to-r from-purple-500/10 to-blue-500/10 border border-purple-500/20 rounded-lg hover:border-purple-500/40 transition-colors text-left"
      >
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-white">💡 Get Personalized Task Suggestions</h3>
            <p className="text-sm text-slate-400 mt-1">
              AI-powered recommendations based on your skill level
            </p>
          </div>
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </button>
    );
  }

  return (
    <div className="bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-700 rounded-xl p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-xl font-bold text-white flex items-center gap-2">
            <span className="text-2xl">💡</span>
            {getSkillLevelLabel()}
          </h3>
          <p className="text-sm text-slate-400 mt-1">
            Personalized recommendations to help you grow your PM skills
          </p>
        </div>
        {compact && (
          <button
            onClick={() => setIsExpanded(false)}
            className="text-slate-400 hover:text-white transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
            </svg>
          </button>
        )}
      </div>

      {isLoading ? (
        <div className="space-y-4">
          <div className="animate-pulse space-y-3">
            <div className="h-20 bg-slate-700/50 rounded-lg"></div>
            <div className="h-20 bg-slate-700/50 rounded-lg"></div>
            <div className="h-20 bg-slate-700/50 rounded-lg"></div>
          </div>
        </div>
      ) : error ? (
        <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4">
          <p className="text-red-400 text-sm">{error}</p>
          <button
            onClick={generateTaskSuggestions}
            className="mt-2 text-sm text-red-300 hover:text-red-200 underline"
          >
            Try again
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Static Suggestions */}
          <div className="space-y-3">
            {suggestions.map((suggestion, index) => (
              <div
                key={index}
                className="bg-slate-700/30 border border-slate-600/50 rounded-lg p-4 hover:border-purple-500/50 transition-colors"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h4 className="font-semibold text-white mb-2">{suggestion.name}</h4>
                    <p className="text-sm text-slate-300 mb-3">{suggestion.description}</p>
                    
                    <div className="flex items-center gap-4 text-xs">
                      <span className="flex items-center gap-1 text-slate-400">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        {suggestion.estimatedDuration}
                      </span>
                      
                      <span className={`px-2 py-1 rounded ${
                        suggestion.priority === 'High' ? 'bg-red-500/20 text-red-400' :
                        suggestion.priority === 'Medium' ? 'bg-yellow-500/20 text-yellow-400' :
                        'bg-blue-500/20 text-blue-400'
                      }`}>
                        {suggestion.priority}
                      </span>
                    </div>

                    {suggestion.skillBenefit && (
                      <div className="mt-3 pt-3 border-t border-slate-600/50">
                        <p className="text-xs text-purple-400 flex items-start gap-2">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                          </svg>
                          <span><strong>Skill Benefit:</strong> {suggestion.skillBenefit}</span>
                        </p>
                      </div>
                    )}
                  </div>

                  {onTaskAdd && (
                    <button
                      onClick={() => handleAddTask(suggestion)}
                      className="ml-4 px-4 py-2 bg-purple-500 hover:bg-purple-600 text-white text-sm font-medium rounded-lg transition-colors flex-shrink-0"
                    >
                      Add Task
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* AI Suggestions */}
          {aiSuggestions && (
            <div className="border-t border-slate-700 pt-6">
              <h4 className="font-semibold text-white mb-3 flex items-center gap-2">
                <span className="text-xl">🤖</span>
                AI-Powered Insights
              </h4>
              <div className="bg-slate-700/20 border border-slate-600/50 rounded-lg p-4">
                <MarkdownRenderer content={aiSuggestions} />
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default TaskSuggestions;
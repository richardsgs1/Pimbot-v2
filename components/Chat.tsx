import React, { useState, useRef, useEffect } from 'react';
import type { OnboardingData, Project, ChatMessage, Task } from '../types';
import { SkillLevel, ProjectStatus, Priority } from '../types';
import MarkdownRenderer from './MarkdownRenderer';
import TimelineGenerator from './TimelineGenerator';
import TeamCapacityAnalysis from './TeamCapacityAnalysis';
import RiskReport from './RiskReport';
import ExportCenter from './ExportCenter'; 

interface ChatProps {
  userData: OnboardingData;
  projects: Project[];
  onMenuClick: () => void;
  onTaskCreate?: (projectId: string, task: Omit<Task, 'id'>) => void;
  onProjectUpdate?: (projectId: string, updates: Partial<Project>) => void;
}

interface QuickAction {
  id: string;
  label: string;
  icon: string;
  action: () => void;
  condition: () => boolean;
}

interface TaskCreationForm {
  name: string;
  projectId: string;
  dueDate: string;
  priority: Priority;
  assigneeId?: string;
}

const Chat: React.FC<ChatProps> = ({ 
  userData, 
  projects, 
  onMenuClick,
  onTaskCreate,
  onProjectUpdate 
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [currentResponse, setCurrentResponse] = useState('');
  const [showContextPanel, setShowContextPanel] = useState(true);
  const [showTaskForm, setShowTaskForm] = useState(false);
  const [showTimeline, setShowTimeline] = useState(false);
  const [showTeamAnalysis, setShowTeamAnalysis] = useState(false);
  const [showRiskReport, setShowRiskReport] = useState(false);
  const [showExportCenter, setShowExportCenter] = useState(false); 
  const [taskForm, setTaskForm] = useState<TaskCreationForm>({
    name: '',
    projectId: projects[0]?.id || '',
    dueDate: new Date().toISOString().split('T')[0],
    priority: Priority.Medium
  });
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Calculate context insights
  const contextInsights = {
    totalProjects: projects.length,
    activeProjects: projects.filter(p => p.status !== ProjectStatus.Completed).length,
    atRiskProjects: projects.filter(p => p.status === ProjectStatus.AtRisk).length,
    overdueTasks: projects.reduce((acc, p) => {
      const overdue = p.tasks.filter(t => 
        !t.completed && new Date(t.dueDate) < new Date()
      ).length;
      return acc + overdue;
    }, 0),
    totalBudget: projects.reduce((acc, p) => acc + (p.budget || 0), 0),
    totalSpent: projects.reduce((acc, p) => acc + (p.spent || 0), 0),
    budgetUtilization: function() {
      return this.totalBudget > 0 
        ? ((this.totalSpent / this.totalBudget) * 100).toFixed(1)
        : '0';
    },
    overBudgetProjects: projects.filter(p => 
      p.budget && p.spent && p.spent > p.budget
    ).length
  };

  // Quick actions based on context
  const quickActions: QuickAction[] = [
    {
      id: 'create-task',
      label: 'Create Task',
      icon: '✓',
      action: () => setShowTaskForm(true),
      condition: () => projects.length > 0
    },
    {
      id: 'timeline',
      label: 'Generate Timeline',
      icon: '📅',
      action: () => setShowTimeline(true),
      condition: () => projects.length > 0
    },
    {
      id: 'team-analysis',
      label: 'Team Capacity',
      icon: '👥',
      action: () => setShowTeamAnalysis(true),
      condition: () => projects.some(p => p.teamMembers && p.teamMembers.length > 0)
    },
    {
      id: 'risk-report',
      label: 'Risk Report',
      icon: '⚠️',
      action: () => setShowRiskReport(true),
      condition: () => contextInsights.atRiskProjects > 0 || contextInsights.overdueTasks > 0
    },
    {
      id: 'export',  // ADD THIS ENTIRE OBJECT
      label: 'Export Reports',
      icon: '📥',
      action: () => setShowExportCenter(true),
      condition: () => projects.length > 0
    },
    {
      id: 'review-risks',
      label: 'AI Risk Analysis',
      icon: '🔍',
      action: () => handleQuickPrompt('Analyze the risks across my projects in detail and provide mitigation strategies'),
      condition: () => contextInsights.atRiskProjects > 0
    },
    {
      id: 'budget-review',
      label: 'Budget Review',
      icon: '💰',
      action: () => handleQuickPrompt('Review my budget utilization and highlight any concerns'),
      condition: () => contextInsights.overBudgetProjects > 0 || parseFloat(contextInsights.budgetUtilization()) > 80
    },
    {
      id: 'prioritize-tasks',
      label: 'Prioritize Tasks',
      icon: '🎯',
      action: () => handleQuickPrompt('Help me prioritize my overdue tasks'),
      condition: () => contextInsights.overdueTasks > 0
    },
    {
      id: 'generate-report',
      label: 'Status Report',
      icon: '📊',
      action: () => handleQuickPrompt('Generate a comprehensive status report for all my active projects'),
      condition: () => contextInsights.activeProjects > 0
    },
    {
      id: 'draft-update',
      label: 'Draft Update',
      icon: '✉️',
      action: () => handleQuickPrompt('Draft a stakeholder update email for my at-risk projects'),
      condition: () => contextInsights.atRiskProjects > 0
    }
  ];

  const activeQuickActions = quickActions.filter(action => action.condition());

  useEffect(() => {
    const welcomeMessage = getWelcomeMessage();
    setMessages([{
      id: '1',
      role: 'assistant',
      content: welcomeMessage,
      timestamp: new Date().toISOString()
    }]);
  }, [userData.skillLevel]);

  useEffect(() => {
    scrollToBottom();
  }, [messages, currentResponse]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const getWelcomeMessage = (): string => {
    const insights = `I can see you're managing ${contextInsights.activeProjects} active project${contextInsights.activeProjects !== 1 ? 's' : ''}${
      contextInsights.atRiskProjects > 0 ? `, with ${contextInsights.atRiskProjects} at risk` : ''
    }${
      contextInsights.overdueTasks > 0 ? ` and ${contextInsights.overdueTasks} overdue task${contextInsights.overdueTasks !== 1 ? 's' : ''}` : ''
    }.`;

    switch (userData.skillLevel) {
      case SkillLevel.NO_EXPERIENCE:
        return `Hi ${userData.name}! 👋 I'm your AI assistant. ${insights}\n\nI can help you:\n- Understand project management concepts\n- Create and organize tasks\n- Review project health\n- Learn best practices\n\nTry clicking one of the quick action buttons below, or just ask me anything!`;
      
      case SkillLevel.NOVICE:
        return `Hello ${userData.name}! ${insights}\n\nI can help you create tasks, review risks, generate reports, and provide PM guidance. What would you like to work on?`;
      
      default:
        return `Hi ${userData.name}! ${insights}\n\nReady to assist with strategic planning, risk management, and project optimization. What can I help with today?`;
    }
  };

  const buildContextPrompt = (userMessage: string): string => {
    return `Context about the user's projects:
- Total projects: ${contextInsights.totalProjects}
- Active projects: ${contextInsights.activeProjects}
- At-risk projects: ${contextInsights.atRiskProjects}
- Overdue tasks: ${contextInsights.overdueTasks}
- Budget utilization: ${contextInsights.budgetUtilization()}%
- Over-budget projects: ${contextInsights.overBudgetProjects}

Projects:
${projects.map(p => `- ${p.name}: ${p.status}, ${p.progress}% complete, ${p.tasks.length} tasks`).join('\n')}

User skill level: ${userData.skillLevel}

User message: ${userMessage}

Provide helpful, context-aware advice based on their current portfolio status and skill level.`;
  };

  const detectIntent = (message: string): 'create-task' | 'update-status' | 'none' => {
    const lowerMsg = message.toLowerCase();
    
    const taskKeywords = ['create task', 'add task', 'new task', 'make a task', 'add a todo'];
    const statusKeywords = ['update status', 'change status', 'mark as', 'set status'];
    
    if (taskKeywords.some(kw => lowerMsg.includes(kw))) return 'create-task';
    if (statusKeywords.some(kw => lowerMsg.includes(kw))) return 'update-status';
    
    return 'none';
  };

  const handleQuickPrompt = (prompt: string) => {
    setInputMessage(prompt);
    setTimeout(() => handleSendMessage(prompt), 100);
  };

  const handleSendMessage = async (overrideMessage?: string) => {
    const messageToSend = overrideMessage || inputMessage;
    if (!messageToSend.trim() || isStreaming) return;

    const intent = detectIntent(messageToSend);
    
    // If intent detected, show form instead of sending to AI
    if (intent === 'create-task') {
      setShowTaskForm(true);
      setInputMessage('');
      return;
    }

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: messageToSend,
      timestamp: new Date().toISOString()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsStreaming(true);
    setCurrentResponse('');

    try {
      const contextualPrompt = buildContextPrompt(messageToSend);
      
      const response = await fetch('/api/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'generate',
          prompt: contextualPrompt,
          userData: userData,
          projects: projects
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      // Handle the response - Gemini returns direct content, not streaming
      const assistantMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: data.content || data.briefing || 'Sorry, I couldn\'t generate a response.',
        timestamp: new Date().toISOString()
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error('Error sending message:', error);
      const errorMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: 'I apologize, but I\'m having trouble connecting right now. Please try again in a moment.',
        timestamp: new Date().toISOString()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsStreaming(false);
      inputRef.current?.focus();
    }
  };

  const handleCreateTask = () => {
    if (!taskForm.name.trim() || !onTaskCreate) return;

    const newTask: Omit<Task, 'id'> = {
      name: taskForm.name,
      completed: false,
      priority: taskForm.priority,
      dueDate: taskForm.dueDate,
      startDate: new Date().toISOString().split('T')[0],
      duration: 1,
      assigneeId: taskForm.assigneeId
    };

    onTaskCreate(taskForm.projectId, newTask);
    
    // Add confirmation message
    const confirmMessage: ChatMessage = {
      id: Date.now().toString(),
      role: 'assistant',
      content: `✅ Task "${taskForm.name}" created successfully in project "${projects.find(p => p.id === taskForm.projectId)?.name}"!`,
      timestamp: new Date().toISOString()
    };
    setMessages(prev => [...prev, confirmMessage]);

    // Reset form
    setTaskForm({
      name: '',
      projectId: projects[0]?.id || '',
      dueDate: new Date().toISOString().split('T')[0],
      priority: Priority.Medium
    });
    setShowTaskForm(false);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className="flex h-full max-h-[calc(100vh-8rem)] gap-4">
      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <div className="flex items-center justify-between mb-4 p-4 bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-lg">
          <div className="flex items-center">
            <button onClick={onMenuClick} className="md:hidden mr-4 p-1 rounded-full hover:bg-[var(--bg-tertiary)]">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            <div>
              <h2 className="text-xl font-bold text-[var(--text-primary)]">AI Assistant</h2>
              <p className="text-sm text-[var(--text-tertiary)]">
                Context-aware • {contextInsights.activeProjects} active projects
              </p>
            </div>
          </div>
          <button
            onClick={() => setShowContextPanel(!showContextPanel)}
            className="p-2 hover:bg-[var(--bg-tertiary)] rounded-lg transition-colors"
            title={showContextPanel ? "Hide context panel" : "Show context panel"}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </button>
        </div>

        {/* Quick Actions */}
        {activeQuickActions.length > 0 && (
          <div className="mb-4 flex flex-wrap gap-2">
            {activeQuickActions.map(action => (
              <button
                key={action.id}
                onClick={action.action}
                className="px-3 py-1.5 bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-lg hover:border-[var(--accent-primary)] hover:bg-[var(--bg-tertiary)] transition-colors text-sm flex items-center gap-2"
              >
                <span>{action.icon}</span>
                <span>{action.label}</span>
              </button>
            ))}
          </div>
        )}

        {/* Messages */}
        <div className="flex-1 overflow-y-auto space-y-4 mb-4 p-4 bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-lg">
          {messages.map((message) => (
            <div key={message.id} className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-xs lg:max-w-md xl:max-w-lg px-4 py-2 rounded-lg ${
                message.role === 'user'
                  ? 'bg-[var(--accent-primary)] text-white'
                  : 'bg-[var(--bg-tertiary)] text-[var(--text-primary)]'
              }`}>
                {message.role === 'assistant' ? (
                  <MarkdownRenderer content={message.content} />
                ) : (
                  <p className="text-sm">{message.content}</p>
                )}
                <p className={`text-xs mt-1 ${
                  message.role === 'user' ? 'text-white/70' : 'text-[var(--text-tertiary)]'
                }`}>
                  {new Date(message.timestamp).toLocaleTimeString()}
                </p>
              </div>
            </div>
          ))}

          {isStreaming && (
            <div className="flex justify-start">
              <div className="max-w-xs lg:max-w-md xl:max-w-lg px-4 py-2 rounded-lg bg-[var(--bg-tertiary)]">
                <div className="flex items-center gap-2">
                  <div className="animate-pulse flex space-x-1">
                    <div className="rounded-full h-2 w-2 bg-[var(--accent-primary)]"></div>
                    <div className="rounded-full h-2 w-2 bg-[var(--accent-primary)]"></div>
                    <div className="rounded-full h-2 w-2 bg-[var(--accent-primary)]"></div>
                  </div>
                  <span className="text-xs text-[var(--text-tertiary)]">AI is thinking...</span>
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="flex space-x-2">
          <input
            ref={inputRef}
            type="text"
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Ask about your projects, create tasks, or request insights..."
            disabled={isStreaming}
            className="flex-1 px-4 py-2 border border-[var(--border-primary)] rounded-lg bg-[var(--bg-secondary)] text-[var(--text-primary)] placeholder-[var(--text-tertiary)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-primary)] disabled:opacity-50"
          />
          <button
            onClick={() => handleSendMessage()}
            disabled={!inputMessage.trim() || isStreaming}
            className="px-6 py-2 bg-[var(--accent-primary)] hover:bg-[var(--accent-secondary)] disabled:bg-[var(--bg-tertiary)] disabled:cursor-not-allowed text-white font-medium rounded-lg transition-colors"
          >
            Send
          </button>
        </div>
      </div>

      {/* Context Panel */}
      {showContextPanel && (
        <div className="w-64 flex-shrink-0 space-y-4">
          <div className="bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-lg p-4">
            <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-3">Portfolio Overview</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-[var(--text-tertiary)]">Active Projects</span>
                <span className="font-semibold text-[var(--text-primary)]">{contextInsights.activeProjects}</span>
              </div>
              {contextInsights.atRiskProjects > 0 && (
                <div className="flex justify-between">
                  <span className="text-yellow-600 dark:text-yellow-400">At Risk</span>
                  <span className="font-semibold text-yellow-600 dark:text-yellow-400">{contextInsights.atRiskProjects}</span>
                </div>
              )}
              {contextInsights.overdueTasks > 0 && (
                <div className="flex justify-between">
                  <span className="text-red-600 dark:text-red-400">Overdue Tasks</span>
                  <span className="font-semibold text-red-600 dark:text-red-400">{contextInsights.overdueTasks}</span>
                </div>
              )}
            </div>
          </div>

          {contextInsights.totalBudget > 0 && (
            <div className="bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-lg p-4">
              <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-3">Budget</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-[var(--text-tertiary)]">Utilization</span>
                  <span className={`font-semibold ${
                    parseFloat(contextInsights.budgetUtilization()) > 90 
                      ? 'text-red-600 dark:text-red-400' 
                      : parseFloat(contextInsights.budgetUtilization()) > 80
                      ? 'text-yellow-600 dark:text-yellow-400'
                      : 'text-green-600 dark:text-green-400'
                  }`}>
                    {contextInsights.budgetUtilization()}%
                  </span>
                </div>
                {contextInsights.overBudgetProjects > 0 && (
                  <div className="text-xs text-red-600 dark:text-red-400">
                    {contextInsights.overBudgetProjects} project{contextInsights.overBudgetProjects !== 1 ? 's' : ''} over budget
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Task Creation Modal */}
      {showTaskForm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-xl p-6 max-w-md w-full">
            <h3 className="text-lg font-bold text-[var(--text-primary)] mb-4">Create New Task</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">Task Name</label>
                <input
                  type="text"
                  value={taskForm.name}
                  onChange={(e) => setTaskForm({...taskForm, name: e.target.value})}
                  className="w-full p-2 border border-[var(--border-primary)] rounded bg-[var(--bg-primary)] text-[var(--text-primary)]"
                  placeholder="Enter task name"
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">Project</label>
                <select
                  value={taskForm.projectId}
                  onChange={(e) => setTaskForm({...taskForm, projectId: e.target.value})}
                  className="w-full p-2 border border-[var(--border-primary)] rounded bg-[var(--bg-primary)] text-[var(--text-primary)]"
                >
                  {projects.map(p => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">Due Date</label>
                  <input
                    type="date"
                    value={taskForm.dueDate}
                    onChange={(e) => setTaskForm({...taskForm, dueDate: e.target.value})}
                    className="w-full p-2 border border-[var(--border-primary)] rounded bg-[var(--bg-primary)] text-[var(--text-primary)]"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">Priority</label>
                  <select
                    value={taskForm.priority}
                    onChange={(e) => setTaskForm({...taskForm, priority: e.target.value as Priority})}
                    className="w-full p-2 border border-[var(--border-primary)] rounded bg-[var(--bg-primary)] text-[var(--text-primary)]"
                  >
                    <option value={Priority.Low}>Low</option>
                    <option value={Priority.Medium}>Medium</option>
                    <option value={Priority.High}>High</option>
                    <option value={Priority.Critical}>Critical</option>
                  </select>
                </div>
              </div>

              <div className="flex gap-2 pt-4">
                <button
                  onClick={handleCreateTask}
                  disabled={!taskForm.name.trim()}
                  className="flex-1 bg-[var(--accent-primary)] hover:bg-[var(--accent-secondary)] disabled:bg-gray-500 text-white py-2 rounded-lg transition-colors"
                >
                  Create Task
                </button>
                <button
                  onClick={() => setShowTaskForm(false)}
                  className="px-4 bg-gray-500 hover:bg-gray-600 text-white py-2 rounded-lg transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Timeline Generator Modal */}
      {showTimeline && (
        <TimelineGenerator
          projects={projects}
          onClose={() => setShowTimeline(false)}
        />
      )}

      {/* Team Capacity Analysis Modal */}
      {showTeamAnalysis && (
        <TeamCapacityAnalysis
          projects={projects}
          onClose={() => setShowTeamAnalysis(false)}
        />
      )}

      {/* Risk Report Modal */}
      {showRiskReport && (
        <RiskReport
          projects={projects}
          userData={userData}
          onClose={() => setShowRiskReport(false)}
        />
      )}

      {/* Export Center Modal - ADD THIS */}
      {showExportCenter && (
        <ExportCenter
          projects={projects}
          userData={userData}
          onClose={() => setShowExportCenter(false)}
        />
      )}
    </div>
  );
};

export default Chat;
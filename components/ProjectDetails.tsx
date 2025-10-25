import React, { useState } from 'react';
import type { Project, TeamMember, OnboardingData, Task, Priority, ProjectStatus } from '../types';
import { PRIORITY_VALUES, PROJECT_STATUS_VALUES } from '../types';

// Define JournalEntry locally since it's not in types
interface JournalEntry {
  id: string;
  date: string;
  content: string;
  author: string;
  type: string;
}

interface ProjectDetailsProps {
  project: Project;
  onMenuClick: () => void;
  onUpdateProject?: (project: Project) => void;
  team?: TeamMember[];
  userData: OnboardingData;
  onBack: () => void;
}

const ProjectDetails: React.FC<ProjectDetailsProps> = ({ 
  project, 
  onMenuClick, 
  onUpdateProject,
  team = [],
  userData,
  onBack 
}) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'tasks' | 'team' | 'journal'>('overview');
  const [newJournalEntry, setNewJournalEntry] = useState('');
  const [journal, setJournal] = useState<JournalEntry[]>([]);

  const getAvatarColor = (name: string): string => {
    const colors = ['#6366f1', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#3b82f6', '#ef4444', '#06b6d4'];
    const hash = name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return colors[hash % colors.length];
  };

  // Ensure teamMembers exists to prevent undefined errors
  const safeProject = {
    ...project,
    teamMembers: project.teamMembers || team || []
  };

  const handleAddJournalEntry = () => {
    if (!newJournalEntry.trim()) return;

    const entry: JournalEntry = {
      id: Date.now().toString(),
      date: new Date().toISOString().split('T')[0],
      content: newJournalEntry,
      author: userData.name || 'Unknown User',
      type: 'update'
    };

    setJournal([...journal, entry]);
    setNewJournalEntry('');
  };

  const handleTaskToggle = (taskId: string) => {
    const updatedTasks = safeProject.tasks.map(task =>
      task.id === taskId ? { ...task, completed: !task.completed } : task
    );

    const completedCount = updatedTasks.filter(task => task.completed).length;
    const progress = Math.round((completedCount / updatedTasks.length) * 100);

    const updatedProject = {
      ...safeProject,
      tasks: updatedTasks,
      progress: progress
    };

    if (onUpdateProject) {
      onUpdateProject(updatedProject);
    }
  };

  const getStatusColor = (status: ProjectStatus) => {
    switch (status) {
      case PROJECT_STATUS_VALUES.InProgress:
        return 'bg-green-100 text-green-800 border-green-200';
      case PROJECT_STATUS_VALUES.AtRisk:
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case PROJECT_STATUS_VALUES.OnHold:
        return 'bg-red-100 text-red-800 border-red-200';
      case PROJECT_STATUS_VALUES.Completed:
        return 'bg-blue-100 text-blue-800 border-blue-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getPriorityColor = (priority: Priority) => {
    switch (priority) {
      case PRIORITY_VALUES.High:
        return 'bg-red-100 text-red-800 border-red-200';
      case PRIORITY_VALUES.Medium:
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case PRIORITY_VALUES.Low:
        return 'bg-green-100 text-green-800 border-green-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const renderOverview = () => (
    <div className="space-y-6">
      {/* Project Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-xl p-4">
          <h3 className="text-sm font-medium text-[var(--text-tertiary)] mb-2">Status</h3>
          <span className={`inline-flex px-3 py-1 rounded-full text-sm font-medium border ${getStatusColor(safeProject.status)}`}>
            {safeProject.status}
          </span>
        </div>
        <div className="bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-xl p-4">
          <h3 className="text-sm font-medium text-[var(--text-tertiary)] mb-2">Progress</h3>
          <div className="flex items-center">
            <div className="flex-1 bg-[var(--bg-tertiary)] rounded-full h-2 mr-3">
              <div 
                className="bg-[var(--accent-primary)] h-2 rounded-full transition-all duration-300"
                style={{ width: `${safeProject.progress}%` }}
              ></div>
            </div>
            <span className="text-lg font-semibold text-[var(--text-primary)]">{safeProject.progress}%</span>
          </div>
        </div>
        <div className="bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-xl p-4">
          <h3 className="text-sm font-medium text-[var(--text-tertiary)] mb-2">Due Date</h3>
          <p className="text-lg font-semibold text-[var(--text-primary)]">
            {safeProject.dueDate ? new Date(safeProject.dueDate).toLocaleDateString() : 'Not set'}
          </p>
        </div>
        <div className="bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-xl p-4">
          <h3 className="text-sm font-medium text-[var(--text-tertiary)] mb-2">Team Size</h3>
          <p className="text-lg font-semibold text-[var(--text-primary)]">{safeProject.teamMembers.length}</p>
        </div>
      </div>

      {/* Project Description */}
      <div className="bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-xl p-6">
        <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-4">Description</h3>
        <p className="text-[var(--text-secondary)]">{safeProject.description}</p>
      </div>

      {/* Budget Info */}
      {safeProject.budget && (
        <div className="bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-xl p-6">
          <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-4">Budget Overview</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <p className="text-sm text-[var(--text-tertiary)]">Total Budget</p>
              <p className="text-xl font-semibold text-[var(--text-primary)]">${safeProject.budget.toLocaleString()}</p>
            </div>
            <div>
              <p className="text-sm text-[var(--text-tertiary)]">Spent</p>
              <p className="text-xl font-semibold text-[var(--text-primary)]">${(safeProject.spent || 0).toLocaleString()}</p>
            </div>
            <div>
              <p className="text-sm text-[var(--text-tertiary)]">Remaining</p>
              <p className="text-xl font-semibold text-[var(--text-primary)]">
                ${(safeProject.budget - (safeProject.spent || 0)).toLocaleString()}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  const renderTasks = () => (
    <div className="space-y-4">
      {safeProject.tasks && safeProject.tasks.length > 0 ? (
        safeProject.tasks.map((task) => (
          <div key={task.id} className="bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-xl p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center flex-1">
                <input
                  type="checkbox"
                  checked={task.completed}
                  onChange={() => handleTaskToggle(task.id)}
                  className="mr-4 w-4 h-4 accent-[var(--accent-primary)]"
                />
                <div className="flex-1">
                  <h4 className={`font-medium ${task.completed ? 'line-through text-[var(--text-tertiary)]' : 'text-[var(--text-primary)]'}`}>
                    {task.name}
                  </h4>
                  <div className="flex items-center space-x-4 mt-1">
                    {task.dueDate && (
                      <span className="text-sm text-[var(--text-tertiary)]">
                        Due: {new Date(task.dueDate).toLocaleDateString()}
                      </span>
                    )}
                    {task.startDate && (
                      <span className="text-sm text-[var(--text-tertiary)]">
                        Started: {new Date(task.startDate).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                </div>
              </div>
              <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getPriorityColor(task.priority)}`}>
                {task.priority}
              </span>
            </div>
          </div>
        ))
      ) : (
        <div className="text-center py-8">
          <p className="text-[var(--text-tertiary)]">No tasks available for this project.</p>
        </div>
      )}
    </div>
  );

  const renderTeam = () => (
    <div className="space-y-4">
      {safeProject.teamMembers && safeProject.teamMembers.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {safeProject.teamMembers.map((member) => (
            <div key={member.id} className="bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-xl p-4">
              <div className="flex items-center">
                <div 
                  className="w-10 h-10 rounded-full flex items-center justify-center text-white font-semibold mr-4"
                  style={{ backgroundColor: getAvatarColor(member.name) }}
                >
                  {member.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <h4 className="font-medium text-[var(--text-primary)]">{member.name}</h4>
                  <p className="text-sm text-[var(--text-tertiary)]">{member.role}</p>
                  <p className="text-sm text-[var(--text-tertiary)]">{member.email}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-8">
          <p className="text-[var(--text-tertiary)]">No team members assigned to this project.</p>
        </div>
      )}
    </div>
  );

  const renderJournal = () => (
    <div className="space-y-6">
      {/* Add New Entry */}
      <div className="bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-xl p-4">
        <h4 className="font-medium text-[var(--text-primary)] mb-3">Add Journal Entry</h4>
        <div className="space-y-3">
          <textarea
            value={newJournalEntry}
            onChange={(e) => setNewJournalEntry(e.target.value)}
            placeholder="What happened today? Record project updates, decisions, or notes..."
            className="w-full p-3 rounded-lg border border-[var(--border-primary)] bg-[var(--bg-tertiary)] text-[var(--text-primary)] placeholder-[var(--text-tertiary)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-primary)] resize-none"
            rows={3}
          />
          <button
            onClick={handleAddJournalEntry}
            disabled={!newJournalEntry.trim()}
            className="px-4 py-2 bg-[var(--accent-primary)] hover:bg-[var(--accent-secondary)] disabled:bg-[var(--bg-tertiary)] disabled:cursor-not-allowed text-white font-medium rounded-lg transition-colors"
          >
            Add Entry
          </button>
        </div>
      </div>

      {/* Journal Entries */}
      <div className="space-y-4">
        {journal && journal.length > 0 ? (
          journal
            .sort((a: JournalEntry, b: JournalEntry) => new Date(b.date).getTime() - new Date(a.date).getTime())
            .map((entry: JournalEntry) => (
              <div key={entry.id} className="bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-xl p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium text-[var(--text-primary)]">{entry.author}</span>
                  <span className="text-sm text-[var(--text-tertiary)]">
                    {new Date(entry.date).toLocaleDateString()}
                  </span>
                </div>
                <p className="text-[var(--text-secondary)]">{entry.content}</p>
              </div>
            ))
        ) : (
          <div className="text-center py-8">
            <p className="text-[var(--text-tertiary)]">No journal entries yet. Add the first entry above!</p>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className="max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center">
          <button
            onClick={onBack}
            className="mr-4 p-2 rounded-lg hover:bg-[var(--bg-tertiary)] text-[var(--text-tertiary)] hover:text-[var(--text-primary)] transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <div>
            <h1 className="text-2xl font-bold text-[var(--text-primary)]">{safeProject.name}</h1>
            <p className="text-[var(--text-tertiary)]">Project Details & Management</p>
          </div>
        </div>
        <button
          onClick={onMenuClick}
          className="md:hidden p-2 rounded-lg hover:bg-[var(--bg-tertiary)]"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
      </div>

      {/* Navigation Tabs */}
      <div className="flex space-x-1 mb-6 bg-[var(--bg-secondary)] p-1 rounded-lg border border-[var(--border-primary)]">
        {[
          { id: 'overview', label: 'Overview' },
          { id: 'tasks', label: 'Tasks' },
          { id: 'team', label: 'Team' },
          { id: 'journal', label: 'Journal' }
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`flex-1 px-4 py-2 rounded-md font-medium transition-colors ${
              activeTab === tab.id
                ? 'bg-[var(--accent-primary)] text-white'
                : 'text-[var(--text-tertiary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-tertiary)]'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div>
        {activeTab === 'overview' && renderOverview()}
        {activeTab === 'tasks' && renderTasks()}
        {activeTab === 'team' && renderTeam()}
        {activeTab === 'journal' && renderJournal()}
      </div>
    </div>
  );
};

export default ProjectDetails;
import React, { useState } from 'react';
import type { Project, TeamMember, OnboardingData, Task, Priority, ProjectStatus, FileAttachment } from '../types';
import { PRIORITY_VALUES, PROJECT_STATUS_VALUES } from '../types';
import FileUpload from './FileUpload';
import FileList from './FileList';

// Add the upload and list components to your UI
// See FILE_ATTACHMENTS_GUIDE.md for full example

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
  onAddTask?: () => void;
  onAddTeamMember?: () => void;
}

const ProjectDetails: React.FC<ProjectDetailsProps> = ({
  project,
  onMenuClick,
  onUpdateProject,
  team = [],
  userData,
  onBack,
  onAddTask,
  onAddTeamMember
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

  const handleTaskToggle = (taskId: string) => {
    if (!onUpdateProject) return;

    const updatedTasks = safeProject.tasks.map(task => 
      task.id === taskId 
        ? { ...task, completed: !task.completed }
        : task
    );

    const completedTasks = updatedTasks.filter(t => t.completed).length;
    const progress = Math.round((completedTasks / updatedTasks.length) * 100);

    const updatedProject = {
      ...safeProject,
      tasks: updatedTasks,
      progress
    };

    if (onUpdateProject) {
      onUpdateProject(updatedProject);
    }
  };

  const handleAddJournalEntry = () => {
    if (!newJournalEntry.trim()) return;

    const entry: JournalEntry = {
      id: Date.now().toString(),
      date: new Date().toISOString(),
      content: newJournalEntry,
      author: userData.name,
      type: 'update'
    };

    setJournal([entry, ...journal]);
    setNewJournalEntry('');
  };

  // FIXED: Changed InProgress to OnTrack
  const getStatusColor = (status: ProjectStatus) => {
    switch (status) {
      case PROJECT_STATUS_VALUES.OnTrack: // Was: InProgress
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

  // FIXED: Added Urgent priority
  const getPriorityColor = (priority: Priority) => {
    switch (priority) {
      case PRIORITY_VALUES.Urgent:
        return 'bg-red-200 text-red-900 border-red-300';
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

      {/* File Attachments Section */}
      <div className="bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-xl p-6">
        <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-4">Attachments</h3>
        <FileUpload 
          projectId={safeProject.id}
          userId={userData.id}
          onFileUploaded={(newFile: FileAttachment) => {
            if (onUpdateProject) {
              const updatedProject = {
                ...safeProject,
                attachments: [...(safeProject.attachments || []), newFile]
              };
              onUpdateProject(updatedProject);
            }
          }}
        />
        <FileList 
          files={safeProject.attachments || []}
          onFileDeleted={(fileId: string) => {
            if (onUpdateProject) {
              const updatedProject = {
                ...safeProject,
                attachments: safeProject.attachments?.filter(f => f.id !== fileId) || []
              };
              onUpdateProject(updatedProject);
            }
          }}
        />
      </div>
    </div>
  );

  const renderTasks = () => (
    <div className="space-y-4">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold text-[var(--text-primary)]">Tasks</h3>
        {onAddTask && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onAddTask();
            }}
            className="px-4 py-2 bg-[var(--accent-primary)] text-white rounded-lg hover:opacity-80 transition-opacity"
          >
            + Add Task
          </button>
        )}
      </div>
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
                    <span className={`inline-flex px-2 py-1 rounded text-xs font-medium border ${getPriorityColor(task.priority)}`}>
                      {task.priority}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))
      ) : (
        <div className="text-center py-12 bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-xl">
          <p className="text-[var(--text-tertiary)]">No tasks yet</p>
        </div>
      )}
    </div>
  );

  const renderTeam = () => (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold text-[var(--text-primary)]">Team Members</h3>
        {onAddTeamMember && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onAddTeamMember();
            }}
            className="px-4 py-2 bg-[var(--accent-primary)] text-white rounded-lg hover:opacity-80 transition-opacity"
          >
            + Add Member
          </button>
        )}
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {safeProject.teamMembers && safeProject.teamMembers.length > 0 ? (
          safeProject.teamMembers.map((member) => (
            <div key={member.id} className="bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-xl p-4">
              <div className="flex items-center">
                <div
                  className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-lg mr-4"
                  style={{ backgroundColor: getAvatarColor(member.name) }}
                >
                  {member.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <h4 className="font-medium text-[var(--text-primary)]">{member.name}</h4>
                  <p className="text-sm text-[var(--text-tertiary)]">{member.role || 'Team Member'}</p>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="col-span-full text-center py-12 bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-xl">
            <p className="text-[var(--text-tertiary)]">No team members assigned</p>
          </div>
        )}
      </div>
    </div>
  );

  const renderJournal = () => (
    <div className="space-y-4">
      {/* Add Entry Form */}
      <div className="bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-xl p-4">
        <textarea
          value={newJournalEntry}
          onChange={(e) => setNewJournalEntry(e.target.value)}
          placeholder="Add a project update..."
          className="w-full bg-[var(--bg-tertiary)] border border-[var(--border-primary)] rounded-lg p-3 text-[var(--text-primary)] resize-none focus:outline-none focus:ring-2 focus:ring-[var(--accent-primary)]"
          rows={3}
        />
        <button
          onClick={handleAddJournalEntry}
          disabled={!newJournalEntry.trim()}
          className="mt-2 px-4 py-2 bg-[var(--accent-primary)] text-white rounded-lg hover:opacity-80 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Add Entry
        </button>
      </div>

      {/* Journal Entries */}
      {journal.length > 0 ? (
        journal.map((entry) => (
          <div key={entry.id} className="bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-xl p-4">
            <div className="flex items-start justify-between mb-2">
              <div className="flex items-center">
                <div 
                  className="w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-sm mr-3"
                  style={{ backgroundColor: getAvatarColor(entry.author) }}
                >
                  {entry.author.charAt(0).toUpperCase()}
                </div>
                <div>
                  <p className="font-medium text-[var(--text-primary)]">{entry.author}</p>
                  <p className="text-xs text-[var(--text-tertiary)]">
                    {new Date(entry.date).toLocaleDateString()} at {new Date(entry.date).toLocaleTimeString()}
                  </p>
                </div>
              </div>
            </div>
            <p className="text-[var(--text-secondary)] ml-11">{entry.content}</p>
          </div>
        ))
      ) : (
        <div className="text-center py-12 bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-xl">
          <p className="text-[var(--text-tertiary)]">No journal entries yet</p>
        </div>
      )}
    </div>
  );

  return (
    <div className="flex-1 flex flex-col h-full">
      {/* Header */}
      <header className="flex-shrink-0 p-4 border-b border-[var(--border-primary)] bg-[var(--bg-secondary)]">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <button 
              onClick={onMenuClick} 
              className="md:hidden mr-4 p-1 rounded-full hover:bg-[var(--bg-tertiary)]"
              aria-label="Open menu"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            <button
              onClick={onBack}
              className="mr-4 text-[var(--text-tertiary)] hover:text-[var(--text-primary)] transition-colors flex items-center"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Back
            </button>
            <div>
              <h1 className="text-2xl font-bold text-[var(--text-primary)]">{safeProject.name}</h1>
              <p className="text-sm text-[var(--text-tertiary)]">Project Details</p>
            </div>
          </div>
        </div>
      </header>

      {/* Tabs */}
      <div className="flex-shrink-0 border-b border-[var(--border-primary)] bg-[var(--bg-secondary)]">
        <div className="flex space-x-1 p-2">
          {(['overview', 'tasks', 'team', 'journal'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 rounded-lg font-medium transition-colors capitalize ${
                activeTab === tab
                  ? 'bg-[var(--accent-primary)] text-white'
                  : 'text-[var(--text-tertiary)] hover:bg-[var(--bg-tertiary)]'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6">
        <div className="max-w-6xl mx-auto">
          {activeTab === 'overview' && renderOverview()}
          {activeTab === 'tasks' && renderTasks()}
          {activeTab === 'team' && renderTeam()}
          {activeTab === 'journal' && renderJournal()}
        </div>
      </div>
    </div>
  );
};

export default ProjectDetails;
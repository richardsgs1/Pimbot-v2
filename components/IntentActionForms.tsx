import React from 'react';
import type { Project } from '../types';
import { ProjectStatus } from '../types';
import type { DetectedIntent } from '../lib/IntentDetector';

interface StatusFormProps {
  detectedIntent: DetectedIntent | null;
  projects: Project[];
  onConfirm: (projectId: string, status: ProjectStatus) => void;
  onCancel: () => void;
}

export const StatusUpdateForm: React.FC<StatusFormProps> = ({ 
  detectedIntent, 
  projects, 
  onConfirm, 
  onCancel 
}) => {
  const [selectedProject, setSelectedProject] = React.useState(
    detectedIntent?.data.projectId || projects[0]?.id || ''
  );
  const [selectedStatus, setSelectedStatus] = React.useState<ProjectStatus>(
    detectedIntent?.data.status || ProjectStatus.OnTrack
  );

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-xl p-6 max-w-md w-full">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 bg-[var(--accent-primary)]/20 rounded-full flex items-center justify-center">
            <span className="text-xl">✓</span>
          </div>
          <div>
            <h3 className="text-lg font-bold text-[var(--text-primary)]">Update Project Status</h3>
            <p className="text-sm text-[var(--text-tertiary)]">AI detected status update request</p>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">Project</label>
            <select
              value={selectedProject}
              onChange={(e) => setSelectedProject(e.target.value)}
              className="w-full p-2 border border-[var(--border-primary)] rounded bg-[var(--bg-primary)] text-[var(--text-primary)]"
            >
              {projects.map(p => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">New Status</label>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value as ProjectStatus)}
              className="w-full p-2 border border-[var(--border-primary)] rounded bg-[var(--bg-primary)] text-[var(--text-primary)]"
            >
              <option value={ProjectStatus.OnTrack}>On Track</option>
              <option value={ProjectStatus.AtRisk}>At Risk</option>
              <option value={ProjectStatus.OffTrack}>Off Track</option>
              <option value={ProjectStatus.Completed}>Completed</option>
              <option value={ProjectStatus.OnHold}>On Hold</option>
            </select>
          </div>

          <div className="flex gap-2 pt-4">
            <button
              onClick={() => onConfirm(selectedProject, selectedStatus)}
              className="flex-1 bg-[var(--accent-primary)] hover:bg-[var(--accent-secondary)] text-white py-2 rounded-lg transition-colors"
            >
              Update Status
            </button>
            <button
              onClick={onCancel}
              className="px-4 bg-gray-500 hover:bg-gray-600 text-white py-2 rounded-lg transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

interface ProgressFormProps {
  detectedIntent: DetectedIntent | null;
  projects: Project[];
  onConfirm: (projectId: string, progress: number) => void;
  onCancel: () => void;
}

export const ProgressUpdateForm: React.FC<ProgressFormProps> = ({ 
  detectedIntent, 
  projects, 
  onConfirm, 
  onCancel 
}) => {
  const [selectedProject, setSelectedProject] = React.useState(
    detectedIntent?.data.projectId || projects[0]?.id || ''
  );
  const [progress, setProgress] = React.useState(
    detectedIntent?.data.progress || 0
  );

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-xl p-6 max-w-md w-full">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 bg-[var(--accent-primary)]/20 rounded-full flex items-center justify-center">
            <span className="text-xl">📊</span>
          </div>
          <div>
            <h3 className="text-lg font-bold text-[var(--text-primary)]">Update Progress</h3>
            <p className="text-sm text-[var(--text-tertiary)]">AI detected progress update request</p>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">Project</label>
            <select
              value={selectedProject}
              onChange={(e) => setSelectedProject(e.target.value)}
              className="w-full p-2 border border-[var(--border-primary)] rounded bg-[var(--bg-primary)] text-[var(--text-primary)]"
            >
              {projects.map(p => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">
              Progress: {progress}%
            </label>
            <input
              type="range"
              min="0"
              max="100"
              value={progress}
              onChange={(e) => setProgress(parseInt(e.target.value))}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-[var(--text-tertiary)] mt-1">
              <span>0%</span>
              <span>50%</span>
              <span>100%</span>
            </div>
          </div>

          <div className="flex gap-2 pt-4">
            <button
              onClick={() => onConfirm(selectedProject, progress)}
              className="flex-1 bg-[var(--accent-primary)] hover:bg-[var(--accent-secondary)] text-white py-2 rounded-lg transition-colors"
            >
              Update Progress
            </button>
            <button
              onClick={onCancel}
              className="px-4 bg-gray-500 hover:bg-gray-600 text-white py-2 rounded-lg transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

interface AssignFormProps {
  detectedIntent: DetectedIntent | null;
  projects: Project[];
  onConfirm: (projectId: string, taskName: string, assignee: string) => void;
  onCancel: () => void;
}

export const AssignTaskForm: React.FC<AssignFormProps> = ({ 
  detectedIntent, 
  projects, 
  onConfirm, 
  onCancel 
}) => {
  const [selectedProject, setSelectedProject] = React.useState(
    detectedIntent?.data.projectId || projects[0]?.id || ''
  );
  const [taskName, setTaskName] = React.useState(detectedIntent?.data.taskName || '');
  const [assignee, setAssignee] = React.useState(detectedIntent?.data.assignee || '');

  const selectedProjectData = projects.find(p => p.id === selectedProject);
  const teamMembers = selectedProjectData?.teamMembers || [];

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-xl p-6 max-w-md w-full">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 bg-[var(--accent-primary)]/20 rounded-full flex items-center justify-center">
            <span className="text-xl">👤</span>
          </div>
          <div>
            <h3 className="text-lg font-bold text-[var(--text-primary)]">Assign Task</h3>
            <p className="text-sm text-[var(--text-tertiary)]">AI detected task assignment request</p>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">Project</label>
            <select
              value={selectedProject}
              onChange={(e) => setSelectedProject(e.target.value)}
              className="w-full p-2 border border-[var(--border-primary)] rounded bg-[var(--bg-primary)] text-[var(--text-primary)]"
            >
              {projects.map(p => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">Task Name</label>
            <input
              type="text"
              value={taskName}
              onChange={(e) => setTaskName(e.target.value)}
              className="w-full p-2 border border-[var(--border-primary)] rounded bg-[var(--bg-primary)] text-[var(--text-primary)]"
              placeholder="Enter task name"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">Assign To</label>
            {teamMembers.length > 0 ? (
              <select
                value={assignee}
                onChange={(e) => setAssignee(e.target.value)}
                className="w-full p-2 border border-[var(--border-primary)] rounded bg-[var(--bg-primary)] text-[var(--text-primary)]"
              >
                <option value="">Select team member</option>
                {teamMembers.map(member => (
                  <option key={member.id} value={member.name}>{member.name} - {member.role}</option>
                ))}
              </select>
            ) : (
              <input
                type="text"
                value={assignee}
                onChange={(e) => setAssignee(e.target.value)}
                className="w-full p-2 border border-[var(--border-primary)] rounded bg-[var(--bg-primary)] text-[var(--text-primary)]"
                placeholder="Enter assignee name"
              />
            )}
          </div>

          <div className="flex gap-2 pt-4">
            <button
              onClick={() => onConfirm(selectedProject, taskName, assignee)}
              disabled={!taskName.trim() || !assignee.trim()}
              className="flex-1 bg-[var(--accent-primary)] hover:bg-[var(--accent-secondary)] disabled:bg-gray-500 text-white py-2 rounded-lg transition-colors"
            >
              Assign Task
            </button>
            <button
              onClick={onCancel}
              className="px-4 bg-gray-500 hover:bg-gray-600 text-white py-2 rounded-lg transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

interface SuggestionsProps {
  projects: Project[];
  onSuggestionClick: (suggestion: string) => void;
}

export const AutoSuggestions: React.FC<SuggestionsProps> = ({ projects, onSuggestionClick }) => {
  const [suggestions, setSuggestions] = React.useState<string[]>([]);

  React.useEffect(() => {
    // Import IntentDetector dynamically to avoid circular dependencies
    import('../lib/IntentDetector').then(({ default: IntentDetector }) => {
      const newSuggestions = IntentDetector.generateSuggestions(projects);
      setSuggestions(newSuggestions);
    });
  }, [projects]);

  if (suggestions.length === 0) return null;

  return (
    <div className="mb-4 p-4 bg-[var(--accent-primary)]/10 border border-[var(--accent-primary)]/30 rounded-lg">
      <div className="flex items-center gap-2 mb-3">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-[var(--accent-primary)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
        </svg>
        <h4 className="text-sm font-semibold text-[var(--text-primary)]">Suggested Actions</h4>
      </div>
      <div className="space-y-2">
        {suggestions.map((suggestion, idx) => (
          <button
            key={idx}
            onClick={() => onSuggestionClick(suggestion)}
            className="w-full text-left p-2 text-sm bg-[var(--bg-secondary)] hover:bg-[var(--bg-tertiary)] border border-[var(--border-primary)] rounded transition-colors"
          >
            {suggestion}
          </button>
        ))}
      </div>
    </div>
  );
};

interface IntentActionFormsProps {
  detectedIntent: DetectedIntent | null;
  projects: Project[];
  showStatusForm: boolean;
  showProgressForm: boolean;
  showAssignForm: boolean;
  onStatusUpdate: (projectId: string, status: string) => void;
  onProgressUpdate: (projectId: string, progress: number) => void;
  onTaskAssign: (taskName: string, assignee: string, projectId?: string) => void;
  onClose: () => void;
}

const IntentActionForms: React.FC<IntentActionFormsProps> = ({
  detectedIntent,
  projects,
  showStatusForm,
  showProgressForm,
  showAssignForm,
  onStatusUpdate,
  onProgressUpdate,
  onTaskAssign,
  onClose
}) => {
  return (
    <>
      {showStatusForm && (
        <StatusUpdateForm
          detectedIntent={detectedIntent}
          projects={projects}
          onConfirm={onStatusUpdate}
          onCancel={onClose}
        />
      )}

      {showProgressForm && (
        <ProgressUpdateForm
          detectedIntent={detectedIntent}
          projects={projects}
          onConfirm={onProgressUpdate}
          onCancel={onClose}
        />
      )}

      {showAssignForm && (
        <AssignTaskForm
          detectedIntent={detectedIntent}
          projects={projects}
          onConfirm={(projectId, taskName, assignee) => onTaskAssign(taskName, assignee, projectId)}
          onCancel={onClose}
        />
      )}
    </>
  );
};

export default IntentActionForms;
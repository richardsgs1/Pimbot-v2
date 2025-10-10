import React, { useState } from 'react';
import { projectTemplates, ProjectTemplate, createProjectFromTemplate } from './ProjectTemplates';
import { CustomTemplate } from './useCustomTemplates';
import { Project } from '../types';

interface TemplateSelectorProps {
  onSelect: (project: Partial<Project>) => void;
  onClose: () => void;
  customTemplates?: CustomTemplate[];
  onDeleteTemplate?: (templateId: string) => void;
}

const TemplateSelector: React.FC<TemplateSelectorProps> = ({ onSelect, onClose }) => {
  const [selectedTemplate, setSelectedTemplate] = useState<ProjectTemplate | null>(null);
  const [projectName, setProjectName] = useState('');
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [showDetails, setShowDetails] = useState(false);

  const handleTemplateClick = (template: ProjectTemplate) => {
    setSelectedTemplate(template);
    setProjectName(template.name);
    setShowDetails(true);
  };

  const handleCreate = () => {
    if (!selectedTemplate) return;
    
    const project = createProjectFromTemplate(
      selectedTemplate,
      projectName,
      startDate
    );
    
    onSelect(project);
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-xl max-w-5xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-[var(--border-primary)] flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-[var(--text-primary)]">
              {showDetails ? 'Configure Project' : 'Choose a Template'}
            </h2>
            <p className="text-[var(--text-tertiary)] mt-1">
              {showDetails 
                ? 'Customize your project details and start date' 
                : 'Start with a pre-built template or create from scratch'}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-[var(--bg-tertiary)] rounded-lg transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {!showDetails ? (
            /* Template Grid */
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {projectTemplates.map((template) => (
                <button
                  key={template.id}
                  onClick={() => handleTemplateClick(template)}
                  className="text-left p-6 border-2 border-[var(--border-primary)] rounded-xl hover:border-[var(--accent-primary)] hover:bg-[var(--bg-tertiary)] transition-all group"
                >
                  <div className="text-4xl mb-3">{template.icon}</div>
                  <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-2 group-hover:text-[var(--accent-primary)]">
                    {template.name}
                  </h3>
                  <p className="text-sm text-[var(--text-tertiary)] mb-3">
                    {template.description}
                  </p>
                  <div className="flex items-center gap-4 text-xs text-[var(--text-tertiary)]">
                    <span className="flex items-center gap-1">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      {template.estimatedDuration}
                    </span>
                    {template.tasks.length > 0 && (
                      <span className="flex items-center gap-1">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                        </svg>
                        {template.tasks.length} tasks
                      </span>
                    )}
                  </div>
                </button>
              ))}
            </div>
          ) : (
            /* Template Details & Configuration */
            <div className="space-y-6">
              {/* Back Button */}
              <button
                onClick={() => {
                  setShowDetails(false);
                  setSelectedTemplate(null);
                }}
                className="flex items-center gap-2 text-[var(--text-tertiary)] hover:text-[var(--text-primary)] transition-colors"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                Back to templates
              </button>

              {/* Project Configuration */}
              <div className="bg-[var(--bg-tertiary)] rounded-xl p-6 space-y-4">
                <div className="flex items-start gap-4">
                  <div className="text-5xl">{selectedTemplate?.icon}</div>
                  <div className="flex-1">
                    <h3 className="text-xl font-bold text-[var(--text-primary)] mb-2">
                      {selectedTemplate?.name}
                    </h3>
                    <p className="text-[var(--text-tertiary)]">
                      {selectedTemplate?.description}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4">
                  <div>
                    <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">
                      Project Name
                    </label>
                    <input
                      type="text"
                      value={projectName}
                      onChange={(e) => setProjectName(e.target.value)}
                      className="w-full p-3 border border-[var(--border-primary)] rounded-lg bg-[var(--bg-primary)] text-[var(--text-primary)]"
                      placeholder="Enter project name"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">
                      Start Date
                    </label>
                    <input
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      className="w-full p-3 border border-[var(--border-primary)] rounded-lg bg-[var(--bg-primary)] text-[var(--text-primary)]"
                    />
                  </div>
                </div>
              </div>

              {/* Template Details */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Tasks Preview */}
                {selectedTemplate && selectedTemplate.tasks.length > 0 && (
                  <div className="bg-[var(--bg-tertiary)] rounded-xl p-6">
                    <h4 className="text-lg font-semibold text-[var(--text-primary)] mb-4 flex items-center gap-2">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                      </svg>
                      {selectedTemplate.tasks.length} Tasks Included
                    </h4>
                    <div className="space-y-2 max-h-64 overflow-y-auto">
                      {selectedTemplate.tasks.map((task, index) => (
                        <div key={index} className="flex items-start gap-3 p-2 bg-[var(--bg-secondary)] rounded">
                          <div className="w-2 h-2 rounded-full bg-[var(--accent-primary)] mt-2" />
                          <div className="flex-1">
                            <p className="text-sm text-[var(--text-primary)]">{task.name}</p>
                            <p className="text-xs text-[var(--text-tertiary)]">{task.estimatedDays} days</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Team Roles */}
                {selectedTemplate && selectedTemplate.teamRoles.length > 0 && (
                  <div className="bg-[var(--bg-tertiary)] rounded-xl p-6">
                    <h4 className="text-lg font-semibold text-[var(--text-primary)] mb-4 flex items-center gap-2">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                      </svg>
                      Suggested Team Roles
                    </h4>
                    <div className="space-y-3">
                      {selectedTemplate.teamRoles.map((role, index) => (
                        <div key={index} className="p-3 bg-[var(--bg-secondary)] rounded">
                          <p className="text-sm font-medium text-[var(--text-primary)]">{role.role}</p>
                          <p className="text-xs text-[var(--text-tertiary)] mt-1">{role.description}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Project Stats or Blank Message */}
              {selectedTemplate && selectedTemplate.id === 'blank' ? (
                <div className="bg-[var(--bg-tertiary)] rounded-lg p-6 text-center">
                  <p className="text-[var(--text-secondary)] mb-2">
                    ✨ Create your custom project from scratch
                  </p>
                  <p className="text-sm text-[var(--text-tertiary)]">
                    Click "Create Project" to start, then add tasks, team members, and details in the project editor
                  </p>
                </div>
              ) : selectedTemplate && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="bg-[var(--bg-tertiary)] rounded-lg p-4 text-center">
                    <p className="text-2xl font-bold text-[var(--accent-primary)]">
                      {selectedTemplate.estimatedDuration}
                    </p>
                    <p className="text-xs text-[var(--text-tertiary)] mt-1">Duration</p>
                  </div>
                  <div className="bg-[var(--bg-tertiary)] rounded-lg p-4 text-center">
                    <p className="text-2xl font-bold text-[var(--accent-primary)]">
                      {selectedTemplate.tasks.length}
                    </p>
                    <p className="text-xs text-[var(--text-tertiary)] mt-1">Tasks</p>
                  </div>
                  <div className="bg-[var(--bg-tertiary)] rounded-lg p-4 text-center">
                    <p className="text-2xl font-bold text-[var(--accent-primary)]">
                      {selectedTemplate.teamRoles.length}
                    </p>
                    <p className="text-xs text-[var(--text-tertiary)] mt-1">Team Roles</p>
                  </div>
                  {selectedTemplate.defaultBudget && (
                    <div className="bg-[var(--bg-tertiary)] rounded-lg p-4 text-center">
                      <p className="text-2xl font-bold text-[var(--accent-primary)]">
                        ${(selectedTemplate.defaultBudget / 1000).toFixed(0)}k
                      </p>
                      <p className="text-xs text-[var(--text-tertiary)] mt-1">Budget</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        {showDetails && (
          <div className="p-6 border-t border-[var(--border-primary)] flex items-center justify-between bg-[var(--bg-secondary)]">
            <button
              onClick={onClose}
              className="px-4 py-2 text-[var(--text-tertiary)] hover:text-[var(--text-primary)] transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleCreate}
              disabled={!projectName.trim()}
              className="bg-[var(--accent-primary)] hover:bg-[var(--accent-secondary)] disabled:bg-gray-500 disabled:cursor-not-allowed text-white font-semibold py-2 px-6 rounded-lg transition-colors"
            >
              Create Project
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default TemplateSelector;
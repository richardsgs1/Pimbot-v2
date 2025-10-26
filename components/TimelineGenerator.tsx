import React, { useState } from 'react';
import type { Project, ProjectStatus } from '../types';
import { PROJECT_STATUS_VALUES } from '../types';

interface TimelineGeneratorProps {
  projects: Project[];
  onClose: () => void;
}

const TimelineGenerator: React.FC<TimelineGeneratorProps> = ({ projects, onClose }) => {
  const [selectedProjects, setSelectedProjects] = useState<string[]>(
    projects.filter(p => p.status !== PROJECT_STATUS_VALUES.Completed).map(p => p.id)
  );

  // Calculate timeline data
  const getTimelineData = () => {
    const activeProjects = projects.filter(p => selectedProjects.includes(p.id) && p.dueDate);
    
    // Get date range
    const allDates = activeProjects.flatMap(p => [
      new Date(p.startDate || p.dueDate!),
      new Date(p.dueDate!)
    ]);
    
    if (allDates.length === 0) {
      return { activeProjects: [], minDate: new Date(), maxDate: new Date() };
    }
    
    const minDate = new Date(Math.min(...allDates.map(d => d.getTime())));
    const maxDate = new Date(Math.max(...allDates.map(d => d.getTime())));
    
    return { activeProjects, minDate, maxDate };
  };

  const { activeProjects, minDate, maxDate } = getTimelineData();

  const calculatePosition = (date: Date) => {
    const totalDays = Math.ceil((maxDate.getTime() - minDate.getTime()) / (1000 * 60 * 60 * 24));
    const daysFromStart = Math.ceil((date.getTime() - minDate.getTime()) / (1000 * 60 * 60 * 24));
    return (daysFromStart / totalDays) * 100;
  };

  const calculateWidth = (startDate: Date, endDate: Date) => {
    const totalDays = Math.ceil((maxDate.getTime() - minDate.getTime()) / (1000 * 60 * 60 * 24));
    const projectDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
    return (projectDays / totalDays) * 100;
  };

  const getStatusColor = (status: ProjectStatus) => {
    switch (status) {
      case PROJECT_STATUS_VALUES.OnTrack: // Fixed: was InProgress
        return 'bg-green-500';
      case PROJECT_STATUS_VALUES.AtRisk:
        return 'bg-yellow-500';
      case PROJECT_STATUS_VALUES.OnHold:
        return 'bg-red-500';
      case PROJECT_STATUS_VALUES.Completed:
        return 'bg-blue-500';
      default:
        return 'bg-gray-500';
    }
  };

  const toggleProject = (projectId: string) => {
    setSelectedProjects(prev =>
      prev.includes(projectId)
        ? prev.filter(id => id !== projectId)
        : [...prev, projectId]
    );
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-xl max-w-6xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-[var(--border-primary)] flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-[var(--text-primary)]">Project Timeline</h2>
            <p className="text-sm text-[var(--text-tertiary)] mt-1">
              Gantt-style view of your project schedules
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
          {/* Project Filters */}
          <div className="mb-6">
            <h3 className="text-sm font-semibold text-[var(--text-secondary)] mb-3">Select Projects</h3>
            <div className="flex flex-wrap gap-2">
              {projects.map(project => (
                <button
                  key={project.id}
                  onClick={() => toggleProject(project.id)}
                  className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${
                    selectedProjects.includes(project.id)
                      ? 'bg-[var(--accent-primary)] text-white'
                      : 'bg-[var(--bg-tertiary)] text-[var(--text-secondary)] hover:bg-[var(--bg-tertiary)]'
                  }`}
                >
                  {project.name}
                </button>
              ))}
            </div>
          </div>

          {/* Timeline View */}
          {activeProjects.length > 0 ? (
            <div className="bg-[var(--bg-tertiary)] rounded-lg p-4">
              {/* Timeline Header with Months */}
              <div className="mb-4 pb-2 border-b border-[var(--border-primary)]">
                <div className="flex justify-between text-xs text-[var(--text-tertiary)]">
                  <span>{minDate.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}</span>
                  <span>{maxDate.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}</span>
                </div>
              </div>

              {/* Project Bars */}
              <div className="space-y-4">
                {activeProjects.map(project => {
                  const startDate = new Date(project.startDate || project.dueDate!);
                  const endDate = new Date(project.dueDate!);
                  const leftPos = calculatePosition(startDate);
                  const width = calculateWidth(startDate, endDate);
                  const today = new Date();
                  const isOverdue = endDate < today && project.status !== PROJECT_STATUS_VALUES.Completed;

                  return (
                    <div key={project.id} className="relative">
                      {/* Project Name */}
                      <div className="flex items-center mb-2">
                        <span className="text-sm font-medium text-[var(--text-primary)] w-48 truncate">
                          {project.name}
                        </span>
                        <span className={`ml-2 text-xs px-2 py-0.5 rounded ${
                          project.status === PROJECT_STATUS_VALUES.OnTrack ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' :
                          project.status === PROJECT_STATUS_VALUES.AtRisk ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400' :
                          'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
                        }`}>
                          {project.status}
                        </span>
                      </div>

                      {/* Timeline Bar */}
                      <div className="relative h-8 bg-[var(--bg-secondary)] rounded">
                        {/* Project Duration Bar */}
                        <div
                          className={`absolute h-full ${getStatusColor(project.status)} rounded flex items-center justify-between px-2 text-white text-xs font-medium`}
                          style={{
                            left: `${leftPos}%`,
                            width: `${width}%`,
                            minWidth: '60px'
                          }}
                        >
                          <span>{startDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                          <span>{endDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                        </div>

                        {/* Progress Indicator */}
                        <div
                          className="absolute h-full bg-white/30 rounded-l"
                          style={{
                            left: `${leftPos}%`,
                            width: `${(width * project.progress) / 100}%`
                          }}
                        />

                        {/* Overdue Indicator */}
                        {isOverdue && (
                          <div className="absolute -top-1 -right-1">
                            <span className="flex h-3 w-3">
                              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                              <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Progress Label */}
                      <div className="mt-1 text-xs text-[var(--text-tertiary)]">
                        {project.progress}% complete
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Legend */}
              <div className="mt-6 pt-4 border-t border-[var(--border-primary)] flex flex-wrap gap-4 text-xs">
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-green-500 rounded"></div>
                  <span className="text-[var(--text-tertiary)]">On Track</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-yellow-500 rounded"></div>
                  <span className="text-[var(--text-tertiary)]">At Risk</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-red-500 rounded"></div>
                  <span className="text-[var(--text-tertiary)]">Off Track</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-white/30 rounded"></div>
                  <span className="text-[var(--text-tertiary)]">Progress</span>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-[var(--text-tertiary)]">Select at least one project to view the timeline</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-[var(--border-primary)] bg-[var(--bg-secondary)]">
          <button
            onClick={onClose}
            className="w-full bg-[var(--accent-primary)] hover:bg-[var(--accent-secondary)] text-white py-2 px-4 rounded-lg transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default TimelineGenerator;
import React, { useMemo } from 'react';
import type { Project, Task } from '../types';
import { Priority } from '../types';

interface TimelineViewProps {
  projects: Project[];
  selectedProjectId?: string;
}

interface TimelineTask extends Task {
  projectName: string;
  projectId: string;
  calculatedStartDate: Date;
  calculatedEndDate: Date;
  calculatedDuration: number;
}

const TimelineView: React.FC<TimelineViewProps> = ({ projects, selectedProjectId }) => {
  const timelineTasks = useMemo(() => {
    const tasksWithTimeline: TimelineTask[] = [];
    
    const projectsToShow = selectedProjectId 
      ? projects.filter(p => p.id === selectedProjectId)
      : projects;

    projectsToShow.forEach(project => {
      project.tasks.forEach(task => {
        // Calculate start date and duration if not provided
        const dueDate = new Date(task.dueDate);
        const duration = task.duration || 7; // Default 7 days if not specified
        const startDate = task.startDate 
          ? new Date(task.startDate)
          : new Date(dueDate.getTime() - (duration * 24 * 60 * 60 * 1000));

        tasksWithTimeline.push({
          ...task,
          projectName: project.name,
          projectId: project.id,
          calculatedStartDate: startDate,
          calculatedEndDate: dueDate,
          calculatedDuration: duration
        });
      });
    });

    // Sort by start date
    return tasksWithTimeline.sort((a, b) => 
      a.calculatedStartDate.getTime() - b.calculatedStartDate.getTime()
    );
  }, [projects, selectedProjectId]);

  const timelineRange = useMemo(() => {
    if (timelineTasks.length === 0) return { start: new Date(), end: new Date() };
    
    const startDates = timelineTasks.map(t => t.calculatedStartDate);
    const endDates = timelineTasks.map(t => t.calculatedEndDate);
    
    const earliestStart = new Date(Math.min(...startDates.map(d => d.getTime())));
    const latestEnd = new Date(Math.max(...endDates.map(d => d.getTime())));
    
    return { start: earliestStart, end: latestEnd };
  }, [timelineTasks]);

  const totalDays = Math.ceil((timelineRange.end.getTime() - timelineRange.start.getTime()) / (24 * 60 * 60 * 1000)) || 1;

  const getTaskPosition = (task: TimelineTask) => {
    const startOffset = Math.max(0, (task.calculatedStartDate.getTime() - timelineRange.start.getTime()) / (24 * 60 * 60 * 1000));
    const duration = (task.calculatedEndDate.getTime() - task.calculatedStartDate.getTime()) / (24 * 60 * 60 * 1000);
    
    return {
      left: `${(startOffset / totalDays) * 100}%`,
      width: `${Math.max(2, (duration / totalDays) * 100)}%`
    };
  };

  const getPriorityColor = (priority: Priority) => {
    switch (priority) {
      case Priority.High: return 'bg-red-500';
      case Priority.Medium: return 'bg-yellow-500';
      case Priority.Low: return 'bg-blue-500';
      default: return 'bg-gray-500';
    }
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const generateDateHeaders = () => {
    const headers = [];
    const current = new Date(timelineRange.start);
    
    while (current <= timelineRange.end) {
      headers.push(new Date(current));
      current.setDate(current.getDate() + Math.max(1, Math.floor(totalDays / 10)));
    }
    
    return headers;
  };

  if (timelineTasks.length === 0) {
    return (
      <div className="bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-xl p-8 text-center">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-[var(--text-tertiary)] mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
        </svg>
        <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-2">No Tasks to Display</h3>
        <p className="text-[var(--text-tertiary)]">
          {selectedProjectId ? 'This project has no tasks yet.' : 'Create some projects and tasks to see your timeline.'}
        </p>
      </div>
    );
  }

  return (
    <div className="bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-xl p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-bold text-[var(--text-primary)]">Project Timeline</h3>
        <div className="flex items-center text-sm text-[var(--text-tertiary)]">
          <span className="mr-4">
            {formatDate(timelineRange.start)} - {formatDate(timelineRange.end)}
          </span>
          <span>{timelineTasks.length} tasks</span>
        </div>
      </div>

      {/* Date Headers */}
      <div className="relative mb-4 h-8">
        <div className="flex justify-between text-xs text-[var(--text-tertiary)] border-b border-[var(--border-primary)] pb-2">
          {generateDateHeaders().map((date, index) => (
            <span key={index} className="font-medium">
              {formatDate(date)}
            </span>
          ))}
        </div>
      </div>

      {/* Timeline Tasks */}
      <div className="space-y-3">
        {timelineTasks.map((task, index) => {
          const position = getTaskPosition(task);
          const isCompleted = task.completed;
          const isOverdue = !isCompleted && new Date() > task.calculatedEndDate;
          
          return (
            <div key={task.id} className="relative">
              {/* Task Row */}
              <div className="flex items-center mb-2">
                <div className="w-48 flex-shrink-0 pr-4">
                  <div className="text-sm font-medium text-[var(--text-primary)] truncate" title={task.name}>
                    {task.name}
                  </div>
                  <div className="text-xs text-[var(--text-tertiary)] truncate" title={task.projectName}>
                    {task.projectName}
                  </div>
                </div>
                
                {/* Timeline Bar Container */}
                <div className="flex-1 relative h-8 bg-[var(--bg-tertiary)] rounded-lg overflow-hidden">
                  {/* Timeline Bar */}
                  <div
                    className={`absolute top-1 bottom-1 rounded transition-all duration-200 flex items-center justify-center text-xs font-medium text-white ${
                      isCompleted 
                        ? 'bg-green-500' 
                        : isOverdue 
                        ? 'bg-red-500' 
                        : getPriorityColor(task.priority)
                    } ${isCompleted ? 'opacity-70' : ''}`}
                    style={position}
                    title={`${task.name} - ${formatDate(task.calculatedStartDate)} to ${formatDate(task.calculatedEndDate)}`}
                  >
                    <span className="truncate px-2">
                      {task.calculatedDuration}d
                    </span>
                  </div>
                  
                  {/* Today Indicator */}
                  {(() => {
                    const today = new Date();
                    if (today >= timelineRange.start && today <= timelineRange.end) {
                      const todayOffset = (today.getTime() - timelineRange.start.getTime()) / (24 * 60 * 60 * 1000);
                      const todayPosition = (todayOffset / totalDays) * 100;
                      
                      return (
                        <div
                          className="absolute top-0 bottom-0 w-0.5 bg-[var(--accent-primary)] z-10"
                          style={{ left: `${todayPosition}%` }}
                          title="Today"
                        />
                      );
                    }
                    return null;
                  })()}
                </div>

                {/* Task Status */}
                <div className="w-20 flex-shrink-0 pl-4 text-right">
                  <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                    isCompleted 
                      ? 'bg-green-500/20 text-green-300' 
                      : isOverdue
                      ? 'bg-red-500/20 text-red-300'
                      : 'bg-[var(--accent-primary)]/20 text-[var(--accent-primary)]'
                  }`}>
                    {isCompleted ? 'Done' : isOverdue ? 'Overdue' : 'Active'}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Legend */}
      <div className="mt-6 pt-4 border-t border-[var(--border-primary)]">
        <div className="flex items-center justify-between text-xs text-[var(--text-tertiary)]">
          <div className="flex items-center space-x-4">
            <div className="flex items-center">
              <div className="w-3 h-3 bg-red-500 rounded mr-2"></div>
              High Priority
            </div>
            <div className="flex items-center">
              <div className="w-3 h-3 bg-yellow-500 rounded mr-2"></div>
              Medium Priority
            </div>
            <div className="flex items-center">
              <div className="w-3 h-3 bg-blue-500 rounded mr-2"></div>
              Low Priority
            </div>
            <div className="flex items-center">
              <div className="w-3 h-3 bg-green-500 rounded mr-2"></div>
              Completed
            </div>
          </div>
          <div className="flex items-center">
            <div className="w-0.5 h-4 bg-[var(--accent-primary)] mr-2"></div>
            Today
          </div>
        </div>
      </div>
    </div>
  );
};

export default TimelineView;
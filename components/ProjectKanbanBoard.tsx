import React, { useState } from 'react';
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
  closestCorners,
} from '@dnd-kit/core';
import type { Project, ProjectStatus } from '../types';
import { PROJECT_STATUS_VALUES } from '../types';

interface ProjectKanbanBoardProps {
  projects: Project[];
  onSelectProject: (project: Project) => void;
  onUpdateProjectStatus?: (projectId: string, newStatus: ProjectStatus) => void;
}

const ProjectKanbanBoard: React.FC<ProjectKanbanBoardProps> = ({
  projects,
  onSelectProject,
  onUpdateProjectStatus,
}) => {
  const [activeProject, setActiveProject] = useState<Project | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  // Define the columns based on project statuses
  const columns: { status: ProjectStatus; label: string; color: string }[] = [
    { status: PROJECT_STATUS_VALUES.Planning, label: 'Planning', color: 'bg-blue-500/20 border-blue-500/50' },
    { status: PROJECT_STATUS_VALUES.Active, label: 'Active', color: 'bg-green-500/20 border-green-500/50' },
    { status: PROJECT_STATUS_VALUES.OnHold, label: 'On Hold', color: 'bg-yellow-500/20 border-yellow-500/50' },
    { status: PROJECT_STATUS_VALUES.Completed, label: 'Completed', color: 'bg-purple-500/20 border-purple-500/50' },
  ];

  // Group projects by status
  const projectsByStatus = (status: ProjectStatus) => {
    return projects.filter(project => project.status === status);
  };

  const getStatusColor = (status: ProjectStatus) => {
    switch (status) {
      case PROJECT_STATUS_VALUES.Planning:
        return 'bg-blue-500/20 text-blue-400';
      case PROJECT_STATUS_VALUES.Active:
        return 'bg-green-500/20 text-green-400';
      case PROJECT_STATUS_VALUES.OnHold:
        return 'bg-yellow-500/20 text-yellow-400';
      case PROJECT_STATUS_VALUES.Completed:
        return 'bg-purple-500/20 text-purple-400';
      default:
        return 'bg-gray-500/20 text-gray-400';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'Urgent':
        return 'bg-red-500/20 text-red-400';
      case 'High':
        return 'bg-orange-500/20 text-orange-400';
      case 'Medium':
        return 'bg-yellow-500/20 text-yellow-400';
      case 'Low':
        return 'bg-green-500/20 text-green-400';
      default:
        return 'bg-gray-500/20 text-gray-400';
    }
  };

  const handleDragStart = (event: DragStartEvent) => {
    const projectId = event.active.id as string;
    const project = projects.find(p => p.id === projectId);
    setActiveProject(project || null);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (!over || !onUpdateProjectStatus) {
      setActiveProject(null);
      return;
    }

    const projectId = active.id as string;
    const newStatus = over.id as ProjectStatus;

    // Only update if status actually changed
    const project = projects.find(p => p.id === projectId);
    if (project && project.status !== newStatus) {
      onUpdateProjectStatus(projectId, newStatus);
    }

    setActiveProject(null);
  };

  const handleDragCancel = () => {
    setActiveProject(null);
  };

  const renderProjectCard = (project: Project, isDragging = false) => {
    const completedTasks = project.tasks.filter(t => t.completed).length;
    const totalTasks = project.tasks.length;
    const progress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

    return (
      <div
        className={`p-4 bg-[var(--bg-primary)] border border-[var(--border-primary)] rounded-lg transition-all ${
          isDragging
            ? 'opacity-50 cursor-grabbing'
            : 'hover:border-[var(--accent-primary)] cursor-grab hover:shadow-md'
        }`}
      >
        {/* Project Name */}
        <h4 className="font-semibold text-[var(--text-primary)] mb-2">
          {project.name}
        </h4>

        {/* Project Description */}
        {project.description && (
          <p className="text-sm text-[var(--text-secondary)] mb-3 line-clamp-2">
            {project.description}
          </p>
        )}

        {/* Project Meta */}
        <div className="space-y-2">
          {/* Priority */}
          <div className="flex items-center gap-2">
            <span className={`text-xs px-2 py-1 rounded ${getPriorityColor(project.priority)}`}>
              {project.priority}
            </span>
            {project.dueDate && (
              <span className="text-xs text-[var(--text-tertiary)]">
                Due: {new Date(project.dueDate).toLocaleDateString()}
              </span>
            )}
          </div>

          {/* Tasks Progress */}
          <div className="space-y-1">
            <div className="flex items-center justify-between text-xs text-[var(--text-tertiary)]">
              <span>{completedTasks} / {totalTasks} tasks</span>
              <span>{progress}%</span>
            </div>
            <div className="w-full bg-[var(--bg-tertiary)] rounded-full h-2">
              <div
                className="bg-[var(--accent-primary)] h-2 rounded-full transition-all"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>

          {/* Team Members */}
          {project.teamMembers && project.teamMembers.length > 0 && (
            <div className="flex items-center gap-1">
              <span className="text-xs text-[var(--text-tertiary)]">
                Team: {project.teamMembers.length}
              </span>
            </div>
          )}

          {/* Budget */}
          {project.budget && project.budget > 0 && (
            <div className="text-xs text-[var(--text-tertiary)]">
              Budget: ${project.budget.toLocaleString()}
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onDragCancel={handleDragCancel}
    >
      <div className="h-full overflow-x-auto">
        <div className="flex gap-4 h-full min-w-max p-4">
          {columns.map((column) => {
            const columnProjects = projectsByStatus(column.status);

            return (
              <div
                key={column.status}
                id={column.status}
                className="flex-shrink-0 w-80 flex flex-col"
              >
                {/* Column Header */}
                <div className={`p-3 rounded-t-lg border-2 ${column.color}`}>
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-[var(--text-primary)]">
                      {column.label}
                    </h3>
                    <span className="text-sm text-[var(--text-tertiary)] bg-[var(--bg-tertiary)] px-2 py-1 rounded">
                      {columnProjects.length}
                    </span>
                  </div>
                </div>

                {/* Droppable Column Content */}
                <div
                  className="flex-1 bg-[var(--bg-secondary)] border-x-2 border-b-2 border-[var(--border-primary)] rounded-b-lg p-3 space-y-3 overflow-y-auto min-h-[400px]"
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => {
                    e.preventDefault();
                  }}
                  data-status={column.status}
                >
                  {columnProjects.length === 0 ? (
                    <div className="text-center text-[var(--text-tertiary)] text-sm py-8">
                      No projects
                    </div>
                  ) : (
                    columnProjects.map((project) => (
                      <div
                        key={project.id}
                        draggable={!!onUpdateProjectStatus}
                        onDragStart={(e) => {
                          if (onUpdateProjectStatus) {
                            e.dataTransfer.effectAllowed = 'move';
                            e.dataTransfer.setData('projectId', project.id);
                          }
                        }}
                        onDragEnd={(e) => {
                          e.preventDefault();
                        }}
                        onClick={(e) => {
                          // Only open project details if not dragging
                          if (!activeProject) {
                            onSelectProject(project);
                          }
                        }}
                      >
                        {renderProjectCard(project, activeProject?.id === project.id)}
                      </div>
                    ))
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Drag Overlay */}
      <DragOverlay>
        {activeProject ? (
          <div className="w-80 opacity-90">
            {renderProjectCard(activeProject, true)}
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
};

export default ProjectKanbanBoard;

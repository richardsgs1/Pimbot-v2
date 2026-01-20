import React, { useState, useEffect } from 'react';
import type { Project, Task, Priority, TaskStatus, TeamMember, ProjectStatus } from '../types';
import { PRIORITY_VALUES, PROJECT_STATUS_VALUES, TaskStatus as TaskStatusEnum } from '../types';
import KanbanBoard from './KanbanBoard';
import ProjectKanbanBoard from './ProjectKanbanBoard';
import EmptyState from './EmptyState';
import LoadingSpinner from './LoadingSpinner';
import FormField from './FormField';
import { generateUUID, showSuccessNotification } from '../lib/utils';
import { dependencyResolver } from '../lib/DependencyResolver';
import TaskDetailModal from './TaskDetailModal';

interface ProjectManagementProps {
  projects: Project[];
  onUpdateProjects: (projects: Project[]) => void;
  onSelectProject: (project: Project | null) => void;
  selectedProject: Project | null;
  userId?: string;
  activeTileFilter?: 'totalProjects' | 'overdue' | 'dueThisWeek' | 'atRisk' | null;
  onClearTileFilter?: () => void;
}

const ProjectManagement: React.FC<ProjectManagementProps> = ({
  projects,
  onUpdateProjects,
  onSelectProject,
  selectedProject,
  userId = '',
  activeTileFilter,
  onClearTileFilter,
}) => {
  const [viewMode, setViewMode] = useState<'list' | 'kanban'>('list');
  const [isAddingProject, setIsAddingProject] = useState(false);
  const [isEditingProject, setIsEditingProject] = useState(false);
  const [isAddingTask, setIsAddingTask] = useState(false);
  const [isEditingTask, setIsEditingTask] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showTaskDetailModal, setShowTaskDetailModal] = useState(false);
  const [selectedTaskForDetail, setSelectedTaskForDetail] = useState<Task | null>(null);

  // Loading states
  const [isSavingProject, setIsSavingProject] = useState(false);
  const [isSavingTask, setIsSavingTask] = useState(false);
  const [isDeletingTask, setIsDeletingTask] = useState(false);

  // Validation errors
  const [projectErrors, setProjectErrors] = useState<{ name?: string; description?: string; budget?: string }>({});
  const [taskErrors, setTaskErrors] = useState<{ name?: string; description?: string; estimatedHours?: string }>({});

  // Get filter display name
  const getFilterDisplayName = (): string => {
    switch (activeTileFilter) {
      case 'totalProjects':
        return 'All Projects';
      case 'overdue':
        return 'Overdue Projects';
      case 'dueThisWeek':
        return 'Due This Week';
      case 'atRisk':
        return 'At Risk Projects';
      default:
        return '';
    }
  };

  // New Project Form State - explicitly typed
  const [newProject, setNewProject] = useState<{
    name: string;
    description: string;
    manager: string;
    status: ProjectStatus;
    priority: Priority;
    startDate: string;
    endDate: string;
    dueDate: string;
    budget: number;
    teamMembers: TeamMember[];
  }>({
    name: '',
    description: '',
    manager: '',
    status: PROJECT_STATUS_VALUES.Planning,
    priority: PRIORITY_VALUES.Medium,
    startDate: '',
    endDate: '',
    dueDate: '',
    budget: 0,
    teamMembers: [],
  });

  // New Task Form State - explicitly typed
  const [newTask, setNewTask] = useState<{
    name: string;
    description: string;
    assignees: string[];
    status: TaskStatus;
    priority: Priority;
    dueDate: string;
    estimatedHours: number;
  }>({
    name: '',
    description: '',
    assignees: [],
    status: TaskStatusEnum.ToDo,
    priority: PRIORITY_VALUES.Medium,
    dueDate: '',
    estimatedHours: 0,
  });

  // Validation functions
  const validateProject = (): boolean => {
    const errors: { name?: string; description?: string; budget?: string } = {};

    // Name validation
    const trimmedName = newProject.name.trim();
    if (!trimmedName) {
      errors.name = 'Project name is required';
    } else if (trimmedName.length < 2) {
      errors.name = 'Project name must be at least 2 characters';
    } else if (trimmedName.length > 100) {
      errors.name = 'Project name must be less than 100 characters';
    }

    // Description validation (optional but with max length)
    if (newProject.description.length > 1000) {
      errors.description = 'Description must be less than 1000 characters';
    }

    // Budget validation
    if (newProject.budget < 0) {
      errors.budget = 'Budget cannot be negative';
    } else if (newProject.budget > 999999999) {
      errors.budget = 'Budget exceeds maximum allowed value';
    }

    setProjectErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const validateTask = (): boolean => {
    const errors: { name?: string; description?: string; estimatedHours?: string } = {};

    // Name validation
    const trimmedName = newTask.name.trim();
    if (!trimmedName) {
      errors.name = 'Task name is required';
    } else if (trimmedName.length < 2) {
      errors.name = 'Task name must be at least 2 characters';
    } else if (trimmedName.length > 100) {
      errors.name = 'Task name must be less than 100 characters';
    }

    // Description validation (optional but with max length)
    if (newTask.description.length > 500) {
      errors.description = 'Description must be less than 500 characters';
    }

    // Estimated hours validation
    if (newTask.estimatedHours < 0) {
      errors.estimatedHours = 'Estimated hours cannot be negative';
    } else if (newTask.estimatedHours > 10000) {
      errors.estimatedHours = 'Estimated hours exceeds maximum allowed value';
    }

    setTaskErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleCreateProject = async () => {
    if (!validateProject()) return;

    setIsSavingProject(true);
    try {
      const now = new Date().toISOString();
      const project: Project = {
        id: generateUUID(), // Use proper UUID instead of Date.now()
        name: newProject.name,
        description: newProject.description,
        manager: newProject.manager,
        status: newProject.status,
        priority: newProject.priority,
        startDate: newProject.startDate,
        endDate: newProject.endDate,
        dueDate: newProject.dueDate,
        budget: newProject.budget,
        teamMembers: newProject.teamMembers,
        tasks: [],
        attachments: [],
        progress: 0,
        createdAt: now,
        updatedAt: now,
      };

      onUpdateProjects([...projects, project]);
      onSelectProject(project);
      setIsAddingProject(false);
      setNewProject({
        name: '',
        description: '',
        manager: '',
        status: PROJECT_STATUS_VALUES.Planning,
        priority: PRIORITY_VALUES.Medium,
        startDate: '',
        endDate: '',
        dueDate: '',
        budget: 0,
        teamMembers: [],
      });
      showSuccessNotification(`Project "${project.name}" created successfully!`);
    } finally {
      setIsSavingProject(false);
    }
  };

  const handleUpdateProject = () => {
    if (!selectedProject) return;
    if (!validateProject()) return;

    const updatedProject = {
      ...selectedProject,
      ...newProject,
      updatedAt: new Date().toISOString(),
    };

    const updatedProjects = projects.map(p =>
      p.id === selectedProject.id ? updatedProject : p
    );

    onUpdateProjects(updatedProjects);
    onSelectProject(updatedProject);
    setIsEditingProject(false);
    showSuccessNotification(`Project "${updatedProject.name}" updated successfully!`);
  };

  const handleDeleteProject = () => {
    if (!selectedProject) return;
    if (!confirm('Are you sure you want to delete this project?')) return;

    const updatedProjects = projects.filter(p => p.id !== selectedProject.id);
    onUpdateProjects(updatedProjects);
    onSelectProject(null);
  };

  const handleCreateTask = async () => {
    if (!selectedProject) return;
    if (!validateTask()) return;

    setIsSavingTask(true);
    try {
      const now = new Date().toISOString();
      const task: Task = {
        id: generateUUID(), // Use proper UUID instead of Date.now()
        name: newTask.name,
        description: newTask.description,
        assignees: newTask.assignees,
        status: newTask.status,
        priority: newTask.priority,
        dueDate: newTask.dueDate,
        estimatedHours: newTask.estimatedHours,
        completed: false,
        attachments: [],
        createdAt: now,
        updatedAt: now,
      };

      const updatedProject = {
        ...selectedProject,
        tasks: [...selectedProject.tasks, task],
        updatedAt: now,
      };

      const updatedProjects = projects.map(p =>
        p.id === selectedProject.id ? updatedProject : p
      );

      onUpdateProjects(updatedProjects);
      onSelectProject(updatedProject);
      setIsAddingTask(false);
      setNewTask({
        name: '',
        description: '',
        assignees: [],
        status: TaskStatusEnum.ToDo,
        priority: PRIORITY_VALUES.Medium,
        dueDate: '',
        estimatedHours: 0,
      });
      showSuccessNotification(`Task "${task.name}" created successfully!`);
    } finally {
      setIsSavingTask(false);
    }
  };

  const handleUpdateTask = () => {
    if (!selectedProject || !editingTask) return;
    if (!validateTask()) return;

    const updatedTask = {
      ...editingTask,
      name: newTask.name,
      description: newTask.description,
      assignees: newTask.assignees,
      status: newTask.status,
      priority: newTask.priority,
      dueDate: newTask.dueDate,
      estimatedHours: newTask.estimatedHours,
      updatedAt: new Date().toISOString(),
    };

    // If task was just marked as completed, update blocked status of dependent tasks
    let taskWithDependencyUpdates = updatedTask;
    if (!editingTask.completed && newTask.status === TaskStatusEnum.Done) {
      // Task is being marked complete, update dependencies
      const updatedProjectWithDeps = {
        ...selectedProject,
        tasks: selectedProject.tasks.map(t =>
          t.id === editingTask.id ? updatedTask : t
        ),
      };

      // Update blocked status for all dependent tasks
      const updatedProjectWithBlockedStatus = dependencyResolver.updateBlockedStatus(updatedProjectWithDeps);

      taskWithDependencyUpdates = updatedProjectWithBlockedStatus.tasks.find(t => t.id === editingTask.id) || updatedTask;
    }

    const updatedProject = {
      ...selectedProject,
      tasks: selectedProject.tasks.map(t =>
        t.id === editingTask.id ? taskWithDependencyUpdates : t
      ),
      updatedAt: new Date().toISOString(),
    };

    // Update blocked status for the whole project
    const finalProject = dependencyResolver.updateBlockedStatus(updatedProject);

    const updatedProjects = projects.map(p =>
      p.id === selectedProject.id ? finalProject : p
    );

    onUpdateProjects(updatedProjects);
    onSelectProject(finalProject);
    setIsEditingTask(false);
    setEditingTask(null);
    showSuccessNotification(`Task "${taskWithDependencyUpdates.name}" updated successfully!`);
  };

  const handleDeleteTask = async (taskId: string) => {
    if (!selectedProject) return;
    if (!confirm('Are you sure you want to delete this task?')) return;

    setIsDeletingTask(true);
    try {
      const updatedProject = {
        ...selectedProject,
        tasks: selectedProject.tasks.filter(t => t.id !== taskId),
        updatedAt: new Date().toISOString(),
      };

      const updatedProjects = projects.map(p =>
        p.id === selectedProject.id ? updatedProject : p
      );

      onUpdateProjects(updatedProjects);
      onSelectProject(updatedProject);
      showSuccessNotification('Task deleted successfully!');
    } finally {
      setIsDeletingTask(false);
    }
  };

  const handleEditTask = (task: Task) => {
    setTaskErrors({});
    setEditingTask(task);
    setNewTask({
      name: task.name,
      description: task.description,
      assignees: task.assignees,
      status: task.status,
      priority: task.priority,
      dueDate: task.dueDate || '',
      estimatedHours: task.estimatedHours || 0,
    });
    setIsEditingTask(true);
  };

  const handleViewTaskDetails = (task: Task) => {
    setSelectedTaskForDetail(task);
    setShowTaskDetailModal(true);
  };

  const handleEditProject = () => {
    if (!selectedProject) return;

    setProjectErrors({});
    setNewProject({
      name: selectedProject.name,
      description: selectedProject.description,
      manager: selectedProject.manager || '',
      status: selectedProject.status,
      priority: selectedProject.priority,
      startDate: selectedProject.startDate || '',
      endDate: selectedProject.endDate || '',
      dueDate: selectedProject.dueDate || '',
      budget: selectedProject.budget || 0,
      teamMembers: selectedProject.teamMembers || [],
    });
    setIsEditingProject(true);
  };

  // Close modal when selectedProject becomes null
  React.useEffect(() => {
    if (!selectedProject) {
      setIsEditingProject(false);
      setIsAddingTask(false);
      setIsEditingTask(false);
      setEditingTask(null);
    }
  }, [selectedProject]);

  const getFilteredProjects = () => {
    let filtered = projects;

    if (searchQuery) {
      filtered = filtered.filter(p =>
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.description.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    if (filterStatus !== 'all') {
      filtered = filtered.filter(p => p.status === filterStatus);
    }

    return filtered;
  };

  const filteredProjects = getFilteredProjects();

  return (
    <div className="flex-1 flex flex-col h-full">
      {/* Header */}
      <div className="flex-shrink-0 p-4 border-b border-[var(--border-primary)] bg-[var(--bg-secondary)]">
        {/* Active Filter Banner */}
        {activeTileFilter && (
          <div className="mb-4 p-3 bg-[var(--accent-primary)]/10 border border-[var(--accent-primary)]/30 rounded-lg flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-[var(--accent-primary)]">
                Showing: {getFilterDisplayName()}
              </span>
            </div>
            {onClearTileFilter && (
              <button
                onClick={onClearTileFilter}
                className="text-xs px-2 py-1 bg-[var(--accent-primary)] text-white rounded hover:opacity-80 transition-opacity"
              >
                Clear Filter
              </button>
            )}
          </div>
        )}
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-bold text-[var(--text-primary)]">Project Management</h1>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setViewMode('list')}
              className={`px-3 py-1.5 rounded-lg transition-colors ${
                viewMode === 'list'
                  ? 'bg-[var(--accent-primary)] text-white'
                  : 'bg-[var(--bg-tertiary)] text-[var(--text-secondary)]'
              }`}
            >
              List
            </button>
            <button
              onClick={() => setViewMode('kanban')}
              className={`px-3 py-1.5 rounded-lg transition-colors ${
                viewMode === 'kanban'
                  ? 'bg-[var(--accent-primary)] text-white'
                  : 'bg-[var(--bg-tertiary)] text-[var(--text-secondary)]'
              }`}
            >
              Kanban
            </button>
            <button
              onClick={() => {
                setProjectErrors({});
                setNewProject({
                  name: '',
                  description: '',
                  manager: '',
                  status: PROJECT_STATUS_VALUES.Planning,
                  priority: PRIORITY_VALUES.Medium,
                  startDate: '',
                  endDate: '',
                  dueDate: '',
                  budget: 0,
                  teamMembers: [],
                });
                setIsAddingProject(true);
              }}
              className="ml-2 px-4 py-1.5 bg-[var(--accent-primary)] text-white rounded-lg hover:opacity-80 transition-opacity"
            >
              + New Project
            </button>
          </div>
        </div>

        {/* Search and Filter */}
        <div className="flex gap-4">
          <input
            type="text"
            placeholder="Search projects..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="flex-1 px-3 py-2 bg-[var(--bg-tertiary)] border border-[var(--border-primary)] rounded-lg text-[var(--text-primary)]"
          />
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-3 py-2 bg-[var(--bg-tertiary)] border border-[var(--border-primary)] rounded-lg text-[var(--text-primary)]"
          >
            <option value="all">All Status</option>
            <option value="Planning">Planning</option>
            <option value="On Track">On Track</option>
            <option value="At Risk">At Risk</option>
            <option value="On Hold">On Hold</option>
            <option value="Completed">Completed</option>
          </select>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4">
        {filteredProjects.length === 0 ? (
          <EmptyState
            icon="📁"
            title="No Projects Found"
            description={
              activeTileFilter
                ? `No projects match the "${getFilterDisplayName()}" filter. Try clearing the filter or creating a new project.`
                : "Get started by creating your first project. Projects help you organize tasks and track progress."
            }
            actionLabel="Create Project"
            onAction={() => setIsAddingProject(true)}
          />
        ) : viewMode === 'list' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredProjects.map((project) => (
              <div
                key={project.id}
                onClick={() => onSelectProject(project)}
                className="p-4 bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-lg hover:border-[var(--accent-primary)] cursor-pointer transition-colors"
              >
                <h3 className="font-semibold text-[var(--text-primary)] mb-2">{project.name}</h3>
                <p className="text-sm text-[var(--text-secondary)] mb-3 line-clamp-2">{project.description}</p>
                <div className="flex items-center justify-between text-xs">
                  <span className={`px-2 py-1 rounded ${
                    project.status === 'On Track' ? 'bg-green-500/20 text-green-400' :
                    project.status === 'At Risk' ? 'bg-yellow-500/20 text-yellow-400' :
                    project.status === 'On Hold' ? 'bg-red-500/20 text-red-400' :
                    'bg-blue-500/20 text-blue-400'
                  }`}>
                    {project.status}
                  </span>
                  <span className="text-[var(--text-tertiary)]">{project.tasks.length} tasks</span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <ProjectKanbanBoard
            projects={filteredProjects}
            onSelectProject={onSelectProject}
            onUpdateProjectStatus={(projectId: string, newStatus: ProjectStatus) => {
              const updatedProjects = projects.map(p =>
                p.id === projectId
                  ? { ...p, status: newStatus, updatedAt: new Date().toISOString() }
                  : p
              );
              onUpdateProjects(updatedProjects);
            }}
          />
        )}
      </div>

      {/* Project Detail Modal */}
      {selectedProject && !isEditingProject && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-[var(--bg-primary)] border border-[var(--border-primary)] rounded-lg p-6 max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-[var(--text-primary)]">{selectedProject.name}</h2>
              <div className="flex gap-2">
                <button
                  onClick={handleEditProject}
                  className="px-3 py-1.5 bg-[var(--bg-tertiary)] text-[var(--text-primary)] rounded-lg hover:opacity-80 transition-opacity"
                >
                  Edit
                </button>
                <button
                  onClick={() => {
                    setIsEditingProject(false);
                    onSelectProject(null);
                  }}
                  className="px-3 py-1.5 bg-[var(--bg-tertiary)] text-[var(--text-primary)] rounded-lg hover:opacity-80 transition-opacity"
                >
                  Close
                </button>
              </div>
            </div>

            <div className="space-y-6">
              {/* Project Info */}
              <div>
                <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-2">Description</h3>
                <p className="text-[var(--text-secondary)]">{selectedProject.description}</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="text-sm font-medium text-[var(--text-tertiary)]">Status</h4>
                  <p className="text-[var(--text-primary)]">{selectedProject.status}</p>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-[var(--text-tertiary)]">Priority</h4>
                  <p className="text-[var(--text-primary)]">{selectedProject.priority}</p>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-[var(--text-tertiary)]">Due Date</h4>
                  <p className="text-[var(--text-primary)]">{selectedProject.dueDate || 'Not set'}</p>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-[var(--text-tertiary)]">Budget</h4>
                  <p className="text-[var(--text-primary)]">${selectedProject.budget || 0}</p>
                </div>
              </div>

              {/* Tasks Section */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-[var(--text-primary)]">Tasks ({selectedProject.tasks.length})</h3>
                  <button
                    onClick={() => {
                      setTaskErrors({});
                      setNewTask({
                        name: '',
                        description: '',
                        assignees: [],
                        status: TaskStatusEnum.ToDo,
                        priority: PRIORITY_VALUES.Medium,
                        dueDate: '',
                        estimatedHours: 0,
                      });
                      setIsAddingTask(true);
                    }}
                    className="px-3 py-1.5 bg-[var(--accent-primary)] text-white rounded-lg hover:opacity-80 transition-opacity"
                  >
                    + Add Task
                  </button>
                </div>

                {viewMode === 'list' ? (
                  <div className="space-y-2">
                    {selectedProject.tasks.map((task) => (
                      <div
                        key={task.id}
                        className={`p-3 bg-[var(--bg-secondary)] border rounded-lg transition-colors ${
                          task.isBlocked
                            ? 'border-red-500/50 opacity-75'
                            : 'border-[var(--border-primary)]'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <h4 className="font-medium text-[var(--text-primary)]">{task.name}</h4>
                              {/* Advanced Features Indicators */}
                              <div className="flex gap-1">
                                {task.isBlocked && (
                                  <span className="px-1.5 py-0.5 text-xs bg-red-500/20 text-red-400 rounded" title="Task is blocked by dependencies">
                                    ⛔ Blocked
                                  </span>
                                )}
                                {task.dependencies && task.dependencies.length > 0 && (
                                  <span className="px-1.5 py-0.5 text-xs bg-orange-500/20 text-orange-400 rounded" title={`Depends on ${task.dependencies.length} task(s)`}>
                                    ⛓️ {task.dependencies.length}
                                  </span>
                                )}
                                {task.subtasks && task.subtasks.length > 0 && (
                                  <span className="px-1.5 py-0.5 text-xs bg-blue-500/20 text-blue-400 rounded" title={`${task.subtasks.length} subtask(s)`}>
                                    ✓ {task.subtasks.length}
                                  </span>
                                )}
                                {task.isRecurring && (
                                  <span className="px-1.5 py-0.5 text-xs bg-purple-500/20 text-purple-400 rounded" title="Recurring task">
                                    🔁 Recurring
                                  </span>
                                )}
                              </div>
                            </div>
                            <p className="text-sm text-[var(--text-secondary)] mt-1">{task.description}</p>
                            <div className="flex items-center gap-4 mt-2 text-xs flex-wrap">
                              <span className={`px-2 py-0.5 rounded ${
                                task.status === 'Done' ? 'bg-green-500/20 text-green-400' :
                                task.status === 'In Progress' ? 'bg-blue-500/20 text-blue-400' :
                                'bg-gray-500/20 text-gray-400'
                              }`}>
                                {task.status}
                              </span>
                              <span className={`px-2 py-0.5 rounded ${
                                task.priority === 'Urgent' ? 'bg-red-500/20 text-red-400' :
                                task.priority === 'High' ? 'bg-orange-500/20 text-orange-400' :
                                task.priority === 'Medium' ? 'bg-yellow-500/20 text-yellow-400' :
                                'bg-green-500/20 text-green-400'
                              }`}>
                                {task.priority}
                              </span>
                              {task.dueDate && (
                                <span className="text-[var(--text-tertiary)]">Due: {task.dueDate}</span>
                              )}
                            </div>
                          </div>
                          <div className="flex gap-2 flex-shrink-0 ml-2">
                            <button
                              onClick={() => handleViewTaskDetails(task)}
                              className="px-2 py-1 text-sm bg-blue-500/20 text-blue-400 rounded hover:bg-blue-500/30"
                            >
                              View Details
                            </button>
                            <button
                              onClick={() => handleEditTask(task)}
                              className="px-2 py-1 text-sm bg-[var(--bg-tertiary)] text-[var(--text-primary)] rounded hover:opacity-80"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => handleDeleteTask(task.id)}
                              className="px-2 py-1 text-sm bg-red-500/20 text-red-400 rounded hover:bg-red-500/30"
                            >
                              Delete
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                    {selectedProject.tasks.length === 0 && (
                      <EmptyState
                        icon="✓"
                        title="No Tasks Yet"
                        description="Create your first task to start tracking work in this project."
                        actionLabel="Add Task"
                        onAction={() => setIsAddingTask(true)}
                      />
                    )}
                  </div>
                ) : (
                  <KanbanBoard
                    project={selectedProject}
                    onUpdateTask={(taskId: string, updates: Partial<Task>) => {
                      if (!selectedProject) return;
                      
                      const updatedProject = {
                        ...selectedProject,
                        tasks: selectedProject.tasks.map(t =>
                          t.id === taskId ? { ...t, ...updates, updatedAt: new Date().toISOString() } : t
                        ),
                        updatedAt: new Date().toISOString(),
                      };
                      
                      const updatedProjects = projects.map(p =>
                        p.id === updatedProject.id ? updatedProject : p
                      );
                      onUpdateProjects(updatedProjects);
                      onSelectProject(updatedProject);
                    }}
                    onEditTask={handleEditTask}
                  />
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add/Edit Project Modal */}
      {(isAddingProject || isEditingProject) && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50"
          role="dialog"
          aria-modal="true"
          aria-labelledby="project-modal-title"
          onKeyDown={(e) => {
            if (e.key === 'Escape') {
              setIsAddingProject(false);
              setIsEditingProject(false);
            }
          }}
        >
          <div className="bg-[var(--bg-primary)] border border-[var(--border-primary)] rounded-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <h3 id="project-modal-title" className="text-xl font-bold text-[var(--text-primary)] mb-4">
              {isAddingProject ? 'New Project' : 'Edit Project'}
            </h3>
            <div className="space-y-4">
              <FormField label="Project Name" required error={projectErrors.name}>
                <input
                  type="text"
                  value={newProject.name}
                  onChange={(e) => {
                    setNewProject({ ...newProject, name: e.target.value });
                    if (projectErrors.name) setProjectErrors({ ...projectErrors, name: undefined });
                  }}
                  maxLength={100}
                  className={`w-full px-3 py-2 bg-[var(--bg-secondary)] border rounded-lg text-[var(--text-primary)] ${
                    projectErrors.name ? 'border-red-500' : 'border-[var(--border-primary)]'
                  }`}
                  placeholder="Enter project name"
                />
              </FormField>
              <FormField label="Description" error={projectErrors.description} hint={`${newProject.description.length}/1000 characters`}>
                <textarea
                  value={newProject.description}
                  onChange={(e) => {
                    setNewProject({ ...newProject, description: e.target.value });
                    if (projectErrors.description) setProjectErrors({ ...projectErrors, description: undefined });
                  }}
                  maxLength={1000}
                  className={`w-full px-3 py-2 bg-[var(--bg-secondary)] border rounded-lg text-[var(--text-primary)] ${
                    projectErrors.description ? 'border-red-500' : 'border-[var(--border-primary)]'
                  }`}
                  rows={3}
                  placeholder="Describe your project"
                />
              </FormField>
              <FormField label="Project Manager">
                <input
                  type="text"
                  value={newProject.manager}
                  onChange={(e) => setNewProject({ ...newProject, manager: e.target.value })}
                  className="w-full px-3 py-2 bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-lg text-[var(--text-primary)]"
                  placeholder="Who is managing this project?"
                />
              </FormField>
              <div className="grid grid-cols-2 gap-4">
                <FormField label="Status">
                  <select
                    value={newProject.status}
                    onChange={(e) => setNewProject({ ...newProject, status: e.target.value as ProjectStatus })}
                    className="w-full px-3 py-2 bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-lg text-[var(--text-primary)]"
                  >
                    <option value="Planning">Planning</option>
                    <option value="On Track">On Track</option>
                    <option value="At Risk">At Risk</option>
                    <option value="On Hold">On Hold</option>
                    <option value="Completed">Completed</option>
                  </select>
                </FormField>
                <FormField label="Priority">
                  <select
                    value={newProject.priority}
                    onChange={(e) => setNewProject({ ...newProject, priority: e.target.value as Priority })}
                    className="w-full px-3 py-2 bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-lg text-[var(--text-primary)]"
                  >
                    <option value="Urgent">Urgent</option>
                    <option value="High">High</option>
                    <option value="Medium">Medium</option>
                    <option value="Low">Low</option>
                  </select>
                </FormField>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <FormField label="Start Date">
                  <input
                    type="date"
                    value={newProject.startDate}
                    onChange={(e) => setNewProject({ ...newProject, startDate: e.target.value })}
                    className="w-full px-3 py-2 bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-lg text-[var(--text-primary)]"
                  />
                </FormField>
                <FormField label="Due Date">
                  <input
                    type="date"
                    value={newProject.dueDate}
                    onChange={(e) => setNewProject({ ...newProject, dueDate: e.target.value })}
                    className="w-full px-3 py-2 bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-lg text-[var(--text-primary)]"
                  />
                </FormField>
              </div>
              <FormField label="Budget" error={projectErrors.budget} hint="Enter the project budget in dollars">
                <input
                  type="number"
                  value={newProject.budget}
                  onChange={(e) => {
                    setNewProject({ ...newProject, budget: Number(e.target.value) });
                    if (projectErrors.budget) setProjectErrors({ ...projectErrors, budget: undefined });
                  }}
                  min={0}
                  max={999999999}
                  className={`w-full px-3 py-2 bg-[var(--bg-secondary)] border rounded-lg text-[var(--text-primary)] ${
                    projectErrors.budget ? 'border-red-500' : 'border-[var(--border-primary)]'
                  }`}
                  placeholder="0"
                />
              </FormField>

              {/* Team Members Section */}
              <FormField label="Team Members">
                <div className="space-y-3">
                  <button
                    type="button"
                    onClick={() => {
                      const name = prompt('Enter team member name:');
                      const email = prompt('Enter team member email:');
                      if (name && email) {
                        const newMember: TeamMember = {
                          id: generateUUID(),
                          name,
                          email,
                          role: 'Team Member',
                          avatar: undefined
                        };
                        setNewProject({
                          ...newProject,
                          teamMembers: [...newProject.teamMembers, newMember]
                        });
                      }
                    }}
                    className="text-xs px-2 py-1 bg-[var(--accent-primary)] text-white rounded hover:opacity-80 transition-opacity"
                  >
                    + Add Member
                  </button>

                  {newProject.teamMembers.length > 0 ? (
                    <div className="space-y-2">
                      {newProject.teamMembers.map((member) => (
                        <div
                          key={member.id}
                          className="flex items-center justify-between bg-[var(--bg-tertiary)] p-2 rounded-lg"
                        >
                          <div>
                            <div className="text-sm font-medium text-[var(--text-primary)]">
                              {member.name}
                            </div>
                            <div className="text-xs text-[var(--text-tertiary)]">
                              {member.email}
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              setNewProject({
                                ...newProject,
                                teamMembers: newProject.teamMembers.filter((m) => m.id !== member.id)
                              });
                            }}
                            className="text-red-500 hover:text-red-400 transition-colors text-sm"
                          >
                            Remove
                          </button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-[var(--text-tertiary)] italic">
                      No team members added yet
                    </p>
                  )}
                </div>
              </FormField>
            </div>
            <div className="flex gap-3 mt-6">
              <button
                onClick={isAddingProject ? handleCreateProject : handleUpdateProject}
                disabled={isSavingProject}
                className="flex-1 px-4 py-2 bg-[var(--accent-primary)] text-white rounded-lg hover:opacity-80 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isSavingProject && <LoadingSpinner size="sm" />}
                {isSavingProject
                  ? 'Saving...'
                  : (isAddingProject ? 'Create Project' : 'Update Project')
                }
              </button>
              <button
                onClick={() => {
                  setIsAddingProject(false);
                  setIsEditingProject(false);
                }}
                className="flex-1 px-4 py-2 bg-[var(--bg-tertiary)] text-[var(--text-primary)] rounded-lg hover:opacity-80 transition-opacity"
              >
                Cancel
              </button>
              {isEditingProject && (
                <button
                  onClick={handleDeleteProject}
                  className="px-4 py-2 bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500/30 transition-colors"
                >
                  Delete
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Add/Edit Task Modal */}
      {(isAddingTask || isEditingTask) && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50"
          role="dialog"
          aria-modal="true"
          aria-labelledby="task-modal-title"
          onKeyDown={(e) => {
            if (e.key === 'Escape') {
              setIsAddingTask(false);
              setIsEditingTask(false);
            }
          }}
        >
          <div className="bg-[var(--bg-primary)] border border-[var(--border-primary)] rounded-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <h3 id="task-modal-title" className="text-xl font-bold text-[var(--text-primary)] mb-4">
              {isAddingTask ? 'New Task' : 'Edit Task'}
            </h3>
            <div className="space-y-4">
              <FormField label="Task Name" required error={taskErrors.name}>
                <input
                  type="text"
                  value={newTask.name}
                  onChange={(e) => {
                    setNewTask({ ...newTask, name: e.target.value });
                    if (taskErrors.name) setTaskErrors({ ...taskErrors, name: undefined });
                  }}
                  maxLength={100}
                  className={`w-full px-3 py-2 bg-[var(--bg-secondary)] border rounded-lg text-[var(--text-primary)] ${
                    taskErrors.name ? 'border-red-500' : 'border-[var(--border-primary)]'
                  }`}
                  placeholder="Enter task name"
                />
              </FormField>
              <FormField label="Description" error={taskErrors.description} hint={`${newTask.description.length}/500 characters`}>
                <textarea
                  value={newTask.description}
                  onChange={(e) => {
                    setNewTask({ ...newTask, description: e.target.value });
                    if (taskErrors.description) setTaskErrors({ ...taskErrors, description: undefined });
                  }}
                  maxLength={500}
                  className={`w-full px-3 py-2 bg-[var(--bg-secondary)] border rounded-lg text-[var(--text-primary)] ${
                    taskErrors.description ? 'border-red-500' : 'border-[var(--border-primary)]'
                  }`}
                  rows={3}
                  placeholder="Describe the task"
                />
              </FormField>

              {/* Assign To Team Members */}
              {selectedProject && selectedProject.teamMembers && selectedProject.teamMembers.length > 0 && (
                <FormField label="Assign To">
                  <div className="space-y-2">
                    {selectedProject.teamMembers.map((member) => (
                      <label key={member.id} className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={newTask.assignees.includes(member.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setNewTask({
                                ...newTask,
                                assignees: [...newTask.assignees, member.id]
                              });
                            } else {
                              setNewTask({
                                ...newTask,
                                assignees: newTask.assignees.filter((id) => id !== member.id)
                              });
                            }
                          }}
                          className="w-4 h-4 rounded border-[var(--border-primary)] bg-[var(--bg-secondary)]"
                        />
                        <span className="text-sm text-[var(--text-primary)]">
                          {member.name}
                        </span>
                      </label>
                    ))}
                  </div>
                </FormField>
              )}

              <div className="grid grid-cols-2 gap-4">
                <FormField label="Status">
                  <select
                    value={newTask.status}
                    onChange={(e) => setNewTask({ ...newTask, status: e.target.value as TaskStatus })}
                    className="w-full px-3 py-2 bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-lg text-[var(--text-primary)]"
                  >
                    <option value="To Do">To Do</option>
                    <option value="In Progress">In Progress</option>
                    <option value="Done">Done</option>
                    <option value="On Hold">On Hold</option>
                  </select>
                </FormField>
                <FormField label="Priority">
                  <select
                    value={newTask.priority}
                    onChange={(e) => setNewTask({ ...newTask, priority: e.target.value as Priority })}
                    className="w-full px-3 py-2 bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-lg text-[var(--text-primary)]"
                  >
                    <option value="Urgent">Urgent</option>
                    <option value="High">High</option>
                    <option value="Medium">Medium</option>
                    <option value="Low">Low</option>
                  </select>
                </FormField>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <FormField label="Due Date">
                  <input
                    type="date"
                    value={newTask.dueDate}
                    onChange={(e) => setNewTask({ ...newTask, dueDate: e.target.value })}
                    className="w-full px-3 py-2 bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-lg text-[var(--text-primary)]"
                  />
                </FormField>
                <FormField label="Estimated Hours" error={taskErrors.estimatedHours} hint="How long will this task take?">
                  <input
                    type="number"
                    value={newTask.estimatedHours}
                    onChange={(e) => {
                      setNewTask({ ...newTask, estimatedHours: Number(e.target.value) });
                      if (taskErrors.estimatedHours) setTaskErrors({ ...taskErrors, estimatedHours: undefined });
                    }}
                    min={0}
                    max={10000}
                    className={`w-full px-3 py-2 bg-[var(--bg-secondary)] border rounded-lg text-[var(--text-primary)] ${
                      taskErrors.estimatedHours ? 'border-red-500' : 'border-[var(--border-primary)]'
                    }`}
                    placeholder="0"
                  />
                </FormField>
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button
                onClick={isAddingTask ? handleCreateTask : handleUpdateTask}
                disabled={isSavingTask}
                className="flex-1 px-4 py-2 bg-[var(--accent-primary)] text-white rounded-lg hover:opacity-80 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isSavingTask && <LoadingSpinner size="sm" />}
                {isSavingTask
                  ? 'Saving...'
                  : (isAddingTask ? 'Create Task' : 'Update Task')
                }
              </button>
              <button
                onClick={() => {
                  setIsAddingTask(false);
                  setIsEditingTask(false);
                  setEditingTask(null);
                }}
                className="flex-1 px-4 py-2 bg-[var(--bg-tertiary)] text-[var(--text-primary)] rounded-lg hover:opacity-80 transition-opacity"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Task Detail Modal */}
      {showTaskDetailModal && selectedTaskForDetail && selectedProject && (
        <TaskDetailModal
          task={selectedTaskForDetail}
          project={selectedProject}
          onClose={() => {
            setShowTaskDetailModal(false);
            setSelectedTaskForDetail(null);
          }}
          onUpdateTask={(taskId: string, updates: Partial<Task>) => {
            if (!selectedProject) return;

            const updatedProject = {
              ...selectedProject,
              tasks: selectedProject.tasks.map(t =>
                t.id === taskId ? { ...t, ...updates, updatedAt: new Date().toISOString() } : t
              ),
              updatedAt: new Date().toISOString(),
            };

            const updatedProjects = projects.map(p =>
              p.id === selectedProject.id ? updatedProject : p
            );

            onUpdateProjects(updatedProjects);
            onSelectProject(updatedProject);
            setSelectedTaskForDetail(updatedProject.tasks.find(t => t.id === taskId) || null);
          }}
          onDeleteTask={(taskId: string) => {
            if (!selectedProject) return;

            const updatedProject = {
              ...selectedProject,
              tasks: selectedProject.tasks.filter(t => t.id !== taskId),
              updatedAt: new Date().toISOString(),
            };

            const updatedProjects = projects.map(p =>
              p.id === selectedProject.id ? updatedProject : p
            );

            onUpdateProjects(updatedProjects);
            onSelectProject(updatedProject);
            setShowTaskDetailModal(false);
            setSelectedTaskForDetail(null);
          }}
        />
      )}
    </div>
  );
};

export default ProjectManagement;
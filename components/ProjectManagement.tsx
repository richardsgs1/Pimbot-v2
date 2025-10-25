import React, { useState, useEffect } from 'react';
import type { Project, Task, Priority, TaskStatus, TeamMember, ProjectStatus } from '../types';
import KanbanBoard from './KanbanBoard';

interface ProjectManagementProps {
  projects: Project[];
  onUpdateProjects: (projects: Project[]) => void;
  onSelectProject: (project: Project | null) => void;
  selectedProject: Project | null;
}

const ProjectManagement: React.FC<ProjectManagementProps> = ({
  projects,
  onUpdateProjects,
  onSelectProject,
  selectedProject,
}) => {
  const [viewMode, setViewMode] = useState<'list' | 'kanban'>('list');
  const [isAddingProject, setIsAddingProject] = useState(false);
  const [isEditingProject, setIsEditingProject] = useState(false);
  const [isAddingTask, setIsAddingTask] = useState(false);
  const [isEditingTask, setIsEditingTask] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // New Project Form State
  const [newProject, setNewProject] = useState({
    name: '',
    description: '',
    client: '',
    status: 'Planning' as ProjectStatus,
    startDate: '',
    endDate: '',
    budget: 0,
    teamMembers: [] as TeamMember[],
  });

  // New Task Form State
  const [newTask, setNewTask] = useState({
    title: '',
    description: '',
    assignedTo: '',
    status: 'To Do' as TaskStatus,
    priority: 'Medium' as Priority,
    dueDate: '',
    estimatedHours: 0,
  });

  const handleCreateProject = () => {
    const project: Project = {
      id: Date.now().toString(),
      name: newProject.name,
      description: newProject.description,
      client: newProject.client,
      status: newProject.status,
      startDate: newProject.startDate,
      endDate: newProject.endDate,
      budget: newProject.budget,
      teamMembers: newProject.teamMembers,
      tasks: [],
      progress: 0,
    };

    onUpdateProjects([...projects, project]);
    setIsAddingProject(false);
    setNewProject({
      name: '',
      description: '',
      client: '',
      status: 'Planning' as ProjectStatus,
      startDate: '',
      endDate: '',
      budget: 0,
      teamMembers: [] as TeamMember[],
    });
  };

  const handleUpdateProject = () => {
    if (!selectedProject) return;

    const updatedProject = {
      ...selectedProject,
      ...newProject,
    };

    const updatedProjects = projects.map(p =>
      p.id === selectedProject.id ? updatedProject : p
    );

    onUpdateProjects(updatedProjects);
    onSelectProject(updatedProject);
    setIsEditingProject(false);
  };

  const handleDeleteProject = () => {
    if (!selectedProject) return;
    if (!confirm('Are you sure you want to delete this project?')) return;

    const updatedProjects = projects.filter(p => p.id !== selectedProject.id);
    onUpdateProjects(updatedProjects);
    onSelectProject(null);
  };

  const handleCreateTask = () => {
    if (!selectedProject) return;

    const task: Task = {
      id: Date.now().toString(),
      name: newTask.title, // FIXED: name is the primary field in Task type
      title: newTask.title, // Keep title as alias
      description: newTask.description,
      assignedTo: newTask.assignedTo,
      status: newTask.status,
      priority: newTask.priority,
      dueDate: newTask.dueDate,
      estimatedHours: newTask.estimatedHours,
      completed: false,
    };

    const updatedProject = {
      ...selectedProject,
      tasks: [...selectedProject.tasks, task],
    };

    const updatedProjects = projects.map(p =>
      p.id === selectedProject.id ? updatedProject : p
    );

    onUpdateProjects(updatedProjects);
    onSelectProject(updatedProject);
    setIsAddingTask(false);
    setNewTask({
      title: '',
      description: '',
      assignedTo: '',
      status: 'To Do' as TaskStatus,
      priority: 'Medium' as Priority,
      dueDate: '',
      estimatedHours: 0,
    });
  };

  const handleUpdateTask = (taskId: string, updates: Partial<Task>) => {
    if (!selectedProject) return;

    const updatedTasks = selectedProject.tasks.map(task =>
      task.id === taskId ? { ...task, ...updates } : task
    );

    const updatedProject = {
      ...selectedProject,
      tasks: updatedTasks,
    };

    const updatedProjects = projects.map(p =>
      p.id === selectedProject.id ? updatedProject : p
    );

    onUpdateProjects(updatedProjects);
    onSelectProject(updatedProject);
  };

  const handleEditTask = (task: Task) => {
    setEditingTask(task);
    setNewTask({
      title: task.name, // Use task.name (primary field)
      description: task.description || '',
      assignedTo: task.assignedTo || '',
      status: task.status,
      priority: task.priority,
      dueDate: task.dueDate || '',
      estimatedHours: task.estimatedHours || 0,
    });
    setIsEditingTask(true);
  };

  const handleSaveEditedTask = () => {
    if (!editingTask) return;

    handleUpdateTask(editingTask.id, {
      name: newTask.title,
      title: newTask.title,
      description: newTask.description,
      assignedTo: newTask.assignedTo,
      status: newTask.status,
      priority: newTask.priority,
      dueDate: newTask.dueDate,
      estimatedHours: newTask.estimatedHours,
    });
    setIsEditingTask(false);
    setEditingTask(null);
    setNewTask({
      title: '',
      description: '',
      assignedTo: '',
      status: 'To Do' as TaskStatus,
      priority: 'Medium' as Priority,
      dueDate: '',
      estimatedHours: 0,
    });
  };

  const handleDeleteTask = (taskId: string) => {
    if (!selectedProject) return;
    if (!confirm('Are you sure you want to delete this task?')) return;

    const updatedTasks = selectedProject.tasks.filter(t => t.id !== taskId);
    const updatedProject = {
      ...selectedProject,
      tasks: updatedTasks,
    };

    const updatedProjects = projects.map(p =>
      p.id === selectedProject.id ? updatedProject : p
    );

    onUpdateProjects(updatedProjects);
    onSelectProject(updatedProject);
  };

  const handleEditProjectClick = () => {
    if (!selectedProject) return;
    setNewProject({
      name: selectedProject.name,
      description: selectedProject.description || '',
      client: selectedProject.client || '',
      status: selectedProject.status,
      startDate: selectedProject.startDate,
      endDate: selectedProject.endDate || '',
      budget: selectedProject.budget || 0,
      teamMembers: selectedProject.teamMembers || [],
    });
    setIsEditingProject(true);
  };

  const filteredProjects = projects.filter(project => {
    const matchesSearch = project.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = filterStatus === 'all' || project.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const statusColors: Record<ProjectStatus, string> = {
    'Planning': 'bg-blue-500/20 text-blue-400',
    'In Progress': 'bg-yellow-500/20 text-yellow-400',
    'On Hold': 'bg-orange-500/20 text-orange-400',
    'Completed': 'bg-green-500/20 text-green-400',
    'At Risk': 'bg-red-500/20 text-red-400',
  };

  const priorityColors: Record<Priority, string> = {
    'Low': 'text-green-400',
    'Medium': 'text-yellow-400',
    'High': 'text-red-400',
  };

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between mb-6 flex-shrink-0">
        <div className="flex items-center gap-4">
          <h2 className="text-2xl font-bold text-[var(--text-primary)]">
            {selectedProject ? selectedProject.name : 'Project Management'}
          </h2>
          {selectedProject && (
            <button
              onClick={() => onSelectProject(null)}
              className="text-[var(--text-tertiary)] hover:text-[var(--text-primary)] transition-colors"
            >
              ← Back to Projects
            </button>
          )}
        </div>

        {selectedProject && (
          <div className="flex items-center gap-3">
            {/* View Toggle */}
            <div className="flex bg-[var(--bg-tertiary)] rounded-lg p-1">
              <button
                onClick={() => setViewMode('list')}
                className={`px-3 py-1 rounded transition-colors ${
                  viewMode === 'list'
                    ? 'bg-[var(--accent-primary)] text-white'
                    : 'text-[var(--text-tertiary)] hover:text-[var(--text-primary)]'
                }`}
              >
                List
              </button>
              <button
                onClick={() => setViewMode('kanban')}
                className={`px-3 py-1 rounded transition-colors ${
                  viewMode === 'kanban'
                    ? 'bg-[var(--accent-primary)] text-white'
                    : 'text-[var(--text-tertiary)] hover:text-[var(--text-primary)]'
                }`}
              >
                Kanban
              </button>
            </div>

            <button
              onClick={() => setIsAddingTask(true)}
              className="flex items-center gap-2 bg-[var(--accent-primary)] hover:bg-[var(--accent-secondary)] text-white px-4 py-2 rounded-lg transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Add Task
            </button>

            <button
              onClick={handleEditProjectClick}
              className="flex items-center gap-2 bg-[var(--bg-tertiary)] hover:bg-[var(--bg-tertiary)]/80 text-[var(--text-primary)] px-4 py-2 rounded-lg transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
              Edit Project
            </button>
          </div>
        )}

        {!selectedProject && (
          <button
            onClick={() => setIsAddingProject(true)}
            className="flex items-center gap-2 bg-[var(--accent-primary)] hover:bg-[var(--accent-secondary)] text-white px-4 py-2 rounded-lg transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            New Project
          </button>
        )}
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-auto">
        {!selectedProject ? (
          // Project List View
          <div>
            {/* Search and Filter */}
            <div className="flex gap-4 mb-6">
              <div className="flex-1">
                <input
                  type="text"
                  placeholder="Search projects..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full p-3 bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-lg text-[var(--text-primary)]"
                />
              </div>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="p-3 bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-lg text-[var(--text-primary)]"
              >
                <option value="all">All Status</option>
                <option value="Planning">Planning</option>
                <option value="In Progress">In Progress</option>
                <option value="On Hold">On Hold</option>
                <option value="Completed">Completed</option>
                <option value="At Risk">At Risk</option>
              </select>
            </div>

            {/* Project Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredProjects.map(project => (
                <div
                  key={project.id}
                  onClick={() => onSelectProject(project)}
                  className="bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-xl p-6 cursor-pointer hover:border-[var(--accent-primary)] transition-all"
                >
                  <div className="flex items-start justify-between mb-3">
                    <h3 className="text-lg font-semibold text-[var(--text-primary)]">{project.name}</h3>
                    <span className={`px-2 py-1 rounded text-xs ${statusColors[project.status]}`}>
                      {project.status}
                    </span>
                  </div>

                  {project.description && (
                    <p className="text-sm text-[var(--text-tertiary)] mb-4 line-clamp-2">
                      {project.description}
                    </p>
                  )}

                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-[var(--text-tertiary)]">Tasks</span>
                      <span className="text-[var(--text-primary)]">
                        {project.tasks.filter(t => t.completed).length} / {project.tasks.length}
                      </span>
                    </div>

                    {project.tasks.length > 0 && (
                      <div className="w-full bg-[var(--bg-tertiary)] rounded-full h-2">
                        <div
                          className="bg-[var(--accent-primary)] h-2 rounded-full transition-all"
                          style={{
                            width: `${(project.tasks.filter(t => t.completed).length / project.tasks.length) * 100}%`
                          }}
                        />
                      </div>
                    )}

                    {project.client && (
                      <div className="flex items-center gap-2 text-sm text-[var(--text-tertiary)] mt-3">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                        </svg>
                        <span>{project.client}</span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {filteredProjects.length === 0 && (
              <div className="text-center py-12">
                <p className="text-[var(--text-tertiary)] mb-4">No projects found</p>
                <button
                  onClick={() => setIsAddingProject(true)}
                  className="text-[var(--accent-primary)] hover:text-[var(--accent-secondary)]"
                >
                  Create your first project
                </button>
              </div>
            )}
          </div>
        ) : (
          // Project Detail View
          <div>
            {viewMode === 'list' ? (
              // List View
              <div className="space-y-4">
                {selectedProject.tasks.map(task => (
                  <div
                    key={task.id}
                    className="bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-lg p-4 hover:border-[var(--accent-primary)] transition-all"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3 flex-1">
                        <input
                          type="checkbox"
                          checked={task.completed}
                          onChange={() => handleUpdateTask(task.id, { completed: !task.completed })}
                          className="mt-1"
                        />
                        <div className="flex-1">
                          <h4 className={`font-medium text-[var(--text-primary)] ${task.completed ? 'line-through opacity-50' : ''}`}>
                            {task.name}
                          </h4>
                          {task.description && (
                            <p className="text-sm text-[var(--text-tertiary)] mt-1">{task.description}</p>
                          )}
                          <div className="flex items-center gap-4 mt-2 text-sm">
                            <span className={`${priorityColors[task.priority]}`}>
                              {task.priority}
                            </span>
                            {task.dueDate && (
                              <span className="text-[var(--text-tertiary)]">
                                Due: {new Date(task.dueDate).toLocaleDateString()}
                              </span>
                            )}
                            {task.assignedTo && (
                              <span className="text-[var(--text-tertiary)]">
                                Assigned to: {task.assignedTo}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleEditTask(task)}
                          className="p-2 text-[var(--text-tertiary)] hover:text-[var(--accent-primary)] transition-colors"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </button>
                        <button
                          onClick={() => handleDeleteTask(task.id)}
                          className="p-2 text-[var(--text-tertiary)] hover:text-red-400 transition-colors"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  </div>
                ))}

                {selectedProject.tasks.length === 0 && (
                  <div className="text-center py-12 bg-[var(--bg-secondary)] rounded-lg border border-dashed border-[var(--border-primary)]">
                    <p className="text-[var(--text-tertiary)] mb-4">No tasks yet</p>
                    <button
                      onClick={() => setIsAddingTask(true)}
                      className="text-[var(--accent-primary)] hover:text-[var(--accent-secondary)]"
                    >
                      Add your first task
                    </button>
                  </div>
                )}
              </div>
            ) : (
              // Kanban View
              <KanbanBoard
                project={selectedProject}
                onUpdateTask={(taskId, updates) => handleUpdateTask(taskId, updates)}
                  onEditTask={handleEditTask}
                />
            )}
          </div>
        )}
      </div>

      {/* Add Project Modal */}
      {isAddingProject && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-[var(--bg-secondary)] rounded-xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <h3 className="text-xl font-bold text-[var(--text-primary)] mb-4">Create New Project</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">
                  Project Name *
                </label>
                <input
                  type="text"
                  value={newProject.name}
                  onChange={(e) => setNewProject({ ...newProject, name: e.target.value })}
                  className="w-full p-3 bg-[var(--bg-primary)] border border-[var(--border-primary)] rounded-lg text-[var(--text-primary)]"
                  placeholder="Enter project name"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">
                  Description
                </label>
                <textarea
                  value={newProject.description}
                  onChange={(e) => setNewProject({ ...newProject, description: e.target.value })}
                  className="w-full p-3 bg-[var(--bg-primary)] border border-[var(--border-primary)] rounded-lg text-[var(--text-primary)] h-24"
                  placeholder="Enter project description"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">
                  Client
                </label>
                <input
                  type="text"
                  value={newProject.client}
                  onChange={(e) => setNewProject({ ...newProject, client: e.target.value })}
                  className="w-full p-3 bg-[var(--bg-primary)] border border-[var(--border-primary)] rounded-lg text-[var(--text-primary)]"
                  placeholder="Enter client name"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">
                  Status
                </label>
                <select
                  value={newProject.status}
                  onChange={(e) => setNewProject({ ...newProject, status: e.target.value as ProjectStatus })}
                  className="w-full p-3 bg-[var(--bg-primary)] border border-[var(--border-primary)] rounded-lg text-[var(--text-primary)]"
                >
                  <option value="Planning">Planning</option>
                  <option value="In Progress">In Progress</option>
                  <option value="On Hold">On Hold</option>
                  <option value="Completed">Completed</option>
                  <option value="At Risk">At Risk</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">
                    Start Date
                  </label>
                  <input
                    type="date"
                    value={newProject.startDate}
                    onChange={(e) => setNewProject({ ...newProject, startDate: e.target.value })}
                    className="w-full p-3 bg-[var(--bg-primary)] border border-[var(--border-primary)] rounded-lg text-[var(--text-primary)]"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">
                    End Date
                  </label>
                  <input
                    type="date"
                    value={newProject.endDate}
                    onChange={(e) => setNewProject({ ...newProject, endDate: e.target.value })}
                    className="w-full p-3 bg-[var(--bg-primary)] border border-[var(--border-primary)] rounded-lg text-[var(--text-primary)]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">
                  Budget ($)
                </label>
                <input
                  type="number"
                  value={newProject.budget}
                  onChange={(e) => setNewProject({ ...newProject, budget: Number(e.target.value) })}
                  className="w-full p-3 bg-[var(--bg-primary)] border border-[var(--border-primary)] rounded-lg text-[var(--text-primary)]"
                  placeholder="0"
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={handleCreateProject}
                disabled={!newProject.name}
                className="flex-1 bg-[var(--accent-primary)] hover:bg-[var(--accent-secondary)] disabled:opacity-50 disabled:cursor-not-allowed text-white py-2 px-4 rounded-lg transition-colors"
              >
                Create Project
              </button>
              <button
                onClick={() => {
                  setIsAddingProject(false);
                  setNewProject({
                    name: '',
                    description: '',
                    client: '',
                    status: 'Planning' as ProjectStatus,
                    startDate: '',
                    endDate: '',
                    budget: 0,
                    teamMembers: [] as TeamMember[],
                  });
                }}
                className="px-4 py-2 bg-[var(--bg-tertiary)] hover:bg-[var(--bg-tertiary)]/80 text-[var(--text-primary)] rounded-lg transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add/Edit Task Modal */}
      {(isAddingTask || isEditingTask) && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-[var(--bg-secondary)] rounded-xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <h3 className="text-xl font-bold text-[var(--text-primary)] mb-4">
              {isEditingTask ? 'Edit Task' : 'Create New Task'}
            </h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">
                  Task Title *
                </label>
                <input
                  type="text"
                  value={newTask.title}
                  onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
                  className="w-full p-3 bg-[var(--bg-primary)] border border-[var(--border-primary)] rounded-lg text-[var(--text-primary)]"
                  placeholder="Enter task title"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">
                  Description
                </label>
                <textarea
                  value={newTask.description}
                  onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
                  className="w-full p-3 bg-[var(--bg-primary)] border border-[var(--border-primary)] rounded-lg text-[var(--text-primary)] h-24"
                  placeholder="Enter task description"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">
                  Assigned To
                </label>
                <input
                  type="text"
                  value={newTask.assignedTo}
                  onChange={(e) => setNewTask({ ...newTask, assignedTo: e.target.value })}
                  className="w-full p-3 bg-[var(--bg-primary)] border border-[var(--border-primary)] rounded-lg text-[var(--text-primary)]"
                  placeholder="Enter assignee name"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">
                    Status *
                  </label>
                  <select
                    value={newTask.status}
                    onChange={(e) => setNewTask({ ...newTask, status: e.target.value as TaskStatus })}
                    className="w-full p-3 bg-[var(--bg-primary)] border border-[var(--border-primary)] rounded-lg text-[var(--text-primary)]"
                  >
                    <option value="To Do">To Do</option>
                    <option value="In Progress">In Progress</option>
                    <option value="Done">Done</option>
                    <option value="On Hold">On Hold</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">
                    Priority *
                  </label>
                  <select
                    value={newTask.priority}
                    onChange={(e) => setNewTask({ ...newTask, priority: e.target.value as Priority })}
                    className="w-full p-3 bg-[var(--bg-primary)] border border-[var(--border-primary)] rounded-lg text-[var(--text-primary)]"
                  >
                    <option value="Low">Low</option>
                    <option value="Medium">Medium</option>
                    <option value="High">High</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">
                    Due Date
                  </label>
                  <input
                    type="date"
                    value={newTask.dueDate}
                    onChange={(e) => setNewTask({ ...newTask, dueDate: e.target.value })}
                    className="w-full p-3 bg-[var(--bg-primary)] border border-[var(--border-primary)] rounded-lg text-[var(--text-primary)]"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">
                    Estimated Hours
                  </label>
                  <input
                    type="number"
                    value={newTask.estimatedHours}
                    onChange={(e) => setNewTask({ ...newTask, estimatedHours: Number(e.target.value) })}
                    className="w-full p-3 bg-[var(--bg-primary)] border border-[var(--border-primary)] rounded-lg text-[var(--text-primary)]"
                    placeholder="0"
                  />
                </div>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={isEditingTask ? handleSaveEditedTask : handleCreateTask}
                disabled={!newTask.title}
                className="flex-1 bg-[var(--accent-primary)] hover:bg-[var(--accent-secondary)] disabled:opacity-50 disabled:cursor-not-allowed text-white py-2 px-4 rounded-lg transition-colors"
              >
                {isEditingTask ? 'Save Changes' : 'Create Task'}
              </button>
              <button
                onClick={() => {
                  setIsAddingTask(false);
                  setIsEditingTask(false);
                  setEditingTask(null);
                  setNewTask({
                    title: '',
                    description: '',
                    assignedTo: '',
                    status: 'To Do' as TaskStatus,
                    priority: 'Medium' as Priority,
                    dueDate: '',
                    estimatedHours: 0,
                  });
                }}
                className="px-4 py-2 bg-[var(--bg-tertiary)] hover:bg-[var(--bg-tertiary)]/80 text-[var(--text-primary)] rounded-lg transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Project Modal */}
      {isEditingProject && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-[var(--bg-secondary)] rounded-xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <h3 className="text-xl font-bold text-[var(--text-primary)] mb-4">Edit Project</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">
                  Project Name *
                </label>
                <input
                  type="text"
                  value={newProject.name}
                  onChange={(e) => setNewProject({ ...newProject, name: e.target.value })}
                  className="w-full p-3 bg-[var(--bg-primary)] border border-[var(--border-primary)] rounded-lg text-[var(--text-primary)]"
                  placeholder="Enter project name"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">
                  Description
                </label>
                <textarea
                  value={newProject.description}
                  onChange={(e) => setNewProject({ ...newProject, description: e.target.value })}
                  className="w-full p-3 bg-[var(--bg-primary)] border border-[var(--border-primary)] rounded-lg text-[var(--text-primary)] h-24"
                  placeholder="Enter project description"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">
                  Client
                </label>
                <input
                  type="text"
                  value={newProject.client}
                  onChange={(e) => setNewProject({ ...newProject, client: e.target.value })}
                  className="w-full p-3 bg-[var(--bg-primary)] border border-[var(--border-primary)] rounded-lg text-[var(--text-primary)]"
                  placeholder="Enter client name"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">
                  Status
                </label>
                <select
                  value={newProject.status}
                  onChange={(e) => setNewProject({ ...newProject, status: e.target.value as ProjectStatus })}
                  className="w-full p-3 bg-[var(--bg-primary)] border border-[var(--border-primary)] rounded-lg text-[var(--text-primary)]"
                >
                  <option value="Planning">Planning</option>
                  <option value="In Progress">In Progress</option>
                  <option value="On Hold">On Hold</option>
                  <option value="Completed">Completed</option>
                  <option value="At Risk">At Risk</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">
                    Start Date
                  </label>
                  <input
                    type="date"
                    value={newProject.startDate}
                    onChange={(e) => setNewProject({ ...newProject, startDate: e.target.value })}
                    className="w-full p-3 bg-[var(--bg-primary)] border border-[var(--border-primary)] rounded-lg text-[var(--text-primary)]"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">
                    End Date
                  </label>
                  <input
                    type="date"
                    value={newProject.endDate}
                    onChange={(e) => setNewProject({ ...newProject, endDate: e.target.value })}
                    className="w-full p-3 bg-[var(--bg-primary)] border border-[var(--border-primary)] rounded-lg text-[var(--text-primary)]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">
                  Budget ($)
                </label>
                <input
                  type="number"
                  value={newProject.budget}
                  onChange={(e) => setNewProject({ ...newProject, budget: Number(e.target.value) })}
                  className="w-full p-3 bg-[var(--bg-primary)] border border-[var(--border-primary)] rounded-lg text-[var(--text-primary)]"
                  placeholder="0"
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={handleUpdateProject}
                disabled={!newProject.name}
                className="flex-1 bg-[var(--accent-primary)] hover:bg-[var(--accent-secondary)] disabled:opacity-50 disabled:cursor-not-allowed text-white py-2 px-4 rounded-lg transition-colors"
              >
                Save Changes
              </button>
              <button
                onClick={handleDeleteProject}
                className="px-4 py-2 bg-red-600/20 hover:bg-red-600/30 text-red-400 rounded-lg transition-colors"
              >
                Delete
              </button>
              <button
                onClick={() => setIsEditingProject(false)}
                className="px-4 py-2 bg-[var(--bg-tertiary)] hover:bg-[var(--bg-tertiary)]/80 text-[var(--text-primary)] rounded-lg transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProjectManagement;
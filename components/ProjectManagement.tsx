import React, { useState, useEffect } from 'react';
import type { Project, Task, Priority, TaskStatus, TeamMember, ProjectStatus } from '../types';
import { PRIORITY_VALUES, PROJECT_STATUS_VALUES, TaskStatus as TaskStatusEnum } from '../types';
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

  const handleCreateProject = () => {
    const now = new Date().toISOString();
    const project: Project = {
      id: Date.now().toString(),
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
  };

  const handleUpdateProject = () => {
    if (!selectedProject) return;

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

    const now = new Date().toISOString();
    const task: Task = {
      id: Date.now().toString(),
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
  };

  const handleUpdateTask = () => {
    if (!selectedProject || !editingTask) return;

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

    const updatedProject = {
      ...selectedProject,
      tasks: selectedProject.tasks.map(t =>
        t.id === editingTask.id ? updatedTask : t
      ),
      updatedAt: new Date().toISOString(),
    };

    const updatedProjects = projects.map(p =>
      p.id === selectedProject.id ? updatedProject : p
    );

    onUpdateProjects(updatedProjects);
    onSelectProject(updatedProject);
    setIsEditingTask(false);
    setEditingTask(null);
  };

  const handleDeleteTask = (taskId: string) => {
    if (!selectedProject) return;
    if (!confirm('Are you sure you want to delete this task?')) return;

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
  };

  const handleEditTask = (task: Task) => {
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

  const handleEditProject = () => {
    if (!selectedProject) return;
    
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
              onClick={() => setIsAddingProject(true)}
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
        {viewMode === 'list' ? (
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
          <div className="text-[var(--text-secondary)]">
            Kanban view coming soon...
          </div>
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
                  onClick={() => onSelectProject(null)}
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
                    onClick={() => setIsAddingTask(true)}
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
                        className="p-3 bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-lg"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <h4 className="font-medium text-[var(--text-primary)]">{task.name}</h4>
                            <p className="text-sm text-[var(--text-secondary)] mt-1">{task.description}</p>
                            <div className="flex items-center gap-4 mt-2 text-xs">
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
                          <div className="flex gap-2">
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
                      <p className="text-center text-[var(--text-tertiary)] py-8">No tasks yet. Add one to get started!</p>
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
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-[var(--bg-primary)] border border-[var(--border-primary)] rounded-lg p-6 max-w-2xl w-full">
            <h3 className="text-xl font-bold text-[var(--text-primary)] mb-4">
              {isAddingProject ? 'New Project' : 'Edit Project'}
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">
                  Project Name
                </label>
                <input
                  type="text"
                  value={newProject.name}
                  onChange={(e) => setNewProject({ ...newProject, name: e.target.value })}
                  className="w-full px-3 py-2 bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-lg text-[var(--text-primary)]"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">
                  Description
                </label>
                <textarea
                  value={newProject.description}
                  onChange={(e) => setNewProject({ ...newProject, description: e.target.value })}
                  className="w-full px-3 py-2 bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-lg text-[var(--text-primary)]"
                  rows={3}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">
                  Project Manager
                </label>
                <input
                  type="text"
                  value={newProject.manager}
                  onChange={(e) => setNewProject({ ...newProject, manager: e.target.value })}
                  className="w-full px-3 py-2 bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-lg text-[var(--text-primary)]"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">
                    Status
                  </label>
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
                </div>
                <div>
                  <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">
                    Priority
                  </label>
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
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">
                    Start Date
                  </label>
                  <input
                    type="date"
                    value={newProject.startDate}
                    onChange={(e) => setNewProject({ ...newProject, startDate: e.target.value })}
                    className="w-full px-3 py-2 bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-lg text-[var(--text-primary)]"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">
                    Due Date
                  </label>
                  <input
                    type="date"
                    value={newProject.dueDate}
                    onChange={(e) => setNewProject({ ...newProject, dueDate: e.target.value })}
                    className="w-full px-3 py-2 bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-lg text-[var(--text-primary)]"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">
                  Budget
                </label>
                <input
                  type="number"
                  value={newProject.budget}
                  onChange={(e) => setNewProject({ ...newProject, budget: Number(e.target.value) })}
                  className="w-full px-3 py-2 bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-lg text-[var(--text-primary)]"
                />
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button
                onClick={isAddingProject ? handleCreateProject : handleUpdateProject}
                className="flex-1 px-4 py-2 bg-[var(--accent-primary)] text-white rounded-lg hover:opacity-80 transition-opacity"
              >
                {isAddingProject ? 'Create Project' : 'Update Project'}
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
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-[var(--bg-primary)] border border-[var(--border-primary)] rounded-lg p-6 max-w-2xl w-full">
            <h3 className="text-xl font-bold text-[var(--text-primary)] mb-4">
              {isAddingTask ? 'New Task' : 'Edit Task'}
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">
                  Task Name
                </label>
                <input
                  type="text"
                  value={newTask.name}
                  onChange={(e) => setNewTask({ ...newTask, name: e.target.value })}
                  className="w-full px-3 py-2 bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-lg text-[var(--text-primary)]"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">
                  Description
                </label>
                <textarea
                  value={newTask.description}
                  onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
                  className="w-full px-3 py-2 bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-lg text-[var(--text-primary)]"
                  rows={3}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">
                    Status
                  </label>
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
                </div>
                <div>
                  <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">
                    Priority
                  </label>
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
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">
                    Due Date
                  </label>
                  <input
                    type="date"
                    value={newTask.dueDate}
                    onChange={(e) => setNewTask({ ...newTask, dueDate: e.target.value })}
                    className="w-full px-3 py-2 bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-lg text-[var(--text-primary)]"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">
                    Estimated Hours
                  </label>
                  <input
                    type="number"
                    value={newTask.estimatedHours}
                    onChange={(e) => setNewTask({ ...newTask, estimatedHours: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-lg text-[var(--text-primary)]"
                  />
                </div>
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button
                onClick={isAddingTask ? handleCreateTask : handleUpdateTask}
                className="flex-1 px-4 py-2 bg-[var(--accent-primary)] text-white rounded-lg hover:opacity-80 transition-opacity"
              >
                {isAddingTask ? 'Create Task' : 'Update Task'}
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
    </div>
  );
};

export default ProjectManagement;
import React, { useState, useEffect } from 'react';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

type Project = {
  id: string;
  name: string;
  description: string;
  client: string;
  status: 'planning' | 'active' | 'on-hold' | 'completed';
  startDate: string;
  endDate: string;
  budget: number;
  teamMembers: string[];
  archived: boolean;
};

type Task = {
  id: string;
  projectId: string;
  title: string;
  description: string;
  assignedTo: string;
  status: 'todo' | 'in-progress' | 'done' | 'blocked';
  priority: 'low' | 'medium' | 'high' | 'critical';
  dueDate: string;
  estimatedHours: number;
  actualHours: number;
  createdAt: string;
};

function App() {
  const [supabase, setSupabase] = useState<SupabaseClient | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [currentView, setCurrentView] = useState<'home' | 'projectList' | 'projectDetail' | 'archivedProjects'>('home');
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [isCreatingProject, setIsCreatingProject] = useState(false);
  const [isEditingProject, setIsEditingProject] = useState(false);
  const [editedProject, setEditedProject] = useState<Project | null>(null);
  const [isCreatingTask, setIsCreatingTask] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);

  useEffect(() => {
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
    
    if (supabaseUrl && supabaseKey) {
      const client = createClient(supabaseUrl, supabaseKey);
      setSupabase(client);
    }
  }, []);

  const saveProjectsToDb = async (projectsToSave: Project[]) => {
    if (!supabase) return;
    
    const { error } = await supabase
      .from('projects')
      .upsert(projectsToSave.map(p => ({
        id: p.id,
        name: p.name,
        description: p.description,
        client: p.client,
        status: p.status,
        start_date: p.startDate,
        end_date: p.endDate,
        budget: p.budget || 0,
        team_members: p.teamMembers,
        archived: p.archived,
      })));
    
    if (error) console.error('Error saving projects:', error);
  };

  const saveTasksToDb = async (tasksToSave: Task[]) => {
    if (!supabase) return;
    
    const { error } = await supabase
      .from('tasks')
      .upsert(tasksToSave.map(t => ({
        id: t.id,
        project_id: t.projectId,
        title: t.title,
        description: t.description,
        assigned_to: t.assignedTo,
        status: t.status,
        priority: t.priority,
        due_date: t.dueDate,
        estimated_hours: t.estimatedHours,
        actual_hours: t.actualHours,
        created_at: t.createdAt,
      })));
    
    if (error) console.error('Error saving tasks:', error);
  };

  const deleteTaskFromDb = async (taskId: string) => {
    if (!supabase) return;
    
    const { error } = await supabase
      .from('tasks')
      .delete()
      .eq('id', taskId);
    
    if (error) console.error('Error deleting task:', error);
  };

  const deleteProjectFromDb = async (projectId: string) => {
    if (!supabase) return;
    
    const { error } = await supabase
      .from('projects')
      .delete()
      .eq('id', projectId);
    
    if (error) console.error('Error deleting project:', error);
  };

  useEffect(() => {
    const loadData = async () => {
      if (!supabase) return;
      
      const { data: projectData, error: projectError } = await supabase
        .from('projects')
        .select('*');
      
      if (projectError) {
        console.error('Error loading projects:', projectError);
        return;
      }
      
      if (projectData) {
        setProjects(projectData.map(p => ({
          id: p.id,
          name: p.name,
          description: p.description,
          client: p.client,
          status: p.status,
          startDate: p.start_date,
          endDate: p.end_date,
          budget: p.budget || 0,
          teamMembers: p.team_members || [],
          archived: p.archived || false,
        })));
      }

      const { data: taskData, error: taskError } = await supabase
        .from('tasks')
        .select('*');
      
      if (taskError) {
        console.error('Error loading tasks:', taskError);
        return;
      }
      
      if (taskData) {
        setTasks(taskData.map(t => ({
          id: t.id,
          projectId: t.project_id,
          title: t.title,
          description: t.description,
          assignedTo: t.assigned_to,
          status: t.status,
          priority: t.priority,
          dueDate: t.due_date,
          estimatedHours: t.estimated_hours,
          actualHours: t.actual_hours,
          createdAt: t.created_at,
        })));
      }
    };
    
    loadData();
  }, [supabase]);

  const activeProjects = projects.filter(p => !p.archived);
  const archivedProjects = projects.filter(p => p.archived);

  const renderCurrentView = () => {
    if (currentView === 'home') {
      return (
        <div className="space-y-8">
          <div>
            <h1 className="text-4xl font-bold text-gray-900">Project Management Dashboard</h1>
            <p className="text-gray-600 mt-2">Track and manage your projects efficiently</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div 
              onClick={() => setCurrentView('projectList')}
              className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow cursor-pointer"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-500 text-sm">Active Projects</p>
                  <p className="text-3xl font-bold text-gray-900 mt-1">{activeProjects.length}</p>
                </div>
                <div className="bg-blue-100 p-3 rounded-full">
                  <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-md">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-500 text-sm">Total Tasks</p>
                  <p className="text-3xl font-bold text-gray-900 mt-1">{tasks.length}</p>
                </div>
                <div className="bg-green-100 p-3 rounded-full">
                  <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                  </svg>
                </div>
              </div>
            </div>

            <div 
              onClick={() => setCurrentView('archivedProjects')}
              className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow cursor-pointer"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-500 text-sm">Archived Projects</p>
                  <p className="text-3xl font-bold text-gray-900 mt-1">{archivedProjects.length}</p>
                </div>
                <div className="bg-yellow-100 p-3 rounded-full">
                  <svg className="w-8 h-8 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
                  </svg>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Quick Actions</h2>
            <div className="flex gap-4">
              <button
                onClick={() => setIsCreatingProject(true)}
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg transition-colors"
              >
                + Create New Project
              </button>
              <button
                onClick={() => setCurrentView('projectList')}
                className="bg-gray-200 hover:bg-gray-300 text-gray-800 px-6 py-3 rounded-lg transition-colors"
              >
                View All Projects
              </button>
            </div>
          </div>
        </div>
      );
    }

    if (currentView === 'archivedProjects') {
      return (
        <div className="space-y-6">
          <div>
            <button
              onClick={() => setCurrentView('home')}
              className="text-blue-600 hover:text-blue-800 mb-4"
            >
              ← Back to Home
            </button>
            <h1 className="text-3xl font-bold text-gray-900">Archived Projects</h1>
            <p className="text-gray-600 mt-2">{archivedProjects.length} archived project(s)</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {archivedProjects.map((project) => (
              <div
                key={project.id}
                className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow cursor-pointer border-2 border-yellow-200"
                onClick={() => {
                  setEditedProject(project);
                  setIsEditingProject(true);
                }}
              >
                <div className="flex items-start justify-between mb-3">
                  <h3 className="text-xl font-semibold text-gray-900">{project.name}</h3>
                  <span className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded text-xs font-medium">
                    Archived
                  </span>
                </div>
                <p className="text-gray-600 text-sm mb-4">{project.description}</p>
                <div className="space-y-2 text-sm">
                  <p><span className="font-medium">Client:</span> {project.client}</p>
                  <p><span className="font-medium">Budget:</span> ${project.budget?.toLocaleString() ?? 'N/A'}</p>
                </div>
              </div>
            ))}
          </div>

          {archivedProjects.length === 0 && (
            <div className="text-center py-12 bg-white rounded-lg shadow-md">
              <p className="text-gray-500">No archived projects</p>
            </div>
          )}
        </div>
      );
    }

    if (currentView === 'projectList') {
      return (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <button
                onClick={() => setCurrentView('home')}
                className="text-blue-600 hover:text-blue-800 mb-2"
              >
                ← Back to Home
              </button>
              <h1 className="text-3xl font-bold text-gray-900">All Projects</h1>
            </div>
            <button
              onClick={() => setIsCreatingProject(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
            >
              + New Project
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {activeProjects.map((project) => (
              <div
                key={project.id}
                className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow cursor-pointer"
              >
                <div className="flex items-start justify-between mb-3">
                  <h3 className="text-xl font-semibold text-gray-900">{project.name}</h3>
                  <span className={`px-2 py-1 rounded text-xs font-medium ${
                    project.status === 'active' ? 'bg-green-100 text-green-800' :
                    project.status === 'planning' ? 'bg-blue-100 text-blue-800' :
                    project.status === 'on-hold' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {project.status}
                  </span>
                </div>
                <p className="text-gray-600 text-sm mb-4">{project.description}</p>
                <div className="space-y-2 text-sm mb-4">
                  <p><span className="font-medium">Client:</span> {project.client}</p>
                  <p><span className="font-medium">Budget:</span> ${project.budget?.toLocaleString() ?? 'N/A'}</p>
                  <p><span className="font-medium">Team:</span> {project.teamMembers.length} member(s)</p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      setSelectedProject(project);
                      setCurrentView('projectDetail');
                    }}
                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded transition-colors text-sm"
                  >
                    View Details
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setEditedProject(project);
                      setIsEditingProject(true);
                    }}
                    className="px-3 py-2 border border-gray-300 rounded hover:bg-gray-50 transition-colors text-sm"
                  >
                    Edit
                  </button>
                </div>
              </div>
            ))}
          </div>

          {activeProjects.length === 0 && (
            <div className="text-center py-12 bg-white rounded-lg shadow-md">
              <p className="text-gray-500 mb-4">No projects yet</p>
              <button
                onClick={() => setIsCreatingProject(true)}
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg transition-colors"
              >
                Create Your First Project
              </button>
            </div>
          )}
        </div>
      );
    }

    return null;
  };

  // Project Detail View
  if (currentView === 'projectDetail' && selectedProject) {
    const projectTasks = tasks.filter(t => t.projectId === selectedProject.id);
    const todoTasks = projectTasks.filter(t => t.status === 'todo');
    const inProgressTasks = projectTasks.filter(t => t.status === 'in-progress');
    const doneTasks = projectTasks.filter(t => t.status === 'done');
    const blockedTasks = projectTasks.filter(t => t.status === 'blocked');

    const handleTaskAssignmentChange = async (taskId: string, newAssignee: string) => {
      const updatedTasks = tasks.map(t => 
        t.id === taskId ? { ...t, assignedTo: newAssignee } : t
      );
      setTasks(updatedTasks);
      await saveTasksToDb(updatedTasks);
    };

    const TaskCard = ({ task }: { task: Task }) => {
      const priorityColors = {
        low: 'bg-gray-500',
        medium: 'bg-blue-500',
        high: 'bg-orange-500',
        critical: 'bg-red-500',
      };

      return (
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 mb-3 cursor-pointer hover:shadow-md transition-shadow">
          <div className="flex items-start justify-between mb-2">
            <h4 className="font-medium text-gray-900 flex-1">{task.title}</h4>
            <span className={`px-2 py-1 rounded text-xs text-white ${priorityColors[task.priority]}`}>
              {task.priority}
            </span>
          </div>
          {task.description && (
            <p className="text-sm text-gray-600 mb-3">{task.description}</p>
          )}
          <div className="flex items-center justify-between text-sm">
            <select
              value={task.assignedTo}
              onChange={(e) => handleTaskAssignmentChange(task.id, e.target.value)}
              className="text-gray-700 border border-gray-300 rounded px-2 py-1 text-xs"
              onClick={(e) => e.stopPropagation()}
            >
              <option value="">Unassigned</option>
              {selectedProject.teamMembers.map(member => (
                <option key={member} value={member}>{member}</option>
              ))}
            </select>
            {task.dueDate && (
              <span className="text-gray-500 text-xs">
                Due: {new Date(task.dueDate).toLocaleDateString()}
              </span>
            )}
          </div>
          <div className="flex items-center justify-between mt-2 text-xs text-gray-500">
            <span>{task.estimatedHours}h est.</span>
            <button
              onClick={() => setEditingTask(task)}
              className="text-blue-600 hover:text-blue-800"
            >
              Edit
            </button>
          </div>
        </div>
      );
    };

    const KanbanColumn = ({ 
      title, 
      tasks, 
      status 
    }: { 
      title: string; 
      tasks: Task[]; 
      status: Task['status'];
    }) => (
      <div className="flex-1 min-w-[280px]">
        <div className="bg-gray-100 rounded-lg p-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-700">{title}</h3>
            <span className="bg-gray-200 text-gray-600 rounded-full px-2 py-1 text-xs">
              {tasks.length}
            </span>
          </div>
          <div className="space-y-2">
            {tasks.map(task => (
              <TaskCard key={task.id} task={task} />
            ))}
          </div>
        </div>
      </div>
    );

    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <button
              onClick={() => setCurrentView('projectList')}
              className="text-blue-600 hover:text-blue-800 mb-2 flex items-center"
            >
              ← Back to Projects
            </button>
            <h1 className="text-3xl font-bold text-gray-900">{selectedProject.name}</h1>
            <p className="text-gray-600 mt-1">{selectedProject.description}</p>
          </div>
          <button
            onClick={() => setIsCreatingTask(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
          >
            + New Task
          </button>
        </div>

        <div className="grid grid-cols-4 gap-4">
          <KanbanColumn title="To Do" tasks={todoTasks} status="todo" />
          <KanbanColumn title="In Progress" tasks={inProgressTasks} status="in-progress" />
          <KanbanColumn title="Blocked" tasks={blockedTasks} status="blocked" />
          <KanbanColumn title="Done" tasks={doneTasks} status="done" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        {renderCurrentView()}
      </div>

      {/* Task Creation/Edit Modal */}
      {(isCreatingTask || editingTask) && selectedProject && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">
              {editingTask ? 'Edit Task' : 'Create New Task'}
            </h2>
            <form
              onSubmit={async (e) => {
                e.preventDefault();
                const formData = new FormData(e.currentTarget);
                
                const taskData = {
                  id: editingTask?.id || crypto.randomUUID(),
                  projectId: selectedProject.id,
                  title: formData.get('title') as string,
                  description: formData.get('description') as string,
                  assignedTo: formData.get('assignedTo') as string,
                  status: (formData.get('status') as Task['status']) || 'todo',
                  priority: (formData.get('priority') as Task['priority']) || 'medium',
                  dueDate: formData.get('dueDate') as string,
                  estimatedHours: Number(formData.get('estimatedHours')) || 0,
                  actualHours: editingTask?.actualHours || 0,
                  createdAt: editingTask?.createdAt || new Date().toISOString(),
                };

                if (editingTask) {
                  const updatedTasks = tasks.map(t => t.id === taskData.id ? taskData : t);
                  setTasks(updatedTasks);
                  await saveTasksToDb(updatedTasks);
                } else {
                  const updatedTasks = [...tasks, taskData];
                  setTasks(updatedTasks);
                  await saveTasksToDb(updatedTasks);
                }

                setIsCreatingTask(false);
                setEditingTask(null);
              }}
              className="space-y-4"
            >
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Title *
                </label>
                <input
                  type="text"
                  name="title"
                  required
                  defaultValue={editingTask?.title}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  name="description"
                  rows={3}
                  defaultValue={editingTask?.description}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Assigned To
                  </label>
                  <select
                    name="assignedTo"
                    defaultValue={editingTask?.assignedTo || ''}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">Unassigned</option>
                    {selectedProject.teamMembers.map(member => (
                      <option key={member} value={member}>{member}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Status
                  </label>
                  <select
                    name="status"
                    defaultValue={editingTask?.status || 'todo'}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="todo">To Do</option>
                    <option value="in-progress">In Progress</option>
                    <option value="blocked">Blocked</option>
                    <option value="done">Done</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Priority
                  </label>
                  <select
                    name="priority"
                    defaultValue={editingTask?.priority || 'medium'}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="critical">Critical</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Due Date
                  </label>
                  <input
                    type="date"
                    name="dueDate"
                    defaultValue={editingTask?.dueDate}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Estimated Hours
                </label>
                <input
                  type="number"
                  name="estimatedHours"
                  min="0"
                  step="0.5"
                  defaultValue={editingTask?.estimatedHours || 0}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="submit"
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
                >
                  {editingTask ? 'Save Changes' : 'Create Task'}
                </button>
                {editingTask && (
                  <button
                    type="button"
                    onClick={async () => {
                      if (!confirm(`Delete task "${editingTask.title}"?`)) return;
                      const updatedTasks = tasks.filter(t => t.id !== editingTask.id);
                      setTasks(updatedTasks);
                      await deleteTaskFromDb(editingTask.id);
                      setEditingTask(null);
                    }}
                    className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg transition-colors"
                  >
                    Delete
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => {
                    setIsCreatingTask(false);
                    setEditingTask(null);
                  }}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Project Creation Modal */}
      {isCreatingProject && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Create New Project</h2>
            <form
              onSubmit={async (e) => {
                e.preventDefault();
                const formData = new FormData(e.currentTarget);
                
                const newProject: Project = {
                  id: crypto.randomUUID(),
                  name: formData.get('name') as string,
                  description: formData.get('description') as string,
                  client: formData.get('client') as string,
                  status: formData.get('status') as Project['status'],
                  startDate: formData.get('startDate') as string,
                  endDate: formData.get('endDate') as string,
                  budget: Number(formData.get('budget')),
                  teamMembers: [],
                  archived: false,
                };

                const updatedProjects = [...projects, newProject];
                setProjects(updatedProjects);
                await saveProjectsToDb(updatedProjects);
                setIsCreatingProject(false);
              }}
              className="space-y-4"
            >
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Project Name *
                </label>
                <input
                  type="text"
                  name="name"
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  name="description"
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Client *
                </label>
                <input
                  type="text"
                  name="client"
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Status *
                </label>
                <select
                  name="status"
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="planning">Planning</option>
                  <option value="active">Active</option>
                  <option value="on-hold">On Hold</option>
                  <option value="completed">Completed</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Start Date *
                  </label>
                  <input
                    type="date"
                    name="startDate"
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    End Date *
                  </label>
                  <input
                    type="date"
                    name="endDate"
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Budget ($) *
                </label>
                <input
                  type="number"
                  name="budget"
                  required
                  min="0"
                  step="0.01"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="submit"
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
                >
                  Create Project
                </button>
                <button
                  type="button"
                  onClick={() => setIsCreatingProject(false)}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Project Edit Modal */}
      {isEditingProject && editedProject && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Edit Project</h2>
            <form
              onSubmit={async (e) => {
                e.preventDefault();
                const formData = new FormData(e.currentTarget);
                
                const updatedProject: Project = {
                  ...editedProject,
                  name: formData.get('name') as string,
                  description: formData.get('description') as string,
                  client: formData.get('client') as string,
                  status: formData.get('status') as Project['status'],
                  startDate: formData.get('startDate') as string,
                  endDate: formData.get('endDate') as string,
                  budget: Number(formData.get('budget')),
                };

                const updatedProjects = projects.map(p => 
                  p.id === updatedProject.id ? updatedProject : p
                );
                setProjects(updatedProjects);
                await saveProjectsToDb(updatedProjects);
                setIsEditingProject(false);
                setEditedProject(null);
              }}
              className="space-y-4"
            >
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Project Name *
                </label>
                <input
                  type="text"
                  name="name"
                  required
                  defaultValue={editedProject.name}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  name="description"
                  rows={3}
                  defaultValue={editedProject.description}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Client *
                </label>
                <input
                  type="text"
                  name="client"
                  required
                  defaultValue={editedProject.client}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Status *
                </label>
                <select
                  name="status"
                  required
                  defaultValue={editedProject.status}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="planning">Planning</option>
                  <option value="active">Active</option>
                  <option value="on-hold">On Hold</option>
                  <option value="completed">Completed</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Start Date *
                  </label>
                  <input
                    type="date"
                    name="startDate"
                    required
                    defaultValue={editedProject.startDate}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    End Date *
                  </label>
                  <input
                    type="date"
                    name="endDate"
                    required
                    defaultValue={editedProject.endDate}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Budget ($) *
                </label>
                <input
                  type="number"
                  name="budget"
                  required
                  min="0"
                  step="0.01"
                  defaultValue={editedProject.budget}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Team Members
                </label>
                <div className="space-y-2">
                  {editedProject.teamMembers.map((member, index) => (
                    <div key={index} className="flex gap-2">
                      <input
                        type="text"
                        value={member}
                        onChange={(e) => {
                          const newMembers = [...editedProject.teamMembers];
                          newMembers[index] = e.target.value;
                          setEditedProject({ ...editedProject, teamMembers: newMembers });
                        }}
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          const newMembers = editedProject.teamMembers.filter((_, i) => i !== index);
                          setEditedProject({ ...editedProject, teamMembers: newMembers });
                        }}
                        className="px-3 py-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-200 transition-colors"
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={() => {
                      setEditedProject({ 
                        ...editedProject, 
                        teamMembers: [...editedProject.teamMembers, ''] 
                      });
                    }}
                    className="w-full px-3 py-2 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors text-gray-600"
                  >
                    + Add Team Member
                  </button>
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="submit"
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
                >
                  Save Changes
                </button>
                {editedProject.archived ? (
                  <button
                    onClick={async () => {
                      const unarchivedProject = { ...editedProject, archived: false };
                      const updatedProjects = projects.map(p => p.id === unarchivedProject.id ? unarchivedProject : p);
                      setProjects(updatedProjects);
                      await saveProjectsToDb(updatedProjects);
                      setIsEditingProject(false);
                      setEditedProject(null);
                      setCurrentView('projectList');
                    }}
                    className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition-colors"
                  >
                    Unarchive
                  </button>
                ) : (
                  <button
                    onClick={async () => {
                      if (!confirm(`Are you sure you want to archive "${editedProject.name}"? You can unarchive it later.`)) return;
                      
                      const archivedProject = { ...editedProject, archived: true };
                      const updatedProjects = projects.map(p => p.id === archivedProject.id ? archivedProject : p);
                      setProjects(updatedProjects);
                      await saveProjectsToDb(updatedProjects);
                      setIsEditingProject(false);
                      setEditedProject(null);
                      setCurrentView('projectList');
                    }}
                    className="bg-yellow-600 hover:bg-yellow-700 text-white px-4 py-2 rounded-lg transition-colors"
                  >
                    Archive
                  </button>
                )}
                <button
                  onClick={async () => {
                    if (!confirm(`Are you sure you want to permanently delete "${editedProject.name}"? This cannot be undone.`)) return;
                    
                    const updatedProjects = projects.filter(p => p.id !== editedProject.id);
                    setProjects(updatedProjects);
                    await deleteProjectFromDb(editedProject.id);
                    setIsEditingProject(false);
                    setEditedProject(null);
                    setCurrentView('projectList');
                  }}
                  className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg transition-colors"
                >
                  Delete
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsEditingProject(false);
                    setEditedProject(null);
                  }}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
import React, { useState, useEffect } from 'react';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import KanbanBoard from './KanbanBoard';

type TeamMember = {
  id: string;
  name: string;
  role: string;
  email: string;
  avatarColor: string;
};

type Project = {
  id: string;
  name: string;
  description: string;
  client: string;
  status: 'planning' | 'active' | 'on-hold' | 'completed';
  startDate: string;
  endDate: string;
  budget: number;
  teamMembers: TeamMember[];
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

type TimeEntry = {
  id: string;
  taskId: string;
  userName: string;
  hours: number;
  date: string;
  notes: string;
  createdAt: string;
};
interface ProjectManagementProps {
  onMenuClick: () => void;
}

const ProjectManagement: React.FC<ProjectManagementProps> = ({ onMenuClick }) => {
  const [supabase, setSupabase] = useState<SupabaseClient | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [currentView, setCurrentView] = useState<'list' | 'detail'>('list');
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [isCreatingProject, setIsCreatingProject] = useState(false);
  const [isEditingProject, setIsEditingProject] = useState(false);
  const [editedProject, setEditedProject] = useState<Project | null>(null);
  const [isCreatingTask, setIsCreatingTask] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [timeEntries, setTimeEntries] = useState<TimeEntry[]>([]);
  const [isLoggingTime, setIsLoggingTime] = useState(false);
  const [timeLogTask, setTimeLogTask] = useState<Task | null>(null);

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
        team_members: p.teamMembers ||[],
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

  const saveTimeEntriesToDb = async (entriesToSave: TimeEntry[]) => {
  if (!supabase) return;
  
  const { error } = await supabase
    .from('time_entries')
    .upsert(entriesToSave.map(e => ({
      id: e.id,
      task_id: e.taskId,
      user_name: e.userName,
      hours: e.hours,
      date: e.date,
      notes: e.notes,
      created_at: e.createdAt,
    })));
  
  if (error) console.error('Error saving time entries:', error);
};

const deleteTimeEntryFromDb = async (entryId: string) => {
  if (!supabase) return;
  
  const { error } = await supabase
    .from('time_entries')
    .delete()
    .eq('id', entryId);
  
  if (error) console.error('Error deleting time entry:', error);
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
        teamMembers: Array.isArray(p.team_members) 
          ? p.team_members.map((member: any) => 
              typeof member === 'string' 
                ? {
                    id: crypto.randomUUID(),
                    name: member,
                    role: '',
                    email: '',
                    avatarColor: `#${Math.floor(Math.random()*16777215).toString(16)}`
                  }
                : member
            )
          : [],
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

    const { data: timeEntryData, error: timeEntryError } = await supabase
      .from('time_entries')
      .select('*');

    if (timeEntryError) {
      console.error('Error loading time entries:', timeEntryError);
      return;
    }

    if (timeEntryData) {
      setTimeEntries(timeEntryData.map(e => ({
        id: e.id,
        taskId: e.task_id,
        userName: e.user_name,
        hours: e.hours,
        date: e.date,
        notes: e.notes || '',
        createdAt: e.created_at,
      })));
    }
  };
  
  loadData();
}, [supabase]);

  const activeProjects = projects.filter(p => !p.archived);

  const handleTaskAssignmentChange = async (taskId: string, newAssignee: string) => {
    const updatedTasks = tasks.map(t => 
      t.id === taskId ? { ...t, assignedTo: newAssignee } : t
    );
    setTasks(updatedTasks);
    await saveTasksToDb(updatedTasks);
  };

  const handleEditTask = (task: Task) => {
    setEditingTask(task);
  };

  // Project List View
  if (currentView === 'list') {
    return (
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-[var(--text-primary)]">Project Management</h1>
            <p className="text-[var(--text-tertiary)]">Manage projects and tasks</p>
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={() => setIsCreatingProject(true)}
              className="px-4 py-2 bg-[var(--accent-primary)] hover:bg-[var(--accent-secondary)] text-white rounded-lg transition-colors"
            >
              + New Project
            </button>
            <button
              onClick={onMenuClick}
              className="md:hidden p-2 rounded-lg hover:bg-[var(--bg-tertiary)]"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {activeProjects.map((project) => (
            <div
              key={project.id}
              className="bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-xl p-6 hover:border-[var(--accent-primary)] transition-colors"
            >
              <div className="flex items-start justify-between mb-3">
                <h3 className="text-xl font-semibold text-[var(--text-primary)]">{project.name}</h3>
                <span className={`px-2 py-1 rounded text-xs font-medium ${
                  project.status === 'active' ? 'bg-green-100 text-green-800' :
                  project.status === 'planning' ? 'bg-blue-100 text-blue-800' :
                  project.status === 'on-hold' ? 'bg-yellow-100 text-yellow-800' :
                  'bg-gray-100 text-gray-800'
                }`}>
                  {project.status}
                </span>
              </div>
              <p className="text-[var(--text-secondary)] text-sm mb-4">{project.description}</p>
              <div className="space-y-2 text-sm mb-4">
                <p><span className="font-medium">Client:</span> {project.client}</p>
                <p><span className="font-medium">Budget:</span> ${project.budget?.toLocaleString() ?? 'N/A'}</p>
                <p><span className="font-medium">Team:</span> {project.teamMembers.length} member(s)</p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    setSelectedProject(project);
                    setCurrentView('detail');
                  }}
                  className="flex-1 bg-[var(--accent-primary)] hover:bg-[var(--accent-secondary)] text-white px-3 py-2 rounded transition-colors text-sm"
                >
                  View Details
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setEditedProject(project);
                    setIsEditingProject(true);
                  }}
                  className="px-3 py-2 border border-[var(--border-primary)] rounded hover:bg-[var(--bg-tertiary)] transition-colors text-sm"
                >
                  Edit
                </button>
              </div>
            </div>
          ))}
        </div>

        {activeProjects.length === 0 && (
          <div className="text-center py-12 bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-xl">
            <p className="text-[var(--text-tertiary)] mb-4">No projects yet</p>
            <button
              onClick={() => setIsCreatingProject(true)}
              className="px-6 py-3 bg-[var(--accent-primary)] hover:bg-[var(--accent-secondary)] text-white rounded-lg transition-colors"
            >
              Create Your First Project
            </button>
          </div>
        )}

        {/* Project Creation Modal */}
        {isCreatingProject && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-[var(--bg-primary)] border border-[var(--border-primary)] rounded-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <h2 className="text-2xl font-bold text-[var(--text-primary)] mb-6">Create New Project</h2>
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
                  <label className="block text-sm font-medium text-[var(--text-primary)] mb-1">
                    Project Name *
                  </label>
                  <input
                    type="text"
                    name="name"
                    required
                    className="w-full px-3 py-2 border border-[var(--border-primary)] rounded-lg bg-[var(--bg-secondary)] text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-primary)]"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-[var(--text-primary)] mb-1">
                    Description
                  </label>
                  <textarea
                    name="description"
                    rows={3}
                    className="w-full px-3 py-2 border border-[var(--border-primary)] rounded-lg bg-[var(--bg-secondary)] text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-primary)]"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-[var(--text-primary)] mb-1">
                    Client *
                  </label>
                  <input
                    type="text"
                    name="client"
                    required
                    className="w-full px-3 py-2 border border-[var(--border-primary)] rounded-lg bg-[var(--bg-secondary)] text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-primary)]"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-[var(--text-primary)] mb-1">
                    Status *
                  </label>
                  <select
                    name="status"
                    required
                    className="w-full px-3 py-2 border border-[var(--border-primary)] rounded-lg bg-[var(--bg-secondary)] text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-primary)]"
                  >
                    <option value="planning">Planning</option>
                    <option value="active">Active</option>
                    <option value="on-hold">On Hold</option>
                    <option value="completed">Completed</option>
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-[var(--text-primary)] mb-1">
                      Start Date *
                    </label>
                    <input
                      type="date"
                      name="startDate"
                      required
                      className="w-full px-3 py-2 border border-[var(--border-primary)] rounded-lg bg-[var(--bg-secondary)] text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-primary)]"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-[var(--text-primary)] mb-1">
                      End Date *
                    </label>
                    <input
                      type="date"
                      name="endDate"
                      required
                      className="w-full px-3 py-2 border border-[var(--border-primary)] rounded-lg bg-[var(--bg-secondary)] text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-primary)]"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-[var(--text-primary)] mb-1">
                    Budget ($) *
                  </label>
                  <input
                    type="number"
                    name="budget"
                    required
                    min="0"
                    step="0.01"
                    className="w-full px-3 py-2 border border-[var(--border-primary)] rounded-lg bg-[var(--bg-secondary)] text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-primary)]"
                  />
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    type="submit"
                    className="flex-1 bg-[var(--accent-primary)] hover:bg-[var(--accent-secondary)] text-white px-4 py-2 rounded-lg transition-colors"
                  >
                    Create Project
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsCreatingProject(false)}
                    className="px-4 py-2 border border-[var(--border-primary)] rounded-lg hover:bg-[var(--bg-tertiary)] transition-colors"
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
            <div className="bg-[var(--bg-primary)] border border-[var(--border-primary)] rounded-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <h2 className="text-2xl font-bold text-[var(--text-primary)] mb-6">Edit Project</h2>
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
                  <label className="block text-sm font-medium text-[var(--text-primary)] mb-1">
                    Project Name *
                  </label>
                  <input
                    type="text"
                    name="name"
                    required
                    defaultValue={editedProject.name}
                    className="w-full px-3 py-2 border border-[var(--border-primary)] rounded-lg bg-[var(--bg-secondary)] text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-primary)]"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-[var(--text-primary)] mb-1">
                    Description
                  </label>
                  <textarea
                    name="description"
                    rows={3}
                    defaultValue={editedProject.description}
                    className="w-full px-3 py-2 border border-[var(--border-primary)] rounded-lg bg-[var(--bg-secondary)] text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-primary)]"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-[var(--text-primary)] mb-1">
                    Client *
                  </label>
                  <input
                    type="text"
                    name="client"
                    required
                    defaultValue={editedProject.client}
                    className="w-full px-3 py-2 border border-[var(--border-primary)] rounded-lg bg-[var(--bg-secondary)] text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-primary)]"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-[var(--text-primary)] mb-1">
                    Status *
                  </label>
                  <select
                    name="status"
                    required
                    defaultValue={editedProject.status}
                    className="w-full px-3 py-2 border border-[var(--border-primary)] rounded-lg bg-[var(--bg-secondary)] text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-primary)]"
                  >
                    <option value="planning">Planning</option>
                    <option value="active">Active</option>
                    <option value="on-hold">On Hold</option>
                    <option value="completed">Completed</option>
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-[var(--text-primary)] mb-1">
                      Start Date *
                    </label>
                    <input
                      type="date"
                      name="startDate"
                      required
                      defaultValue={editedProject.startDate}
                      className="w-full px-3 py-2 border border-[var(--border-primary)] rounded-lg bg-[var(--bg-secondary)] text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-primary)]"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-[var(--text-primary)] mb-1">
                      End Date *
                    </label>
                    <input
                      type="date"
                      name="endDate"
                      required
                      defaultValue={editedProject.endDate}
                      className="w-full px-3 py-2 border border-[var(--border-primary)] rounded-lg bg-[var(--bg-secondary)] text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-primary)]"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-[var(--text-primary)] mb-1">
                    Budget ($) *
                  </label>
                  <input
                    type="number"
                    name="budget"
                    required
                    min="0"
                    step="0.01"
                    defaultValue={editedProject.budget}
                    className="w-full px-3 py-2 border border-[var(--border-primary)] rounded-lg bg-[var(--bg-secondary)] text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-primary)]"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-[var(--text-primary)] mb-1">
                    Team Members
                  </label>
                  <div className="space-y-2">
                    {editedProject.teamMembers.map((member, index) => (
                      <div key={member.id} className="grid grid-cols-2 gap-2">
                        <input
                          type="text"
                          value={member.name}
                          onChange={(e) => {
                            const newMembers = [...editedProject.teamMembers];
                            newMembers[index] = { ...member, name: e.target.value };
                            setEditedProject({ ...editedProject, teamMembers: newMembers });
                        }}
                        placeholder="Name"
                        className="px-3 py-2 border border-[var(--border-primary)] rounded-lg bg-[var(--bg-secondary)] text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-primary)]"
                    />
                    <input
                        type="text"
                        value={member.email}
                        onChange={(e) => {
                          const newMembers = [...editedProject.teamMembers];
                          newMembers[index] = { ...member, email: e.target.value };
                          setEditedProject({ ...editedProject, teamMembers: newMembers });
                         }}
                         placeholder="Email"
                         className="px-3 py-2 border border-[var(--border-primary)] rounded-lg bg-[var(--bg-secondary)] text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-primary)]"
                    />
                    <input
                        type="text"
                        value={member.role}
                        onChange={(e) => {
                            const newMembers = [...editedProject.teamMembers];
                            newMembers[index] = { ...member, role: e.target.value };
                            setEditedProject({ ...editedProject, teamMembers: newMembers });
                    }}
                            placeholder="Role"
                            className="px-3 py-2 border border-[var(--border-primary)] rounded-lg bg-[var(--bg-secondary)] text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-primary)]"
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
                            teamMembers: [
                                ...editedProject.teamMembers, 
                                {
                                id: crypto.randomUUID(),
                                name: '',
                                role: '',
                                email: '',
                                avatarColor: `#${Math.floor(Math.random()*16777215).toString(16)}`
                                }
                            ] 
                            });
                        }}
                        className="w-full px-3 py-2 border-2 border-dashed border-[var(--border-primary)] rounded-lg hover:border-[var(--accent-primary)] hover:bg-[var(--bg-tertiary)] transition-colors text-[var(--text-tertiary)]"
                        >
                        + Add Team Member
                        </button>
                    </div>
                    </div>

                <div className="flex gap-3 pt-4">
                  <button
                    type="submit"
                    className="flex-1 bg-[var(--accent-primary)] hover:bg-[var(--accent-secondary)] text-white px-4 py-2 rounded-lg transition-colors"
                  >
                    Save Changes
                  </button>
                  {editedProject.archived ? (
                    <button
                      type="button"
                      onClick={async () => {
                        const unarchivedProject = { ...editedProject, archived: false };
                        const updatedProjects = projects.map(p => p.id === unarchivedProject.id ? unarchivedProject : p);
                        setProjects(updatedProjects);
                        await saveProjectsToDb(updatedProjects);
                        setIsEditingProject(false);
                        setEditedProject(null);
                      }}
                      className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition-colors"
                    >
                      Unarchive
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={async () => {
                        if (!confirm(`Archive "${editedProject.name}"?`)) return;
                        
                        const archivedProject = { ...editedProject, archived: true };
                        const updatedProjects = projects.map(p => p.id === archivedProject.id ? archivedProject : p);
                        setProjects(updatedProjects);
                        await saveProjectsToDb(updatedProjects);
                        setIsEditingProject(false);
                        setEditedProject(null);
                      }}
                      className="bg-yellow-600 hover:bg-yellow-700 text-white px-4 py-2 rounded-lg transition-colors"
                    >
                      Archive
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={async () => {
                      if (!confirm(`Permanently delete "${editedProject.name}"?`)) return;
                      
                      const updatedProjects = projects.filter(p => p.id !== editedProject.id);
                      setProjects(updatedProjects);
                      await deleteProjectFromDb(editedProject.id);
                      setIsEditingProject(false);
                      setEditedProject(null);
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
                    className="px-4 py-2 border border-[var(--border-primary)] rounded-lg hover:bg-[var(--bg-tertiary)] transition-colors"
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

  // Project Detail View with Kanban
  if (currentView === 'detail' && selectedProject) {
    const projectTasks = tasks.filter(t => t.projectId === selectedProject.id);

    return (
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center">
            <button
              onClick={() => setCurrentView('list')}
              className="mr-4 p-2 rounded-lg hover:bg-[var(--bg-tertiary)] text-[var(--text-tertiary)] hover:text-[var(--text-primary)] transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <div>
              <h1 className="text-2xl font-bold text-[var(--text-primary)]">{selectedProject.name}</h1>
              <p className="text-[var(--text-tertiary)]">{selectedProject.description}</p>
            </div>
          </div>
          <button
            onClick={() => setIsCreatingTask(true)}
            className="px-4 py-2 bg-[var(--accent-primary)] hover:bg-[var(--accent-secondary)] text-white rounded-lg transition-colors"
          >
            Add Task
          </button>
        </div>

        <KanbanBoard
  project={selectedProject}
  tasks={projectTasks}
  onTaskAssignmentChange={handleTaskAssignmentChange}
  onEditTask={handleEditTask}
  onLogTime={(task) => {
    setTimeLogTask(task);
    setIsLoggingTime(true);
  }}
/>

{/* Task Creation/Edit Modal */}
{(isCreatingTask || editingTask) && selectedProject && (
  <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
    <div className="bg-[var(--bg-primary)] border border-[var(--border-primary)] rounded-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
      <h2 className="text-2xl font-bold text-[var(--text-primary)] mb-6">
        {editingTask ? 'Edit Task' : 'Create New Task'}
      </h2>
      <form
        onSubmit={async (e) => {
          e.preventDefault();
          const formData = new FormData(e.currentTarget);
          
          if (editingTask) {
            const updatedTask: Task = {
              ...editingTask,
              title: formData.get('title') as string,
              description: formData.get('description') as string,
              assignedTo: formData.get('assignedTo') as string,
              status: formData.get('status') as Task['status'],
              priority: formData.get('priority') as Task['priority'],
              dueDate: formData.get('dueDate') as string,
              estimatedHours: Number(formData.get('estimatedHours')),
            };

            const updatedTasks = tasks.map(t => t.id === updatedTask.id ? updatedTask : t);
            setTasks(updatedTasks);
            await saveTasksToDb(updatedTasks);
            setEditingTask(null);
          } else {
            const newTask: Task = {
              id: crypto.randomUUID(),
              projectId: selectedProject.id,
              title: formData.get('title') as string,
              description: formData.get('description') as string,
              assignedTo: formData.get('assignedTo') as string,
              status: formData.get('status') as Task['status'],
              priority: formData.get('priority') as Task['priority'],
              dueDate: formData.get('dueDate') as string,
              estimatedHours: Number(formData.get('estimatedHours')),
              actualHours: 0,
              createdAt: new Date().toISOString(),
            };

            const updatedTasks = [...tasks, newTask];
            setTasks(updatedTasks);
            await saveTasksToDb(updatedTasks);
            setIsCreatingTask(false);
          }
        }}
        className="space-y-4"
      >
        <div>
          <label className="block text-sm font-medium text-[var(--text-primary)] mb-1">
            Task Title *
          </label>
          <input
            type="text"
            name="title"
            required
            defaultValue={editingTask?.title || ''}
            className="w-full px-3 py-2 border border-[var(--border-primary)] rounded-lg bg-[var(--bg-secondary)] text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-primary)]"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-[var(--text-primary)] mb-1">
            Description
          </label>
          <textarea
            name="description"
            rows={3}
            defaultValue={editingTask?.description || ''}
            className="w-full px-3 py-2 border border-[var(--border-primary)] rounded-lg bg-[var(--bg-secondary)] text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-primary)]"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-[var(--text-primary)] mb-1">
            Assigned To
          </label>
          <input
            type="text"
            name="assignedTo"
            defaultValue={editingTask?.assignedTo || ''}
            className="w-full px-3 py-2 border border-[var(--border-primary)] rounded-lg bg-[var(--bg-secondary)] text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-primary)]"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-[var(--text-primary)] mb-1">
              Status *
            </label>
            <select
              name="status"
              required
              defaultValue={editingTask?.status || 'todo'}
              className="w-full px-3 py-2 border border-[var(--border-primary)] rounded-lg bg-[var(--bg-secondary)] text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-primary)]"
            >
              <option value="todo">To Do</option>
              <option value="in-progress">In Progress</option>
              <option value="done">Done</option>
              <option value="blocked">Blocked</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-[var(--text-primary)] mb-1">
              Priority *
            </label>
            <select
              name="priority"
              required
              defaultValue={editingTask?.priority || 'medium'}
              className="w-full px-3 py-2 border border-[var(--border-primary)] rounded-lg bg-[var(--bg-secondary)] text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-primary)]"
            >
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
              <option value="critical">Critical</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-[var(--text-primary)] mb-1">
              Due Date *
            </label>
            <input
              type="date"
              name="dueDate"
              required
              defaultValue={editingTask?.dueDate || ''}
              className="w-full px-3 py-2 border border-[var(--border-primary)] rounded-lg bg-[var(--bg-secondary)] text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-primary)]"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-[var(--text-primary)] mb-1">
              Estimated Hours
            </label>
            <input
              type="number"
              name="estimatedHours"
              min="0"
              step="0.5"
              defaultValue={editingTask?.estimatedHours || 0}
              className="w-full px-3 py-2 border border-[var(--border-primary)] rounded-lg bg-[var(--bg-secondary)] text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-primary)]"
            />
          </div>
        </div>

        <div className="flex gap-3 pt-4">
          <button
            type="submit"
            className="flex-1 bg-[var(--accent-primary)] hover:bg-[var(--accent-secondary)] text-white px-4 py-2 rounded-lg transition-colors"
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
            className="px-4 py-2 border border-[var(--border-primary)] rounded-lg hover:bg-[var(--bg-tertiary)] transition-colors"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  </div>
)}

{/* Time Logging Modal - NOW PROPERLY POSITIONED AS SIBLING */}
{isLoggingTime && timeLogTask && (
  <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
    <div className="bg-[var(--bg-primary)] border border-[var(--border-primary)] rounded-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
      <h2 className="text-2xl font-bold text-[var(--text-primary)] mb-6">
        Log Time - {timeLogTask.title}
      </h2>
      
      <form
        onSubmit={async (e) => {
          e.preventDefault();
          const formData = new FormData(e.currentTarget);
          
          const newEntry: TimeEntry = {
            id: crypto.randomUUID(),
            taskId: timeLogTask.id,
            userName: formData.get('userName') as string,
            hours: Number(formData.get('hours')),
            date: formData.get('date') as string,
            notes: formData.get('notes') as string || '',
            createdAt: new Date().toISOString(),
          };

          const updatedEntries = [...timeEntries, newEntry];
          setTimeEntries(updatedEntries);
          await saveTimeEntriesToDb(updatedEntries);
          
          // Update task actual hours
          const taskEntries = updatedEntries.filter(e => e.taskId === timeLogTask.id);
          const totalHours = taskEntries.reduce((sum, e) => sum + e.hours, 0);
          const updatedTasks = tasks.map(t => 
            t.id === timeLogTask.id ? { ...t, actualHours: totalHours } : t
          );
          setTasks(updatedTasks);
          await saveTasksToDb(updatedTasks);
          
          setIsLoggingTime(false);
          setTimeLogTask(null);
        }}
        className="space-y-4"
      >
        <div>
          <label className="block text-sm font-medium text-[var(--text-primary)] mb-1">
            Your Name *
          </label>
          <input
            type="text"
            name="userName"
            required
            className="w-full px-3 py-2 border border-[var(--border-primary)] rounded-lg bg-[var(--bg-secondary)] text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-primary)]"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-[var(--text-primary)] mb-1">
            Hours Worked *
          </label>
          <input
            type="number"
            name="hours"
            required
            min="0.1"
            step="0.1"
            className="w-full px-3 py-2 border border-[var(--border-primary)] rounded-lg bg-[var(--bg-secondary)] text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-primary)]"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-[var(--text-primary)] mb-1">
            Date *
          </label>
          <input
            type="date"
            name="date"
            required
            defaultValue={new Date().toISOString().split('T')[0]}
            className="w-full px-3 py-2 border border-[var(--border-primary)] rounded-lg bg-[var(--bg-secondary)] text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-primary)]"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-[var(--text-primary)] mb-1">
            Notes
          </label>
          <textarea
            name="notes"
            rows={3}
            className="w-full px-3 py-2 border border-[var(--border-primary)] rounded-lg bg-[var(--bg-secondary)] text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-primary)]"
          />
        </div>

        {/* Show existing time entries for this task */}
        {timeEntries.filter(e => e.taskId === timeLogTask.id).length > 0 && (
          <div className="mt-6">
            <h3 className="font-medium text-[var(--text-primary)] mb-3">Previous Time Logs</h3>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {timeEntries
                .filter(e => e.taskId === timeLogTask.id)
                .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                .map(entry => (
                  <div key={entry.id} className="bg-[var(--bg-tertiary)] p-3 rounded-lg text-sm">
                    <div className="flex justify-between items-start mb-1">
                      <span className="font-medium text-[var(--text-primary)]">{entry.userName}</span>
                      <button
                        type="button"
                        onClick={async () => {
                          const updatedEntries = timeEntries.filter(e => e.id !== entry.id);
                          setTimeEntries(updatedEntries);
                          await deleteTimeEntryFromDb(entry.id);
                          
                          // Recalculate task actual hours
                          const taskEntries = updatedEntries.filter(e => e.taskId === timeLogTask.id);
                          const totalHours = taskEntries.reduce((sum, e) => sum + e.hours, 0);
                          const updatedTasks = tasks.map(t => 
                            t.id === timeLogTask.id ? { ...t, actualHours: totalHours } : t
                          );
                          setTasks(updatedTasks);
                          await saveTasksToDb(updatedTasks);
                        }}
                        className="text-red-600 hover:text-red-800 text-xs"
                      >
                        Delete
                      </button>
                    </div>
                    <div className="text-[var(--text-secondary)]">
                      {entry.hours}h on {new Date(entry.date).toLocaleDateString()}
                    </div>
                    {entry.notes && (
                      <p className="text-[var(--text-tertiary)] mt-1">{entry.notes}</p>
                    )}
                  </div>
                ))}
            </div>
          </div>
        )}

        <div className="flex gap-3 pt-4">
          <button
            type="submit"
            className="flex-1 bg-[var(--accent-primary)] hover:bg-[var(--accent-secondary)] text-white px-4 py-2 rounded-lg transition-colors"
          >
            Log Time
          </button>
          <button
            type="button"
            onClick={() => {
              setIsLoggingTime(false);
              setTimeLogTask(null);
            }}
            className="px-4 py-2 border border-[var(--border-primary)] rounded-lg hover:bg-[var(--bg-tertiary)] transition-colors"
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

  return null;
};

export default ProjectManagement;
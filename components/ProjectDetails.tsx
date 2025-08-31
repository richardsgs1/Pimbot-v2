
import React, { useState, useRef, FormEvent, useMemo } from 'react';
import type { Project, Task, JournalEntry, TeamMember } from '../types';
import { ProjectStatus, Priority } from '../types';

interface ProjectDetailsProps {
  project: Project;
  onBack: () => void;
  onUpdateProject: (updatedProject: Project) => void;
  team: TeamMember[];
}

const statusColors: { [key in ProjectStatus]: { bg: string, text: string, dot: string, border: string } } = {
  [ProjectStatus.OnTrack]: { bg: 'bg-green-500/10', text: 'text-green-400', dot: 'bg-green-400', border: 'border-green-500/20' },
  [ProjectStatus.AtRisk]: { bg: 'bg-yellow-500/10', text: 'text-yellow-400', dot: 'bg-yellow-400', border: 'border-yellow-500/20' },
  [ProjectStatus.OffTrack]: { bg: 'bg-red-500/10', text: 'text-red-400', dot: 'bg-red-400', border: 'border-red-500/20' },
  [ProjectStatus.Completed]: { bg: 'bg-blue-500/10', text: 'text-blue-400', dot: 'bg-blue-400', border: 'border-blue-500/20' },
};

const priorityColors: { [key in Priority]: { border: string } } = {
    [Priority.High]: { border: 'border-red-500' },
    [Priority.Medium]: { border: 'border-yellow-500' },
    [Priority.Low]: { border: 'border-blue-500' },
    [Priority.None]: { border: 'border-slate-600' },
};

const Avatar: React.FC<{ member?: TeamMember }> = ({ member }) => {
    if (!member) return <div className="w-6 h-6 rounded-full bg-slate-600 border-2 border-slate-800" title="Unassigned"></div>;
    return (
        <div className={`w-6 h-6 rounded-full ${member.avatarColor} flex items-center justify-center text-xs font-bold text-white border-2 border-slate-800`} title={member.name}>
            {member.name.charAt(0).toUpperCase()}
        </div>
    );
};


// --- Icon Components ---
const CalendarIcon: React.FC = () => ( <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg> );
const EditIcon: React.FC = () => ( <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.536L16.732 3.732z" /></svg> );
const DeleteIcon: React.FC = () => ( <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg> );
const DependencyIcon: React.FC<{ title: string }> = ({ title }) => ( <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 text-slate-500 ml-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><title>{title}</title><path strokeLinecap="round" strokeLinejoin="round" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" /></svg> );

// --- Helper Function ---
const addJournalEntry = (currentProject: Project, content: string): Project => {
  const newEntry: JournalEntry = {
    id: `j-${Date.now()}-${Math.random()}`,
    date: new Date().toISOString(),
    content,
  };
  return { ...currentProject, journal: [newEntry, ...(currentProject.journal || [])] };
};

// --- Main Component ---
const ProjectDetails: React.FC<ProjectDetailsProps> = ({ project, onBack, onUpdateProject, team }) => {
    const colors = statusColors[project.status];
    
    // Modal State
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [taskToEdit, setTaskToEdit] = useState<Task | null>(null);
    const [completionModalState, setCompletionModalState] = useState<{ isOpen: boolean; taskId: string | null; note: string }>({ isOpen: false, taskId: null, note: '' });

    // New Task State
    const [newTaskName, setNewTaskName] = useState('');
    const [newTaskDueDate, setNewTaskDueDate] = useState('');
    const [newTaskPriority, setNewTaskPriority] = useState<Priority>(Priority.None);
    const [newTaskDependency, setNewTaskDependency] = useState('');
    const [newTaskAssignee, setNewTaskAssignee] = useState('');
    
    // Drag & Drop State
    const [draggedTaskId, setDraggedTaskId] = useState<string | null>(null);

    // AI Suggestions State
    const [suggestions, setSuggestions] = useState<string[]>([]);
    const [isSuggesting, setIsSuggesting] = useState(false);
    const [suggestionError, setSuggestionError] = useState<string | null>(null);
    const suggestionsFetched = useRef(false);

    // Journal State
    const [newJournalNote, setNewJournalNote] = useState('');

    const tasksById = useMemo(() => project.tasks.reduce((acc, task) => { acc[task.id] = task; return acc; }, {} as Record<string, Task>), [project.tasks]);
    const teamById = useMemo(() => team.reduce((acc, member) => { acc[member.id] = member; return acc; }, {} as Record<string, TeamMember>), [team]);

    const formattedDate = new Date(project.dueDate + 'T00:00:00').toLocaleString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
    
    const isTaskOverdue = (task: Task) => task.dueDate && !task.completed && new Date(task.dueDate) < new Date();
    const isTaskBlocked = (taskId: string): boolean => {
        const task = tasksById[taskId];
        if (!task || !task.dependsOn) return false;
        const dependency = tasksById[task.dependsOn];
        return dependency ? !dependency.completed : false;
    };
    const getDependencyName = (taskId?: string): string => (taskId && tasksById[taskId]) ? tasksById[taskId].name : '';

    const recalculateProjectState = (tasks: Task[], currentStatus: ProjectStatus) => {
        const totalTasks = tasks.length;
        if (totalTasks === 0) return { progress: 0, status: ProjectStatus.OnTrack };
        const completedTasks = tasks.filter(t => t.completed).length;
        const newProgress = Math.round((completedTasks / totalTasks) * 100);
        
        let newStatus = currentStatus;
        const hasOverdueTasks = tasks.some(isTaskOverdue);

        if (newProgress === 100) newStatus = ProjectStatus.Completed;
        else if (hasOverdueTasks && currentStatus !== ProjectStatus.OffTrack) newStatus = ProjectStatus.AtRisk;
        else if (!hasOverdueTasks) newStatus = ProjectStatus.OnTrack;
        
        return { progress: newProgress, status: newStatus };
    }

    const handleToggleTask = (taskId: string) => {
        if (isTaskBlocked(taskId)) return;
        const task = tasksById[taskId];
        if (!task) return;

        if (!task.completed) {
            setCompletionModalState({ isOpen: true, taskId, note: '' });
        } else {
            const newTasks = project.tasks.map(t => t.id === taskId ? { ...t, completed: false } : t);
            const { progress, status } = recalculateProjectState(newTasks, project.status);
            const updatedProject = addJournalEntry({ ...project, tasks: newTasks, progress, status }, `Task "${task.name}" marked as incomplete.`);
            onUpdateProject(updatedProject);
        }
    };

    const handleCompleteTaskWithNote = (e: FormEvent) => {
        e.preventDefault();
        const { taskId, note } = completionModalState;
        if (!taskId) return;

        const task = tasksById[taskId];
        if (!task) return;

        const newTasks = project.tasks.map(t => t.id === taskId ? { ...t, completed: true } : t);
        const { progress, status } = recalculateProjectState(newTasks, project.status);
        const journalContent = `Task "${task.name}" completed.${note.trim() ? ` Note: ${note.trim()}` : ''}`;
        const updatedProject = addJournalEntry({ ...project, tasks: newTasks, progress, status }, journalContent);
        onUpdateProject(updatedProject);
        setCompletionModalState({ isOpen: false, taskId: null, note: '' });
    };

    const handleOpenEditModal = (task: Task) => {
        setTaskToEdit(task);
        setIsEditModalOpen(true);
    };

    const handleSaveTask = (updatedTask: Task) => {
        const originalTask = tasksById[updatedTask.id];
        if (!originalTask) return;

        const newTasks = project.tasks.map(task => task.id === updatedTask.id ? updatedTask : task);
        
        const changes: string[] = [];
        if (originalTask.name !== updatedTask.name) changes.push(`name changed to "${updatedTask.name}"`);
        if (originalTask.priority !== updatedTask.priority) changes.push(`priority set to "${updatedTask.priority}"`);
        if (originalTask.dueDate !== updatedTask.dueDate) changes.push(`due date changed to ${updatedTask.dueDate || 'none'}`);
        if (originalTask.dependsOn !== updatedTask.dependsOn) changes.push(updatedTask.dependsOn ? `dependency set to "${getDependencyName(updatedTask.dependsOn)}"` : `dependency removed`);
        if (originalTask.assigneeId !== updatedTask.assigneeId) changes.push(updatedTask.assigneeId ? `assigned to "${teamById[updatedTask.assigneeId]?.name}"` : `unassigned`);

        let updatedProject = { ...project, tasks: newTasks };
        if (changes.length > 0) {
          updatedProject = addJournalEntry(updatedProject, `For task "${originalTask.name}", ${changes.join(', ')}.`);
        }
        
        const { progress, status } = recalculateProjectState(newTasks, updatedProject.status);
        onUpdateProject({ ...updatedProject, progress, status });
        setIsEditModalOpen(false);
        setTaskToEdit(null);
    };

    const handleDeleteTask = (taskIdToDelete: string) => {
        const taskToDelete = tasksById[taskIdToDelete];
        if (!taskToDelete) return;

        let updatedTasks = project.tasks.map(task => task.dependsOn === taskIdToDelete ? { ...task, dependsOn: undefined } : task);
        const newTasks = updatedTasks.filter(task => task.id !== taskIdToDelete);
        const { progress, status } = recalculateProjectState(newTasks, project.status);
        const updatedProject = addJournalEntry({ ...project, tasks: newTasks, progress, status }, `Task "${taskToDelete.name}" was deleted.`);
        onUpdateProject(updatedProject);
    };

    const handleDragStart = (e: React.DragEvent, taskId: string) => { e.dataTransfer.setData('text/plain', taskId); setDraggedTaskId(taskId); };
    const handleDragOver = (e: React.DragEvent) => e.preventDefault();
    const handleDrop = (e: React.DragEvent, targetTaskId: string) => {
        e.preventDefault();
        const draggedId = e.dataTransfer.getData('text/plain');
        setDraggedTaskId(null);
        if (draggedId === targetTaskId) return;

        const tasks = [...project.tasks];
        const draggedIndex = tasks.findIndex(t => t.id === draggedId);
        const [draggedItem] = tasks.splice(draggedIndex, 1);
        const targetIndex = tasks.findIndex(t => t.id === targetTaskId);
        tasks.splice(targetIndex, 0, draggedItem);
        
        const updatedProject = addJournalEntry({ ...project, tasks }, `Task "${draggedItem.name}" was reordered.`);
        onUpdateProject(updatedProject);
    };

    const handleAddTask = (e: FormEvent) => {
        e.preventDefault();
        const taskName = newTaskName.trim();
        if (!taskName) return;
        
        const newTask: Task = {
            id: `task-${Date.now()}-${Math.random()}`, name: taskName, completed: false,
            priority: newTaskPriority, dueDate: newTaskDueDate || undefined, dependsOn: newTaskDependency || undefined, assigneeId: newTaskAssignee || undefined
        };

        const newTasks = [...project.tasks, newTask];
        const { progress, status } = recalculateProjectState(newTasks, project.status);
        const updatedProject = addJournalEntry({ ...project, tasks: newTasks, progress, status }, `New task "${taskName}" was added.`);
        onUpdateProject(updatedProject);
        
        setNewTaskName(''); setNewTaskDueDate(''); setNewTaskPriority(Priority.None); setNewTaskDependency(''); setNewTaskAssignee('');
        setSuggestions([]); suggestionsFetched.current = false;
    };

    const fetchSuggestions = async () => {
        if (suggestionsFetched.current || isSuggesting) return;
        setIsSuggesting(true); setSuggestionError(null); suggestionsFetched.current = true;
        try {
            const response = await fetch('/api/suggest-tasks', {
                method: 'POST', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ projectDescription: project.description, tasks: project.tasks.map(t => ({ name: t.name, completed: t.completed })) }),
            });
            if (!response.ok) { const errorData = await response.json(); throw new Error(errorData.error || 'Failed to get suggestions.'); }
            const data = await response.json(); setSuggestions(data.suggestions || []);
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred.'; setSuggestionError(errorMessage);
        } finally {
            setIsSuggesting(false);
        }
    };

    const handleAddJournalNote = (e: FormEvent) => {
      e.preventDefault();
      const note = newJournalNote.trim();
      if (!note) return;
      onUpdateProject(addJournalEntry(project, note));
      setNewJournalNote('');
    };
    
    return (
      <>
        <div className="flex flex-col h-full">
            <header className="flex items-center p-4 border-b border-slate-700 bg-slate-800/50 backdrop-blur-sm flex-shrink-0">
                <button onClick={onBack} className="flex items-center text-slate-300 hover:text-white transition">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
                    Back to Projects
                </button>
            </header>
            <div className="flex-1 overflow-y-auto p-6">
                <div className="max-w-7xl mx-auto">
                    {/* Project Header */}
                    <div className={`bg-slate-800 border ${colors.border} rounded-xl p-6 mb-6`}>
                        <div className="flex justify-between items-start">
                            <h1 className="text-3xl font-bold text-white">{project.name}</h1>
                             <div className={`flex items-center px-2.5 py-1 rounded-full text-sm font-medium ${colors.bg} ${colors.text}`}>
                                <span className={`w-2 h-2 mr-2 rounded-full ${colors.dot}`}></span>{project.status}
                            </div>
                        </div>
                        <p className="text-slate-400 mt-2">Due: {formattedDate}</p>
                        <div className="mt-6">
                            <div className="flex justify-between items-center mb-1"><span className="text-sm font-medium text-slate-400">Progress</span><span className="text-sm font-medium text-white">{project.progress}%</span></div>
                            <div className="w-full bg-slate-700 rounded-full h-2.5"><div className="bg-cyan-500 h-2.5 rounded-full" style={{ width: `${project.progress}%` }}></div></div>
                        </div>
                    </div>
                    {/* Project Body */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        <div className="lg:col-span-2">
                             <div className="bg-slate-800 rounded-xl p-6 mb-6">
                                <h2 className="text-xl font-bold text-white mb-4">Description</h2>
                                <p className="text-slate-300 leading-relaxed whitespace-pre-wrap">{project.description}</p>
                            </div>
                             <div className="bg-slate-800 rounded-xl p-6">
                                <h2 className="text-xl font-bold text-white mb-4">Project Journal</h2>
                                <form onSubmit={handleAddJournalNote} className="mb-4">
                                  <textarea value={newJournalNote} onChange={(e) => setNewJournalNote(e.target.value)} className="w-full bg-slate-700 border border-slate-600 rounded-md text-white px-3 py-2 focus:outline-none focus:ring-2 focus:ring-cyan-500 transition" placeholder="Add a new note or update..." rows={2}/>
                                  <button type="submit" className="mt-2 text-sm bg-cyan-600 hover:bg-cyan-500 text-white font-semibold py-1 px-3 rounded-md transition disabled:opacity-50" disabled={!newJournalNote.trim()}>Add Note</button>
                                </form>
                                <div className="space-y-4 max-h-96 overflow-y-auto pr-2">
                                  {(project.journal || []).map(entry => (
                                    <div key={entry.id} className="text-sm border-l-2 border-slate-700 pl-3">
                                      <p className="text-slate-300 whitespace-pre-wrap">{entry.content}</p>
                                      <p className="text-xs text-slate-500 mt-1">{new Date(entry.date).toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' })}</p>
                                    </div>
                                  ))}
                                </div>
                            </div>
                        </div>
                        <div className="lg:col-span-1">
                             <div className="bg-slate-800 rounded-xl p-6">
                                <h2 className="text-xl font-bold text-white mb-4">Tasks</h2>
                                <div className="space-y-2">
                                    {project.tasks.map(task => {
                                        const isBlocked = isTaskBlocked(task.id); const dependencyName = getDependencyName(task.dependsOn); const checkboxTitle = isBlocked ? `Blocked by: "${dependencyName}"` : 'Mark task complete';
                                        return (
                                        <div key={task.id} draggable onDragStart={(e) => handleDragStart(e, task.id)} onDragOver={handleDragOver} onDrop={(e) => handleDrop(e, task.id)} onDragEnd={() => setDraggedTaskId(null)}
                                            onDoubleClick={() => handleOpenEditModal(task)}
                                            className={`group relative p-3 rounded-lg transition-all ${task.completed ? 'bg-slate-700/50' : 'bg-slate-900/50'} ${draggedTaskId === task.id ? 'opacity-50' : 'opacity-100'} border-l-4 ${priorityColors[task.priority].border} hover:bg-slate-700/50`}>
                                            <div className="flex items-start">
                                                <div title={checkboxTitle} className="flex-shrink-0 mt-0.5">
                                                    <input type="checkbox" checked={task.completed} onChange={() => handleToggleTask(task.id)} disabled={isBlocked} className="h-5 w-5 rounded border-slate-500 text-cyan-600 focus:ring-cyan-500 bg-slate-900 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"/>
                                                </div>
                                                <div className="ml-3 flex-grow cursor-pointer" onClick={() => handleOpenEditModal(task)}>
                                                    <div className="flex items-center">
                                                      <span className={`${task.completed ? 'text-slate-400 line-through' : 'text-slate-200'}`}>{task.name}</span>
                                                      {task.dependsOn && <DependencyIcon title={`Depends on: "${dependencyName}"`} />}
                                                    </div>
                                                    {task.dueDate && (
                                                        <div className={`flex items-center text-xs mt-1 ${isTaskOverdue(task) ? 'text-red-400' : 'text-slate-400'}`}>
                                                            <CalendarIcon />{new Date(task.dueDate + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                                                        </div>
                                                    )}
                                                </div>
                                                <div className="ml-auto pl-2 flex-shrink-0"><Avatar member={teamById[task.assigneeId || '']} /></div>
                                            </div>
                                            <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button onClick={() => handleOpenEditModal(task)} className="p-1 text-slate-400 hover:text-white" title="Edit task"><EditIcon /></button>
                                                <button onClick={() => handleDeleteTask(task.id)} className="p-1 text-slate-400 hover:text-red-400" title="Delete task"><DeleteIcon /></button>
                                            </div>
                                        </div>
                                        )
                                    })}
                                </div>
                                <div className="mt-4 pt-4 border-t border-slate-700/50">
                                    <form onSubmit={handleAddTask}>
                                        <input type="text" value={newTaskName} onChange={(e) => setNewTaskName(e.target.value)} onFocus={fetchSuggestions} className="w-full bg-slate-700 border border-slate-600 rounded-md text-white px-3 py-2 focus:outline-none focus:ring-2 focus:ring-cyan-500 transition" placeholder="+ Add new task"/>
                                        <div className="grid grid-cols-2 gap-2 mt-2">
                                            <input type="date" value={newTaskDueDate} onChange={(e) => setNewTaskDueDate(e.target.value)} className="bg-slate-700 text-slate-400 border border-slate-600 text-sm rounded p-1 focus:outline-none focus:ring-1 focus:ring-cyan-500" />
                                            <select value={newTaskPriority} onChange={(e) => setNewTaskPriority(e.target.value as Priority)} className="bg-slate-700 text-slate-400 border border-slate-600 text-sm rounded p-1 focus:outline-none focus:ring-1 focus:ring-cyan-500">
                                                {Object.values(Priority).map(p => (<option key={p} value={p}>{p}</option>))}
                                            </select>
                                            <select value={newTaskDependency} onChange={(e) => setNewTaskDependency(e.target.value)} className="col-span-2 w-full bg-slate-700 text-slate-400 border border-slate-600 text-sm rounded p-1 focus:outline-none focus:ring-1 focus:ring-cyan-500">
                                                <option value="">No dependency</option>
                                                {project.tasks.map(t => (<option key={t.id} value={t.id}>{t.name}</option>))}
                                            </select>
                                            <select value={newTaskAssignee} onChange={(e) => setNewTaskAssignee(e.target.value)} className="col-span-2 w-full bg-slate-700 text-slate-400 border border-slate-600 text-sm rounded p-1 focus:outline-none focus:ring-1 focus:ring-cyan-500">
                                                <option value="">Unassigned</option>
                                                {team.map(member => (<option key={member.id} value={member.id}>{member.name}</option>))}
                                            </select>
                                        </div>
                                        <button type="submit" className="w-full mt-2 text-sm bg-cyan-600 hover:bg-cyan-500 text-white font-semibold py-1.5 px-3 rounded-md transition">Add Task</button>
                                    </form>
                                    {isSuggesting && <p className="text-slate-400 text-sm mt-2">Getting AI suggestions...</p>} {suggestionError && <p className="text-red-400 text-sm mt-2">{suggestionError}</p>}
                                    {suggestions.length > 0 && (
                                        <div className="mt-2 flex flex-wrap gap-2"><p className="text-xs text-slate-400 w-full">Suggestions:</p>{suggestions.map((s, i) => (<button key={i} onClick={() => setNewTaskName(s)} className="bg-slate-600/50 hover:bg-slate-600 text-cyan-300 text-xs px-2 py-1 rounded-full transition">{s}</button>))}</div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        {isEditModalOpen && taskToEdit && (
            <EditTaskModal 
                task={taskToEdit}
                projectTasks={project.tasks}
                team={team}
                onClose={() => setIsEditModalOpen(false)}
                onSave={handleSaveTask}
            />
        )}
        
        {completionModalState.isOpen && (
            <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4" aria-modal="true" role="dialog">
                <form onSubmit={handleCompleteTaskWithNote} className="bg-slate-800 border border-slate-700 rounded-2xl shadow-2xl w-full max-w-md relative p-8">
                    <h2 className="text-2xl font-bold text-white mb-2">Complete Task</h2>
                    <p className="text-slate-400 mb-6">Add a note to the project journal for this completion. (Optional)</p>
                    <textarea
                        value={completionModalState.note}
                        onChange={(e) => setCompletionModalState(s => ({ ...s, note: e.target.value }))}
                        className="w-full bg-slate-700 border border-slate-600 rounded-lg resize-none text-white p-4 focus:outline-none focus:ring-2 focus:ring-cyan-500 transition h-24"
                        placeholder="e.g., Final version approved by the client."
                        autoFocus
                    />
                    <div className="mt-6 flex justify-end gap-3">
                        <button type="button" onClick={() => setCompletionModalState({ isOpen: false, taskId: null, note: '' })} className="font-semibold py-2 px-6 rounded-lg transition duration-300 text-slate-300 hover:bg-slate-700">Cancel</button>
                        <button type="submit" className="bg-cyan-600 hover:bg-cyan-500 text-white font-bold py-2 px-6 rounded-lg transition duration-300">Complete Task</button>
                    </div>
                </form>
            </div>
        )}
      </>
    );
};

// --- Edit Task Modal Component ---
interface EditTaskModalProps {
    task: Task;
    projectTasks: Task[];
    team: TeamMember[];
    onClose: () => void;
    onSave: (updatedTask: Task) => void;
}

const EditTaskModal: React.FC<EditTaskModalProps> = ({ task, projectTasks, team, onClose, onSave }) => {
    const [name, setName] = useState(task.name);
    const [priority, setPriority] = useState(task.priority);
    const [dueDate, setDueDate] = useState(task.dueDate || '');
    const [dependsOn, setDependsOn] = useState(task.dependsOn || '');
    const [assigneeId, setAssigneeId] = useState(task.assigneeId || '');

    const handleSubmit = (e: FormEvent) => {
        e.preventDefault();
        onSave({ ...task, name: name.trim(), priority, dueDate: dueDate || undefined, dependsOn: dependsOn || undefined, assigneeId: assigneeId || undefined });
    };

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4" aria-modal="true" role="dialog">
            <form onSubmit={handleSubmit} className="bg-slate-800 border border-slate-700 rounded-2xl shadow-2xl w-full max-w-lg relative p-8">
                <h2 className="text-2xl font-bold text-white mb-6">Edit Task</h2>
                
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-300 mb-2">Task Name</label>
                        <input type="text" value={name} onChange={e => setName(e.target.value)} className="w-full bg-slate-700 border border-slate-600 rounded-md text-white px-3 py-2 focus:outline-none focus:ring-2 focus:ring-cyan-500" required />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                           <label className="block text-sm font-medium text-slate-300 mb-2">Priority</label>
                           <select value={priority} onChange={e => setPriority(e.target.value as Priority)} className="w-full bg-slate-700 border border-slate-600 rounded-md text-white px-3 py-2 focus:outline-none focus:ring-2 focus:ring-cyan-500">
                                {Object.values(Priority).map(p => <option key={p} value={p}>{p}</option>)}
                           </select>
                        </div>
                        <div>
                           <label className="block text-sm font-medium text-slate-300 mb-2">Due Date</label>
                           <input type="date" value={dueDate} onChange={e => setDueDate(e.target.value)} className="w-full bg-slate-700 border border-slate-600 rounded-md text-white px-3 py-2 focus:outline-none focus:ring-2 focus:ring-cyan-500" />
                        </div>
                    </div>
                     <div>
                        <label className="block text-sm font-medium text-slate-300 mb-2">Assignee</label>
                        <select value={assigneeId} onChange={e => setAssigneeId(e.target.value)} className="w-full bg-slate-700 border border-slate-600 rounded-md text-white px-3 py-2 focus:outline-none focus:ring-2 focus:ring-cyan-500">
                            <option value="">Unassigned</option>
                            {team.map(member => <option key={member.id} value={member.id}>{member.name}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-300 mb-2">Depends On</label>
                        <select value={dependsOn} onChange={e => setDependsOn(e.target.value)} className="w-full bg-slate-700 border border-slate-600 rounded-md text-white px-3 py-2 focus:outline-none focus:ring-2 focus:ring-cyan-500">
                            <option value="">No dependency</option>
                            {projectTasks.filter(t => t.id !== task.id).map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                        </select>
                    </div>
                </div>

                <div className="mt-8 flex justify-end gap-3">
                    <button type="button" onClick={onClose} className="font-semibold py-2 px-6 rounded-lg transition duration-300 text-slate-300 hover:bg-slate-700">Cancel</button>
                    <button type="submit" className="bg-cyan-600 hover:bg-cyan-500 text-white font-bold py-2 px-6 rounded-lg transition duration-300">Save Changes</button>
                </div>
            </form>
        </div>
    );
};


export default ProjectDetails;
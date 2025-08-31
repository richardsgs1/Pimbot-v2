
import React from 'react';
import type { Project, Task } from '../types';
import { ProjectStatus } from '../types';

interface ProjectDetailsProps {
  project: Project;
  onBack: () => void;
  onUpdateProject: (updatedProject: Project) => void;
}

const statusColors: { [key in ProjectStatus]: { bg: string, text: string, dot: string, border: string } } = {
  [ProjectStatus.OnTrack]: { bg: 'bg-green-500/10', text: 'text-green-400', dot: 'bg-green-400', border: 'border-green-500/20' },
  [ProjectStatus.AtRisk]: { bg: 'bg-yellow-500/10', text: 'text-yellow-400', dot: 'bg-yellow-400', border: 'border-yellow-500/20' },
  [ProjectStatus.OffTrack]: { bg: 'bg-red-500/10', text: 'text-red-400', dot: 'bg-red-400', border: 'border-red-500/20' },
  [ProjectStatus.Completed]: { bg: 'bg-blue-500/10', text: 'text-blue-400', dot: 'bg-blue-400', border: 'border-blue-500/20' },
};

const TaskItem: React.FC<{ task: Task; onToggle: () => void }> = ({ task, onToggle }) => (
    <div 
        className={`flex items-center p-3 rounded-lg transition-colors cursor-pointer ${task.completed ? 'bg-slate-700/50 hover:bg-slate-700' : 'bg-slate-800 hover:bg-slate-700/50'}`}
        onClick={onToggle}
    >
        <input 
            type="checkbox"
            checked={task.completed}
            onChange={onToggle}
            className="h-5 w-5 rounded border-slate-500 text-cyan-600 focus:ring-cyan-500 bg-slate-900 cursor-pointer"
            onClick={(e) => e.stopPropagation()} // Prevent double-triggering onToggle
        />
        <span className={`ml-3 ${task.completed ? 'text-slate-400 line-through' : 'text-slate-200'}`}>{task.name}</span>
    </div>
)

const ProjectDetails: React.FC<ProjectDetailsProps> = ({ project, onBack, onUpdateProject }) => {
    const colors = statusColors[project.status];
    const formattedDate = new Date(project.dueDate + 'T00:00:00').toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
    });

    const handleToggleTask = (taskId: string) => {
        const newTasks = project.tasks.map(task =>
            task.id === taskId ? { ...task, completed: !task.completed } : task
        );

        const completedTasks = newTasks.filter(task => task.completed).length;
        const totalTasks = newTasks.length;
        const newProgress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

        let newStatus = project.status;
        if (newProgress === 100) {
            newStatus = ProjectStatus.Completed;
        } else if (project.status === ProjectStatus.Completed && newProgress < 100) {
            newStatus = ProjectStatus.OnTrack; // Revert from completed if a task is unchecked
        }
        
        const updatedProject: Project = {
            ...project,
            tasks: newTasks,
            progress: newProgress,
            status: newStatus,
        };

        onUpdateProject(updatedProject);
    };

    return (
        <div className="flex flex-col h-full">
            <header className="flex items-center p-4 border-b border-slate-700 bg-slate-800/50 backdrop-blur-sm flex-shrink-0">
                <button onClick={onBack} className="flex items-center text-slate-300 hover:text-white transition">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                    Back to Projects
                </button>
            </header>
            <div className="flex-1 overflow-y-auto p-6">
                <div className="max-w-4xl mx-auto">
                    {/* Project Header */}
                    <div className={`bg-slate-800 border ${colors.border} rounded-xl p-6 mb-6`}>
                        <div className="flex justify-between items-start">
                            <h1 className="text-3xl font-bold text-white">{project.name}</h1>
                             <div className={`flex items-center px-2.5 py-1 rounded-full text-sm font-medium ${colors.bg} ${colors.text}`}>
                                <span className={`w-2 h-2 mr-2 rounded-full ${colors.dot}`}></span>
                                {project.status}
                            </div>
                        </div>
                        <p className="text-slate-400 mt-2">Due: {formattedDate}</p>

                        <div className="mt-6">
                            <div className="flex justify-between items-center mb-1">
                                <span className="text-sm font-medium text-slate-400">Progress</span>
                                <span className="text-sm font-medium text-white">{project.progress}%</span>
                            </div>
                            <div className="w-full bg-slate-700 rounded-full h-2.5">
                                <div className="bg-cyan-500 h-2.5 rounded-full" style={{ width: `${project.progress}%` }}></div>
                            </div>
                        </div>
                    </div>
                    
                    {/* Project Body */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        <div className="lg:col-span-2">
                             <div className="bg-slate-800 rounded-xl p-6">
                                <h2 className="text-xl font-bold text-white mb-4">Description</h2>
                                <p className="text-slate-300 leading-relaxed whitespace-pre-wrap">{project.description}</p>
                            </div>
                        </div>
                        <div>
                             <div className="bg-slate-800 rounded-xl p-6">
                                <h2 className="text-xl font-bold text-white mb-4">Tasks</h2>
                                <div className="space-y-3">
                                    {project.tasks.map(task => (
                                        <TaskItem key={task.id} task={task} onToggle={() => handleToggleTask(task.id)} />
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ProjectDetails;

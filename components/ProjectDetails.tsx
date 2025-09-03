

import React, { useState, useMemo } from 'react';
import type { Project, TeamMember, OnboardingData, Task, JournalEntry } from '../types';
import { Priority } from '../types';
import CommunicationDraftModal from './CommunicationDraftModal';

interface ProjectDetailsProps {
    project: Project;
    onBack: () => void;
    onUpdateProject: (project: Project) => void;
    team: TeamMember[];
    userData: OnboardingData;
    onMenuClick: () => void;
}

const getStatusColor = (status: string) => {
    switch (status) {
        case 'On Track': return 'bg-green-500/20 text-green-300';
        case 'At Risk': return 'bg-yellow-500/20 text-yellow-300';
        case 'Off Track': return 'bg-red-500/20 text-red-300';
        case 'Completed': return 'bg-blue-500/20 text-blue-300';
        default: return 'bg-slate-600/20 text-slate-300';
    }
};

const getPriorityPill = (priority: Priority) => {
    switch (priority) {
        case Priority.High: return <span className="text-xs font-medium text-red-300 bg-red-500/20 px-2 py-0.5 rounded-full">High</span>;
        case Priority.Medium: return <span className="text-xs font-medium text-yellow-300 bg-yellow-500/20 px-2 py-0.5 rounded-full">Medium</span>;
        case Priority.Low: return <span className="text-xs font-medium text-blue-300 bg-blue-500/20 px-2 py-0.5 rounded-full">Low</span>;
        default: return null;
    }
};

const MemberAvatar: React.FC<{ member?: TeamMember }> = ({ member }) => {
    if (!member) {
        return <div className="w-6 h-6 rounded-full bg-slate-600 flex items-center justify-center text-xs text-slate-300" title="Unassigned">?</div>;
    }
    return <div className={`w-6 h-6 rounded-full ${member.avatarColor} flex items-center justify-center text-xs font-bold text-white`} title={member.name}>{member.name.charAt(0)}</div>;
};

const ProjectDetails: React.FC<ProjectDetailsProps> = ({ onMenuClick, project, onBack, onUpdateProject, team }) => {
  const [isCommModalOpen, setIsCommModalOpen] = useState(false);
  const [newJournalEntry, setNewJournalEntry] = useState('');

  const handleToggleTask = (taskId: string) => {
    const updatedTasks = project.tasks.map(task => 
      task.id === taskId ? { ...task, completed: !task.completed } : task
    );
    const completedTasks = updatedTasks.filter(t => t.completed).length;
    const newProgress = Math.round((completedTasks / updatedTasks.length) * 100);

    onUpdateProject({ ...project, tasks: updatedTasks, progress: newProgress });
  };

  const handleAddJournalEntry = () => {
    if (!newJournalEntry.trim()) return;
    const newEntry: JournalEntry = {
      id: `j-${Date.now()}`,
      date: new Date().toISOString(),
      content: newJournalEntry,
      type: 'user',
    };
    onUpdateProject({ ...project, journal: [newEntry, ...project.journal] });
    setNewJournalEntry('');
  };
  
  const projectTeamMembers = useMemo(() => {
    const memberIds = new Set(project.tasks.map(t => t.assigneeId).filter(Boolean));
    return team.filter(m => memberIds.has(m.id));
  }, [project.tasks, team]);
  
  const sortedTasks = useMemo(() => {
    return [...project.tasks].sort((a, b) => (a.completed === b.completed) ? 0 : a.completed ? 1 : -1);
  }, [project.tasks]);

  return (
    <>
      <div className="p-6 h-screen flex flex-col bg-slate-900">
        <header className="flex-shrink-0">
            <div className="flex justify-between items-center mb-1">
                <div className="flex items-center gap-4">
                    <button onClick={onMenuClick} className="md:hidden p-1 rounded-full hover:bg-slate-700" aria-label="Open menu">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" /></svg>
                    </button>
                    <button onClick={onBack} className="text-sm text-cyan-400 hover:text-cyan-300 font-semibold flex items-center gap-1">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
                        Back
                    </button>
                </div>
                 <button 
                    onClick={() => setIsCommModalOpen(true)}
                    className="flex items-center gap-2 bg-cyan-600/50 hover:bg-cyan-600/80 text-cyan-200 font-semibold py-2 px-4 rounded-lg transition"
                  >
                     <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path d="M2.5 1A1.5 1.5 0 001 2.5v1.455A2.5 2.5 0 013.5 6h13a2.5 2.5 0 012.5-2.045V2.5A1.5 1.5 0 0017.5 1h-15zM1 8v7.5A1.5 1.5 0 002.5 17h15a1.5 1.5 0 001.5-1.5V8h-18zm5.5 2a.5.5 0 01.5.5v2a.5.5 0 01-1 0v-2a.5.5 0 01.5-.5z" /></svg>
                    Draft Communication
                  </button>
            </div>
            <div className="flex items-baseline gap-3 mt-4">
                <h1 className="text-3xl font-bold">{project.name}</h1>
                <span className={`text-sm font-medium px-3 py-1 rounded-full ${getStatusColor(project.status)}`}>{project.status}</span>
            </div>
             <p className="text-slate-400 mt-2 max-w-4xl">{project.description}</p>
        </header>

        <div className="flex-1 overflow-y-auto mt-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main content */}
          <div className="lg:col-span-2 flex flex-col gap-6">
             <div className="bg-slate-800 border border-slate-700 rounded-xl p-6">
                <h3 className="text-lg font-bold text-white mb-4">Tasks ({project.tasks.filter(t=>!t.completed).length} remaining)</h3>
                <div className="space-y-3">
                    {sortedTasks.map(task => (
                        <div key={task.id} className={`flex items-center p-3 rounded-lg transition-colors ${task.completed ? 'bg-slate-800/50' : 'bg-slate-700/50'}`}>
                            <input 
                                type="checkbox"
                                checked={task.completed}
                                onChange={() => handleToggleTask(task.id)}
                                className="h-5 w-5 rounded bg-slate-600 border-slate-500 text-cyan-500 focus:ring-cyan-500 cursor-pointer"
                            />
                            <p className={`ml-4 flex-1 ${task.completed ? 'line-through text-slate-500' : 'text-slate-200'}`}>{task.name}</p>
                            {getPriorityPill(task.priority)}
                            <span className="text-xs text-slate-400 mx-4">{new Date(task.dueDate).toLocaleDateString()}</span>
                            <MemberAvatar member={team.find(m => m.id === task.assigneeId)} />
                        </div>
                    ))}
                </div>
             </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
             <div className="bg-slate-800 border border-slate-700 rounded-xl p-6">
                 <h3 className="text-lg font-bold text-white mb-4">Key Info</h3>
                 <div className="space-y-4">
                    <div>
                        <label className="text-sm font-medium text-slate-400">Progress</label>
                        <div className="flex items-center gap-3 mt-1">
                           <div className="w-full bg-slate-700 rounded-full h-2.5"><div className="bg-cyan-500 h-2.5 rounded-full" style={{width: `${project.progress}%`}}></div></div>
                           <span className="font-semibold text-white">{project.progress}%</span>
                        </div>
                    </div>
                     <div>
                        <label className="text-sm font-medium text-slate-400">Due Date</label>
                        <p className="font-semibold text-white mt-1">{new Date(project.dueDate).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
                    </div>
                     <div>
                        <label className="text-sm font-medium text-slate-400">Team</label>
                         <div className="flex -space-x-2 mt-2">
                             {projectTeamMembers.map(m => <MemberAvatar key={m.id} member={m} />)}
                             {projectTeamMembers.length === 0 && <p className="text-xs text-slate-500">No members assigned.</p>}
                         </div>
                    </div>
                 </div>
             </div>
             <div className="bg-slate-800 border border-slate-700 rounded-xl p-6">
                <h3 className="text-lg font-bold text-white mb-4">Project Journal</h3>
                <div className="space-y-2 mb-4">
                    <textarea 
                        value={newJournalEntry}
                        onChange={(e) => setNewJournalEntry(e.target.value)}
                        rows={2}
                        className="w-full bg-slate-700 border border-slate-600 rounded-lg p-2 text-sm"
                        placeholder="Add a new journal entry..."
                    />
                    <button onClick={handleAddJournalEntry} className="w-full bg-cyan-600/80 hover:bg-cyan-600 text-white font-semibold py-2 rounded-lg text-sm">Add Entry</button>
                </div>
                <div className="space-y-3 max-h-48 overflow-y-auto">
                    {project.journal.slice(0, 5).map(entry => (
                        <div key={entry.id} className="text-sm">
                            <p className="text-slate-300">{entry.content}</p>
                            <p className="text-xs text-slate-500">{new Date(entry.date).toLocaleString()}</p>
                        </div>
                    ))}
                    {project.journal.length === 0 && <p className="text-sm text-slate-500">No journal entries yet.</p>}
                </div>
             </div>
          </div>
        </div>
      </div>
      <CommunicationDraftModal 
        isOpen={isCommModalOpen}
        onClose={() => setIsCommModalOpen(false)}
        project={project}
      />
    </>
  );
};

export default ProjectDetails;
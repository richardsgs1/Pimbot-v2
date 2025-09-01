
import React from 'react';
import type { Task } from '../types';

interface TimelineViewProps {
  tasks: Task[];
  projectDueDate: string;
}

const daysBetween = (date1: string, date2: string): number => {
  const d1 = new Date(date1).getTime();
  const d2 = new Date(date2).getTime();
  return Math.round((d2 - d1) / (1000 * 3600 * 24));
};

const addDays = (dateStr: string, days: number): Date => {
    const date = new Date(dateStr);
    date.setDate(date.getDate() + days);
    return date;
};

const TimelineView: React.FC<TimelineViewProps> = ({ tasks, projectDueDate }) => {
  const scheduledTasks = tasks.filter(t => t.startDate && t.duration);
  
  if (scheduledTasks.length === 0) {
    return <p className="text-slate-400 text-center py-8">No schedule data available. Generate a schedule to see the timeline.</p>;
  }

  const projectStartDate = scheduledTasks.reduce((earliest, task) => {
    return new Date(task.startDate!) < new Date(earliest) ? task.startDate! : earliest;
  }, scheduledTasks[0].startDate!);

  const totalTimelineDays = daysBetween(projectStartDate, projectDueDate) + 1;

  const today = new Date();
  today.setHours(0,0,0,0);
  const todayOffsetDays = daysBetween(projectStartDate, today.toISOString().split('T')[0]);
  const todayPosition = (todayOffsetDays / totalTimelineDays) * 100;
  
  const tasksById = React.useMemo(() => scheduledTasks.reduce((acc, task) => { acc[task.id] = task; return acc; }, {} as Record<string, Task>), [scheduledTasks]);

  return (
    <div className="bg-slate-800 rounded-xl p-6 relative overflow-x-auto">
        <h2 className="text-xl font-bold text-white mb-6">Project Timeline</h2>
        <div className="relative" style={{ minWidth: '800px' }}>
            {/* Today Marker */}
            {todayPosition >= 0 && todayPosition <= 100 && (
                <div className="absolute top-0 bottom-0 border-l-2 border-red-500/70 z-10" style={{ left: `${todayPosition}%` }}>
                    <div className="absolute -top-6 -translate-x-1/2 bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">TODAY</div>
                </div>
            )}
            
            {/* Task Rows */}
            <div className="space-y-2 relative">
            {scheduledTasks.map((task, index) => {
                const offsetDays = daysBetween(projectStartDate, task.startDate!);
                const left = (offsetDays / totalTimelineDays) * 100;
                const width = (task.duration! / totalTimelineDays) * 100;

                const taskEndDate = addDays(task.startDate!, task.duration!);
                const isOverdue = !task.completed && taskEndDate < today;
                
                let bgColor = 'bg-cyan-600';
                if (task.completed) bgColor = 'bg-blue-600';
                if (isOverdue) bgColor = 'bg-red-600';

                return (
                    <div key={task.id} className="h-10 flex items-center group relative">
                        <div className="w-48 text-sm text-slate-300 truncate pr-4 font-medium flex-shrink-0" title={task.name}>{task.name}</div>
                        <div className="flex-grow h-full bg-slate-700/50 rounded-md relative">
                             <div 
                                className={`absolute h-full rounded-md transition-all duration-300 ${bgColor} flex items-center justify-start pl-2`} 
                                style={{ left: `${left}%`, width: `${width}%` }}
                                title={`${task.name}\nStart: ${task.startDate}\nDuration: ${task.duration} days`}
                             >
                             </div>
                        </div>
                    </div>
                );
            })}
            </div>
            {/* Dependency Lines - this is a simplified SVG overlay */}
            <svg className="absolute top-0 left-0 w-full h-full pointer-events-none" style={{ minWidth: '800px' }}>
                {scheduledTasks.map((task, index) => {
                    if (!task.dependsOn || !tasksById[task.dependsOn] || !tasksById[task.dependsOn].startDate) return null;

                    const dependentTask = tasksById[task.dependsOn];
                    const startY = (index * 48) + 20;
                    
                    const dependentIndex = scheduledTasks.findIndex(t => t.id === dependentTask.id);
                    const endY = (dependentIndex * 48) + 20;

                    const startOffsetDays = daysBetween(projectStartDate, task.startDate!);
                    const startXPercent = ((startOffsetDays) / totalTimelineDays) * 100;

                    const endOffsetDays = daysBetween(projectStartDate, dependentTask.startDate!);
                    const endXPercent = ((endOffsetDays + dependentTask.duration!) / totalTimelineDays) * 100;

                    return (
                        <path 
                            key={`${task.id}-dep`}
                            d={`M calc(${endXPercent}% + 8px) ${endY} L calc(${endXPercent}% + 20px) ${endY} L calc(${endXPercent}% + 20px) ${startY} L calc(${startXPercent}% - 8px) ${startY}`}
                            stroke="#f59e0b"
                            strokeWidth="1.5"
                            fill="none"
                            markerEnd="url(#arrow)"
                        />
                    );
                })}
                 <defs>
                    <marker id="arrow" viewBox="0 0 10 10" refX="5" refY="5"
                        markerWidth="4" markerHeight="4"
                        orient="auto-start-reverse">
                    <path d="M 0 0 L 10 5 L 0 10 z" fill="#f59e0b" />
                    </marker>
                </defs>
            </svg>
        </div>
    </div>
  );
};

export default TimelineView;
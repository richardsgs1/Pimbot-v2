import React from 'react';

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

interface KanbanBoardProps {
  tasks: Task[];
  project: Project;
  onTaskAssignmentChange: (taskId: string, assignedTo: string) => void;
  onEditTask: (task: Task) => void;
  onLogTime: (task: Task) => void;
}

const KanbanBoard: React.FC<KanbanBoardProps> = ({
  tasks,
  project,
  onTaskAssignmentChange,
  onEditTask,
  onLogTime,
}) => {
  const todoTasks = tasks.filter(t => t.status === 'todo');
  const inProgressTasks = tasks.filter(t => t.status === 'in-progress');
  const blockedTasks = tasks.filter(t => t.status === 'blocked');
  const doneTasks = tasks.filter(t => t.status === 'done');

 const TaskCard = ({ task }: { task: Task }) => {
  const priorityColors = {
    low: 'bg-gray-100 text-gray-700 border-gray-300',
    medium: 'bg-blue-100 text-blue-700 border-blue-300',
    high: 'bg-orange-100 text-orange-700 border-orange-300',
    critical: 'bg-red-100 text-red-700 border-red-300',
  };

  const assignedMember = project.teamMembers.find(m => m.name === task.assignedTo);

  return (
    <div 
      onClick={() => onEditTask(task)}
      className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 mb-3 cursor-pointer hover:shadow-md transition-shadow"
    >
      <div className="flex items-start justify-between mb-3">
        <h4 className="font-medium text-gray-900 flex-1 pr-2">{task.title}</h4>
        <span className={`px-2 py-1 rounded text-xs font-medium border ${priorityColors[task.priority]}`}>
          {task.priority}
        </span>
      </div>
      
      {task.description && (
        <p className="text-sm text-gray-600 mb-3 line-clamp-2">{task.description}</p>
      )}
      
      <div className="space-y-2">
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-2 flex-1">
            {assignedMember ? (
              <div className="flex items-center gap-2">
                <div 
                  className="w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-medium"
                  style={{ backgroundColor: assignedMember.avatarColor }}
                >
                  {assignedMember.name.charAt(0).toUpperCase()}
                </div>
                <div className="flex flex-col">
                  <span className="text-gray-700 font-medium text-xs">{assignedMember.name}</span>
                  <span className="text-gray-500 text-xs">{assignedMember.role}</span>
                </div>
              </div>
            ) : (
              <select
                value={task.assignedTo}
                onChange={(e) => {
                  e.stopPropagation();
                  onTaskAssignmentChange(task.id, e.target.value);
                }}
                className="text-gray-600 border border-gray-300 rounded px-2 py-1 text-xs bg-white hover:border-blue-400 transition-colors"
                onClick={(e) => e.stopPropagation()}
              >
                <option value="">Assign to...</option>
                {project.teamMembers.map(member => (
                  <option key={member.id} value={member.name}>{member.name}</option>
                ))}
              </select>
            )}
          </div>
        </div>

        <div className="flex items-center justify-between text-xs text-gray-500 pt-2 border-t border-gray-100">
          <div className="flex items-center gap-3">
            {task.dueDate && (
              <span className="flex items-center gap-1">
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                {new Date(task.dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
              </span>
            )}
            <span className="flex items-center gap-1">
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {task.estimatedHours}h
            </span>
          </div>
          <button
            onClick={(e) => {
            e.stopPropagation();
            onLogTime(task);
            }}
            className="text-green-600 hover:text-green-800 font-medium"
        >
            Log Time
        </button>
        <button
            onClick={(e) => {
            e.stopPropagation();
            onEditTask(task);
            }}
            className="text-blue-600 hover:text-blue-800 font-medium"
        >
            Edit
        </button>
        </div>
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
    <div className="grid grid-cols-4 gap-4">
      <KanbanColumn title="To Do" tasks={todoTasks} status="todo" />
      <KanbanColumn title="In Progress" tasks={inProgressTasks} status="in-progress" />
      <KanbanColumn title="Blocked" tasks={blockedTasks} status="blocked" />
      <KanbanColumn title="Done" tasks={doneTasks} status="done" />
    </div>
  );
};

export default KanbanBoard;
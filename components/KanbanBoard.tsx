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
}

const KanbanBoard: React.FC<KanbanBoardProps> = ({
  tasks,
  project,
  onTaskAssignmentChange,
  onEditTask,
}) => {
  const todoTasks = tasks.filter(t => t.status === 'todo');
  const inProgressTasks = tasks.filter(t => t.status === 'in-progress');
  const blockedTasks = tasks.filter(t => t.status === 'blocked');
  const doneTasks = tasks.filter(t => t.status === 'done');

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
            onChange={(e) => onTaskAssignmentChange(task.id, e.target.value)}
            className="text-gray-700 border border-gray-300 rounded px-2 py-1 text-xs"
            onClick={(e) => e.stopPropagation()}
        >
            <option value="">Unassigned</option>
            {project.teamMembers.map(member => (
                <option key={member.id} value={member.name}>{member.name}</option>
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
            onClick={() => onEditTask(task)}
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
    <div className="grid grid-cols-4 gap-4">
      <KanbanColumn title="To Do" tasks={todoTasks} status="todo" />
      <KanbanColumn title="In Progress" tasks={inProgressTasks} status="in-progress" />
      <KanbanColumn title="Blocked" tasks={blockedTasks} status="blocked" />
      <KanbanColumn title="Done" tasks={doneTasks} status="done" />
    </div>
  );
};

export default KanbanBoard;
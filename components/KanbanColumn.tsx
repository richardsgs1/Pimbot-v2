import React from 'react';
import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import KanbanCard from './KanbanCard';
import type { Task, TaskStatus } from '../types';

interface KanbanColumnProps {
  status: TaskStatus;
  tasks: Task[];
  onEditTask: (task: Task) => void;
}

const KanbanColumn: React.FC<KanbanColumnProps> = ({ status, tasks, onEditTask }) => {
  const { setNodeRef, isOver } = useDroppable({
    id: status,
  });

  const statusConfig = {
    'To Do': { label: 'To Do', color: 'bg-gray-500/20', icon: '📋' },
    'In Progress': { label: 'In Progress', color: 'bg-blue-500/20', icon: '🚀' },
    'Done': { label: 'Done', color: 'bg-green-500/20', icon: '✅' },
    'On Hold': { label: 'On Hold', color: 'bg-yellow-500/20', icon: '⏸️' },
  };

  const config = statusConfig[status] || statusConfig['To Do'];

  return (
    <div className="flex-shrink-0 w-80">
      {/* Column Header */}
      <div className={`${config.color} rounded-lg p-3 mb-4`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xl">{config.icon}</span>
            <h3 className="font-semibold text-[var(--text-primary)]">
              {config.label}
            </h3>
          </div>
          <span className="bg-[var(--bg-secondary)] px-2 py-1 rounded text-sm text-[var(--text-secondary)]">
            {tasks.length}
          </span>
        </div>
      </div>

      {/* Drop Zone */}
      <div
        ref={setNodeRef}
        className={`min-h-[500px] rounded-lg p-3 transition-colors ${
          isOver ? 'bg-[var(--accent-primary)]/10 border-2 border-[var(--accent-primary)]' : 'bg-[var(--bg-tertiary)]/30'
        }`}
      >
        <SortableContext items={tasks.map(t => t.id)} strategy={verticalListSortingStrategy}>
          {tasks.map(task => (
            <KanbanCard key={task.id} task={task} onEdit={onEditTask} />
          ))}
        </SortableContext>

        {tasks.length === 0 && (
          <div className="text-center text-[var(--text-tertiary)] py-8">
            Drop tasks here
          </div>
        )}
      </div>
    </div>
  );
};

export default KanbanColumn;
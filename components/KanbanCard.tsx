import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import type { Task, Priority } from '../types';

interface KanbanCardProps {
  task: Task;
  onEdit: (task: Task) => void;
}

const KanbanCard: React.FC<KanbanCardProps> = ({ task, onEdit }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: task.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : task.isBlocked ? 0.6 : 1,
  };

  const priorityColors: Record<Priority, string> = {
    Urgent: 'bg-red-600/20 text-red-300 border-red-600/30',
    High: 'bg-red-500/20 text-red-400 border-red-500/30',
    Medium: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
    Low: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      onClick={() => onEdit(task)}
      className={`bg-[var(--bg-secondary)] border rounded-lg p-4 mb-3 transition-colors ${
        task.isBlocked
          ? 'border-red-500/50 cursor-not-allowed hover:border-red-500/50'
          : 'border-[var(--border-primary)] cursor-pointer hover:border-[var(--accent-primary)]'
      }`}
    >
      {/* Title with Blocked Indicator */}
      <div className="flex items-center gap-2 mb-2">
        <h4 className="font-semibold text-[var(--text-primary)] line-clamp-2 flex-1">
          {task.name}
        </h4>
        {task.isBlocked && (
          <span className="px-1.5 py-0.5 text-xs bg-red-500/20 text-red-400 rounded flex-shrink-0" title="Blocked by dependencies">
            ⛔
          </span>
        )}
      </div>

      {/* Description */}
      {task.description && (
        <p className="text-sm text-[var(--text-secondary)] mb-3 line-clamp-2">
          {task.description}
        </p>
      )}

      {/* Priority Badge */}
      <div className="flex items-center justify-between">
        <span
          className={`text-xs px-2 py-1 rounded border ${
            priorityColors[task.priority]
          }`}
        >
          {task.priority}
        </span>

        {/* Assigned To - now uses assignees array */}
        {task.assignees && task.assignees.length > 0 && (
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-full bg-[var(--accent-primary)] flex items-center justify-center text-xs text-white font-semibold">
              {task.assignees[0].charAt(0).toUpperCase()}
            </div>
            {task.assignees.length > 1 && (
              <span className="text-xs text-[var(--text-tertiary)]">
                +{task.assignees.length - 1}
              </span>
            )}
          </div>
        )}
      </div>

      {/* Due Date */}
      {task.dueDate && (
        <div className="mt-2 text-xs text-[var(--text-tertiary)]">
          Due: {new Date(task.dueDate).toLocaleDateString()}
        </div>
      )}

      {/* Estimated Hours */}
      {task.estimatedHours && task.estimatedHours > 0 && (
        <div className="mt-1 text-xs text-[var(--text-tertiary)]">
          Est: {task.estimatedHours}h
        </div>
      )}
    </div>
  );
};

export default KanbanCard;
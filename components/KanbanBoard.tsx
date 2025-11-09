import React, { useState } from 'react';
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import KanbanColumn from './KanbanColumn';
import KanbanCard from './KanbanCard';
import type { Project, Task, TaskStatus } from '../types';
import { TaskStatus as TaskStatusEnum } from '../types';
import { dependencyResolver } from '../lib/DependencyResolver';

interface KanbanBoardProps {
  project: Project;
  onUpdateTask: (taskId: string, updates: Partial<Task>) => void;
  onEditTask: (task: Task) => void;
}

const KanbanBoard: React.FC<KanbanBoardProps> = ({ project, onUpdateTask, onEditTask }) => {
  const [activeTask, setActiveTask] = useState<Task | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  // Group tasks by status
  const tasksByStatus: Record<TaskStatus, Task[]> = {
    [TaskStatusEnum.ToDo]: [],
    [TaskStatusEnum.InProgress]: [],
    [TaskStatusEnum.Done]: [],
    [TaskStatusEnum.OnHold]: [],
  };

  project.tasks.forEach(task => {
    const status = task.status as TaskStatus;
    if (tasksByStatus[status]) {
      tasksByStatus[status].push(task);
    }
  });

  const handleDragStart = (event: DragStartEvent) => {
    const taskId = event.active.id as string;
    const task = project.tasks.find(t => t.id === taskId);

    // Prevent dragging blocked tasks
    if (task?.isBlocked) {
      event.active.node.activatorNode?.classList.add('opacity-50', 'cursor-not-allowed');
      return;
    }

    setActiveTask(task || null);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (!over) {
      setActiveTask(null);
      return;
    }

    const taskId = active.id as string;
    const task = project.tasks.find(t => t.id === taskId);

    // Prevent dropping blocked tasks
    if (task?.isBlocked) {
      setActiveTask(null);
      return;
    }

    const newStatus = over.id as TaskStatus;

    // Update task status and auto-update blocked status
    onUpdateTask(taskId, { status: newStatus });
    setActiveTask(null);
  };

  const columns: TaskStatus[] = [TaskStatusEnum.ToDo, TaskStatusEnum.InProgress, TaskStatusEnum.Done, TaskStatusEnum.OnHold];

  return (
    <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
      <div className="overflow-x-auto pb-4">
        <div className="flex gap-4 min-w-max">
          {columns.map(status => (
            <KanbanColumn
              key={status}
              status={status}
              tasks={tasksByStatus[status]}
              onEditTask={onEditTask}
            />
          ))}
        </div>
      </div>

      {/* Drag Overlay */}
      <DragOverlay>
        {activeTask ? <KanbanCard task={activeTask} onEdit={() => {}} /> : null}
      </DragOverlay>
    </DndContext>
  );
};

export default KanbanBoard;